"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IoAdd,
  IoSearch,
  IoCubeOutline,
  IoWalletOutline,
  IoLayersOutline,
  IoEyeOutline,
  IoBuildOutline,
  IoPencilOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoSwapVerticalOutline,
  IoEllipsisHorizontal,
  IoScanOutline,
} from "react-icons/io5";
import { useAuth } from "@/context/AuthContext";
import { itemApi } from "@/lib/api/item";
import { usePreferences } from "@/lib/hooks/usePreferences";
import { useDebounce } from "@/hooks/useDebounce";
import PermissionGuard from "@/components/PermissionGuard";
import FilterTabs from "@/components/FilterTabs";
import PaginationControls from "@/components/PaginationControls";
import { SkeletonBox, SkeletonCard } from "@/components/Skeleton";
import { ItemScannerModal } from "@/components/ItemScannerModal";

import { useMinimumLoading } from "@/lib/hooks/useMinimumLoading";
import SmoothTransition from "@/components/SmoothTransition";

export default function Items() {
  const router = useRouter();
  const { activeBusiness, hasPermission } = useAuth();

  const [items, setItems] = useState([]);
  const { isLoading, startLoading, stopLoading } = useMinimumLoading(true, 400);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [showScannerModal, setShowScannerModal] = useState(false);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        return { key: null, direction: "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  useEffect(() => {
    if (activeBusiness?.id) {
      startLoading();
      itemApi.getItems({ silentError: true })
        .then((res: any) => {
          const list = Array.isArray(res?.body)
            ? res.body
            : (res?.body?.items || res?.body?.data || []);
          setItems(Array.isArray(list) ? list : []);
        })
        .catch(console.error)
        .finally(() => stopLoading());
    } else {
      setItems([]);
      stopLoading();
    }
  }, [activeBusiness?.id]);

  // Totals & KPI calculations memoized
  const { totalQuantity, totalValuation, lowStockCount, totalProductsCount, totalServicesCount } = useMemo(() => {
    let totalQty = 0;
    let totalVal = 0;
    let lowStock = 0;
    let products = 0;
    let services = 0;

    items.forEach((item: any) => {
      const iType = (item.item_type || item.itemType || "product").toLowerCase();
      if (iType === "service") {
        services += 1;
      } else {
        products += 1;
        const qty = Number(item.current_stock ?? item.stockQuantity ?? 0);
        const price = Number(item.purchase_price ?? item.purchasePrice ?? item.sales_price ?? item.salesPrice ?? 0);
        const minAlert = Number(item.min_stock_alert ?? item.lowStockAt ?? 0);
        totalQty += qty;
        totalVal += qty * price;

        if (minAlert > 0 && qty <= minAlert) {
          lowStock += 1;
        }
      }
    });

    return {
      totalQuantity: totalQty,
      totalValuation: totalVal,
      lowStockCount: lowStock,
      totalProductsCount: products,
      totalServicesCount: services,
    };
  }, [items]);

  // Filtered list memoized with debounced search
  const filteredItems = useMemo(() => {
    const query = debouncedSearch.toLowerCase().trim();

    return items.filter((item: any) => {
      const name = item.item_name || item.itemName || "";
      const hsn = item.hsn_sac_code || item.hsnCode || "";
      const code = item.item_code || item.itemCode || "";
      const qrCode = item.qr_code || item.qrCode || "";
      const qrPayload = item.qr_payload || item.qrPayload || "";
      const iType = (item.item_type || item.itemType || "product").toLowerCase();

      const matchesSearch =
        query === "" ||
        name.toLowerCase().includes(query) ||
        hsn.toLowerCase().includes(query) ||
        code.toLowerCase().includes(query) ||
        qrCode.toLowerCase().includes(query) ||
        qrPayload.toLowerCase().includes(query);

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "products" && iType === "product") ||
        (activeFilter === "services" && iType === "service");

      return matchesSearch && matchesFilter;
    });
  }, [items, activeFilter, debouncedSearch]);

  const sortedItems = useMemo(() => {
    if (!sortConfig.key) return filteredItems;
    return [...filteredItems].sort((a: any, b: any) => {
      let aVal: any, bVal: any;
      switch (sortConfig.key) {
        case "itemName":
          aVal = (a.item_name || a.itemName || "").toLowerCase();
          bVal = (b.item_name || b.itemName || "").toLowerCase();
          break;
        case "itemType":
          aVal = (a.item_type || a.itemType || "product").toLowerCase();
          bVal = (b.item_type || b.itemType || "product").toLowerCase();
          break;
        case "hsnCode":
          aVal = (a.hsn_sac_code || a.hsnCode || "").toLowerCase();
          bVal = (b.hsn_sac_code || b.hsnCode || "").toLowerCase();
          break;
        case "salesPrice":
          aVal = Number(a.sales_price ?? a.salesPrice ?? 0);
          bVal = Number(b.sales_price ?? b.salesPrice ?? 0);
          break;
        case "purchasePrice":
          aVal = Number(a.purchase_price ?? a.purchasePrice ?? 0);
          bVal = Number(b.purchase_price ?? b.purchasePrice ?? 0);
          break;
        case "stockQuantity":
          aVal = Number(a.current_stock ?? a.stockQuantity ?? 0);
          bVal = Number(b.current_stock ?? b.stockQuantity ?? 0);
          break;
        default:
          return 0;
      }
      if (typeof aVal === "string") {
        return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [filteredItems, sortConfig]);



  return (
    <PermissionGuard module="Item Transaction">
      <div className="space-y-5 select-none gi-page">
        {/* Page Heading & Action Button */}
        <div className="flex items-center justify-between gap-4 pb-3 border-b gi-divider">
          <div>
            <h1 className="text-2xl font-bold gi-text-primary tracking-tight">
              Items
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowScannerModal(true)}
              className="px-3.5 py-1.5 rounded-lg gi-btn-secondary border gi-border text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer whitespace-nowrap"
            >
              <IoScanOutline className="text-base text-indigo-600 dark:text-indigo-400" />
              <span>Scan Barcode</span>
            </button>

            {hasPermission("Item Transaction", "Create") && (
              <Link href="/addItem" className="shrink-0">
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-lg gi-btn-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <IoAdd className="text-base" />
                  <span>Add Item</span>
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by item name, HSN, SKU..."
              className="w-full h-8 pl-9 pr-4 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs focus:outline-none focus:border-indigo-500 transition shadow-2xs"
            />
          </div>

          <FilterTabs
            options={[
              { id: "all", label: "All Items" },
              { id: "products", label: "Products" },
              { id: "services", label: "Services" },
            ]}
            activeId={activeFilter}
            onChange={setActiveFilter}
            layoutId="itemsFilterPill"
            className="sm:ml-auto"
          />
        </div>

        {/* Inventory Summary KPI Row (Hidden on mobile) */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold gi-text-secondary uppercase tracking-wider">
                Stock Valuation
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono gi-text-primary mt-0.5">
                ₹{totalValuation.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <span className="p-2 rounded-lg gi-badge-info text-lg">
              <IoWalletOutline />
            </span>
          </div>

          <div className="p-3 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold gi-text-secondary uppercase tracking-wider">
                Total Stock Quantity
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono gi-text-primary mt-0.5">
                {totalQuantity.toLocaleString("en-IN")} Units
              </p>
            </div>
            <span className="p-2 rounded-lg gi-badge-success text-lg">
              <IoCubeOutline />
            </span>
          </div>

          <div className="p-3 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold gi-text-secondary uppercase tracking-wider">
                Catalog Items
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono gi-text-primary mt-0.5">
                {items.length}
              </p>
              <p className="text-[10px] gi-text-muted mt-0.5">{totalProductsCount} Prod, {totalServicesCount} Serv</p>
            </div>
            <span className="p-2 rounded-lg gi-badge-info text-lg">
              <IoLayersOutline />
            </span>
          </div>

          <div className="p-3 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold gi-text-secondary uppercase tracking-wider">
                Low Stock Warning
              </p>
              <p className={`text-lg sm:text-xl font-bold font-mono mt-0.5 ${lowStockCount > 0 ? "text-rose-600 dark:text-rose-400" : "gi-text-primary"}`}>
                {lowStockCount} Items
              </p>
            </div>
            <span className={`p-2 rounded-lg text-lg ${lowStockCount > 0 ? "gi-badge-danger" : "gi-badge-success"}`}>
              <IoCubeOutline />
            </span>
          </div>
        </div>

        {/* Mobile Cards View (< 768px) */}
        <div className="block md:hidden space-y-3">
          {isLoading ? (
            <SkeletonCard count={4} />
          ) : sortedItems.length === 0 ? (
            <div className="py-10 text-center gi-card text-xs gi-text-muted">
              No inventory items found matching your criteria.
            </div>
          ) : (
            sortedItems.map((item: any) => {
              const name = item.item_name || item.itemName || "Item";
              const salesPrice = Number(item.sales_price ?? item.salesPrice ?? 0);
              const purchasePrice = Number(item.purchase_price ?? item.purchasePrice ?? 0);
              const qty = Number(item.current_stock ?? item.stockQuantity ?? 0);
              const unit = item.unit || "PCS";

              return (
                <div
                  key={item.id}
                  onClick={() => router.push(`/items/${item.id}`)}
                  className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-2xs cursor-pointer transition-all space-y-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-11 w-11 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-200 font-semibold text-base flex items-center justify-center shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                        {name}
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5 uppercase">
                        {qty} {unit}
                      </p>
                    </div>
                  </div>

                  <div className="border-b border-dashed border-slate-200 dark:border-zinc-800" />

                  <div className="grid grid-cols-2 gap-4 pt-0.5">
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">
                        Sales Price
                      </span>
                      <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-mono block mt-0.5">
                        ₹{salesPrice.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">
                        Purchase Price
                      </span>
                      <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-mono block mt-0.5">
                        ₹{purchasePrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Data Table (>= 768px) */}
        <div className="hidden md:block gi-table-container shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs gi-table border-collapse">
              <thead>
                <tr>
                  {[
                    { key: "itemName", label: "Item Name", align: "left" },
                    { key: "itemType", label: "Type", align: "left" },
                    { key: "hsnCode", label: "HSN / SAC", align: "left" },
                    { key: "salesPrice", label: "Sale Price", align: "right" },
                    { key: "purchasePrice", label: "Purchase Price", align: "right" },
                    { key: "stockQuantity", label: "Current Stock", align: "right" },
                  ].map((col, idx) => {
                    const isActive = sortConfig.key === col.key;
                    return (
                      <th
                        key={idx}
                        onClick={() => handleSort(col.key)}
                        className={`py-3 px-4 cursor-pointer select-none hover:bg-[var(--gi-hover)] transition text-${col.align}`}
                      >
                        <div className={`flex items-center gap-1.5 ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : "justify-start"}`}>
                          <span>{col.label}</span>
                          {isActive ? (
                            sortConfig.direction === "asc" ? (
                              <IoArrowUpOutline className="text-xs text-indigo-500 shrink-0" />
                            ) : (
                              <IoArrowDownOutline className="text-xs text-indigo-500 shrink-0" />
                            )
                          ) : (
                            <IoSwapVerticalOutline className="text-xs text-slate-400 opacity-40 hover:opacity-100 shrink-0" />
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y gi-divider">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, rIdx) => (
                    <tr key={rIdx}>
                      <td colSpan={7} className="py-3 px-4">
                        <SkeletonBox className="h-5 w-full" />
                      </td>
                    </tr>
                  ))
                ) : sortedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center gi-text-muted text-xs">
                      No inventory items found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  sortedItems.map((item: any) => {
                    const name = item.item_name || item.itemName || "Item";
                    const iType = (item.item_type || item.itemType || "product").toLowerCase();
                    const isService = iType === "service";
                    const hsn = item.hsn_sac_code || item.hsnCode || "";
                    const salesPrice = Number(item.sales_price ?? item.salesPrice ?? 0);
                    const purchasePrice = Number(item.purchase_price ?? item.purchasePrice ?? 0);
                    const qty = Number(item.current_stock ?? item.stockQuantity ?? 0);
                    const minAlert = Number(item.min_stock_alert ?? item.lowStockAt ?? 0);
                    const isLow = minAlert > 0 && qty <= minAlert;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => router.push(`/items/${item.id}`)}
                        className="hover:bg-[var(--gi-hover)] transition cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-md gi-badge-info font-bold text-xs flex items-center justify-center shrink-0">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="gi-mob-primary font-semibold gi-text-primary">{name}</p>
                              <div className="gi-mob-secondary">
                                {hsn && <span className="font-mono">HSN: {hsn}</span>}
                                {!isService && <><span className="gi-text-muted">·</span><span className={isLow ? "text-rose-500" : ""}>{qty} {item.unit || "PCS"}</span></>}
                                {!isService && <><span className="gi-text-muted">·</span><span>₹{salesPrice.toLocaleString("en-IN")}</span></>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isService ? "gi-badge-warning" : "gi-badge-info"
                              }`}
                          >
                            {iType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono gi-text-muted">
                          {hsn || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold gi-text-primary">
                          ₹{salesPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono gi-text-secondary">
                          {purchasePrice > 0 ? `₹${purchasePrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "N/A"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {isService ? (
                            <span className="gi-text-muted font-normal text-xs">—</span>
                          ) : (
                            <span className={isLow ? "text-rose-600 dark:text-rose-400" : "gi-text-primary"}>
                              {qty} {item.unit || "PCS"}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">

                            {hasPermission("Item Transaction", "Update") && (
                              <button
                                type="button"
                                onClick={() => router.push(`/addItem?id=${item.id}`)}
                                className="p-1.5 rounded-md hover:bg-[var(--gi-hover)] gi-text-secondary transition"
                                title="Edit Item"
                              >
                                <IoPencilOutline className="text-base" />
                              </button>
                            )}

                            {!isService && hasPermission("Item Transaction", "Update") && (
                              <button
                                type="button"
                                onClick={() => router.push(`/adjustStock/${item.id}`)}
                                className="p-1.5 rounded-md gi-badge-info transition"
                                title="Adjust Stock"
                              >
                                <IoBuildOutline className="text-base" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Item Barcode Scanner Modal */}
        <ItemScannerModal
          isOpen={showScannerModal}
          onClose={() => setShowScannerModal(false)}
        />
      </div>
    </PermissionGuard>
  );
}