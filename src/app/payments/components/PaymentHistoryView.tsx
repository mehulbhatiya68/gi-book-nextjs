"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
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
  IoChevronBack,
  IoArrowForward,
  IoReceiptOutline,
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
import { useMinimumLoading } from "@/lib/hooks/useMinimumLoading";

export default function PaymentHistoryView() {
  const { activeBusiness, hasPermission } = useAuth();
  const router = useRouter();

  const [ledgerTransactions, setLedgerTransactions] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [siteProjects, setSiteProjects] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const { isLoading, startLoading, stopLoading } = useMinimumLoading(true, 400);

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProofImg, setSelectedProofImg] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" }>({
    key: "date",
    direction: "desc",
  });

  // Modals for Edit and Delete
  const [txToEdit, setTxToEdit] = useState<any | null>(null);
  const [txToDelete, setTxToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fast O(1) Lookup Maps
  const ledgerMap = useMemo(() => {
    const map = new Map<string, any>();
    ledgers.forEach((l) => {
      if (l?.id) map.set(String(l.id).toLowerCase().trim(), l);
    });
    return map;
  }, [ledgers]);

  const siteMap = useMemo(() => {
    const map = new Map<string, any>();
    siteProjects.forEach((s) => {
      if (s?.id) map.set(String(s.id).toLowerCase().trim(), s);
    });
    return map;
  }, [siteProjects]);

  const invoiceMap = useMemo(() => {
    const map = new Map<string, any>();
    invoices.forEach((inv) => {
      if (inv?.id) map.set(String(inv.id).toLowerCase().trim(), inv);
    });
    return map;
  }, [invoices]);

  const fetchData = useCallback(async () => {
    if (!activeBusiness?.id) {
      setLedgerTransactions([]);
      setLedgers([]);
      setSiteProjects([]);
      stopLoading();
      return;
    }

    startLoading();
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

      let txList = Array.isArray(txRes?.body)
        ? txRes.body
        : (txRes?.body?.transactions || txRes?.body?.data || []);

      // Fallback if transactions API returns empty but ledgers exist
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
      stopLoading();
    }
  }, [activeBusiness?.id, startLoading, stopLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const getLedgerNameFast = useCallback((id: any) => {
    if (!id) return "—";
    const key = String(id).toLowerCase().trim();
    const l = ledgerMap.get(key);
    if (l) return l.name || l.partyName || l.party_name || l.title || "Ledger";
    return "Ledger";
  }, [ledgerMap]);

  const getSiteNameFast = useCallback((id: any) => {
    if (!id) return "—";
    const key = String(id).toLowerCase().trim();
    const s = siteMap.get(key);
    return s ? (s.siteName || s.name || "Site") : "Site";
  }, [siteMap]);

  const getLinkedInvoiceFast = useCallback((tx: any) => {
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
      const match = invoiceMap.get(targetInvId.toLowerCase().trim());
      return {
        id: match?.id || targetInvId,
        number: match?.invoice_number || match?.number || targetInvNum || `#${targetInvId}`,
      };
    }

    if (targetInvNum) {
      return { id: null, number: targetInvNum };
    }

    return null;
  }, [invoiceMap]);

  // Pre-normalize transactions for high performance
  const normalizedTransactions = useMemo(() => {
    return ledgerTransactions
      .filter((tx) => {
        const typeStr = String(tx.type || tx.transactionType || "").toLowerCase().trim();
        return typeStr !== "journal" && !typeStr.includes("journal");
      })
      .map((tx) => {
        const typeStr = String(tx.type || tx.transactionType || "").toLowerCase().trim();
        const isIn = typeStr === "payment_in" || typeStr === "credit" || typeStr === "receipt";
        const isOut = typeStr === "payment_out" || typeStr === "debit" || typeStr === "paid";

        let fromId: any = null;
        let toId: any = null;
        let fromName = "—";
        let toName = "—";

        if (isIn) {
          // Payment In: From Party (Customer) -> To Payment Ledger (Cash/Bank)
          fromId = tx.party_ledger_id || tx.partyLedgerId || tx.from_ledger_id || tx.fromLedgerId;
          toId = tx.payment_ledger_id || tx.paymentLedgerId || tx.to_ledger_id || tx.toLedgerId;

          fromName =
            tx.party_ledger?.name ||
            tx.party_ledger?.partyName ||
            tx.party_ledger?.party_name ||
            tx.from_ledger?.name ||
            tx.fromLedger?.name ||
            getLedgerNameFast(fromId);

          toName =
            tx.payment_ledger?.name ||
            tx.payment_ledger?.title ||
            tx.to_ledger?.name ||
            tx.toLedger?.name ||
            getLedgerNameFast(toId);
        } else if (isOut) {
          // Payment Out: From Payment Ledger (Cash/Bank) -> To Party (Supplier)
          fromId = tx.payment_ledger_id || tx.paymentLedgerId || tx.from_ledger_id || tx.fromLedgerId;
          toId = tx.party_ledger_id || tx.partyLedgerId || tx.to_ledger_id || tx.toLedgerId;

          fromName =
            tx.payment_ledger?.name ||
            tx.payment_ledger?.title ||
            tx.from_ledger?.name ||
            tx.fromLedger?.name ||
            getLedgerNameFast(fromId);

          toName =
            tx.party_ledger?.name ||
            tx.party_ledger?.partyName ||
            tx.party_ledger?.party_name ||
            tx.to_ledger?.name ||
            tx.toLedger?.name ||
            getLedgerNameFast(toId);
        } else {
          // Contra / Transfer / Journal
          fromId = tx.from_ledger_id || tx.fromLedgerId || tx.payment_ledger_id || tx.paymentLedgerId;
          toId = tx.to_ledger_id || tx.toLedgerId || tx.party_ledger_id || tx.partyLedgerId;

          fromName =
            tx.from_ledger?.name ||
            tx.from_ledger?.partyName ||
            tx.fromLedger?.name ||
            tx.payment_ledger?.name ||
            getLedgerNameFast(fromId);

          toName =
            tx.to_ledger?.name ||
            tx.to_ledger?.partyName ||
            tx.toLedger?.name ||
            tx.party_ledger?.name ||
            getLedgerNameFast(toId);
        }

        const rawDate = tx.transaction_date || tx.date || tx.created_at;
        const dObj = rawDate ? new Date(rawDate) : null;
        const dateFormatted = dObj && !isNaN(dObj.getTime())
          ? `${String(dObj.getDate()).padStart(2, "0")}/${String(dObj.getMonth() + 1).padStart(2, "0")}/${dObj.getFullYear()}`
          : rawDate || "—";
        const dateTimestamp = dObj && !isNaN(dObj.getTime()) ? dObj.getTime() : 0;

        const projId = tx.project_id || tx.siteProjectId;
        const siteName = projId ? getSiteNameFast(projId) : "";
        const linkedInv = getLinkedInvoiceFast(tx);
        const isUnlinked = !linkedInv && !tx.invoice_id && !tx.invoiceId && !tx.linked_invoice_id;
        const amount = Number(tx.amount || 0);

        return {
          ...tx,
          typeStr,
          isIn,
          isOut,
          fromName,
          toName,
          dateFormatted,
          dateTimestamp,
          projId,
          siteName,
          linkedInv,
          isUnlinked,
          amount,
        };
      });
  }, [ledgerTransactions, getLedgerNameFast, getSiteNameFast, getLinkedInvoiceFast]);

  // KPI calculations
  const { totalTxCount, totalVolume, siteLinkedCount, creditTotal } = useMemo(() => {
    let vol = 0;
    let siteCnt = 0;
    let crTot = 0;

    normalizedTransactions.forEach((tx) => {
      vol += Math.abs(tx.amount);
      if (tx.projId) siteCnt += 1;
      if (tx.isIn) crTot += Math.abs(tx.amount);
    });

    return {
      totalTxCount: normalizedTransactions.length,
      totalVolume: vol,
      siteLinkedCount: siteCnt,
      creditTotal: crTot,
    };
  }, [normalizedTransactions]);

  // Filtered list
  const filteredTransactions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return normalizedTransactions.filter((tx) => {
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "payment_in" && tx.isIn) ||
        (activeFilter === "payment_out" && !tx.isIn);

      const matchesSearch =
        query === "" ||
        tx.fromName.toLowerCase().includes(query) ||
        tx.toName.toLowerCase().includes(query) ||
        (tx.remark || "").toLowerCase().includes(query) ||
        (tx.transaction_number || tx.number || "").toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [normalizedTransactions, activeFilter, searchQuery]);

  // Sorted list
  const sortedTransactions = useMemo(() => {
    if (!sortConfig.key) return filteredTransactions;
    return [...filteredTransactions].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortConfig.key) {
        case "date":
          aVal = a.dateTimestamp;
          bVal = b.dateTimestamp;
          break;
        case "transaction_number":
          aVal = String(a.transaction_number || a.number || "").toLowerCase();
          bVal = String(b.transaction_number || b.number || "").toLowerCase();
          break;
        case "fromLedger":
          aVal = a.fromName.toLowerCase();
          bVal = b.fromName.toLowerCase();
          break;
        case "toLedger":
          aVal = a.toName.toLowerCase();
          bVal = b.toName.toLowerCase();
          break;
        case "type":
          aVal = a.typeStr;
          bVal = b.typeStr;
          break;
        case "amount":
          aVal = a.amount;
          bVal = b.amount;
          break;
        case "site":
          aVal = a.siteName.toLowerCase();
          bVal = b.siteName.toLowerCase();
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

  const getTypeBadge = (isIn: boolean) => {
    if (isIn) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
          Payment In
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
        Payment Out
      </span>
    );
  };

  return (
    <PermissionGuard module="Ledger">
      <div className="flex-1 min-h-0 flex flex-col gap-4 select-none gi-page">
        {/* Page Header */}
        <div className="shrink-0 flex items-center justify-between border-b gi-divider pb-3">
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
            <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
              Payment History
            </h1>
          </div>
        </div>

        {/* Summary KPI Cards Row */}
        <div className="grid shrink-0 grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl border gi-border gi-card shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium gi-text-muted uppercase tracking-wider">
                Total Volume
              </p>
              <p className="text-base sm:text-xl font-bold font-mono gi-text-primary mt-0.5">
                ₹{totalVolume.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <span className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xl shrink-0">
              <IoSwapHorizontalOutline />
            </span>
          </div>

          <div className="p-3.5 rounded-2xl border gi-border gi-card shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium gi-text-muted uppercase tracking-wider">
                Transactions
              </p>
              <p className="text-base sm:text-xl font-bold font-mono gi-text-primary mt-0.5">
                {totalTxCount}
              </p>
            </div>
            <span className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xl shrink-0">
              <IoLayersOutline />
            </span>
          </div>

          <div className="p-3.5 rounded-2xl border gi-border gi-card shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium gi-text-muted uppercase tracking-wider">
                Site Linked
              </p>
              <p className="text-base sm:text-xl font-bold font-mono gi-text-primary mt-0.5">
                {siteLinkedCount}
              </p>
            </div>
            <span className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 text-xl shrink-0">
              <IoLocationOutline />
            </span>
          </div>

          <div className="p-3.5 rounded-2xl border gi-border gi-card shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium gi-text-muted uppercase tracking-wider">
                Collected (In)
              </p>
              <p className="text-base sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                ₹{creditTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <span className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xl shrink-0">
              <IoWalletOutline />
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 gi-text-muted text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ledger, transaction or remark..."
              className="w-full h-9 pl-9 pr-3 rounded-xl gi-input text-xs outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <IoClose className="text-sm" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <FilterTabs
            options={[
              { id: "all", label: "All" },
              { id: "payment_out", label: "Paid (Out)" },
              { id: "payment_in", label: "Collected (In)" },
            ]}
            activeId={activeFilter}
            onChange={setActiveFilter}
            layoutId="paymentHistoryFilterPill"
            className="sm:ml-auto"
          />
        </div>

        {/* Mobile View (< 768px) */}
        <div className="block md:hidden space-y-2.5 shrink-0">
          {isLoading ? (
            <SkeletonCard count={5} />
          ) : sortedTransactions.length === 0 ? (
            <div className="py-12 text-center gi-card text-xs gi-text-muted rounded-2xl border gi-border">
              No transactions found matching your criteria.
            </div>
          ) : (
            sortedTransactions.map((tx) => {
              const targetId = tx.payment_id || tx.paymentId || tx.id;
              const mainLedgerName = tx.isIn ? tx.fromName : tx.toName;

              return (
                <div
                  key={tx.id}
                  onClick={() => {
                    if (targetId) router.push(`/paymentDetails/${targetId}?from=/paymentHistory`);
                  }}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs flex items-center justify-between gap-3 cursor-pointer hover:border-slate-300 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-base font-bold ${
                        tx.isIn
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50"
                          : "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50"
                      }`}
                    >
                      {tx.isIn ? <IoArrowDownOutline /> : <IoArrowUpOutline />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                          {mainLedgerName}
                        </h3>
                        {getTypeBadge(tx.isIn)}
                      </div>
                      <p className="text-[11px] gi-text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{tx.dateFormatted}</span>
                        {(tx.transaction_number || tx.number) && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[10px] font-semibold text-slate-500">
                              {tx.transaction_number || tx.number}
                            </span>
                          </>
                        )}
                        {tx.siteName && (
                          <>
                            <span>•</span>
                            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                              {tx.siteName}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p
                        className={`font-mono font-bold text-xs ${
                          tx.isIn ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {tx.isIn ? "+" : "-"}₹{Math.abs(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    {tx.isUnlinked && hasPermission("Ledger", "Delete") && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTxToDelete(tx);
                        }}
                        className="gi-action-btn-delete"
                        title="Delete Unlinked Transaction"
                      >
                        <IoTrashOutline className="text-sm" />
                      </button>
                    )}
                    {hasPermission("Ledger", "Edit") && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (tx.typeStr === "payment_in" || tx.typeStr === "payment_out" || tx.typeStr === "credit" || tx.typeStr === "debit") {
                            router.push(`/payment/receivedPayment?id=${tx.id}&type=${tx.isIn ? "credit" : "debit"}`);
                          } else {
                            router.push(`/addLedgerTransaction?id=${tx.id}`);
                          }
                        }}
                        className="gi-action-btn-edit"
                        title="Edit Transaction"
                      >
                        <IoPencilOutline className="text-sm" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View (>= 768px) */}
        <div className="hidden md:flex flex-1 min-h-0 flex-col bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-10">
                <tr>
                  {[
                    { key: "date", label: "Date", align: "left" },
                    { key: "fromLedger", label: "From Ledger", align: "left" },
                    { key: "toLedger", label: "To Ledger", align: "left" },
                    { key: "type", label: "Type", align: "left" },
                    { key: "amount", label: "Amount", align: "right" },
                    { key: "site", label: "Site / Project", align: "left" },
                    { key: "linkedInvoice", label: "Linked Invoice", align: "left" },
                  ].map((col, idx) => {
                    const isActive = sortConfig.key === col.key;
                    return (
                      <th
                        key={idx}
                        onClick={() => handleSort(col.key)}
                        className={`py-3 px-3 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-zinc-800 transition text-${col.align}`}
                      >
                        <div
                          className={`flex items-center gap-1 ${
                            col.align === "right" ? "justify-end" : "justify-start"
                          }`}
                        >
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
                  <th className="py-3 px-3">Remark</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-3 px-3"><SkeletonBox className="h-4 w-20" /></td>
                      <td className="py-3 px-3"><SkeletonBox className="h-4 w-28" /></td>
                      <td className="py-3 px-3"><SkeletonBox className="h-4 w-28" /></td>
                      <td className="py-3 px-3"><SkeletonBox className="h-5 w-20" /></td>
                      <td className="py-3 px-3 text-right"><SkeletonBox className="h-4 w-20 ml-auto" /></td>
                      <td className="py-3 px-3"><SkeletonBox className="h-4 w-24" /></td>
                      <td className="py-3 px-3"><SkeletonBox className="h-4 w-20" /></td>
                      <td className="py-3 px-3"><SkeletonBox className="h-4 w-24" /></td>
                      <td className="py-3 px-3 text-center"><SkeletonBox className="h-6 w-16 mx-auto" /></td>
                    </tr>
                  ))
                ) : sortedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center gi-text-muted text-xs">
                      No payment transactions found matching your search.
                    </td>
                  </tr>
                ) : (
                  sortedTransactions.map((tx) => {
                    const proofImg = tx.proof_image || tx.imageProof;

                    return (
                      <tr
                        key={tx.id}
                        onClick={() => {
                          const targetId = tx.payment_id || tx.paymentId || tx.id;
                          if (targetId) router.push(`/paymentDetails/${targetId}?from=/paymentHistory`);
                        }}
                        className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition cursor-pointer"
                      >
                        <td className="py-3 px-3 font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {tx.dateFormatted}
                        </td>
                        <td className="py-3 px-3 font-semibold gi-text-primary max-w-[140px] truncate" title={tx.fromName}>
                          {tx.fromName}
                        </td>
                        <td className="py-3 px-3 font-semibold gi-text-primary max-w-[140px] truncate" title={tx.toName}>
                          {tx.toName}
                        </td>
                        <td className="py-3 px-3 shrink-0">
                          {getTypeBadge(tx.isIn)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-xs whitespace-nowrap">
                          <span className={tx.isIn ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                            {tx.isIn ? "+" : "-"}₹{Math.abs(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-[120px] truncate" title={tx.siteName || ""}>
                          {tx.siteName ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 truncate">
                              <IoLocationOutline className="text-xs shrink-0" />
                              <span className="truncate">{tx.siteName}</span>
                            </span>
                          ) : (
                            <span className="gi-text-muted text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 max-w-[120px] truncate" onClick={(e) => e.stopPropagation()}>
                          {tx.linkedInv ? (
                            tx.linkedInv.id ? (
                              <Link
                                href={`/invoiceDetails/${tx.linkedInv.id}`}
                                className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 truncate"
                                title={tx.linkedInv.number}
                              >
                                <IoReceiptOutline className="text-xs shrink-0" />
                                <span className="truncate">{tx.linkedInv.number}</span>
                              </Link>
                            ) : (
                              <span className="font-mono text-xs font-medium gi-text-primary truncate" title={tx.linkedInv.number}>
                                {tx.linkedInv.number}
                              </span>
                            )
                          ) : (
                            <span className="gi-text-muted text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-xs max-w-[150px] truncate gi-text-secondary" title={tx.remark || ""}>
                          {tx.remark ? (
                            <span className="truncate block">{tx.remark}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {proofImg && (
                              <button
                                type="button"
                                onClick={() => setSelectedProofImg(proofImg)}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                                title="View Proof Image"
                              >
                                <IoEyeOutline className="text-sm" />
                              </button>
                            )}

                            {tx.isUnlinked && hasPermission("Ledger", "Delete") && (
                              <button
                                type="button"
                                onClick={() => setTxToDelete(tx)}
                                className="gi-action-btn-delete"
                                title="Delete Unlinked Transaction"
                              >
                                <IoTrashOutline className="text-sm" />
                              </button>
                            )}

                            {hasPermission("Ledger", "Edit") && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (tx.typeStr === "payment_in" || tx.typeStr === "payment_out" || tx.typeStr === "credit" || tx.typeStr === "debit") {
                                    router.push(`/payment/receivedPayment?id=${tx.id}&type=${tx.isIn ? "credit" : "debit"}`);
                                  } else {
                                    router.push(`/addLedgerTransaction?id=${tx.id}`);
                                  }
                                }}
                                className="gi-action-btn-edit"
                                title="Edit Transaction"
                              >
                                <IoPencilOutline className="text-sm" />
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
                Are you sure you want to delete this transaction of <strong className="gi-text-primary">₹{Math.abs(Number(txToDelete.amount || 0)).toLocaleString("en-IN")}</strong>? This will automatically reverse ledger balance updates.
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

        {/* Proof Image Modal */}
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
