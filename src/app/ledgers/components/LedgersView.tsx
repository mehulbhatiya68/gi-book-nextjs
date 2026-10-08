"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IoAdd,
  IoSearch,
  IoWalletOutline,
  IoBusinessOutline,
  IoCashOutline,
  IoReceiptOutline,
  IoSwapHorizontalOutline,
  IoArrowForward,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoSwapVerticalOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoClose,
} from "react-icons/io5";
import { useAuth } from "@/context/AuthContext";
import { usePreferences } from "@/lib/hooks/usePreferences";
import { ledgerApi } from "@/lib/api/ledger";
import { partyApi } from "@/lib/api/party";
import PermissionGuard from "@/components/PermissionGuard";
import { SkeletonCard, SkeletonBox } from "@/components/Skeleton";
import { toast } from "react-toastify";
import { useMinimumLoading } from "@/lib/hooks/useMinimumLoading";
import SmoothTransition from "@/components/SmoothTransition";

export default function LedgersView() {
  const router = useRouter();
  const { activeBusiness, hasPermission } = useAuth();
  const { t } = usePreferences();

  const [ledgers, setLedgers] = useState<any[]>([]);
  const { isLoading, startLoading, stopLoading } = useMinimumLoading(true, 400);

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" });

  // Modal state for Delete
  const [ledgerToDelete, setLedgerToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLedgers = () => {
    if (activeBusiness?.id) {
      startLoading();
      ledgerApi.getLedgers({ per_page: "all", silentError: true })
        .then((res: any) => {
          const list = Array.isArray(res?.body)
            ? res.body
            : (res?.body?.ledgers || res?.body?.data || (Array.isArray(res) ? res : []));

          const nonPartyLedgers = (Array.isArray(list) ? list : []).filter((l: any) => {
            const t = String(l.type || "").toLowerCase();
            return !["customer", "supplier", "client", "vendor"].includes(t);
          });

          setLedgers(nonPartyLedgers);
        })
        .catch(() => setLedgers([]))
        .finally(() => stopLoading());
    } else {
      setLedgers([]);
      stopLoading();
    }
  };

  useEffect(() => {
    fetchLedgers();
  }, [activeBusiness?.id]);

  const handleDeleteLedger = async () => {
    if (!ledgerToDelete?.id) return;
    setIsDeleting(true);
    try {
      await ledgerApi.deleteLedger(ledgerToDelete.id);
      toast.success("Ledger deleted successfully!");
      setLedgerToDelete(null);
      fetchLedgers();
    } catch (err: any) {
      console.error("Error deleting ledger:", err);
      toast.error(err.message || "Failed to delete ledger.");
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

  const { bankBalance, cashBalance, expenseTotal, bankCount, cashCount, expenseCount, othersCount } = useMemo(() => {
    let bBal = 0;
    let cBal = 0;
    let eTotal = 0;
    let bCnt = 0;
    let cCnt = 0;
    let eCnt = 0;
    let oCnt = 0;

    ledgers.forEach((l: any) => {
      const type = (l.type || "").toLowerCase();
      const bal = Number(l.current_balance ?? l.closingBalance ?? l.opening_balance ?? l.openingBalance ?? 0);

      if (type === "bank") {
        bBal += bal;
        bCnt += 1;
      } else if (type === "cash") {
        cBal += bal;
        cCnt += 1;
      } else if (type === "expense") {
        eTotal += bal;
        eCnt += 1;
      } else {
        oCnt += 1;
      }
    });

    return {
      bankBalance: bBal,
      cashBalance: cBal,
      expenseTotal: eTotal,
      bankCount: bCnt,
      cashCount: cCnt,
      expenseCount: eCnt,
      othersCount: oCnt,
    };
  }, [ledgers]);

  const filteredLedgers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return ledgers.filter((l) => {
      const typeStr = (l.type || "").toLowerCase();
      const nameStr = (l.name || "").toLowerCase();

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "bank" && typeStr === "bank") ||
        (activeFilter === "cash" && typeStr === "cash") ||
        (activeFilter === "expense" && typeStr === "expense") ||
        (activeFilter === "others" && !["bank", "cash", "expense"].includes(typeStr));

      const matchesSearch = query === "" || nameStr.includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [ledgers, activeFilter, searchQuery]);

  const sortedLedgers = useMemo(() => {
    if (!sortConfig.key) return filteredLedgers;
    return [...filteredLedgers].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortConfig.key) {
        case "name":
          aVal = (a.name || "").toLowerCase();
          bVal = (b.name || "").toLowerCase();
          break;
        case "type":
          aVal = (a.type || "").toLowerCase();
          bVal = (b.type || "").toLowerCase();
          break;
        case "openingBalance":
          aVal = Number(a.opening_balance ?? a.openingBalance ?? 0);
          bVal = Number(b.opening_balance ?? b.openingBalance ?? 0);
          break;
        case "closingBalance":
          aVal = Number(a.current_balance ?? a.closingBalance ?? a.opening_balance ?? a.openingBalance ?? 0);
          bVal = Number(b.current_balance ?? b.closingBalance ?? b.opening_balance ?? b.openingBalance ?? 0);
          break;
        default:
          return 0;
      }
      if (typeof aVal === "string") {
        return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [filteredLedgers, sortConfig]);

  const getTypeBadge = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t === "bank") {
      return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-badge-info">Bank</span>;
    }
    if (t === "cash") {
      return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-badge-success">Cash</span>;
    }
    if (t === "expense") {
      return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-badge-warning">Expense</span>;
    }
    if (t === "company" || t === "capital" || t === "equity") {
      return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-badge-info">Company</span>;
    }
    return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-surface-secondary border gi-border gi-text-secondary">{type || "Others"}</span>;
  };

  return (
    <PermissionGuard module="Ledger">
      <div className="space-y-5 gi-page">
        {/* Page Heading & Action Buttons */}
        <div className="flex items-center justify-between gap-3 border-b gi-divider pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold gi-text-primary tracking-tight">
                {t("ledgers")}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold gi-badge-info md:hidden">
                {sortedLedgers.length}
              </span>
            </div>
          </div>

          {hasPermission("Ledger", "Create") && (
            <Link href="/addLedger" className="shrink-0">
              <button
                type="button"
                className="px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-lg gi-btn-primary text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer whitespace-nowrap"
              >
                <IoAdd className="text-base" />
                <span>{t("createLedger")}</span>
              </button>
            </Link>
          )}
        </div>

        {/* Search Control */}
        <div className="relative w-full sm:w-72">
          <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 gi-text-muted text-sm" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ledger by name..."
            className="w-full h-9 pl-9 pr-8 rounded-xl gi-input text-xs font-medium outline-none transition focus:ring-2 focus:ring-indigo-500/20"
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



        {/* Mobile Cards View (< 768px) */}
        <div className="block md:hidden space-y-3">
          {isLoading ? (
            <SkeletonCard count={4} />
          ) : sortedLedgers.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs gi-text-muted font-medium">
              No ledgers found. Click &quot;Create Ledger&quot; to add your first account.
            </div>
          ) : (
            sortedLedgers.map((l: any) => {
              const currentBal = Number(l.current_balance ?? l.closingBalance ?? l.opening_balance ?? l.openingBalance ?? 0);
              const tStr = String(l.type || l.group || l.category || "").toLowerCase().trim();
              const nStr = String(l.name || "").toLowerCase().trim();
              const isComp = tStr === "company" || tStr === "capital" || tStr === "equity" || nStr.includes("company");

              const balColor = currentBal === 0
                ? "gi-text-primary"
                : (currentBal > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400");
              const signPrefix = currentBal > 0 ? "+" : currentBal < 0 ? "-" : "";

              return (
                <div
                  key={l.id}
                  onClick={() => router.push(`/ledgers/${l.id}?from=/ledgers`)}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs flex items-center justify-between gap-3 cursor-pointer hover:border-slate-400/50 active:scale-[0.99] transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 font-bold text-base flex items-center justify-center shrink-0">
                      {l.name?.charAt(0)?.toUpperCase() || "L"}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                        {l.name}
                      </h3>
                      <p className="text-[11px] gi-text-muted mt-0.5 capitalize">
                        {l.type || "Ledger"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`font-mono font-bold text-xs ${balColor}`}>
                      {signPrefix}₹{Math.abs(currentBal).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
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
                    { key: "name", label: t("ledgers"), align: "left" },
                    { key: "type", label: t("type"), align: "left" },
                    { key: "openingBalance", label: t("openingBalance"), align: "right" },
                    { key: "closingBalance", label: t("closingBalance"), align: "right" },
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
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-3 px-4"><SkeletonBox className="h-5 w-36" /></td>
                      <td className="py-3 px-4"><SkeletonBox className="h-5 w-20" /></td>
                      <td className="py-3 px-4"><SkeletonBox className="h-5 w-24 ml-auto" /></td>
                      <td className="py-3 px-4"><SkeletonBox className="h-5 w-24 ml-auto" /></td>
                      <td className="py-3 px-4"><SkeletonBox className="h-5 w-24 ml-auto" /></td>
                    </tr>
                  ))
                ) : sortedLedgers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center gi-text-muted text-xs">
                      No ledgers found. Click &quot;Create Ledger&quot; to add your first account.
                    </td>
                  </tr>
                ) : (
                  sortedLedgers.map((l: any) => {
                    const currentBal = Number(l.current_balance ?? l.closingBalance ?? l.opening_balance ?? l.openingBalance ?? 0);
                    const openBal = Number(l.opening_balance ?? l.openingBalance ?? 0);
                    const tStr = String(l.type || l.group || l.category || "").toLowerCase().trim();
                    const nStr = String(l.name || "").toLowerCase().trim();
                    const isComp = tStr === "company" || tStr === "capital" || tStr === "equity" || nStr.includes("company");
                    const balColor = currentBal === 0
                      ? "gi-text-primary"
                      : (currentBal > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400");
                    const signPrefix = currentBal > 0 ? "+" : currentBal < 0 ? "-" : "";

                    const openBalColor = openBal === 0
                      ? "gi-text-secondary"
                      : (openBal > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400");
                    const openSignPrefix = openBal > 0 ? "+" : openBal < 0 ? "-" : "";

                    return (
                      <tr
                        key={l.id}
                        onClick={() => router.push(`/ledgers/${l.id}?from=/ledgers`)}
                        className="hover:bg-[var(--gi-hover)] transition cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-md gi-badge-info font-bold text-xs flex items-center justify-center shrink-0">
                              {l.name?.charAt(0)?.toUpperCase() || "L"}
                            </div>
                            <div className="min-w-0">
                              <p className="gi-mob-primary font-semibold gi-text-primary">{l.name}</p>
                              <div className="gi-mob-secondary">
                                <span>{l.type || "Cash"}</span>
                                <span className="gi-text-muted">·</span>
                                <span className={balColor}>{signPrefix}₹{Math.abs(currentBal).toLocaleString("en-IN")}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getTypeBadge(l.type)}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono ${openBalColor}`}>
                          {openSignPrefix}₹{Math.abs(openBal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-bold ${balColor}`}>
                          {signPrefix}₹{Math.abs(currentBal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/addLedgerTransaction?ledger_id=${l.id}`}>
                              <button
                                type="button"
                                className="p-1.5 rounded-md gi-badge-info transition inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                                title="Transfer Funds"
                              >
                                <span>Transfer</span>
                                <IoArrowForward className="text-xs" />
                              </button>
                            </Link>

                            {hasPermission("Ledger", "Edit") && (
                              <button
                                type="button"
                                onClick={() => {
                                  const tStr = String(l.type || "").toLowerCase().trim();
                                  const isParty = tStr === "customer" || tStr === "supplier";
                                  router.push(isParty ? `/addParty?id=${l.id}&from=/ledgers` : `/addLedger?id=${l.id}&from=/ledgers`);
                                }}
                                className="gi-action-btn-edit"
                                title="Edit Ledger"
                              >
                                <IoPencilOutline className="text-sm" />
                              </button>
                            )}

                            {hasPermission("Ledger", "Delete") && (
                              <button
                                type="button"
                                onClick={() => setLedgerToDelete(l)}
                                className="gi-action-btn-delete"
                                title="Delete Ledger"
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

        {/* Delete Confirmation Modal */}
        {ledgerToDelete && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative max-w-md w-full gi-card p-6 rounded-2xl shadow-2xl border gi-divider space-y-4">
              <div className="flex items-center justify-between border-b pb-3 gi-divider">
                <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">Delete Ledger</h3>
                <button
                  type="button"
                  onClick={() => setLedgerToDelete(null)}
                  className="p-1 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer"
                >
                  <IoClose className="text-base" />
                </button>
              </div>

              <p className="text-xs gi-text-secondary leading-relaxed">
                Are you sure you want to delete ledger <strong className="gi-text-primary">&quot;{ledgerToDelete.name}&quot;</strong>? This action cannot be undone and will permanently remove this account.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLedgerToDelete(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border gi-surface-interactive gi-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteLedger}
                  disabled={isDeleting}
                  className="gi-btn-delete disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete Ledger"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}

