"use client";

import { useState, useEffect, useMemo } from "react";
import { IoClose, IoChevronDown, IoCubeOutline, IoSaveOutline } from "react-icons/io5";
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
  const [itemCode, setItemCode] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [itemType, setItemType] = useState<"Product" | "Service">("Product");
  const [unit, setUnit] = useState("PCS");
  const [salesPrice, setSalesPrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [gst, setGst] = useState("None");
  const [openingStock, setOpeningStock] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // HSN Autocomplete
  const [hsnOptions, setHsnOptions] = useState<Array<{ id: string; code: string; type: string; description: string }>>([]);
  const [isSearchingHsn, setIsSearchingHsn] = useState(false);
  const [showHsnDropdown, setShowHsnDropdown] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsSearchingHsn(true);
    itemApi.getHsnSacCodes({ per_page: "all", silentError: true })
      .then((res: any) => {
        const list =
          res?.body?.hsn_sac_codes ||
          res?.body?.hsnSacCodes ||
          (Array.isArray(res?.body) ? res.body : []) ||
          res?.hsn_sac_codes ||
          res?.data ||
          [];

        const parsedList = (Array.isArray(list) ? list : []).map((item: any) => ({
          id: String(item.id || item.code || Math.random()),
          code: String(item.code || ""),
          type: String(item.type || "HSN").toUpperCase(),
          description: String(item.description || ""),
        }));

        setHsnOptions(parsedList);
      })
      .catch(() => setHsnOptions([]))
      .finally(() => setIsSearchingHsn(false));
  }, [isOpen]);

  const filteredHsnOptions = useMemo(() => {
    if (!hsnCode.trim()) return hsnOptions;
    const q = hsnCode.toLowerCase().trim();
    return hsnOptions.filter(
      (opt) => opt.code.toLowerCase().includes(q) || opt.description.toLowerCase().includes(q)
    );
  }, [hsnOptions, hsnCode]);

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
    }

    if (hsnCode.trim()) {
      apiPayload.hsn_sac_code = hsnCode.trim();
    }

    setIsSaving(true);
    try {
      const res: any = await itemApi.createItem(apiPayload);
      const createdObj = res?.body?.item || res?.body?.data || res?.body || res?.data || res?.item || res;
      
      const normalizedCreated = {
        ...apiPayload,
        ...(createdObj || {}),
        id: createdObj?.id || Math.random(),
        itemName: apiPayload.item_name,
        itemCode: apiPayload.item_code || "",
        hsnCode: apiPayload.hsn_sac_code || "",
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

          {/* HSN Code & Item Code */}
          <div className="grid grid-cols-2 gap-3">
            {/* HSN / SAC Code with API Dropdown */}
            <div className="relative">
              <label className="block text-xs font-semibold gi-text-secondary mb-1">HSN / SAC Code</label>
              <div className="relative">
                <input type="text" value={hsnCode} onChange={(e) => { setHsnCode(e.target.value); setShowHsnDropdown(true); }} onFocus={() => setShowHsnDropdown(true)} onBlur={() => setTimeout(() => setShowHsnDropdown(false), 200)} placeholder="Search HSN/SAC" className="w-full h-9 px-3 pr-7 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs focus:outline-none focus:border-indigo-500 font-mono" />
                <IoChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
              </div>

              {showHsnDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto divide-y gi-divider">
                  {isSearchingHsn && hsnOptions.length === 0 ? (
                    <div className="p-3 text-center text-xs gi-text-muted">Loading HSN codes...</div>
                  ) : filteredHsnOptions.length === 0 ? (
                    <div className="p-3 text-center text-xs gi-text-muted">No HSN matched. Type custom code.</div>
                  ) : (
                    filteredHsnOptions.map((opt) => (
                      <button key={opt.id + opt.code} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setHsnCode(opt.code); setShowHsnDropdown(false); }} className="w-full text-left p-2 hover:bg-[var(--gi-hover)] transition flex items-start justify-between gap-2 text-xs cursor-pointer">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400 text-xs">{opt.code}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">{opt.type}</span>
                          </div>
                          {opt.description && <p className="text-[11px] gi-text-secondary mt-0.5 leading-tight truncate">{opt.description}</p>}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold gi-text-secondary mb-1">Item Code / SKU</label>
              <input type="text" value={itemCode} onChange={(e) => setItemCode(e.target.value)} placeholder="e.g. ITM-001" className="w-full h-9 px-3 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs focus:outline-none focus:border-indigo-500 font-mono" />
            </div>
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
