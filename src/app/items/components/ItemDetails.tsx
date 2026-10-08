"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, usePathname, useSearchParams } from "next/navigation";
import { handleSmartBack } from "@/lib/utils/smartNavigation";
import { motion, AnimatePresence } from "motion/react";
import {
  IoArrowBack,
  IoChevronBack,
  IoCreateOutline,
  IoTrashOutline,
  IoAddCircleOutline,
  IoRemoveCircleOutline,
  IoCubeOutline,
  IoCalendarOutline,
  IoTrendingUpOutline,
  IoWarningOutline,
  IoBuildOutline,
  IoDocumentTextOutline,
  IoBarcodeOutline,
  IoCopyOutline,
  IoCheckmarkDoneOutline,
  IoPrintOutline,
} from "react-icons/io5";
import { useAuth } from "@/context/AuthContext";
import PermissionGuard from "@/components/PermissionGuard";
import PageHeader from "@/components/PageHeader";
import { SkeletonItemDetails } from "@/components/Skeleton";
import { itemApi } from "@/lib/api/item";
import { invoiceApi } from "@/lib/api/invoice";
import { ItemQrHelper } from "@/lib/utils/itemQrHelper";
import { ItemBarcodeTagModal } from "@/components/ItemBarcodeQr";

const normalizeItem = (raw: any) => {
  if (!raw) return null;
  const qty = Number(raw.current_stock ?? raw.stockQuantity ?? raw.stock_quantity ?? 0);
  const pPrice = Number(raw.purchase_price ?? raw.purchasePrice ?? 0);
  const sPrice = Number(raw.sales_price ?? raw.salesPrice ?? 0);
  const val = Number(raw.stock_value ?? raw.stockValue ?? (qty * pPrice));
  const minAlert = Number(raw.min_stock_alert ?? raw.lowStockAt ?? raw.min_stock ?? 0);

  const rawHistory = raw.stock_history || raw.stockHistory || raw.stock_adjustments || raw.adjustments || [];
  const historyList = Array.isArray(rawHistory) ? rawHistory : [];

  return {
    ...raw,
    id: raw.id,
    itemName: raw.item_name || raw.itemName || raw.name || "Unnamed Item",
    itemCode: raw.item_code || raw.itemCode || raw.sku || raw.qr_code || raw.qrCode || "",
    qrCode: raw.qr_code || raw.qrCode || raw.item_code || raw.itemCode || "",
    qrPayload: raw.qr_payload || raw.qrPayload || ItemQrHelper.encode({ itemId: raw.id, qrCode: raw.qr_code || raw.item_code }),
    hsnCode: raw.hsn || raw.hsn_code || raw.hsn_sac_code || raw.hsnCode || "",
    itemType: (raw.item_type || raw.itemType || "Product").toLowerCase() === "service" ? "Service" : "Product",
    unit: raw.unit || "PCS",
    salesPrice: sPrice,
    purchasePrice: pPrice,
    gst: raw.tax_rate !== undefined && raw.tax_rate !== null ? (raw.tax_rate ? `GST @ ${raw.tax_rate}%` : "None") : (raw.gst || "None"),
    taxRate: raw.tax_rate ?? (raw.gst ? parseFloat(String(raw.gst).replace(/[^\d.]/g, "")) || 0 : 0),
    description: raw.description || "",
    stockQuantity: qty,
    stockValue: val,
    lowStockAlert: Boolean(raw.low_stock_alert ?? raw.lowStockAlert ?? minAlert > 0),
    lowStockAt: minAlert,
    stockHistory: historyList.map((h: any) => ({
      id: h.id || Math.random(),
      type: (h.type || h.adjustment_type || "add").toLowerCase().includes("reduce") ? "reduce" : "add",
      quantity: Number(h.quantity || h.qty || 0),
      unit: h.unit || raw.unit || "PCS",
      date: h.date || h.adjustment_date || (h.created_at ? String(h.created_at).split("T")[0] : new Date().toISOString().split("T")[0]),
      time: h.time || (h.created_at ? new Date(h.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""),
      note: h.note || h.reason || "",
      stockAfter: Number(h.stock_after ?? h.stockAfter ?? 0),
      stockValue: Number(h.stock_value ?? h.stockValue ?? 0),
      adjustedBy: h.adjusted_by || h.adjustedBy || h.user_name || "Owner",
    })),
    createdBy: raw.created_by || raw.createdBy || "",
    createdAt: raw.created_at || raw.createdAt || "",
    updatedBy: raw.updated_by || raw.updatedBy || "",
    updatedAt: raw.updated_at || raw.updatedAt || "",
  };
};

export default function ItemDetails() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hasPermission } = useAuth();

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchItemData = useCallback(async () => {
    const targetId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    if (!targetId) return;
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Fetch Item Details
      let raw: any = null;
      try {
        const res: any = await itemApi.getItemDetails(targetId);
        raw = res?.body?.item || res?.body?.data || res?.body || res?.data || res?.item || res;
      } catch (_) {}

      if (!raw || !raw.id || typeof raw !== "object") {
        const listRes: any = await itemApi.getItems({ silentError: true }).catch(() => null);
        const list = Array.isArray(listRes?.body)
          ? listRes.body
          : (listRes?.body?.items || listRes?.body?.data || listRes?.items || listRes?.data || []);
        raw = (Array.isArray(list) ? list : []).find(
          (i: any) => String(i.id) === String(targetId)
        );
      }

      if (!raw || !raw.id) {
        setErrorMsg("Item not found or removed.");
        setLoading(false);
        return;
      }

      const normalized = normalizeItem(raw);

      // 2. Fetch API Stock Adjustments & Invoices in parallel for accurate movement log
      let [adjRes, invRes]: any = await Promise.all([
        itemApi.getStockAdjustments(targetId, { page: 1, per_page: "100", sort_by: "adjustment_date", sort_dir: "desc", silentError: true }).catch(() => null),
        invoiceApi.getInvoices({ silentError: true }).catch(() => null),
      ]);

      const adjList = Array.isArray(adjRes?.body?.stock_adjustments)
        ? adjRes.body.stock_adjustments
        : (Array.isArray(adjRes?.body?.adjustments)
            ? adjRes.body.adjustments
            : (Array.isArray(adjRes?.body)
                ? adjRes.body
                : (adjRes?.stock_adjustments || adjRes?.body?.data || adjRes?.data || (Array.isArray(adjRes) ? adjRes : []))));

      const invList = Array.isArray(invRes?.body)
        ? invRes.body
        : (invRes?.body?.invoices || invRes?.body?.data || invRes?.invoices || invRes?.data || (Array.isArray(invRes) ? invRes : []));

      const movements: any[] = [];
      const seenIds = new Set<string>();

      // a) Embedded stock history from item details API
      (normalized.stockHistory || []).forEach((h: any) => {
        const key = `h-${h.type}-${h.date}-${h.quantity}-${h.note}`;
        if (!seenIds.has(key)) {
          seenIds.add(key);
          movements.push(h);
        }
      });

      // b) API Stock Adjustments (strictly parsed per items.md schema)
      (Array.isArray(adjList) ? adjList : []).forEach((adj: any) => {
        const typeStr = String(adj.adjustment_type || adj.type || "add").toLowerCase();
        const isReduce = typeStr.includes("reduce") || typeStr.includes("sub") || typeStr.includes("out");
        const dateStr = adj.adjustment_date || adj.date || (adj.created_at ? String(adj.created_at).split("T")[0] : "");
        const key = `adj-${adj.id || (dateStr + adj.quantity + (adj.reason || ''))}`;
        if (!seenIds.has(key)) {
          seenIds.add(key);
          movements.push({
            id: adj.id || key,
            type: isReduce ? "reduce" : "add",
            quantity: Number(adj.quantity || 0),
            unit: adj.unit || normalized.unit,
            date: dateStr,
            time: adj.created_at ? new Date(adj.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "",
            note: adj.reason || adj.note || `${isReduce ? "Stock Reduced" : "Stock Added"} manually`,
            stockAfter: Number(adj.stock_after ?? adj.stockAfter ?? 0),
            stockValue: Number(adj.stock_value ?? adj.stockValue ?? 0),
            adjustedBy: adj.user_name || adj.user?.name || adj.created_by || adj.adjustedBy || "Owner",
          });
        }
      });

      // c) Invoices referencing this item
      (Array.isArray(invList) ? invList : []).forEach((inv: any) => {
        const itemsInInv = inv.items || inv.invoice_items || inv.details || [];
        if (!Array.isArray(itemsInInv)) return;

        const matchingItem = itemsInInv.find(
          (ii: any) => String(ii.item_id || ii.itemId || ii.product_id || ii.productId || ii.id) === String(targetId)
        );

        if (matchingItem) {
          const typeStr = String(inv.invoiceType || inv.type || inv.invoice_type || "").toLowerCase();
          const numStr = String(inv.invoice_number || inv.invoiceNumberStr || inv.invoiceNumber || "").toUpperCase();
          const isPurchase = typeStr.includes("purchase") || typeStr.includes("buy") || numStr.startsWith("PUR") || numStr.startsWith("PINV");

          const qty = Number(matchingItem.quantity || matchingItem.qty || 1);
          const dateStr = inv.due_date || inv.invoice_date || inv.invoiceDate || inv.date || (inv.created_at ? String(inv.created_at).split("T")[0] : "");
          const key = `inv-${inv.id}-${matchingItem.id || qty}`;

          if (!seenIds.has(key)) {
            seenIds.add(key);
            movements.push({
              id: key,
              type: isPurchase ? "add" : "reduce",
              quantity: qty,
              unit: matchingItem.unit || normalized.unit,
              date: dateStr,
              time: inv.created_at ? new Date(inv.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "",
              note: `${isPurchase ? "Purchase Invoice" : "Sales Invoice"} ${inv.invoice_number ? `#${inv.invoice_number}` : ''} (${inv.ledger?.name || inv.partyName || "Party"})`,
              stockAfter: 0,
              stockValue: 0,
              adjustedBy: inv.created_by || "System Invoice",
              isInvoice: true,
              invoiceId: inv.id,
            });
          }
        }
      });

      // Sort chronologically ascending
      movements.sort((a, b) => {
        const tA = a.date ? new Date(a.date).getTime() : 0;
        const tB = b.date ? new Date(b.date).getTime() : 0;
        return tA - tB;
      });

      // Recalculate running stock
      let runningStock = 0;
      movements.forEach((m) => {
        if (m.type === "add") {
          runningStock += m.quantity;
        } else {
          runningStock = Math.max(0, runningStock - m.quantity);
        }
        if (!m.stockAfter) {
          m.stockAfter = runningStock;
        }
      });

      // Reverse to display newest first
      movements.reverse();

      normalized.stockHistory = movements;
      setItem(normalized);
    } catch (err: any) {
      console.error("Error loading item details:", err);
      setErrorMsg("Failed to load item details.");
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  useEffect(() => {
    fetchItemData();
  }, [fetchItemData]);

  const deleteItem = async () => {
    if (!item) return;

    setIsDeleting(true);
    try {
      await itemApi.deleteItem(item.id);
      setShowDelete(false);
      router.push("/items");
    } catch (err: any) {
      console.error("Error deleting item:", err);
      alert(err.message || "Failed to delete item.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <PermissionGuard module="Item Transaction">
        <SkeletonItemDetails />
      </PermissionGuard>
    );
  }

  if (errorMsg || !item) {
    return (
      <div className="min-h-screen p-4 sm:p-6 flex items-center justify-center gi-page">
        <div className="rounded-xl gi-card border gi-divider p-6 max-w-sm w-full text-center space-y-3">
          <IoWarningOutline className="text-3xl text-amber-500 mx-auto" />
          <h2 className="text-base font-bold gi-text-primary">{errorMsg || "Item not found"}</h2>
          <button
            type="button"
            onClick={() => handleSmartBack(router, pathname, searchParams ? searchParams.get("from") : null, "/items")}
            className="gi-back-btn mx-auto"
          >
            <IoChevronBack />
            <span className="gi-back-label">Back</span>
          </button>
        </div>
      </div>
    );
  }

  const stock = Number(item.stockQuantity || 0);
  const stockValue = Number(item.stockValue || 0);
  const history = item.stockHistory || [];
  const isService = String(item.itemType || item.type || item.item_type || "").toLowerCase().trim() === "service";

  return (
    <PermissionGuard module="Item Transaction">
      <div className="space-y-6 pb-12 gi-page">
        {/* Mobile View (< 768px) */}
        <div className="block md:hidden space-y-4 pb-12 select-none">
          {/* Top Header Row */}
          <div className="flex items-center justify-between py-1 border-b gi-divider pb-3">
            <button
              type="button"
              onClick={() => router.push("/items")}
              className="gi-back-btn"
              aria-label="Back"
            >
              <IoChevronBack />
              <span className="gi-back-label">Back</span>
            </button>

            <div className="flex items-center gap-2">
              {item.itemType === "Product" && hasPermission("Item Transaction", "Update") && (
                <button
                  type="button"
                  onClick={() => router.push(`/adjustStock/${item.id}?mode=add`)}
                  className="px-3 py-1.5 rounded-xl gi-btn-primary text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer whitespace-nowrap"
                >
                  <IoBuildOutline className="text-sm" />
                  <span>Adjust Stock</span>
                </button>
              )}

              {hasPermission("Item Transaction", "Update") && (
                <button
                  type="button"
                  onClick={() => setShowBarcodeModal(true)}
                  className="p-2 gi-text-primary hover:bg-[var(--gi-hover)] rounded-full transition cursor-pointer"
                  title="View Barcode Tag"
                >
                  <IoBarcodeOutline className="text-xl" />
                </button>
              )}

              {hasPermission("Item Transaction", "Update") && (
                <button
                  type="button"
                  onClick={() => router.push(`/items/edit/${item.id}`)}
                  className="p-2 gi-text-primary hover:bg-[var(--gi-hover)] rounded-full transition cursor-pointer"
                  title="Edit Item"
                >
                  <IoCreateOutline className="text-xl" />
                </button>
              )}
              {hasPermission("Item Transaction", "Delete") && (
                <button
                  type="button"
                  onClick={() => setShowDelete(true)}
                  className="gi-action-btn-delete"
                  title="Delete Item"
                >
                  <IoTrashOutline className="text-lg" />
                </button>
              )}
            </div>
          </div>

          {/* Item Profile Info Header */}
          <div className="flex items-center gap-4 py-1">
            <div className="h-14 w-14 rounded-full gi-surface-secondary border gi-divider gi-text-primary font-bold text-xl flex items-center justify-center shrink-0">
              {item.itemName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold gi-text-primary tracking-tight truncate">
                {item.itemName}
              </h1>
            </div>
          </div>

          {/* Item Specifications (Shadow section separation) */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 shadow-xs space-y-3.5 text-xs">
            {/* Grid Row 1 (3 Cols) */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[11px] font-medium gi-text-muted block mb-0.5">
                  Item Code
                </span>
                <span className="font-semibold gi-text-primary text-xs block">
                  {item.itemCode || item.qrCode || "—"}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium gi-text-muted block mb-0.5">
                  Measuring Unit
                </span>
                <span className="font-semibold gi-text-primary text-xs block uppercase">
                  {item.unit || "PCS"}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium gi-text-muted block mb-0.5">
                  Low stock at
                </span>
                <span className="font-semibold gi-text-primary text-xs block">
                  {item.lowStockAt ?? 0}
                </span>
              </div>
            </div>

            {/* Grid Row 2 (3 Cols) */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[11px] font-medium gi-text-muted block mb-0.5">
                  Tax Rate
                </span>
                <span className="font-semibold gi-text-primary text-xs block">
                  {item.taxRate ? `${item.taxRate}%` : item.gst || "5%"}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium gi-text-muted block mb-0.5">
                  {item.itemType === "Service" ? "SAC Code" : "HSN Code"}
                </span>
                <span className="font-semibold gi-text-primary text-xs block font-mono">
                  {item.hsnCode || "—"}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium gi-text-muted block mb-0.5">
                  Item type
                </span>
                <span className="font-semibold gi-text-primary text-xs block lowercase">
                  {item.itemType || "product"}
                </span>
              </div>
            </div>

            {/* Row 3 Description */}
            <div>
              <span className="text-[11px] font-medium gi-text-muted block mb-0.5">
                Item Description
              </span>
              <span className="font-semibold gi-text-primary text-xs block">
                {item.description || "-"}
              </span>
            </div>
          </div>

          {/* Pricing & Stock Metrics (Shadow section separation) */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 shadow-xs text-xs">
            <div>
              <span className="text-[11px] font-medium gi-text-muted block mb-0.5">
                Sales Price
              </span>
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="font-semibold text-sm gi-text-primary font-mono">
                  ₹{Number(item.salesPrice || 0).toFixed(2)}
                </span>
                <span className="text-[11px] gi-text-muted font-normal">
                  Without tax
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-medium gi-text-muted block mb-0.5">
                Purchase Price
              </span>
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="font-semibold text-sm gi-text-primary font-mono">
                  ₹{Number(item.purchasePrice || 0).toFixed(2)}
                </span>
                <span className="text-[11px] gi-text-muted font-normal">
                  With tax
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-medium gi-text-muted block mb-0.5">
                Stock Quantity
              </span>
              <span className="font-semibold text-sm gi-text-primary">
                {stock} <span className="text-xs gi-text-muted font-normal">{item.unit || "PCS"}</span>
              </span>
            </div>

            <div>
              <span className="text-[11px] font-medium gi-text-muted block mb-0.5">
                Stock Value
              </span>
              <span className="font-semibold text-sm gi-text-primary font-mono">
                ₹{stockValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Item Timeline Section */}
          {!isService && (
            <div className="pt-3 space-y-3">
              <h2 className="text-sm font-bold gi-text-primary">
                Item Timeline
              </h2>

              {history.length === 0 ? (
                <div className="py-8 text-center text-xs gi-text-muted bg-white dark:bg-zinc-900 rounded-2xl shadow-xs">
                  No timeline records found.
                </div>
              ) : (
                <div className="max-h-[350px] overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                  {history.map((entry: any, idx: number) => {
                    const isAdd = entry.type === "add";
                    const qtyChange = isAdd ? `+ ${entry.quantity} ${entry.unit}` : `- ${entry.quantity} ${entry.unit}`;
                    const invNumStr = entry.invoiceNumber || entry.invoice_number;
                    const titleStr = entry.note || (entry.isInvoice ? `Invoice ${invNumStr || entry.invoiceId || ''}` : isAdd ? "Stock Added" : "Stock Reduced");

                    const rawD = entry.date;
                    const dObj = rawD ? new Date(rawD) : null;
                    const dateDisplay = dObj && !isNaN(dObj.getTime())
                      ? `${String(dObj.getDate()).padStart(2, "0")}-${String(dObj.getMonth() + 1).padStart(2, "0")}-${dObj.getFullYear()}`
                      : rawD || "—";

                    return (
                      <div
                        key={entry.id || idx}
                        className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs gi-text-primary truncate">
                            {titleStr}
                          </h3>
                          <p className="text-[11px] gi-text-muted mt-0.5">
                            {dateDisplay}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`font-mono font-bold text-xs ${isAdd ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                            {qtyChange}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop View (>= 768px) */}
        <div className="hidden md:block space-y-6">
        {/* Header Bar */}
        <PageHeader
          title={item.itemName}
          subtitle="Item details, stock balance & movement log"
          backUrl="/items"
          actions={
            <>
              <button
                type="button"
                onClick={() => setShowBarcodeModal(true)}
                className="h-8 px-3 flex items-center justify-center gap-1.5 rounded-lg gi-badge-warning text-xs font-semibold transition cursor-pointer shadow-xs border gi-border"
              >
                <IoBarcodeOutline className="text-sm" />
                <span>Barcode Tag</span>
              </button>

              {hasPermission("Item Transaction", "Update") && (
                <button
                  type="button"
                  onClick={() => router.push(`/items/edit/${item.id}`)}
                  className="h-8 px-3 flex items-center justify-center gap-1.5 rounded-lg gi-btn-primary text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  <IoCreateOutline className="text-sm" />
                  <span>Edit Item</span>
                </button>
              )}

              {item.itemType === "Product" && hasPermission("Item Transaction", "Update") && (
                <button
                  type="button"
                  onClick={() => router.push(`/adjustStock/${item.id}?mode=add`)}
                  className="h-8 px-3 flex items-center justify-center gap-1.5 rounded-lg gi-badge-info text-xs font-semibold transition cursor-pointer shadow-xs border gi-border"
                >
                  <IoBuildOutline className="text-sm" />
                  <span>Adjust Stock</span>
                </button>
              )}

              {hasPermission("Item Transaction", "Delete") && (
                <button
                  type="button"
                  onClick={() => setShowDelete(true)}
                  className="h-8 px-3 flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  <IoTrashOutline className="text-sm" />
                  <span>Delete</span>
                </button>
              )}
            </>
          }
        />

        {/* 2-Column Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Product Specifications & Pricing */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`${isService ? "lg:col-span-12 max-w-3xl" : "lg:col-span-5"} rounded-xl gi-card border gi-divider p-4.5 shadow-xs space-y-4`}
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b gi-divider">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="h-12 w-12 rounded-xl gi-badge-info font-bold text-lg flex items-center justify-center shrink-0">
                  <IoCubeOutline className="text-2xl" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-base font-bold gi-text-primary truncate">
                    {item.itemName}
                  </h2>

                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded gi-badge-info">
                      {item.itemType}
                    </span>

                    <span className="text-xs gi-text-secondary">
                      Unit: <strong className="font-semibold gi-text-primary">{item.unit}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {item.itemType === "Product" && (
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider gi-text-muted">
                    Current Stock
                  </p>

                  <p className="text-lg sm:text-xl font-bold gi-text-primary font-mono mt-0.5">
                    {stock.toLocaleString("en-IN")} {item.unit}
                  </p>

                  {item.lowStockAlert && stock <= Number(item.lowStockAt || 0) && (
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      Low Stock Warning
                    </span>
                  )}
                </div>
              )}
            </div>



            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <InfoBox title="Sales Price" value={`₹${Number(item.salesPrice || 0).toLocaleString("en-IN")}`} />
              <InfoBox title="Purchase Price" value={item.itemType === "Service" ? "N/A" : `₹${Number(item.purchasePrice || 0).toLocaleString("en-IN")}`} />
              <InfoBox title="Stock Value" value={item.itemType === "Service" ? "N/A" : `₹${stockValue.toLocaleString("en-IN")}`} />
              <InfoBox title="GST Rate" value={item.gst || "None"} />
              <InfoBox title={item.itemType === "Service" ? "SAC Code" : "HSN Code"} value={item.hsnCode || "-"} />
              <InfoBox title="Item Code (SKU)" value={item.itemCode || item.qrCode || "N/A"} />
            </div>

            {item.description && (
              <div className="rounded-lg gi-surface-secondary border gi-divider p-3.5">
                <p className="text-[10px] gi-text-muted uppercase tracking-wider font-semibold mb-1">
                  Description &amp; Notes
                </p>
                <p className="text-xs gi-text-secondary leading-relaxed">
                  {item.description}
                </p>
              </div>
            )}
          </motion.section>

          {/* Right Column: Stock Movement & Adjustments Timeline */}
          {!isService && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="lg:col-span-7 rounded-xl gi-card border gi-divider p-4.5 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between gap-3 pb-3 border-b gi-divider">
                <div>
                  <h2 className="text-base font-bold gi-text-primary tracking-tight flex items-center gap-2">
                    <span>Stock Movement Log</span>
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded-full gi-badge-info font-bold">Real-Time Data</span>
                  </h2>
                  <p className="text-xs gi-text-secondary mt-0.5">
                    Accurate audit log of sales, purchases, and manual stock entries
                  </p>
                </div>

                <span className="text-xs px-2.5 py-1 rounded-lg gi-badge-info font-bold shrink-0">
                  {history.length} {history.length === 1 ? "Entry" : "Entries"}
                </span>
              </div>

              <div>
                {history.length === 0 ? (
                  <div className="py-12 text-center gi-text-secondary">
                    <IoTrendingUpOutline className="text-3xl mx-auto mb-2 gi-text-muted" />
                    <p className="font-semibold text-sm gi-text-primary">
                      No Stock Movements Recorded
                    </p>
                    <p className="text-xs gi-text-secondary mt-1">
                      Stock additions, reductions, and invoice transactions will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[420px] overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar">
                    {history.map((entry: any, index: number) => (
                      <StockHistoryCard
                        key={`stock-entry-${entry?.id && String(entry.id).trim() ? String(entry.id) : index}-${index}`}
                        entry={entry}
                        router={router}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </div>
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDelete && (
            <motion.div
              key="delete-confirmation-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center gi-modal-overlay backdrop-blur-sm p-4"
            >
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2 }} className="w-full max-w-md rounded-xl gi-modal-content p-6 shadow-2xl text-center space-y-4">
                <div className="h-12 w-12 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center text-xl">
                  <IoTrashOutline />
                </div>
                <div>
                  <h3 className="text-base font-bold gi-text-primary">
                    Delete &quot;{item.itemName}&quot;?
                  </h3>
                  <p className="text-xs gi-text-secondary mt-1">
                    This action will permanently delete this item from your inventory.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button type="button" onClick={() => setShowDelete(false)} disabled={isDeleting} className="flex-1 py-2 rounded-lg border gi-divider text-xs font-semibold gi-btn-secondary cursor-pointer">
                    Cancel
                  </button>
                  <button type="button" onClick={deleteItem} disabled={isDeleting} className="flex-1 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition cursor-pointer">
                    {isDeleting ? "Deleting..." : "Yes, Delete"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Barcode Tag Modal */}
        <AnimatePresence>
          {showBarcodeModal && (
            <ItemBarcodeTagModal
              key="item-barcode-modal-wrapper"
              isOpen={showBarcodeModal}
              onClose={() => setShowBarcodeModal(false)}
              itemId={item.id}
              itemData={item}
            />
          )}
        </AnimatePresence>
      </div>
    </PermissionGuard>
  );
}

function InfoBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg gi-surface-secondary border gi-divider p-3">
      <p className="text-[10px] gi-text-muted uppercase tracking-wider font-semibold">
        {title}
      </p>
      <p className="font-bold text-xs sm:text-sm mt-0.5 truncate gi-text-primary">
        {value}
      </p>
    </div>
  );
}

function StockHistoryCard({ entry, router }: { entry: any; router: any }) {
  const isAdd = entry.type === "add";
  const formattedDate = entry.date ? new Date(entry.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "No date";

  return (
    <div className="p-3 rounded-xl border gi-divider gi-surface-interactive text-xs transition space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 font-bold text-xs ${isAdd
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300"
            : "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300"
            }`}>
            {entry.isInvoice ? <IoDocumentTextOutline className="text-base" /> : (isAdd ? <IoAddCircleOutline className="text-base" /> : <IoRemoveCircleOutline className="text-base" />)}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold gi-text-primary text-xs">
                {entry.isInvoice ? (isAdd ? "Purchase Entry" : "Sales Entry") : (isAdd ? "Stock Added" : "Stock Reduced")}
              </span>
              <span className="text-[10px] gi-text-secondary flex items-center gap-1">
                <IoCalendarOutline className="text-xs" />
                {formattedDate} {entry.time ? `• ${entry.time}` : ""}
              </span>
              {entry.adjustedBy && (
                <span className="text-[10px] gi-text-secondary font-medium">
                  by {entry.adjustedBy}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className={`font-bold text-xs sm:text-sm ${isAdd ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {isAdd ? "+" : "-"}{Number(entry.quantity || 0).toLocaleString("en-IN")} {entry.unit}
          </p>
          <p className="text-[10px] gi-text-secondary mt-0.5">
            Stock: <span className="font-semibold gi-text-primary">{Number(entry.stockAfter || 0).toLocaleString("en-IN")} {entry.unit}</span>
          </p>
        </div>
      </div>

      {entry.note && (
        <div className="flex items-center justify-between gap-2 pt-2 border-t gi-divider text-[11px] gi-text-secondary">
          <p className="truncate italic gi-text-secondary">
            &quot;{entry.note}&quot;
          </p>
          {entry.isInvoice && entry.invoiceId && (
            <button
              type="button"
              onClick={() => router.push(`/invoice/${entry.invoiceId}`)}
              className="shrink-0 text-xs font-bold text-sky-600 hover:underline cursor-pointer"
            >
              View Invoice &rarr;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
