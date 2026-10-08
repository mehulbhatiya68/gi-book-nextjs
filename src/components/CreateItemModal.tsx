"use client";

import { useState, useEffect, useMemo } from "react";
import { IoClose, IoChevronDown, IoCubeOutline, IoSaveOutline, IoSparklesOutline, IoBarcodeOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { itemApi } from "@/lib/api/item";
import LimitReachedView from "@/components/LimitReachedView";
import { useLimitCheck } from "@/lib/hooks/useLimitCheck";
import CustomSelect from "@/components/CustomSelect";

export function CreateItemModal({
  isOpen,
  onClose,
  onItemCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onItemCreated: (newItem: any) => void;
}) {
  const { isLimitReached, used, quota, featureName } = useLimitCheck("item", false);

  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [itemType, setItemType] = useState<"Product" | "Service">("Product");
  const [unit, setUnit] = useState("PCS");
  const [salesPrice, setSalesPrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [gst, setGst] = useState("None");
  const [openingStock, setOpeningStock] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hsnOptions, setHsnOptions] = useState<Array<{ value: string; label: string }>>([]);

  const handleGenerateBarcode = () => {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCode = `ITM-${randomHex}`;
    setItemCode(newCode);
    toast.success(`Generated barcode: ${newCode}`);
  };

  useEffect(() => {
    if (!isOpen) return;
    itemApi.getHsnSacCodes({ silentError: true })
      .then((res: any) => {
        const bodyObj = res?.body || res;
        const list = bodyObj?.hsn_sac_codes || bodyObj?.hsnSacCodes || bodyObj?.data || (Array.isArray(bodyObj) ? bodyObj : []);
        if (Array.isArray(list) && list.length > 0) {
          const opts = list.map((item: any) => {
            const code = String(item.code || item.hsn_code || item.hsn || item.sac_code || "").trim();
            const desc = String(item.description || item.details || "").trim();
            const typeStr = String(item.type || "").toUpperCase().trim();
            const typeTag = typeStr ? ` [${typeStr}]` : "";
            return {
              value: code,
              label: desc ? `${code}${typeTag} - ${desc}` : `${code}${typeTag}`,
            };
          }).filter((opt: any) => Boolean(opt.value));
          setHsnOptions(opts);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      toast.error("Please enter item name.");
      return;
    }

    const parsedTaxRate = gst === "None" ? 0 : (parseFloat(String(gst).replace(/[^\d.]/g, "")) || 0);

    const apiPayload: any = {
      item_name: itemName.trim(),
      item_type: itemType.toLowerCase() === "service" ? "service" : "product",
      unit: unit.trim() || "PCS",
      sales_price: Number(salesPrice) || 0,
      purchase_price: itemType === "Service" ? 0 : (Number(purchasePrice) || 0),
      tax_rate: parsedTaxRate,
      current_stock: itemType === "Service" ? 0 : (Number(openingStock) || 0),
    };

    if (itemCode.trim()) {
      apiPayload.item_code = itemCode.trim();
      apiPayload.qr_code = itemCode.trim();
    }

    if (description.trim()) {
      apiPayload.description = description.trim();
    }

    if (hsnCode.trim()) {
      apiPayload.hsn = hsnCode.trim();
    }

    setIsSaving(true);
    try {
      const res: any = await itemApi.createItem(apiPayload);
      const createdObj = res?.body?.item || res?.body?.data || res?.body || res?.data || res?.item || res;
      
      const selectedHsn = apiPayload.hsn || createdObj?.hsn || createdObj?.hsn_code || createdObj?.hsn_sac_code || hsnCode.trim() || "";

      const normalizedCreated = {
        ...apiPayload,
        ...(createdObj || {}),
        id: createdObj?.id || Math.random(),
        itemName: apiPayload.item_name,
        itemCode: apiPayload.item_code || "",
        item_code: apiPayload.item_code || "",
        qrCode: apiPayload.qr_code || apiPayload.item_code || "",
        qr_code: apiPayload.qr_code || apiPayload.item_code || "",
        hsn: selectedHsn,
        hsn_code: selectedHsn,
        hsn_sac_code: selectedHsn,
        hsnCode: selectedHsn,
        purchasePrice: apiPayload.purchase_price,
        salesPrice: apiPayload.sales_price,
        unit: apiPayload.unit,
        stockQuantity: apiPayload.current_stock,
      };

      toast.success(`Item "${normalizedCreated.itemName}" created successfully!`);
      onItemCreated(normalizedCreated);
      onClose();
      
      // Reset form fields
      setItemName("");
      setDescription("");
      setItemCode("");
      setHsnCode("");
      setSalesPrice("");
      setPurchasePrice("");
      setOpeningStock("");
    } catch (err: any) {
      console.error("Failed to create item from modal:", err);
      toast.error(err?.message || "Failed to create item.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  if (isLimitReached) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center select-none" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-6">
          <LimitReachedView featureName={featureName} usedCount={used} quotaLimit={quota} onBack={onClose} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center select-none" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b gi-divider pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gi-badge-warning flex items-center justify-center text-lg">
              <IoCubeOutline />
            </div>
            <div>
              <h3 className="text-sm font-bold gi-text-primary">Create New Item</h3>
              <p className="text-[11px] gi-text-secondary">Add item &amp; automatically select for bill</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg cursor-pointer p-1 rounded-full transition">
            <IoClose />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          {/* Item Name */}
          <div>
            <label className="block text-xs font-semibold gi-text-secondary mb-1">
              Item Name <span className="text-rose-500">*</span>
            </label>
            <input type="text" required value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Portland Cement 50kg Bag" className="w-full h-9 px-3 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs focus:outline-none focus:border-indigo-500 font-medium" />
          </div>

          {/* Type & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold gi-text-secondary mb-1">Category</label>
              <select value={itemType} onChange={(e) => setItemType(e.target.value as any)} className="w-full h-9 px-3 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs focus:outline-none focus:border-indigo-500 font-medium">
                <option value="Product">Product (Physical)</option>
                <option value="Service">Service (Labor)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold gi-text-secondary mb-1">Measuring Unit</label>
              <CustomSelect
                size="sm"
                value={unit}
                onChange={setUnit}
                options={["PCS", "BOX", "KG", "LBS", "MTR", "SETS", "SQFT", "LTR", "NOS", "PAIR", "PACK"].map((u) => ({
                  value: u,
                  label: u,
                }))}
              />
            </div>
          </div>

          {/* Item Code / Barcode */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold gi-text-secondary">Item Code / Barcode / SKU</label>
              <button
                type="button"
                onClick={handleGenerateBarcode}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <IoSparklesOutline className="text-xs" />
                <span>Generate Barcode</span>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value.toUpperCase())}
                placeholder="e.g. ITM-001"
                className="w-full h-9 px-3 pr-24 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs focus:outline-none focus:border-indigo-500 font-mono uppercase"
              />
              <button
                type="button"
                onClick={handleGenerateBarcode}
                className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] cursor-pointer transition shadow-2xs flex items-center gap-1"
              >
                <IoSparklesOutline className="text-xs" />
                <span>Generate</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold gi-text-secondary mb-1">Item Description / Notes</label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Product specifications, details..." className="w-full px-3 py-2 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs focus:outline-none focus:border-indigo-500 resize-none font-medium" />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold gi-text-secondary mb-1">Purchase Price (₹)</label>
              <input type="number" min="0" step="any" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="0.00" className="w-full h-9 px-3 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs focus:outline-none focus:border-indigo-500 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold gi-text-secondary mb-1">Sales Price (₹)</label>
              <input type="number" min="0" step="any" value={salesPrice} onChange={(e) => setSalesPrice(e.target.value)} placeholder="0.00" className="w-full h-9 px-3 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs focus:outline-none focus:border-indigo-500 font-mono" />
            </div>
          </div>

          {/* GST & Opening Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold gi-text-secondary mb-1">GST Tax Rate</label>
              <CustomSelect
                size="sm"
                value={gst}
                onChange={setGst}
                options={["None", "GST @ 0%", "GST @ 3%", "GST @ 5%", "GST @ 12%", "GST @ 18%", "GST @ 28%"].map((g) => ({
                  value: g,
                  label: g,
                }))}
              />
            </div>
            {itemType === "Product" && (
              <div>
                <label className="block text-xs font-semibold gi-text-secondary mb-1">Opening Stock Qty</label>
                <input type="number" min="0" step="any" value={openingStock} onChange={(e) => setOpeningStock(e.target.value)} placeholder="0" className="w-full h-9 px-3 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs focus:outline-none focus:border-indigo-500 font-mono" />
              </div>
            )}
          </div>

          {/* HSN / SAC Code */}
          <div>
            <label className="block text-xs font-semibold gi-text-secondary mb-1">HSN / SAC Code</label>
            <input
              type="text"
              list="create-item-hsn-options"
              value={hsnCode}
              onChange={(e) => setHsnCode(e.target.value)}
              placeholder="Enter or select HSN code..."
              className="w-full h-9 px-3 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs focus:outline-none focus:border-indigo-500 font-mono"
            />
            <datalist id="create-item-hsn-options">
              {hsnOptions.map((opt, idx) => (
                <option key={`${opt.value}-${idx}`} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </datalist>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t gi-divider">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border gi-border gi-surface-interactive gi-text-secondary font-semibold transition cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="px-5 py-2 rounded-xl gi-btn-primary font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60">
              <IoSaveOutline className="text-base" />
              <span>{isSaving ? "Creating..." : "Save & Select Item"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
