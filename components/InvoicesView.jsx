"use client";

import { useState, useMemo, useEffect, useRef, startTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  IoAdd,
  IoSearch,
  IoEyeOutline,
  IoReceiptOutline,
  IoDocumentTextOutline,
  IoCardOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoSwapVerticalOutline,
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";
import { useDebounce } from "@/hooks/useDebounce";
import InvoiceDetailsModal from "./InvoiceDetailsModal";
import PermissionGuard from "./PermissionGuard";
import PaginationControls from "./PaginationControls";

export default function InvoicesView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawFilter = searchParams ? searchParams.get("filter") : null;
  const { invoices = [], hasPermission } = useApp();

  const [activeFilter, setActiveFilter] = useState(() => {
    if (rawFilter === "due") return "unpaid";
    if (rawFilter && ["all", "sales", "purchase", "unpaid", "paid"].includes(rawFilter)) {
      return rawFilter;
    }
    return "all";
  });

  useEffect(() => {
    if (rawFilter) {
      startTransition(() => {
        if (rawFilter === "due") {
          setActiveFilter("unpaid");
        } else if (["all", "sales", "purchase", "unpaid", "paid"].includes(rawFilter)) {
          setActiveFilter(rawFilter);
        }
      });
    }
  }, [rawFilter]);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef(null);

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
    const handleClickOutside = (e) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Totals Calculation Memoized
  const { totalSales, totalPurchases } = useMemo(() => {
    let sales = 0;
    let purchases = 0;
    invoices.forEach((inv) => {
      const isSales = (inv.invoiceType || inv.type) === "sales";
      const amt = Number(inv.totalAmount) || 0;
      if (isSales) sales += amt;
      else purchases += amt;
    });
    return { totalSales: sales, totalPurchases: purchases };
  }, [invoices]);

  // Filtered list memoized with debounced search
  const filteredInvoices = useMemo(() => {
    const query = debouncedSearch.toLowerCase().trim();

    return invoices.filter((invoice) => {
      const invType = invoice.invoiceType || invoice.type || "sales";
      const partyNameStr =
        invoice.partyName || invoice.party?.partyName || invoice.supplier?.partyName || "";
      const invNumStr = invoice.invoiceNumberStr || invoice.invoiceNumber || "";
      const totalAmtStr = String(invoice.totalAmount ?? invoice.grandTotal ?? invoice.total ?? invoice.amount ?? "");
      const paidAmtStr = String(invoice.paidAmount ?? "");
      const dueAmtStr = String(invoice.dueAmount ?? "");
      const formattedTotalStr = Number(invoice.totalAmount || invoice.grandTotal || invoice.total || invoice.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

      const matchesFilter =
        activeFilter === "all"
          ? true
          : activeFilter === "sales"
            ? invType === "sales"
            : activeFilter === "purchase"
              ? invType === "purchase"
              : activeFilter === "unpaid"
                ? invoice.status === "unpaid" || invoice.status === "partially_paid" || !invoice.status
                : activeFilter === "paid"
                  ? invoice.status === "paid"
                  : true;

      const matchesSearch =
        query === "" ||
        partyNameStr.toLowerCase().includes(query) ||
        invNumStr.toString().toLowerCase().includes(query) ||
        totalAmtStr.toLowerCase().includes(query) ||
        paidAmtStr.toLowerCase().includes(query) ||
        dueAmtStr.toLowerCase().includes(query) ||
        formattedTotalStr.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [invoices, activeFilter, debouncedSearch]);

  const sortedInvoices = useMemo(() => {
    if (!sortConfig.key) return filteredInvoices;
    return [...filteredInvoices].sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case "partyName":
          aVal = (a.partyName || a.party?.partyName || a.supplier?.partyName || "").toLowerCase();
          bVal = (b.partyName || b.party?.partyName || b.supplier?.partyName || "").toLowerCase();
          break;
        case "invNum":
          aVal = (a.invoiceNumberStr || a.invoiceNumber || "").toString().toLowerCase();
          bVal = (b.invoiceNumberStr || b.invoiceNumber || "").toString().toLowerCase();
          break;
        case "type":
          aVal = (a.invoiceType || a.type || "sales").toLowerCase();
          bVal = (b.invoiceType || b.type || "sales").toLowerCase();
          break;
        case "date":
          aVal = new Date(a.invoiceDate || a.date || 0).getTime();
          bVal = new Date(b.invoiceDate || b.date || 0).getTime();
          break;
        case "amount":
          aVal = Number(a.totalAmount || a.grandTotal || a.total || a.amount || 0);
          bVal = Number(b.totalAmount || b.grandTotal || b.total || b.amount || 0);
          break;
        case "status":
          aVal = (a.status || "unpaid").toLowerCase();
          bVal = (b.status || "unpaid").toLowerCase();
          break;
        default:
          return 0;
      }
      if (typeof aVal === "string") {
        return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [filteredInvoices, sortConfig]);

  return (
    <PermissionGuard module="Invoice">
      <div className="space-y-5 select-none gi-page">
        {/* Page Heading & Action Button */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
              Invoices
            </h1>
            <p className="text-xs gi-text-secondary mt-0.5">
              Manage customer sales bills and vendor purchase invoices
            </p>
          </div>

          {hasPermission("Invoice", "Create") && (
            <div className="relative shrink-0 z-30" ref={addMenuRef}>
              <button
                type="button"
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="px-3.5 py-2 rounded-lg gi-btn-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer whitespace-nowrap"
              >
                <IoAdd className="text-base" />
                <span>Create Invoice</span>
              </button>

              <AnimatePresence>
                {showAddMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 z-50 w-56 sm:w-60 rounded-xl gi-card shadow-2xl p-2 space-y-1 border gi-divider"
                  >
                    <div className="px-2 py-1 text-[10px] font-bold gi-text-muted uppercase tracking-wider border-b gi-divider pb-1.5 mb-1">
                      Select Invoice Type
                    </div>
                    <Link href="/addInvoice/sales" onClick={() => setShowAddMenu(false)}>
                      <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--gi-hover)] text-xs font-semibold gi-text-primary cursor-pointer transition">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                          <IoDocumentTextOutline className="text-lg" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-xs">Sales Invoice</span>
                          <span className="text-[10px] gi-text-muted font-normal leading-tight">Customer bill &amp; sales receipt</span>
                        </div>
                      </div>
                    </Link>
                    <Link href="/addInvoice/purchase" onClick={() => setShowAddMenu(false)}>
                      <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--gi-hover)] text-xs font-semibold gi-text-primary cursor-pointer transition">
                        <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                          <IoReceiptOutline className="text-lg" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-xs">Purchase Invoice</span>
                          <span className="text-[10px] gi-text-muted font-normal leading-tight">Vendor bill &amp; stock entry</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Accounting Overview KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold gi-text-secondary">
                Total Sales Revenue
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono gi-text-primary mt-1">
                ₹{Number(totalSales).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <span className="p-2 rounded-lg gi-badge-success text-lg">
              <IoDocumentTextOutline />
            </span>
          </div>

          <div className="p-4 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold gi-text-secondary">
                Total Purchases / Bills
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono gi-text-primary mt-1">
                ₹{Number(totalPurchases).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <span className="p-2 rounded-lg gi-badge-warning text-lg">
              <IoReceiptOutline />
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
              placeholder="Search by customer name, invoice #, amount..."
              className="w-full h-9 pl-9 pr-4 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs focus:outline-none focus:border-indigo-500 transition shadow-2xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl gi-card shadow-xs overflow-x-auto max-w-full">
              {[
                { id: "all", label: "All Invoices" },
                { id: "sales", label: "Sales" },
                { id: "purchase", label: "Purchase" },
                { id: "unpaid", label: "Unpaid / Due" },
                { id: "paid", label: "Paid" },
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

        {/* Enterprise Data Table */}
        <div className="gi-table-container shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs gi-table border-collapse">
              <thead>
                <tr>
                  {[
                    { key: "partyName", label: "Invoice # / Party", align: "left" },
                    { key: "partyName", label: "Billed Party", align: "left" },
                    { key: "type", label: "Type", align: "left" },
                    { key: "date", label: "Date", align: "left" },
                    { key: "amount", label: "Amount", align: "right" },
                    { key: "status", label: "Status", align: "center" },
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
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y gi-divider">
                {sortedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center gi-text-muted text-xs">
                      No invoices found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  sortedInvoices.map((inv) => {
                    const invType = inv.invoiceType || inv.type || "sales";
                    const isSales = invType === "sales";
                    const partyName = inv.partyName || inv.party?.partyName || inv.supplier?.partyName || "N/A";
                    const invNum = inv.invoiceNumberStr || inv.invoiceNumber || `#${inv.id}`;
                    const invDate = inv.invoiceDate || inv.date || "N/A";
                    const isPaid = inv.status === "paid";
                    const isPartial = inv.status === "partially_paid";

                    return (
                      <tr
                        key={inv.id}
                        onClick={() => router.push(`/invoiceDetails/${inv.id}`)}
                        className="hover:bg-[var(--gi-hover)] transition cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`h-7 w-7 rounded-md font-bold text-xs flex items-center justify-center shrink-0 ${isSales ? "gi-badge-info" : "gi-badge-warning"
                                }`}
                            >
                              {isSales ? "S" : "P"}
                            </div>
                            <div className="min-w-0">
                              <p className="gi-mob-primary font-semibold gi-text-primary">{partyName}</p>
                              <div className="gi-mob-secondary">
                                <span
                                  className={`inline-block px-1.5 py-0 rounded text-[10px] font-bold uppercase ${isSales ? "gi-badge-info" : "gi-badge-warning"
                                    }`}
                                >
                                  {isSales ? "Sales" : "Purchase"}
                                </span>
                                <span className="gi-text-muted">·</span>
                                <span className="font-mono">{invNum}</span>
                                <span className="gi-text-muted">·</span>
                                <span>{invDate}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold gi-text-primary max-w-[180px] truncate">
                          {partyName}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isSales ? "gi-badge-info" : "gi-badge-warning"
                              }`}
                          >
                            {isSales ? "Sales" : "Purchase"}
                          </span>
                        </td>
                        <td className="py-3 px-4 gi-text-secondary whitespace-nowrap">{invDate}</td>
                        <td className="py-3 px-4 font-mono font-bold text-right gi-text-primary">
                          ₹{Number(inv.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isPaid ? "gi-badge-success" : isPartial ? "gi-badge-warning" : "gi-badge-danger"
                              }`}
                          >
                            {isPaid ? "Paid" : isPartial ? "Partial" : "Unpaid"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-mono font-bold gi-text-primary text-xs">
                              ₹{Number(inv.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => router.push(`/invoiceDetails/${inv.id}`)}
                                className="p-1 rounded-md hover:bg-[var(--gi-hover)] gi-text-secondary transition"
                                title="View Invoice Details"
                              >
                                <IoEyeOutline className="text-sm" />
                              </button>
                              {!isPaid && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const targetPartyId = inv.party?.id || inv.supplier?.id || "";
                                    router.push(
                                      `/payment/receivedPayment?type=${isSales ? "credit" : "debit"
                                      }&invoiceId=${inv.id}&partyId=${targetPartyId}`
                                    );
                                  }}
                                  className="p-1 rounded-md gi-badge-success transition"
                                  title="Record Payment"
                                >
                                  <IoCardOutline className="text-sm" />
                                </button>
                              )}
                            </div>
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

        {/* Invoice Modal (Legacy/Direct preview support) */}
        {selectedInvoice && (
          <InvoiceDetailsModal
            invoice={selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
            onRecordPayment={(inv) => {
              const isSales = (inv.invoiceType || inv.type) === "sales";
              const targetPartyId = inv.party?.id || inv.supplier?.id || "";
              router.push(
                `/payment/receivedPayment?type=${isSales ? "credit" : "debit"
                }&invoiceId=${inv.id}&partyId=${targetPartyId}`
              );
            }}
          />
        )}
      </div>
    </PermissionGuard>
  );
}
