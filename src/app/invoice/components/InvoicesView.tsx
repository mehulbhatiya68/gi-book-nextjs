"use client";

import { useState, useMemo, useEffect, useRef, startTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoAdd,
  IoSearch,
  IoReceiptOutline,
  IoDocumentTextOutline,
  IoTrashOutline,
  IoDownloadOutline,
  IoAlertCircleOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoSwapVerticalOutline,
  IoRefreshOutline,
  IoGlobeOutline,
  IoClose,
} from "react-icons/io5";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { invoiceApi } from "@/lib/api/invoice";
import { ledgerApi } from "@/lib/api/ledger";
import { transactionApi } from "@/lib/api/transaction";
import { usePreferences } from "@/lib/hooks/usePreferences";
import { useDebounce } from "@/hooks/useDebounce";
import PermissionGuard from "@/components/PermissionGuard";
import { SkeletonBox } from "@/components/Skeleton";
import { normalizeInvoice, isPurchaseInvoice, getInvoicePartyId } from "@/lib/utils/invoiceUtils";
import FilterTabs from "@/components/FilterTabs";

export default function InvoicesView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawFilter = searchParams ? searchParams.get("filter") : null;
  const rawStatus = searchParams ? searchParams.get("status") : null;
  const { currentUser, activeBusiness, hasPermission, openEmailVerificationModal } = useAuth();
  const { t } = usePreferences();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [emailUnverified, setEmailUnverified] = useState(false);

  // Filter state (ONLY 3 filters: all, sales, purchase)
  const [activeFilter, setActiveFilter] = useState(() => {
    if (rawFilter && ["all", "sales", "purchase", "unpaid"].includes(rawFilter)) {
      return rawFilter;
    }
    return "all";
  });

  useEffect(() => {
    if (rawFilter && ["all", "sales", "purchase", "unpaid"].includes(rawFilter)) {
      startTransition(() => {
        setActiveFilter(rawFilter);
      });
    }
  }, [rawFilter]);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" });

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<any | null>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Fetch Invoices from API
  const fetchInvoices = async () => {
    setIsLoading(true);
    setEmailUnverified(false);
    try {
      const res: any = await invoiceApi.getInvoices({ silentError: true });
      const rawList = res?.body?.invoices || res?.body || [];
      setInvoices(Array.isArray(rawList) ? rawList : []);
    } catch (error: any) {
      if (error?.isEmailUnverified || error?.message?.toLowerCase().includes("verify your email")) {
        setEmailUnverified(true);
        toast.warning("Please verify your email address to access your invoices.", { autoClose: 5000 });
      } else if (!error?.isSilent) {
        console.error("Failed to fetch invoices:", error);
        toast.error(error?.message || "Failed to load invoices");
      }
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeBusiness?.id) {
      fetchInvoices();
    } else {
      setInvoices([]);
      setIsLoading(false);
    }
  }, [activeBusiness?.id]);

  // Click outside listener for Add Menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Delete invoice handler
  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete?.id) return;
    const id = String(invoiceToDelete.id);
    setInvoiceToDelete(null);
    setDeletingId(id);
    try {
      await invoiceApi.deleteInvoice(id);
      toast.success("Invoice deleted successfully");
      setInvoices((prev) => prev.filter((inv) => String(inv.id) !== String(id)));
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to delete invoice");
    } finally {
      setDeletingId(null);
    }
  };

  // PDF Download Handler
  const handleDownloadPdf = async (id: string, e: React.MouseEvent, invNum?: string) => {
    e.stopPropagation();
    try {
      const success = await invoiceApi.downloadPdf(id, invNum);
      if (!success) {
        router.push(`/invoice/${id}`);
      }
    } catch (err: any) {
      console.error("PDF generation error:", err);
    }
  };

  // View Online Handler
  const handleViewOnline = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await invoiceApi.viewOnline(id);
    } catch (err: any) {
      console.error("View online error:", err);
    }
  };

  // Filtered and searched list
  const filteredInvoices = useMemo(() => {
    const query = debouncedSearch.toLowerCase().trim();

    return invoices.filter((rawInv) => {
      const inv = normalizeInvoice(rawInv);
      const partyName = inv.partyName;
      const invNum = inv.invoiceNumber;
      const totalAmtStr = String(inv.totalAmount);
      const status = inv.status;
      const dueAmt = inv.dueAmount;

      const matchesStatus =
        rawStatus === "unpaid"
          ? status === "unpaid" || status === "partially_paid" || dueAmt > 0
          : true;

      const matchesFilter =
        activeFilter === "all"
          ? true
          : activeFilter === "sales"
            ? inv.isSales
            : activeFilter === "purchase"
              ? inv.isPurchase
              : activeFilter === "unpaid"
                ? status === "unpaid" || status === "partially_paid" || dueAmt > 0
                : true;

      const matchesSearch =
        query === "" ||
        partyName.toLowerCase().includes(query) ||
        invNum.toLowerCase().includes(query) ||
        totalAmtStr.includes(query) ||
        status.includes(query);

      return matchesFilter && matchesStatus && matchesSearch;
    });
  }, [invoices, activeFilter, rawStatus, debouncedSearch]);

  // Sorting Handler
  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const sortedInvoices = useMemo(() => {
    if (!sortConfig.key) return filteredInvoices;
    return [...filteredInvoices].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortConfig.key) {
        case "partyName":
          aVal = (a.ledger?.name || a.partyName || "").toLowerCase();
          bVal = (b.ledger?.name || b.partyName || "").toLowerCase();
          break;
        case "invNum":
          aVal = (a.invoice_number || a.invoiceNumberStr || "").toString().toLowerCase();
          bVal = (b.invoice_number || b.invoiceNumberStr || "").toString().toLowerCase();
          break;
        case "invoiceDate":
          aVal = new Date(a.created_at || a.invoice_date || a.invoiceDate || a.date || 0).getTime();
          bVal = new Date(b.created_at || b.invoice_date || b.invoiceDate || b.date || 0).getTime();
          break;
        case "dueDate":
        case "date":
          aVal = new Date(a.due_date || a.dueDate || 0).getTime();
          bVal = new Date(b.due_date || b.dueDate || 0).getTime();
          break;
        case "amount":
          aVal = Number(a.amount ?? a.totalAmount ?? 0);
          bVal = Number(b.amount ?? b.totalAmount ?? 0);
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

  const mobileStats = useMemo(() => {
    let salesTotal = 0;
    let paidTotal = 0;
    let dueTotal = 0;
    let totalCount = sortedInvoices.length;

    sortedInvoices.forEach((inv) => {
      const totalAmt = Number(inv.amount ?? inv.totalAmount ?? inv.grandTotal ?? 0);
      const paidAmt = Number(inv.paid_amount ?? inv.paidAmount ?? 0);
      const dueAmt = Number(inv.balance_due ?? inv.dueAmount ?? Math.max(0, totalAmt - paidAmt));

      salesTotal += totalAmt;
      paidTotal += paidAmt;
      dueTotal += dueAmt;
    });

    return { salesTotal, paidTotal, dueTotal, totalCount };
  }, [sortedInvoices]);

  const handleToggleStatus = async (e: React.MouseEvent, inv: any) => {
    e.stopPropagation();
    const normalized = normalizeInvoice(inv);
    const currentStatus = normalized.status;
    const nextStatus = currentStatus === "paid" ? "unpaid" : "paid";
    try {
      const invId = String(inv.id);
      const isPurchase = normalized.isPurchase;

      if (nextStatus === "paid") {
        const ledgersRes: any = await ledgerApi.getLedgers({ silentError: true }).catch(() => null);
        const ledgerList = ledgersRes?.body?.data || ledgersRes?.body?.ledgers || (Array.isArray(ledgersRes?.body) ? ledgersRes.body : []);
        const paymentLedger = ledgerList.find((l: any) => l.type === "cash" || l.type === "bank");
        const partyLedgerId = getInvoicePartyId(inv);
        const dueAmt = normalized.dueAmount || normalized.totalAmount;

        if (paymentLedger?.id) {
          if (isPurchase && partyLedgerId) {
            await transactionApi.storeTransaction({
              type: "payment_out",
              payment_ledger_id: paymentLedger.id,
              party_ledger_id: partyLedgerId,
              amount: dueAmt,
              transaction_date: new Date().toISOString().split("T")[0],
              remark: `Payment for Purchase Invoice #${normalized.invoiceNumber}`,
            }).catch(() => { });
          } else {
            await invoiceApi.receivePayment(invId, {
              payment_ledger_id: paymentLedger.id,
              amount: dueAmt,
              transaction_date: new Date().toISOString().split("T")[0],
              remark: `Payment for Sales Invoice #${normalized.invoiceNumber}`,
            }).catch(() => { });
          }
        }
      }

      await invoiceApi.updateInvoiceStatus(invId, nextStatus as any);
      toast.success(`Invoice #${normalized.invoiceNumber} status updated to ${nextStatus.toUpperCase()}!`);
      fetchInvoices();
    } catch (err: any) {
      console.error("Failed to update status:", err);
      toast.error(err?.message || "Failed to update invoice status.");
    }
  };

  return (
    <PermissionGuard module="Invoice">
      <div className="space-y-5 select-none gi-page pb-12">
        {/* Page Heading & Action Button */}
        <div className="flex items-center justify-between pb-3 border-b gi-divider">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold gi-text-primary tracking-tight">
                Invoices
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold gi-badge-info md:hidden">
                {mobileStats?.totalCount ?? 0}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchInvoices}
              className="hidden sm:flex p-2 rounded-lg border gi-surface-interactive gi-text-secondary hover:gi-text-primary transition cursor-pointer shrink-0"
              title="Refresh Invoices"
            >
              <IoRefreshOutline className={`text-base ${isLoading ? "animate-spin" : ""}`} />
            </button>

            {hasPermission("Invoice", "Create") && (
              <div className="relative shrink-0 z-30" ref={addMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-1.5 rounded-xl sm:rounded-lg gi-btn-primary text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer whitespace-nowrap"
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
                      className="absolute right-0 top-full mt-2 z-50 w-40 rounded-xl gi-card shadow-2xl p-1.5 space-y-0.5 border gi-divider"
                    >
                      <Link href="/addInvoice/sales" onClick={() => setShowAddMenu(false)}>
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[var(--gi-hover)] text-xs font-semibold gi-text-primary cursor-pointer transition whitespace-nowrap">
                          <IoDocumentTextOutline className="text-sm text-indigo-500 shrink-0" />
                          <span>Sales</span>
                        </div>
                      </Link>
                      <Link href="/addInvoice/purchase" onClick={() => setShowAddMenu(false)}>
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[var(--gi-hover)] text-xs font-semibold gi-text-primary cursor-pointer transition whitespace-nowrap">
                          <IoReceiptOutline className="text-sm text-amber-500 shrink-0" />
                          <span>Purchase</span>
                        </div>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Email Verification Required Alert Banner */}
        {emailUnverified && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-800 dark:text-amber-200 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 shrink-0">
                <IoAlertCircleOutline className="text-lg" />
              </div>
              <div>
                <h4 className="text-xs font-bold">Email Verification Required</h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  Please verify your email address ({currentUser?.email || "your registered email"}) to access and manage invoices.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openEmailVerificationModal(currentUser?.email)}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 cursor-pointer shadow-xs"
            >
              Verify Email Now
            </button>
          </div>
        )}

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2.5 rounded-2xl gi-card shadow-xs">
          {/* Search Input - Left on Desktop */}
          <div className="relative w-full sm:w-64 order-1">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 gi-text-muted text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by party, invoice #..."
              className="w-full h-9 pl-9 pr-8 text-xs font-medium rounded-xl gi-input outline-none transition focus:ring-2 focus:ring-indigo-500/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-0.5"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter Tabs - Right on Desktop */}
          <FilterTabs
            options={[
              { id: "all", label: "All Invoices" },
              { id: "sales", label: "Sales" },
              { id: "purchase", label: "Purchase" },
            ]}
            activeId={activeFilter}
            onChange={setActiveFilter}
            layoutId="invoicesFilterPill"
            className="order-2 sm:ml-auto"
          />
        </div>

        {/* Mobile Responsive Cards View (< 768px) */}
        <div className="block md:hidden space-y-3">

          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <SkeletonBox className="h-4 w-32 rounded-md" />
                  <SkeletonBox className="h-4 w-16 rounded-md" />
                </div>
                <div className="flex items-center justify-between">
                  <SkeletonBox className="h-3 w-24 rounded-md" />
                  <SkeletonBox className="h-3 w-16 rounded-md" />
                </div>
              </div>
            ))
          ) : sortedInvoices.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-white dark:bg-zinc-900 shadow-xs gi-text-muted text-xs font-medium">
              No Invoices Found
            </div>
          ) : (
            sortedInvoices.map((invItem) => {
              const inv = normalizeInvoice(invItem);
              const partyName = inv.partyName;
              const displayInvNum = inv.invoiceNumber;
              const invoiceDateStr = inv.date;
              const dueDateStr = inv.dueDate;
              const totalAmt = inv.totalAmount;
              const isPaid = inv.status === "paid";
              const isPurchase = inv.isPurchase;

              return (
                <div
                  key={inv.id}
                  onClick={() => router.push(`/invoiceDetails/${inv.id}`)}
                  className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 shadow-xs flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                      <IoDocumentTextOutline className="text-lg" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                          {displayInvNum}
                        </h3>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${isPurchase ? "gi-badge-warning" : "gi-badge-info"
                          }`}>
                          {isPurchase ? "Purchase" : "Sales"}
                        </span>
                      </div>
                      <p className="text-[11px] gi-text-muted mt-0.5 truncate">
                        {partyName} • Inv: {invoiceDateStr} • Due: {dueDateStr}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${isPaid
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                      }`}>
                      {isPaid ? "Paid" : "Unpaid"}
                    </span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-100 text-xs mt-1">
                      ₹{totalAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    {!isPaid && inv.dueAmount > 0 && (
                      <span className={`text-[10px] font-bold block ${isPurchase ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {isPurchase ? "To Pay: " : "To Collect: "}₹{inv.dueAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Main Desktop Invoices Data Table (>= 768px) */}
        <div className="hidden md:block gi-table-container shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs gi-table border-collapse">
              <thead>
                <tr>
                  <th
                    onClick={() => handleSort("invNum")}
                    className="py-3 px-4 cursor-pointer select-none hover:bg-[var(--gi-hover)] transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Invoice #</span>
                      {sortConfig.key === "invNum" && (
                        sortConfig.direction === "asc" ? <IoArrowUpOutline className="text-xs text-indigo-500 shrink-0" /> : <IoArrowDownOutline className="text-xs text-indigo-500 shrink-0" />
                      )}
                      {sortConfig.key !== "invNum" && <IoSwapVerticalOutline className="text-xs text-slate-400 opacity-40 shrink-0" />}
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Type</th>
                  <th
                    onClick={() => handleSort("partyName")}
                    className="py-3 px-4 cursor-pointer select-none hover:bg-[var(--gi-hover)] transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Billed Party</span>
                      {sortConfig.key === "partyName" && (
                        sortConfig.direction === "asc" ? <IoArrowUpOutline className="text-xs text-indigo-500 shrink-0" /> : <IoArrowDownOutline className="text-xs text-indigo-500 shrink-0" />
                      )}
                      {sortConfig.key !== "partyName" && <IoSwapVerticalOutline className="text-xs text-slate-400 opacity-40 shrink-0" />}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("invoiceDate")}
                    className="py-3 px-4 cursor-pointer select-none hover:bg-[var(--gi-hover)] transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Invoice Date</span>
                      {sortConfig.key === "invoiceDate" && (
                        sortConfig.direction === "asc" ? <IoArrowUpOutline className="text-xs text-indigo-500 shrink-0" /> : <IoArrowDownOutline className="text-xs text-indigo-500 shrink-0" />
                      )}
                      {sortConfig.key !== "invoiceDate" && <IoSwapVerticalOutline className="text-xs text-slate-400 opacity-40 shrink-0" />}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("dueDate")}
                    className="py-3 px-4 cursor-pointer select-none hover:bg-[var(--gi-hover)] transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Due Date</span>
                      {sortConfig.key === "dueDate" && (
                        sortConfig.direction === "asc" ? <IoArrowUpOutline className="text-xs text-indigo-500 shrink-0" /> : <IoArrowDownOutline className="text-xs text-indigo-500 shrink-0" />
                      )}
                      {sortConfig.key !== "dueDate" && <IoSwapVerticalOutline className="text-xs text-slate-400 opacity-40 shrink-0" />}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("amount")}
                    className="py-3 px-4 text-right cursor-pointer select-none hover:bg-[var(--gi-hover)] transition"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Total Amount</span>
                      {sortConfig.key === "amount" && (
                        sortConfig.direction === "asc" ? <IoArrowUpOutline className="text-xs text-indigo-500 shrink-0" /> : <IoArrowDownOutline className="text-xs text-indigo-500 shrink-0" />
                      )}
                      {sortConfig.key !== "amount" && <IoSwapVerticalOutline className="text-xs text-slate-400 opacity-40 shrink-0" />}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Paid Amount</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th
                    onClick={() => handleSort("status")}
                    className="py-3 px-4 text-center cursor-pointer select-none hover:bg-[var(--gi-hover)] transition"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Status</span>
                      {sortConfig.key === "status" && (
                        sortConfig.direction === "asc" ? <IoArrowUpOutline className="text-xs text-indigo-500 shrink-0" /> : <IoArrowDownOutline className="text-xs text-indigo-500 shrink-0" />
                      )}
                      {sortConfig.key !== "status" && <IoSwapVerticalOutline className="text-xs text-slate-400 opacity-40 shrink-0" />}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y gi-divider">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, rIdx) => (
                    <tr key={rIdx}>
                      <td className="py-3 px-4"><SkeletonBox className="h-4 w-24 rounded-md" /></td>
                      <td className="py-3 px-3 text-center"><SkeletonBox className="h-5 w-16 rounded mx-auto" /></td>
                      <td className="py-3 px-4"><SkeletonBox className="h-4 w-36 rounded-md" /></td>
                      <td className="py-3 px-4"><SkeletonBox className="h-4 w-20 rounded-md" /></td>
                      <td className="py-3 px-4"><SkeletonBox className="h-4 w-20 rounded-md" /></td>
                      <td className="py-3 px-4 text-right"><SkeletonBox className="h-4 w-20 ml-auto rounded-md" /></td>
                      <td className="py-3 px-4 text-right"><SkeletonBox className="h-4 w-16 ml-auto rounded-md" /></td>
                      <td className="py-3 px-4 text-right"><SkeletonBox className="h-4 w-16 ml-auto rounded-md" /></td>
                      <td className="py-3 px-4 text-center"><SkeletonBox className="h-5 w-16 rounded-full mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><SkeletonBox className="h-5 w-16 rounded mx-auto" /></td>
                    </tr>
                  ))
                ) : sortedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center gi-text-muted text-xs">
                      No invoices found matching your selection.
                    </td>
                  </tr>
                ) : (
                  sortedInvoices.map((invItem) => {
                    const inv = normalizeInvoice(invItem);
                    const partyName = inv.partyName;
                    const invNum = inv.invoiceNumber;
                    const invoiceDateStr = inv.date;
                    const dueDateStr = inv.dueDate;
                    const totalAmt = inv.totalAmount;
                    const paidAmt = inv.paidAmount;
                    const dueAmt = inv.dueAmount;

                    const status = inv.status;
                    const isPaid = status === "paid";
                    const isPartial = status === "partially_paid";
                    const isPurchase = inv.isPurchase;

                    return (
                      <tr
                        key={inv.id}
                        onClick={() => router.push(`/invoice/${inv.id}`)}
                        className="hover:bg-[var(--gi-hover)] transition cursor-pointer"
                      >
                        {/* Invoice # */}
                        <td className="py-3 px-4 font-mono font-bold gi-text-primary whitespace-nowrap">
                          {invNum}
                        </td>

                        {/* Invoice Type */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isPurchase ? "gi-badge-warning" : "gi-badge-info"
                            }`}>
                            {isPurchase ? "Purchase" : "Sales"}
                          </span>
                        </td>

                        {/* Customer / Ledger Name */}
                        <td className="py-3 px-4">
                          <p className="gi-mob-primary font-semibold gi-text-primary truncate max-w-[200px]">{partyName}</p>
                        </td>

                        {/* Invoice Date */}
                        <td className="py-3 px-4 gi-text-secondary whitespace-nowrap">
                          {invoiceDateStr}
                        </td>

                        {/* Due Date */}
                        <td className="py-3 px-4 gi-text-secondary whitespace-nowrap font-medium">
                          {dueDateStr}
                        </td>

                        {/* Total Amount */}
                        <td className="py-3 px-4 font-mono font-bold text-right gi-text-primary whitespace-nowrap">
                          ₹{totalAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>

                        {/* Paid Amount */}
                        <td className="py-3 px-4 font-mono text-right text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                          ₹{paidAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>

                        {/* Balance (To Pay / To Collect) */}
                        <td className="py-3 px-4 text-right font-mono font-semibold whitespace-nowrap">
                          {dueAmt > 0 ? (
                            <span className={isPurchase ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}>
                              <span className="text-[10px] uppercase block font-bold text-slate-400 dark:text-zinc-500 font-sans">
                                {isPurchase ? "To Pay" : "To Collect"}
                              </span>
                              ₹{dueAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-zinc-500">₹0.00</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => handleToggleStatus(e, inv)}
                            title="Click to toggle payment status"
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:opacity-80 transition ${isPaid ? "gi-badge-success" : isPartial ? "gi-badge-warning" : "gi-badge-danger"
                              }`}
                          >
                            {isPaid ? "Paid" : isPartial ? "Partially Paid" : "Unpaid"}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => handleViewOnline(inv.id, e)}
                              title="View Invoice Online"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition"
                            >
                              <IoGlobeOutline className="text-base" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDownloadPdf(inv.id, e, inv.invoiceNumber)}
                              title="Download PDF"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition"
                            >
                              <IoDownloadOutline className="text-base" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInvoiceToDelete(inv);
                              }}
                              disabled={deletingId === inv.id}
                              title="Delete Invoice"
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition disabled:opacity-50"
                            >
                              <IoTrashOutline className="text-base" />
                            </button>
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

        {/* Delete Invoice Confirmation Modal */}
        {invoiceToDelete && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative max-w-md w-full gi-card p-6 rounded-2xl shadow-2xl border gi-divider space-y-4">
              <div className="flex items-center justify-between border-b pb-3 gi-divider">
                <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">Delete Invoice</h3>
                <button
                  type="button"
                  onClick={() => setInvoiceToDelete(null)}
                  className="p-1 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer"
                >
                  <IoClose className="text-base" />
                </button>
              </div>

              <p className="text-xs gi-text-secondary leading-relaxed">
                Are you sure you want to delete invoice <strong className="gi-text-primary">#{invoiceToDelete.invoice_number || invoiceToDelete.invoiceNumber || invoiceToDelete.id}</strong>? This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInvoiceToDelete(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border gi-surface-interactive gi-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteInvoice}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Delete Invoice
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </PermissionGuard>
  );
}
