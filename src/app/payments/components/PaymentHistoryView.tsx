"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IoAdd,
  IoSearch,
  IoSwapHorizontalOutline,
  IoLocationOutline,
  IoClose,
  IoWalletOutline,
  IoEyeOutline,
  IoLayersOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoSwapVerticalOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoArrowBack,
  IoChevronBack,
} from "react-icons/io5";
import { useAuth } from "@/context/AuthContext";
import PermissionGuard from "@/components/PermissionGuard";
import FilterTabs from "@/components/FilterTabs";
import { SkeletonCard, SkeletonBox } from "@/components/Skeleton";
import { ledgerApi } from "@/lib/api/ledger";
import { transactionApi } from "@/lib/api/transaction";
import { siteProjectApi } from "@/lib/api/siteProject";
import { invoiceApi } from "@/lib/api/invoice";
import AddLedgerTransactionForm from "@/app/ledgers/components/AddLedgerTransactionForm";
import { toast } from "react-toastify";

export default function PaymentHistoryView() {
  const { activeBusiness, hasPermission } = useAuth();
  const router = useRouter();

  const [ledgerTransactions, setLedgerTransactions] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [siteProjects, setSiteProjects] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProofImg, setSelectedProofImg] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" });

  // Modals for Edit and Delete
  const [txToEdit, setTxToEdit] = useState<any | null>(null);
  const [txToDelete, setTxToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    if (!activeBusiness?.id) {
      setLedgerTransactions([]);
      setLedgers([]);
      setSiteProjects([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [ledgersRes, siteProjectsRes, invoicesRes]: [any, any, any] = await Promise.all([
        ledgerApi.getLedgers({ per_page: "all", silentError: true }).catch(() => ({ body: [] })),
        siteProjectApi.getSiteProjects(activeBusiness.id, { silentError: true }).catch(() => ({ body: [] })),
        invoiceApi.getInvoices({ per_page: "all", silentError: true }).catch(() => ({ body: [] })),
      ]);

      const lList = Array.isArray(ledgersRes?.body)
        ? ledgersRes.body
        : (ledgersRes?.body?.ledgers || ledgersRes?.body?.data || []);
      const sList = Array.isArray(siteProjectsRes?.body)
        ? siteProjectsRes.body
        : (siteProjectsRes?.body?.projects || siteProjectsRes?.body?.data || []);
      const iList = Array.isArray(invoicesRes?.body)
        ? invoicesRes.body
        : (invoicesRes?.body?.invoices || invoicesRes?.body?.data || []);

      setLedgers(Array.isArray(lList) ? lList : []);
      setSiteProjects(Array.isArray(sList) ? sList : []);
      setInvoices(Array.isArray(iList) ? iList : []);

      // Directly fetch all transactions from POST /transactions
      const txRes: any = await transactionApi.getTransactions({
        per_page: "all",
        sort_by: "transaction_date",
        sort_dir: "desc",
        silentError: true,
      }).catch(() => null);

      console.log("[App PaymentHistory] Actual API Response from POST /transactions:", txRes);

      let txList = Array.isArray(txRes?.body)
        ? txRes.body
        : (txRes?.body?.transactions || txRes?.body?.data || []);

      // If transactions API returned nothing but ledgers exist, fallback to ledger transactions
      if ((!Array.isArray(txList) || txList.length === 0) && Array.isArray(lList) && lList.length > 0) {
        const txResults = await Promise.all(
          lList.map((l: any) =>
            ledgerApi.getTransactions(l.id, { silentError: true }).catch(() => ({ body: [] }))
          )
        );

        const allTxMap = new Map();
        txResults.forEach((res: any) => {
          const list = Array.isArray(res?.body)
            ? res.body
            : (res?.body?.transactions || res?.body?.data || []);
          if (Array.isArray(list)) {
            list.forEach((tx: any) => {
              if (tx && tx.id) {
                allTxMap.set(tx.id, tx);
              }
            });
          }
        });

        txList = Array.from(allTxMap.values());
      }

      setLedgerTransactions(Array.isArray(txList) ? txList : []);
    } catch (err) {
      console.warn("Error fetching transactions data:", err);
      setLedgerTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeBusiness?.id]);

  const handleDeleteTransaction = async () => {
    if (!txToDelete?.id) return;
    setIsDeleting(true);
    try {
      await transactionApi.deleteTransaction(txToDelete.id);
      toast.success("Transaction deleted successfully!");
      setTxToDelete(null);
      fetchData();
    } catch (err: any) {
      console.error("Error deleting transaction:", err);
      toast.error(err.message || "Failed to delete transaction.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        return { key: null, direction: "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const getLedgerName = (id: any) => {
    if (!id) return "—";
    const l = ledgers.find((item) => String(item.id) === String(id));
    return l ? l.name : String(id);
  };

  const getSiteName = (id: any) => {
    if (!id) return "—";
    const s = siteProjects.find((item) => String(item.id) === String(id));
    return s ? (s.siteName || s.name || "Site") : String(id);
  };

  const getLinkedInvoice = (tx: any) => {
    if (!tx) return null;
    if (tx.sales_invoice && tx.sales_invoice.id) {
      return {
        id: tx.sales_invoice.id,
        number: tx.sales_invoice.invoice_number || tx.sales_invoice.number || `INV-${tx.sales_invoice.id}`,
      };
    }
    if (tx.purchase_invoice && tx.purchase_invoice.id) {
      return {
        id: tx.purchase_invoice.id,
        number: tx.purchase_invoice.invoice_number || tx.purchase_invoice.number || `PI-${tx.purchase_invoice.id}`,
      };
    }
    if (tx.invoice && tx.invoice.id) {
      return {
        id: tx.invoice.id,
        number: tx.invoice.invoice_number || tx.invoice.number || `INV-${tx.invoice.id}`,
      };
    }

    const targetInvId = String(tx.sales_invoice_id || tx.purchase_invoice_id || tx.invoice_id || "");
    const targetInvNum = tx.sales_invoice_number || tx.purchase_invoice_number || tx.invoice_number;

    if (targetInvId) {
      const match = invoices.find((i: any) => String(i.id) === targetInvId);
      return {
        id: match?.id || targetInvId,
        number: match?.invoice_number || match?.number || targetInvNum || `#${targetInvId}`,
      };
    }

    if (targetInvNum) {
      return { id: null, number: targetInvNum };
    }

    return null;
  };

  const nonJournalTransactions = useMemo(() => {
    return ledgerTransactions.filter((tx) => {
      const typeStr = String(tx.type || tx.transactionType || "").toLowerCase().trim();
      return typeStr !== "journal" && !typeStr.includes("journal");
    });
  }, [ledgerTransactions]);

  const { totalTxCount, totalVolume, siteLinkedCount, creditTotal } = useMemo(() => {
    let vol = 0;
    let siteCnt = 0;
    let crTot = 0;

    nonJournalTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      vol += amt;

      const projId = tx.project_id || tx.siteProjectId;
      if (projId) {
        siteCnt += 1;
      }

      const type = (tx.type || tx.transactionType || "").toLowerCase();
      if (type === "payment_in" || type === "credit") {
        crTot += amt;
      }
    });

    return {
      totalTxCount: nonJournalTransactions.length,
      totalVolume: vol,
      siteLinkedCount: siteCnt,
      creditTotal: crTot,
    };
  }, [nonJournalTransactions]);

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return nonJournalTransactions.filter((tx) => {
      const fromId = tx.payment_ledger_id || tx.fromLedgerId;
      const toId = tx.party_ledger_id || tx.toLedgerId;
      const fromName = getLedgerName(fromId).toLowerCase();
      const toName = getLedgerName(toId).toLowerCase();
      const remarkStr = (tx.remark || "").toLowerCase();
      const typeStr = (tx.type || tx.transactionType || "").toLowerCase();
      const projId = tx.project_id || tx.siteProjectId;

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "payment_in" && (typeStr === "payment_in" || typeStr === "credit")) ||
        (activeFilter === "payment_out" && (typeStr === "payment_out" || typeStr === "debit"));

      const matchesSearch =
        query === "" ||
        fromName.includes(query) ||
        toName.includes(query) ||
        remarkStr.includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [nonJournalTransactions, activeFilter, searchQuery, ledgers]);

  const sortedTransactions = useMemo(() => {
    if (!sortConfig.key) return filteredTransactions;
    return [...filteredTransactions].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortConfig.key) {
        case "date":
          aVal = new Date(a.transaction_date || a.date || 0).getTime();
          bVal = new Date(b.transaction_date || b.date || 0).getTime();
          break;
        case "transaction_number":
          aVal = String(a.transaction_number || a.number || "").toLowerCase();
          bVal = String(b.transaction_number || b.number || "").toLowerCase();
          break;
        case "fromLedger":
          aVal = getLedgerName(a.payment_ledger_id || a.fromLedgerId).toLowerCase();
          bVal = getLedgerName(b.payment_ledger_id || b.fromLedgerId).toLowerCase();
          break;
        case "toLedger":
          aVal = getLedgerName(a.party_ledger_id || a.toLedgerId).toLowerCase();
          bVal = getLedgerName(b.party_ledger_id || b.toLedgerId).toLowerCase();
          break;
        case "type":
          aVal = (a.type || a.transactionType || "").toLowerCase();
          bVal = (b.type || b.transactionType || "").toLowerCase();
          break;
        case "amount":
          aVal = Number(a.amount || 0);
          bVal = Number(b.amount || 0);
          break;
        case "site":
          aVal = getSiteName(a.project_id || a.siteProjectId).toLowerCase();
          bVal = getSiteName(b.project_id || b.siteProjectId).toLowerCase();
          break;
        default:
          return 0;
      }
      if (typeof aVal === "string") {
        return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [filteredTransactions, sortConfig]);

  const getTypeBadge = (typeStr: string) => {
    const t = (typeStr || "").toLowerCase();
    if (t === "payment_in" || t === "credit") {
      return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-badge-success">Payment In</span>;
    }
    if (t === "payment_out" || t === "debit") {
      return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-badge-danger">Payment Out</span>;
    }
    if (t === "contra") {
      return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-badge-info">Contra</span>;
    }
    return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-badge-warning">{t || "Journal"}</span>;
  };

  return (
    <PermissionGuard module="Ledger">
      <div className="space-y-5 select-none gi-page">
        {/* Page Heading (No Quick Action Buttons, No Settings Icon) */}
        <div className="flex items-center justify-between border-b gi-divider pb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/payments")}
              className="gi-back-btn"
              title="Go Back to Payments"
            >
              <IoChevronBack />
              <span className="gi-back-label">Back</span>
            </button>
            <h1 className="text-2xl font-bold gi-text-primary tracking-tight">
              Payment History
            </h1>
          </div>
        </div>

        {/* Summary KPI Row (Desktop Only) */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold gi-text-secondary uppercase tracking-wider">
                Transferred Volume
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono gi-text-primary mt-0.5">
                ₹{totalVolume.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <span className="p-2 rounded-lg gi-badge-info text-lg">
              <IoSwapHorizontalOutline />
            </span>
          </div>

          <div className="p-3 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold gi-text-secondary uppercase tracking-wider">
                Total Transactions
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono gi-text-primary mt-0.5">
                {totalTxCount}
              </p>
              <p className="text-[10px] gi-text-muted mt-0.5">Recorded in system</p>
            </div>
            <span className="p-2 rounded-lg gi-badge-info text-lg">
              <IoLayersOutline />
            </span>
          </div>

          <div className="p-3 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold gi-text-secondary uppercase tracking-wider">
                Site / Project Linked
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono gi-text-primary mt-0.5">
                {siteLinkedCount}
              </p>
              <p className="text-[10px] gi-text-muted mt-0.5">Tagged to active site</p>
            </div>
            <span className="p-2 rounded-lg gi-badge-success text-lg">
              <IoLocationOutline />
            </span>
          </div>

          <div className="p-3 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold gi-text-secondary uppercase tracking-wider">
                Payment In Total
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                ₹{creditTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <span className="p-2 rounded-lg gi-badge-success text-lg">
              <IoWalletOutline />
            </span>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-0 bg-transparent border-none shadow-none">
          {/* Search Bar (Desktop Only) - Left on Desktop */}
          <div className="hidden md:block relative w-full sm:w-64 order-1">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 gi-text-muted text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ledger or remark..."
              className="w-full h-8 pl-8 pr-3 rounded-lg gi-input text-xs outline-none transition"
            />
          </div>

          {/* Filter Tabs - Right on Desktop */}
          <FilterTabs
            options={[
              { id: "all", label: "All" },
              { id: "payment_out", label: "Paid" },
              { id: "payment_in", label: "Collected" },
            ]}
            activeId={activeFilter}
            onChange={setActiveFilter}
            layoutId="paymentHistoryFilterPill"
            className="order-2 sm:ml-auto"
          />
        </div>

        {/* Mobile Cards View (< 768px) — MATCHES IMAGE 2 */}
        <div className="block md:hidden space-y-2.5">
          {isLoading ? (
            <SkeletonCard count={5} />
          ) : sortedTransactions.length === 0 ? (
            <div className="py-10 text-center gi-card text-xs gi-text-muted rounded-2xl">
              No transactions found.
            </div>
          ) : (
            sortedTransactions.map((tx) => {
              const toId = tx.party_ledger_id || tx.toLedgerId || tx.payment_ledger_id || tx.fromLedgerId;
              const partyName = getLedgerName(toId);
              const txDate = tx.transaction_date || tx.date || tx.created_at;
              const dObj = txDate ? new Date(txDate) : null;
              const dateStr = dObj && !isNaN(dObj.getTime())
                ? `${String(dObj.getDate()).padStart(2, "0")}-${String(dObj.getMonth() + 1).padStart(2, "0")}-${dObj.getFullYear()}`
                : txDate || "—";
              
              const typeStr = String(tx.type || tx.transactionType || "").toLowerCase();
              const isIn = typeStr === "payment_in" || typeStr === "credit" || typeStr === "in";
              const targetId = tx.payment_id || tx.paymentId || tx.id;
              const linkedInv = getLinkedInvoice(tx);
              const isUnlinked = !linkedInv && !tx.invoice_id && !tx.invoiceId && !tx.linked_invoice_id;

              return (
                <div
                  key={tx.id}
                  onClick={() => {
                    if (targetId) router.push(`/paymentDetails/${targetId}?from=/paymentHistory`);
                  }}
                  className="p-3.5 rounded-2xl border gi-border gi-card flex items-center justify-between gap-3 cursor-pointer hover:bg-[var(--gi-hover)] active:scale-[0.99] transition shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-200 font-bold text-sm flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-zinc-700">
                      {partyName.charAt(0).toUpperCase() || "P"}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm gi-text-primary truncate">
                        {partyName}
                      </h3>
                      <p className="text-xs gi-text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{dateStr}</span>
                        {(tx.transaction_number || tx.number) && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[11px] font-medium gi-text-secondary">
                              {tx.transaction_number || tx.number}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className={`font-semibold font-mono text-sm ${isIn ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        ₹{Number(tx.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    {isUnlinked && hasPermission("Ledger", "Delete") && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTxToDelete(tx);
                        }}
                        className="p-1 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Delete Unlinked Transaction"
                      >
                        <IoTrashOutline className="text-sm" />
                      </button>
                    )}
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
                    { key: "date", label: "Date", align: "left" },
                    { key: "fromLedger", label: "From Ledger", align: "left" },
                    { key: "toLedger", label: "To Ledger", align: "left" },
                    { key: "type", label: "Type", align: "left" },
                    { key: "amount", label: "Amount", align: "right" },
                    { key: "site", label: "Site", align: "left" },
                    { key: "linkedInvoice", label: "Invoice", align: "left" },
                  ].map((col, idx) => {
                    const isActive = sortConfig.key === col.key;
                    return (
                      <th
                        key={idx}
                        onClick={() => handleSort(col.key)}
                        className={`py-2 px-2 cursor-pointer select-none hover:bg-[var(--gi-hover)] transition text-${col.align}`}
                      >
                        <div className={`flex items-center gap-1 ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : "justify-start"}`}>
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
                  <th className="py-2 px-2">Remark</th>
                  <th className="py-2 px-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y gi-divider">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-2 px-2"><SkeletonBox className="h-5 w-16" /></td>
                      <td className="py-2 px-2"><SkeletonBox className="h-5 w-24" /></td>
                      <td className="py-2 px-2"><SkeletonBox className="h-5 w-24" /></td>
                      <td className="py-2 px-2"><SkeletonBox className="h-5 w-16" /></td>
                      <td className="py-2 px-2"><SkeletonBox className="h-5 w-16 ml-auto" /></td>
                      <td className="py-2 px-2"><SkeletonBox className="h-5 w-20" /></td>
                      <td className="py-2 px-2"><SkeletonBox className="h-5 w-20" /></td>
                      <td className="py-2 px-2"><SkeletonBox className="h-5 w-20" /></td>
                      <td className="py-2 px-2"><SkeletonBox className="h-5 w-12 mx-auto" /></td>
                    </tr>
                  ))
                ) : sortedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center gi-text-muted text-xs">
                      No ledger transactions found. Click &quot;Add Transaction&quot; to record a new transfer.
                    </td>
                  </tr>
                ) : (
                  sortedTransactions.map((tx) => {
                    const fromId = tx.payment_ledger_id || tx.fromLedgerId;
                    const toId = tx.party_ledger_id || tx.toLedgerId;
                    const dateStr = tx.transaction_date || tx.date || "—";
                    const projId = tx.project_id || tx.siteProjectId;
                    const proofImg = tx.proof_image || tx.imageProof;
                    const linkedInv = getLinkedInvoice(tx);
                    const isUnlinked = !linkedInv && !tx.invoice_id && !tx.invoiceId && !tx.linked_invoice_id;
                    const fromName = getLedgerName(fromId);
                    const toName = getLedgerName(toId);

                    return (
                      <tr
                        key={tx.id}
                        onClick={() => {
                          const targetId = tx.payment_id || tx.paymentId || tx.id || tx.transaction_number;
                          if (targetId) router.push(`/paymentDetails/${targetId}?from=/paymentHistory`);
                        }}
                        className="hover:bg-[var(--gi-hover)] transition cursor-pointer"
                      >
                        <td className="py-2 px-2 font-semibold gi-text-primary whitespace-nowrap">
                          {dateStr}
                        </td>
                        <td className="py-2 px-2 font-semibold text-rose-600 dark:text-rose-400 max-w-[130px] truncate" title={fromName}>
                          {fromName}
                        </td>
                        <td className="py-2 px-2 font-semibold text-emerald-600 dark:text-emerald-400 max-w-[130px] truncate" title={toName}>
                          {toName}
                        </td>
                        <td className="py-2 px-2 shrink-0">
                          {getTypeBadge(tx.type || tx.transactionType)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold gi-text-primary text-xs whitespace-nowrap">
                          ₹{Number(tx.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-2 max-w-[110px] truncate" title={projId ? getSiteName(projId) : ""}>
                          {projId ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium gi-text-primary truncate">
                              <IoLocationOutline className="text-xs text-indigo-500 shrink-0" />
                              <span className="truncate">{getSiteName(projId)}</span>
                            </span>
                          ) : (
                            <span className="gi-text-muted text-xs">—</span>
                          )}
                        </td>
                        <td className="py-2 px-2 max-w-[110px] truncate" onClick={(e) => e.stopPropagation()}>
                          {linkedInv ? (
                            linkedInv.id ? (
                              <Link
                                href={`/invoiceDetails/${linkedInv.id}`}
                                className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 truncate"
                                title={linkedInv.number}
                              >
                                <span className="truncate">{linkedInv.number}</span>
                              </Link>
                            ) : (
                              <span className="font-mono text-xs font-medium gi-text-primary truncate" title={linkedInv.number}>{linkedInv.number}</span>
                            )
                          ) : (
                            <span className="gi-text-muted text-xs">—</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-xs max-w-[140px] truncate gi-text-secondary" title={tx.remark || ""}>
                          {tx.remark ? (
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="truncate">{tx.remark}</span>
                              {tx.remark.toLowerCase().includes("bulk payment") && (
                                <span className="inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 w-fit">
                                  Bulk Split
                                </span>
                              )}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const targetId = tx.payment_id || tx.paymentId || tx.id || tx.transaction_number;
                                if (targetId) router.push(`/paymentDetails/${targetId}?from=/paymentHistory`);
                              }}
                              className="p-1.5 rounded-md gi-badge-info transition inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                              title="View Transaction Details"
                            >
                              <IoEyeOutline className="text-xs" />
                            </button>

                            {proofImg && (
                              <button
                                type="button"
                                onClick={() => setSelectedProofImg(proofImg)}
                                className="p-1.5 rounded-md gi-badge-success transition inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                                title="View Proof"
                              >
                                <IoEyeOutline className="text-xs" />
                              </button>
                            )}

                            {hasPermission("Ledger", "Edit") && (
                              <button
                                type="button"
                                onClick={() => setTxToEdit(tx)}
                                className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                                title="Edit Transaction"
                              >
                                <IoPencilOutline className="text-sm" />
                              </button>
                            )}

                            {isUnlinked && hasPermission("Ledger", "Delete") && (
                              <button
                                type="button"
                                onClick={() => setTxToDelete(tx)}
                                className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                title="Delete Unlinked Transaction"
                              >
                                <IoTrashOutline className="text-sm" />
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

        {/* Edit Transaction Modal */}
        {txToEdit && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-[var(--gi-surface)] rounded-2xl shadow-2xl p-6 border gi-divider max-h-[90vh] overflow-y-auto">
              <AddLedgerTransactionForm
                txToEdit={txToEdit}
                onSuccess={() => {
                  setTxToEdit(null);
                  fetchData();
                }}
                onCancel={() => setTxToEdit(null)}
              />
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {txToDelete && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative max-w-md w-full gi-card p-6 rounded-2xl shadow-2xl border gi-divider space-y-4">
              <div className="flex items-center justify-between border-b pb-3 gi-divider">
                <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">Delete Transaction</h3>
                <button
                  type="button"
                  onClick={() => setTxToDelete(null)}
                  className="p-1 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer"
                >
                  <IoClose className="text-base" />
                </button>
              </div>

              <p className="text-xs gi-text-secondary leading-relaxed">
                Are you sure you want to delete this transaction of <strong className="gi-text-primary">₹{Number(txToDelete.amount || 0).toLocaleString("en-IN")}</strong>? This will automatically reverse ledger balance updates.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTxToDelete(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border gi-surface-interactive gi-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTransaction}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete Transaction"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Proof Image View Modal */}
        {selectedProofImg && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative max-w-lg w-full gi-card p-4 rounded-xl shadow-2xl border gi-divider space-y-3">
              <div className="flex items-center justify-between border-b pb-2 gi-divider">
                <h3 className="text-sm font-bold gi-text-primary">Transaction Proof Image</h3>
                <button
                  type="button"
                  onClick={() => setSelectedProofImg(null)}
                  className="p-1 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer"
                >
                  <IoClose className="text-base" />
                </button>
              </div>

              <div className="flex justify-center bg-black/10 rounded-lg p-2 overflow-hidden max-h-[70vh]">
                <img
                  src={selectedProofImg}
                  alt="Proof Document"
                  className="max-h-[65vh] w-auto object-contain rounded"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProofImg(null)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold gi-btn-primary cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}

