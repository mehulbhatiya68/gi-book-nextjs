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
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";
import { useDebounce } from "@/hooks/useDebounce";
import PermissionGuard from "./PermissionGuard";
import PaginationControls from "./PaginationControls";

export default function Items() {
  const router = useRouter();
  const { items = [], hasPermission } = useApp();

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        return { key: null, direction: "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  // Totals & KPI calculations memoized
  const { totalQuantity, totalValuation, lowStockCount, totalProductsCount, totalServicesCount } = useMemo(() => {
    let totalQty = 0;
    let totalVal = 0;
    let lowStock = 0;
    let products = 0;
    let services = 0;

    items.forEach((item) => {
      if (item.itemType === "Service") {
        services += 1;
      } else {
        products += 1;
        const qty = Number(item.stockQuantity) || 0;
        const price = Number(item.purchasePrice) || Number(item.salesPrice) || 0;
        totalQty += qty;
        totalVal += qty * price;

        if (item.lowStockAlert && qty <= Number(item.lowStockAt || 0)) {
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

    return items.filter((item) => {
      const matchesSearch =
        query === "" ||
        item.itemName?.toLowerCase().includes(query) ||
        item.hsnCode?.toLowerCase().includes(query) ||
        item.itemCode?.toLowerCase().includes(query);

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "products" && item.itemType === "Product") ||
        (activeFilter === "services" && item.itemType === "Service");

      return matchesSearch && matchesFilter;
    });
  }, [items, activeFilter, debouncedSearch]);

  const sortedItems = useMemo(() => {
    if (!sortConfig.key) return filteredItems;
    return [...filteredItems].sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case "itemName":
          aVal = (a.itemName || "").toLowerCase();
          bVal = (b.itemName || "").toLowerCase();
          break;
        case "itemType":
          aVal = (a.itemType || "Product").toLowerCase();
          bVal = (b.itemType || "Product").toLowerCase();
          break;
        case "hsnCode":
          aVal = (a.hsnCode || "").toLowerCase();
          bVal = (b.hsnCode || "").toLowerCase();
          break;
        case "salesPrice":
          aVal = Number(a.salesPrice || 0);
          bVal = Number(b.salesPrice || 0);
          break;
        case "purchasePrice":
          aVal = Number(a.purchasePrice || 0);
          bVal = Number(b.purchasePrice || 0);
          break;
        case "stockQuantity":
          aVal = Number(a.stockQuantity || 0);
          bVal = Number(b.stockQuantity || 0);
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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
              Items &amp; Inventory
            </h1>
            <p className="text-xs gi-text-secondary mt-0.5">
              Track stock levels, pricing, HSN codes, and services
            </p>
          </div>

          {hasPermission("Item Transaction", "Create") && (
            <Link href="/addItem" className="shrink-0">
              <button
                type="button"
                className="px-3.5 py-2 rounded-lg gi-btn-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer whitespace-nowrap"
              >
                <IoAdd className="text-base" />
                <span>Add Item</span>
              </button>
            </Link>
          )}
        </div>

        {/* Inventory Summary KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold gi-text-secondary">
                Stock Valuation
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono gi-text-primary mt-1">
                ₹{totalValuation.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <span className="p-2 rounded-lg gi-badge-info text-lg">
              <IoWalletOutline />
            </span>
          </div>

          <div className="p-4 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold gi-text-secondary">
                Total Stock Quantity
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono gi-text-primary mt-1">
                {totalQuantity.toLocaleString("en-IN")} Units
              </p>
            </div>
            <span className="p-2 rounded-lg gi-badge-success text-lg">
              <IoCubeOutline />
            </span>
          </div>

          <div className="p-4 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold gi-text-secondary">
                Total Catalog Items
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono gi-text-primary mt-1">
                {items.length}
              </p>
              <p className="text-[10px] gi-text-muted mt-0.5">{totalProductsCount} Products, {totalServicesCount} Services</p>
            </div>
            <span className="p-2 rounded-lg gi-badge-info text-lg">
              <IoLayersOutline />
            </span>
          </div>

          <div className="p-4 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold gi-text-secondary">
                Low Stock Warning
              </p>
              <p className={`text-lg sm:text-xl font-bold font-mono mt-1 ${lowStockCount > 0 ? "text-rose-600 dark:text-rose-400" : "gi-text-primary"}`}>
                {lowStockCount} Items
              </p>
            </div>
            <span className={`p-2 rounded-lg text-lg ${lowStockCount > 0 ? "gi-badge-danger" : "gi-badge-success"}`}>
              <IoCubeOutline />
            </span>
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
              className="w-full h-9 pl-9 pr-4 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs focus:outline-none focus:border-indigo-500 transition shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex items-center gap-1 p-1 rounded-xl gi-card shadow-xs">
              {[
                { id: "all", label: "All Items" },
                { id: "products", label: "Products" },
                { id: "services", label: "Services" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-md text-xs transition cursor-pointer whitespace-nowrap ${
                    activeFilter === filter.id ? "gi-filter-active" : "gi-filter-inactive font-medium"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Items Data Table */}
        <div className="gi-table-container shadow-xs">
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
                {sortedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center gi-text-muted text-xs">
                      No inventory items found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  sortedItems.map((item) => {
                    const isService = item.itemType === "Service";
                    const qty = Number(item.stockQuantity || 0);
                    const isLow = item.lowStockAlert && qty <= Number(item.lowStockAt || 0);

                    return (
                      <tr
                        key={item.id}
                        onClick={() => router.push(`/items/${item.id}`)}
                        className="hover:bg-[var(--gi-hover)] transition cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-md gi-badge-info font-bold text-xs flex items-center justify-center shrink-0">
                              {item.itemName?.charAt(0) || "I"}
                            </div>
                            <div className="min-w-0">
                              <p className="gi-mob-primary font-semibold gi-text-primary">{item.itemName}</p>
                              <div className="gi-mob-secondary">
                                {item.hsnCode && <span className="font-mono">HSN: {item.hsnCode}</span>}
                                {!isService && <><span className="gi-text-muted">·</span><span className={isLow ? "text-rose-500" : ""}>{qty} {item.unit || "PCS"}</span></>}
                                {!isService && <><span className="gi-text-muted">·</span><span>₹{Number(item.salesPrice || 0).toLocaleString("en-IN")}</span></>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isService ? "gi-badge-warning" : "gi-badge-info"
                            }`}
                          >
                            {item.itemType || "Product"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono gi-text-muted">
                          {item.hsnCode || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold gi-text-primary">
                          ₹{Number(item.salesPrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono gi-text-secondary">
                          {item.purchasePrice ? `₹${Number(item.purchasePrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "N/A"}
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
                            <button
                              type="button"
                              onClick={() => router.push(`/items/${item.id}`)}
                              className="p-1.5 rounded-md hover:bg-[var(--gi-hover)] gi-text-secondary transition"
                              title="View Details"
                            >
                              <IoEyeOutline className="text-base" />
                            </button>

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
      </div>
    </PermissionGuard>
  );
}