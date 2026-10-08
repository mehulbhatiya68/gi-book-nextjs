"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  IoChevronDown,
  IoCubeOutline,
  IoSaveOutline,
  IoAddCircleOutline,
  IoPricetagOutline,
  IoScanOutline,
  IoSearchOutline,
  IoCloudUploadOutline,
  IoAlertCircleOutline,
  IoBarcodeOutline,
  IoClose,
  IoSparklesOutline,
} from "react-icons/io5";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useAuth } from "@/context/AuthContext";
import PermissionGuard from "@/components/PermissionGuard";
import ToggleSwitch from "@/components/ToggleSwitch";
import PageHeader from "@/components/PageHeader";
import { itemApi } from "@/lib/api/item";
import { ItemBarcode } from "@/components/ItemBarcodeQr";
import { ItemScannerModal } from "@/components/ItemScannerModal";
import { toast } from "react-toastify";
import LimitReachedView from "@/components/LimitReachedView";
import { useLimitCheck } from "@/lib/hooks/useLimitCheck";
import CustomSelect from "@/components/CustomSelect";

export default function AddItem() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const { currentUser } = useAuth();

  const rawEditId = searchParams?.get("id") || (Array.isArray(params?.id) ? params.id[0] : params?.id);
  const editId = rawEditId && rawEditId !== "undefined" ? rawEditId : null;

  const { isLimitReached, used, quota, featureName } = useLimitCheck("item", Boolean(editId));

  const [isLoadingItem, setIsLoadingItem] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Form Fields
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [itemType, setItemType] = useState<"Product" | "Service">("Product");
  const [unit, setUnit] = useState("PCS");

  const [salesPrice, setSalesPrice] = useState("");
  const [salesTaxType, setSalesTaxType] = useState<"Without Tax" | "With Tax">("Without Tax");

  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseTaxType, setPurchaseTaxType] = useState<"With Tax" | "Without Tax">("With Tax");

  const [gst, setGst] = useState("None");
  const [stockQuantity, setStockQuantity] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [desktopItemCode, setDesktopItemCode] = useState("");
  const [isFetchingByCode, setIsFetchingByCode] = useState(false);
  const [lowStockAlert, setLowStockAlert] = useState(false);
  const [lowStockAt, setLowStockAt] = useState("");

  const [hsnCode, setHsnCode] = useState("");
  const [hsnOptions, setHsnOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
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
  }, []);

  // Add Stock Details Collapsible State & Date
  const [isStockDetailsOpen, setIsStockDetailsOpen] = useState(false);
  const [stockDate, setStockDate] = useState(() => new Date().toISOString().split("T")[0]);

  const handleGenerateBarcode = () => {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCode = `ITM-${randomHex}`;
    setItemCode(newCode);
    setDesktopItemCode(newCode);
    setIsStockDetailsOpen(true);
  };

  const handleScanSuccess = (scannedCode: string, matchedItem?: any) => {
    setItemCode(scannedCode);
    setDesktopItemCode(scannedCode);
    setIsStockDetailsOpen(true);

    if (matchedItem && matchedItem.id) {
      const name = matchedItem.item_name || matchedItem.itemName || matchedItem.name || "";
      const hsn = matchedItem.hsn_code || matchedItem.hsn_sac_code || matchedItem.hsnCode || matchedItem.hsn || "";
      const type = (matchedItem.item_type || matchedItem.itemType || "product").toLowerCase() === "service" ? "Service" : "Product";
      const u = matchedItem.unit || "PCS";
      const sPrice = matchedItem.sales_price ?? matchedItem.salesPrice ?? "";
      const pPrice = matchedItem.purchase_price ?? matchedItem.purchasePrice ?? "";
      const qty = matchedItem.current_stock ?? matchedItem.stockQuantity ?? "";
      const minAlert = matchedItem.min_stock_alert ?? matchedItem.lowStockAt ?? "";

      let taxVal = matchedItem.tax_rate ?? matchedItem.taxRate ?? matchedItem.gst;
      let gstStr = "None";
      if (taxVal !== undefined && taxVal !== null && taxVal !== "") {
        if (typeof taxVal === "number") {
          gstStr = taxVal > 0 ? `GST @ ${taxVal}%` : (taxVal === 0 ? "GST @ 0%" : "None");
        } else {
          const num = parseFloat(String(taxVal).replace(/[^\d.]/g, ""));
          if (!isNaN(num)) {
            gstStr = `GST @ ${num}%`;
          } else if (String(taxVal).includes("GST")) {
            gstStr = String(taxVal);
          }
        }
      }

      if (name) setItemName(name);
      setItemType(type);
      if (u) setUnit(u);
      if (sPrice !== "") setSalesPrice(String(sPrice));
      if (matchedItem.sales_price_tax_type || matchedItem.salesTaxType) {
        setSalesTaxType(matchedItem.sales_price_tax_type === "with_tax" || matchedItem.salesTaxType === "With Tax" ? "With Tax" : "Without Tax");
      }
      if (pPrice !== "") setPurchasePrice(String(pPrice));
      if (matchedItem.purchase_price_tax_type || matchedItem.purchaseTaxType) {
        setPurchaseTaxType(matchedItem.purchase_price_tax_type === "without_tax" || matchedItem.purchaseTaxType === "Without Tax" ? "Without Tax" : "With Tax");
      }
      setGst(gstStr);
      if (qty !== "") setStockQuantity(String(qty));
      if (minAlert !== "") {
        setLowStockAlert(Boolean(Number(minAlert) > 0 || matchedItem.lowStockAlert));
        setLowStockAt(String(minAlert));
      }
    }
  };

  const desktopFileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchItemByCode = async (codeToSearch: string) => {
    const trimmedCode = codeToSearch.trim();
    if (!trimmedCode) {
      toast.error("Please enter an item code.");
      return;
    }

    setIsFetchingByCode(true);
    try {
      const searchVal = trimmedCode.toLowerCase();
      let matchedItem: any = null;

      // 1. Try direct item details API fetch ONLY if code is valid UUID format
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedCode);
      if (isUuid) {
        try {
          const directRes: any = await itemApi.getItemDetails(trimmedCode).catch(() => null);
          const itemObj = directRes?.body?.item || directRes?.body?.data || directRes?.body || directRes?.data || directRes?.item || directRes;
          if (itemObj && itemObj.id) {
            matchedItem = itemObj;
          }
        } catch (_) {}
      }

      // 2. Search item list if not found directly
      if (!matchedItem) {
        const listRes: any = await itemApi.getItems({ silentError: true }).catch(() => null);
        const list = Array.isArray(listRes?.body)
          ? listRes.body
          : (listRes?.body?.items || listRes?.body?.data || listRes?.items || listRes?.data || []);

        matchedItem = (Array.isArray(list) ? list : []).find((i: any) => {
          const idStr = String(i.id || "").toLowerCase();
          const codeStr = String(i.item_code || i.itemCode || i.sku || "").toLowerCase();
          const qrCodeStr = String(i.qr_code || i.qrCode || "").toLowerCase();
          const nameStr = String(i.item_name || i.itemName || "").toLowerCase();

          return (
            idStr === searchVal ||
            codeStr === searchVal ||
            qrCodeStr === searchVal ||
            nameStr === searchVal
          );
        });
      }

      if (matchedItem && matchedItem.id) {
        handleScanSuccess(matchedItem.item_code || matchedItem.itemCode || trimmedCode, matchedItem);
        setDesktopItemCode("");
      } else {
        const upper = trimmedCode.toUpperCase();
        setItemCode(upper);
        setDesktopItemCode("");
      }
    } catch (err: any) {
      console.error("Error fetching item by code:", err);
      toast.error("Failed to fetch item data.");
    } finally {
      setIsFetchingByCode(false);
    }
  };

  const handleDesktopImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFetchingByCode(true);
    try {
      const html5QrCode = new Html5Qrcode("desktop-file-reader", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
        ],
        verbose: false,
      });
      const decodedText = await html5QrCode.scanFile(file, true);

      if (decodedText) {
        const uppercaseCode = decodedText.trim().toUpperCase();
        setDesktopItemCode(uppercaseCode);
        await fetchItemByCode(uppercaseCode);
      } else {
        toast.error("No barcode or QR code detected in the uploaded image.");
      }
      try {
        html5QrCode.clear();
      } catch (_) {}
    } catch (err: any) {
      console.warn("Desktop image file barcode scan error:", err);
      toast.error("Could not detect a valid barcode or QR code in this image.");
    } finally {
      setIsFetchingByCode(false);
      if (e.target) e.target.value = "";
    }
  };



  const gstOptions = useMemo(() => {
    const base = ["None", "GST @ 5%", "GST @ 18%", "GST @ 28%"];
    if (gst && !base.includes(gst)) {
      return [...base, gst];
    }
    return base;
  }, [gst]);

  useEffect(() => {
    if (!editId) return;
    setIsLoadingItem(true);

    itemApi.getItemDetails(editId)
      .then((res: any) => {
        let existing = res?.body?.item || res?.body?.data || res?.body || res?.data || res?.item || res;
        if (!existing || !existing.id) {
          return itemApi.getItems({ silentError: true }).then((listRes: any) => {
            const list = Array.isArray(listRes?.body) ? listRes.body : (listRes?.body?.items || listRes?.body?.data || []);
            return (Array.isArray(list) ? list : []).find((i: any) => String(i.id) === String(editId));
          });
        }
        return existing;
      })
      .then((existing: any) => {
        if (existing && existing.id) {
          const name = existing.item_name || existing.itemName || existing.name || "";
          const desc = existing.description || "";
          const type = (existing.item_type || existing.itemType || "product").toLowerCase() === "service" ? "Service" : "Product";
          const u = existing.unit || "PCS";
          const sPrice = existing.sales_price ?? existing.salesPrice ?? "";
          const pPrice = existing.purchase_price ?? existing.purchasePrice ?? "";
          const code = existing.item_code || existing.itemCode || existing.sku || "";
          const qty = existing.current_stock ?? existing.stockQuantity ?? "";
          const minAlert = existing.min_stock_alert ?? existing.lowStockAt ?? "";

          // GST / Tax Rate normalization
          let taxVal = existing.tax_rate ?? existing.taxRate ?? existing.gst;
          let gstStr = "None";
          if (taxVal !== undefined && taxVal !== null && taxVal !== "") {
            if (typeof taxVal === "number") {
              gstStr = taxVal > 0 ? `GST @ ${taxVal}%` : (taxVal === 0 ? "GST @ 0%" : "None");
            } else {
              const num = parseFloat(String(taxVal).replace(/[^\d.]/g, ""));
              if (!isNaN(num)) {
                gstStr = `GST @ ${num}%`;
              } else if (String(taxVal).includes("GST")) {
                gstStr = String(taxVal);
              }
            }
          }

          const existingHsn = existing.hsn || existing.hsn_code || existing.hsn_sac_code || existing.hsnCode || "";
          setItemName(name);
          setDescription(desc);
          setItemType(type);
          setUnit(u);
          setSalesPrice(sPrice !== "" ? String(sPrice) : "");
          setSalesTaxType(existing.sales_price_tax_type === "with_tax" || existing.salesTaxType === "With Tax" ? "With Tax" : "Without Tax");
          setPurchasePrice(pPrice !== "" ? String(pPrice) : "");
          setPurchaseTaxType(existing.purchase_price_tax_type === "without_tax" || existing.purchaseTaxType === "Without Tax" ? "Without Tax" : "With Tax");
          setGst(gstStr);
          setItemCode(code);
          if (existingHsn) setHsnCode(String(existingHsn));
          setStockQuantity(qty !== "" ? String(qty) : "");
          setLowStockAlert(Boolean(Number(minAlert) > 0 || existing.lowStockAlert));
          setLowStockAt(minAlert !== "" ? String(minAlert) : "");

          if (code || (qty !== "" && Number(qty) > 0) || (minAlert !== "" && Number(minAlert) > 0)) {
            setIsStockDetailsOpen(true);
          }
        }
      })
      .catch((err) => {
        console.error("Error loading item for edit:", err);
      })
      .finally(() => setIsLoadingItem(false));
  }, [editId]);

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemName.trim()) {
      toast.error("Please enter an item name.");
      return;
    }

    const parsedTaxRate = gst === "None" ? 0 : (parseFloat(String(gst).replace(/[^\d.]/g, "")) || 0);

    // Exact backend API payload construction
    const apiPayload: any = {
      item_name: itemName.trim(),
      item_type: itemType.toLowerCase() === "service" ? "service" : "product",
      unit: itemType === "Service" ? (unit.trim() || "PCS") : (unit.trim() || "PCS"),
      sales_price: Number(salesPrice) || 0,
      sales_price_tax_type: salesTaxType === "With Tax" ? "with_tax" : "without_tax",
      purchase_price: itemType === "Service" ? 0 : (Number(purchasePrice) || 0),
      purchase_price_tax_type: purchaseTaxType === "Without Tax" ? "without_tax" : "with_tax",
      tax_rate: parsedTaxRate,
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

    if (itemType === "Product") {
      if (editId) {
        apiPayload.min_stock_alert = lowStockAlert ? (Number(lowStockAt) || 0) : 0;
      } else {
        apiPayload.min_stock_alert = (isStockDetailsOpen && lowStockAlert) ? (Number(lowStockAt) || 0) : 0;
        apiPayload.current_stock = isStockDetailsOpen ? (Number(stockQuantity) || 0) : 0;
      }
    } else {
      apiPayload.min_stock_alert = 0;
    }

    setIsSaving(true);
    try {
      if (editId) {
        // Strip current_stock for PUT updates as per API specifications
        const { current_stock, currentStock, ...updatePayload } = apiPayload;
        await itemApi.updateItem(editId, updatePayload);
        toast.success("Item updated successfully!");
      } else {
        await itemApi.createItem(apiPayload);
        toast.success("Item created successfully!");
      }
      router.replace(editId ? `/items/${editId}` : "/items");
    } catch (error: any) {
      console.error("Error saving item:", error);
      toast.error(error?.message || "Failed to save item details.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingItem) {
    return (
      <div className="min-h-screen p-5 flex items-center justify-center gi-page">
        <div className="rounded-xl gi-card border gi-divider px-6 py-5 shadow-xs text-center space-y-2">
          <div className="w-6 h-6 border-3 border-[var(--gi-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold gi-text-secondary">Loading item data...</p>
        </div>
      </div>
    );
  }

  if (isLimitReached) {
    return (
      <LimitReachedView
        featureName={featureName}
        usedCount={used}
        quotaLimit={quota}
      />
    );
  }

  return (
    <PermissionGuard module="Item Transaction">
      <div className="space-y-6 pb-16 select-none gi-page max-w-5xl mx-auto">
        {/* Navigation & Header */}
        <PageHeader
          title={editId ? `Edit Item: ${itemName || ""}` : "Create New Item"}
          subtitle={editId ? "Update product specifications, GST rates & stock alerts" : "Add a new product or service to your business inventory"}
          backUrl={editId ? `/items/${editId}` : "/items"}
          actions={
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="h-9 w-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center cursor-pointer transition shadow-md shrink-0 sm:hidden"
              title="Scan Barcode / QR Code"
              aria-label="Scan Barcode / QR Code"
            >
              <IoScanOutline className="text-xl" />
            </button>
          }
        />

        <form onSubmit={handleSaveItem} className="space-y-6">

          {/* Desktop Screen Only: Enter Item Code to Fetch Data / Upload Barcode Image (Create Mode Only) */}
          {!editId && (
            <div className="hidden sm:flex p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-indigo-950/40 border border-indigo-500/25 dark:border-indigo-500/35 shadow-sm items-center justify-between gap-5">
              <div className="flex items-center gap-3.5 shrink-0">
                <div className="h-11 w-11 rounded-2xl bg-indigo-600/15 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xl shrink-0 shadow-inner">
                  <IoBarcodeOutline />
                </div>
                <div>
                  <h3 className="text-sm font-bold gi-text-primary tracking-tight">Enter item code to fetch data</h3>
                  <p className="text-[11px] gi-text-secondary">Enter item code or upload barcode image to fetch item details</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 max-w-lg w-full">
                <div className="relative flex-1">
                  <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
                  <input
                    type="text"
                    value={desktopItemCode}
                    onChange={(e) => setDesktopItemCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        fetchItemByCode(desktopItemCode);
                      }
                    }}
                    placeholder="ENTER ITEM CODE..."
                    className="w-full h-10 pl-9 pr-8 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs font-mono uppercase focus:outline-none focus:border-indigo-500 shadow-2xs tracking-wider font-semibold placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:font-normal"
                  />
                  {desktopItemCode && (
                    <button
                      type="button"
                      onClick={() => setDesktopItemCode("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer p-0.5 rounded-full"
                      title="Clear"
                    >
                      <IoClose className="text-base" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fetchItemByCode(desktopItemCode)}
                  disabled={isFetchingByCode || !desktopItemCode.trim()}
                  className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-md shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFetchingByCode ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <IoSearchOutline className="text-base" />
                      <span>Fetch Data</span>
                    </>
                  )}
                </button>

                {/* Upload Image Option */}
                <button
                  type="button"
                  onClick={() => desktopFileInputRef.current?.click()}
                  disabled={isFetchingByCode}
                  className="h-10 px-3.5 rounded-xl gi-btn-secondary border gi-divider text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs hover:border-emerald-500 shrink-0"
                  title="Upload image to scan barcode / QR code"
                >
                  <IoCloudUploadOutline className="text-base text-emerald-500" />
                  <span>Upload Image</span>
                </button>
                <input
                  type="file"
                  ref={desktopFileInputRef}
                  accept="image/*"
                  onChange={handleDesktopImageUpload}
                  className="hidden"
                />
                <div id="desktop-file-reader" className="hidden" />
              </div>
            </div>
          )}

          {/* SECTION 1: Item Basic Details */}
          <div className="gi-card p-3.5 sm:p-6 rounded-2xl shadow-xs space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2.5 border-b gi-divider pb-2.5 sm:pb-3">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg gi-badge-info flex items-center justify-center text-sm sm:text-base shrink-0">
                <IoCubeOutline />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold gi-text-primary">General Specifications</h2>
                <p className="text-[11px] gi-text-secondary hidden sm:block">Basic product details, item type, and measurement unit</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Item Name */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold gi-text-secondary mb-1">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder=""
                  className="w-full h-9 sm:h-10 px-3.5 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition shadow-2xs"
                />
              </div>

              {/* Item Category */}
              <div>
                <label className="block text-xs font-semibold gi-text-secondary mb-1">
                  Item Category
                </label>
                <div className="flex items-center gap-1 p-1 rounded-xl gi-surface-secondary border gi-border w-full h-9 sm:h-10">
                  <button
                    type="button"
                    onClick={() => setItemType("Product")}
                    className={`flex-1 h-7 sm:h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                      itemType === "Product" ? "gi-card gi-text-primary shadow-xs" : "gi-text-muted hover:gi-text-primary"
                    }`}
                  >
                    Product (Physical)
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemType("Service")}
                    className={`flex-1 h-7 sm:h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                      itemType === "Service" ? "gi-card gi-text-primary shadow-xs" : "gi-text-muted hover:gi-text-primary"
                    }`}
                  >
                    Service (Labor)
                  </button>
                </div>
              </div>

              {/* Measurement Unit */}
              {itemType === "Product" && (
                <div>
                  <label className="block text-xs font-semibold gi-text-secondary mb-1">
                    Measurement Unit
                  </label>
                  <SelectInput
                    value={unit}
                    onChange={setUnit}
                    options={["PCS", "BOX", "KG", "LBS", "MTR", "SETS", "SQFT", "LTR", "NOS", "PAIR", "PACK"]}
                  />
                </div>
              )}

              {/* Item Description */}
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold gi-text-secondary mb-1">
                  Item Description / Notes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter product specifications, notes, or details..."
                  className="w-full px-3.5 py-2 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition shadow-2xs resize-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Pricing & Taxation */}
          <div className="gi-card p-3.5 sm:p-6 rounded-2xl shadow-xs space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2.5 border-b gi-divider pb-2.5 sm:pb-3">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg gi-badge-warning flex items-center justify-center text-sm sm:text-base shrink-0">
                <IoPricetagOutline />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold gi-text-primary">Pricing &amp; Tax Structure</h2>
                <p className="text-[11px] gi-text-secondary hidden sm:block">Sales price, purchase price, and GST tax application</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {/* Sales Price */}
              <PriceField
                title="Sales Price (₹)"
                price={salesPrice}
                setPrice={setSalesPrice}
                taxType={salesTaxType}
                setTaxType={setSalesTaxType}
                taxOptions={["Without Tax", "With Tax"]}
              />

              {/* Purchase Price (Product only) */}
              {itemType === "Product" ? (
                <PriceField
                  title="Purchase Price (₹)"
                  price={purchasePrice}
                  setPrice={setPurchasePrice}
                  taxType={purchaseTaxType}
                  setTaxType={setPurchaseTaxType}
                  taxOptions={["With Tax", "Without Tax"]}
                />
              ) : (
                <div className="hidden md:block" />
              )}

              {/* Applicable GST Rate */}
              <div>
                <label className="block text-xs font-semibold gi-text-secondary mb-1">
                  GST Tax Rate
                </label>
                <SelectInput value={gst} onChange={setGst} options={gstOptions} />
              </div>

              {/* HSN / SAC Code */}
              <div>
                <label className="block text-xs font-semibold gi-text-secondary mb-1">
                  HSN / SAC Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="add-item-hsn-options"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    placeholder="Enter or select HSN code..."
                    className="w-full h-9 sm:h-10 px-3.5 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition shadow-2xs font-mono"
                  />
                  <datalist id="add-item-hsn-options">
                    {hsnOptions.map((opt, idx) => (
                      <option key={`${opt.value}-${idx}`} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Add Stock Details (Only in Create Mode) */}
          {itemType === "Product" && !editId && (
            <div className="gi-card rounded-2xl shadow-xs border gi-divider overflow-hidden transition-all">
              {/* Section Toggle Header */}
              <div
                onClick={() => setIsStockDetailsOpen((prev) => !prev)}
                className="p-3.5 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-[var(--gi-hover)] transition select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl gi-badge-success flex items-center justify-center text-base sm:text-lg shrink-0">
                    <IoAddCircleOutline />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs sm:text-sm font-bold gi-text-primary">Add Stock Details</h2>
                      <span className={`px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-extrabold uppercase ${
                        isStockDetailsOpen ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-zinc-800 text-slate-500"
                      }`}>
                        {isStockDetailsOpen ? "ENABLED" : "OFF"}
                      </span>
                    </div>
                    <p className="text-[11px] gi-text-secondary leading-tight mt-0.5 hidden sm:block">
                      Configure initial stock quantity, transaction date, barcode, and safety alert limits
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  <ToggleSwitch
                    checked={isStockDetailsOpen}
                    onChange={(val) => setIsStockDetailsOpen(val)}
                    size="md"
                    ariaLabel="Toggle Add Stock Details"
                  />
                </div>
              </div>

              {/* Section Collapsible Body */}
              <AnimatePresence>
                {isStockDetailsOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t gi-divider p-3.5 sm:p-6 space-y-4 bg-[var(--gi-surface)]"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 1. Quantity */}
                      <div>
                        <label className="block text-xs font-semibold gi-text-secondary mb-1">
                          Quantity
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={stockQuantity}
                            onChange={(e) => setStockQuantity(e.target.value)}
                            placeholder="0.00"
                            className="w-full h-9 sm:h-10 px-3.5 pr-14 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs sm:text-sm font-extrabold focus:outline-none focus:border-indigo-500 transition shadow-2xs font-mono"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold gi-text-muted">
                            {unit}
                          </span>
                        </div>
                      </div>

                      {/* 2. Date */}
                      <div>
                        <label className="block text-xs font-semibold gi-text-secondary mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={stockDate}
                          onChange={(e) => setStockDate(e.target.value)}
                          className="w-full h-9 sm:h-10 px-3.5 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition shadow-2xs font-mono"
                        />
                      </div>

                      {/* 3. Item Code with Generate Barcode & Visual Barcode Preview */}
                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-xs font-semibold gi-text-secondary">
                          Item Code
                        </label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <div className="relative flex-1">
                            <IoBarcodeOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
                            <input
                              type="text"
                              value={itemCode}
                              onChange={(e) => setItemCode(e.target.value.toUpperCase())}
                              placeholder="Enter or generate item code..."
                              className="w-full h-9 sm:h-10 pl-9 pr-3.5 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs sm:text-sm font-mono uppercase focus:outline-none focus:border-indigo-500 transition shadow-2xs tracking-wider"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleGenerateBarcode}
                            className="h-9 sm:h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs shrink-0 cursor-pointer"
                            title="Generate unique barcode"
                          >
                            <IoSparklesOutline className="text-sm" />
                            <span>Generate Barcode</span>
                          </button>
                        </div>

                        {/* Visual Barcode Display when itemCode is present */}
                        {itemCode.trim() && (
                          <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-2xs space-y-1 text-center">
                            <div className="flex justify-center">
                              <ItemBarcode value={itemCode.trim()} width={1.8} height={45} fontSize={11} />
                            </div>
                            <p className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 tracking-widest uppercase">
                              CODE: {itemCode.trim()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 4. Low Stock Alert */}
                      <div className="flex items-center justify-between p-3 rounded-xl border gi-border bg-[var(--gi-card-bg)]">
                        <div>
                          <label className="block text-xs font-bold gi-text-primary">
                            Low Stock Alert
                          </label>
                          <p className="text-[11px] gi-text-secondary">Enable safety warning threshold</p>
                        </div>
                        <ToggleSwitch
                          checked={lowStockAlert}
                          onChange={(val) => setLowStockAlert(val)}
                          size="sm"
                          ariaLabel="Toggle Low Stock Alert"
                        />
                      </div>

                      {/* 5. Low Stock At Input */}
                      {lowStockAlert && (
                        <div>
                          <label className="block text-xs font-semibold gi-text-secondary mb-1">
                            Low Stock At
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={lowStockAt}
                              onChange={(e) => setLowStockAt(e.target.value)}
                              placeholder="e.g. 5"
                              className="w-full h-9 sm:h-10 px-3.5 pr-14 rounded-xl border border-amber-500/40 bg-[var(--gi-card-bg)] gi-text-primary text-xs sm:text-sm font-extrabold focus:outline-none focus:border-amber-500 font-mono shadow-2xs"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-700 dark:text-amber-300">
                              {unit}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Submit Action Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push(editId ? `/items/${editId}` : "/items")}
              className="px-5 py-2.5 rounded-xl border gi-border gi-surface-interactive gi-text-secondary text-xs font-semibold cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl gi-btn-primary text-xs sm:text-sm font-semibold flex items-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <IoSaveOutline className="text-base" />
                  <span>{editId ? "Update Item Details" : "Save Item"}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Item Scanner Modal for Barcode Auto-Fill */}
        <ItemScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={(scannedCode) => {
            setItemCode(scannedCode);
            setIsStockDetailsOpen(true);
          }}
        />
      </div>
    </PermissionGuard>
  );
}


function SelectInput({ value, onChange, options }: { value: string; onChange: (val: string) => void; options: string[] }) {
  return (
    <CustomSelect
      value={value}
      onChange={onChange}
      options={options.map((opt) => ({
        value: opt,
        label: opt,
      }))}
    />
  );
}

function PriceField({ title, price, setPrice, taxType, setTaxType, taxOptions }: any) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold gi-text-secondary">
        {title}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          step="any"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
          className="flex-1 h-9 sm:h-10 px-3 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs sm:text-sm focus:outline-none focus:border-indigo-500 font-mono shadow-2xs min-w-0"
        />
        <div className="flex items-center gap-0.5 p-1 rounded-xl gi-surface-secondary border gi-border shrink-0">
          {taxOptions.map((option: string) => (
            <button
              key={option}
              type="button"
              onClick={() => setTaxType(option)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer whitespace-nowrap ${
                taxType === option ? "gi-card gi-text-primary shadow-xs" : "gi-text-muted hover:gi-text-primary"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
