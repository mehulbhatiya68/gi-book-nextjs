"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IoAdd,
  IoSearch,
  IoSwapHorizontalOutline,
  IoLocationOutline,
  IoImageOutline,
  IoClose,
  IoWalletOutline,
  IoEyeOutline,
  IoLayersOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoSwapVerticalOutline,
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";
import PermissionGuard from "./PermissionGuard";
import PaginationControls from "./PaginationControls";

export default function LedgerTransactionsView() {
  const router = useRouter();
  const { ledgerTransactions = [], ledgers = [], siteProjects = [], hasPermission } = useApp();

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProofImg, setSelectedProofImg] = useState(null);
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

  const getLedgerName = (id) => {
    const l = ledgers.find((item) => String(item.id) === String(id));
    return l ? l.name : String(id || "N/A");
  };

  const getSiteName = (id) => {
    const s = siteProjects.find((item) => String(item.id) === String(id));
    return s ? (s.siteName || s.name) : String(id || "N/A");
  };

  const { totalTxCount, totalVolume, siteLinkedCount, debitTotal, creditTotal } = useMemo(() => {
    let vol = 0;
    let siteCnt = 0;
    let drTot = 0;
    let crTot = 0;

    ledgerTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      vol += amt;

      if (tx.hasSiteProject && tx.siteProjectId) {
        siteCnt += 1;
      }

      if (tx.transactionType === "Credit") {
        crTot += amt;
      } else {
        drTot += amt;
      }
    });

    return {
      totalTxCount: ledgerTransactions.length,
      totalVolume: vol,
      siteLinkedCount: siteCnt,
      debitTotal: drTot,
      creditTotal: crTot,
    };
  }, [ledgerTransactions]);

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return ledgerTransactions.filter((tx) => {
      const fromName = getLedgerName(tx.fromLedgerId).toLowerCase();
      const toName = getLedgerName(tx.toLedgerId).toLowerCase();
      const remarkStr = (tx.remark || "").toLowerCase();
      const typeStr = (tx.transactionType || "Debit").toLowerCase();

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "debit" && typeStr === "debit") ||
        (activeFilter === "credit" && typeStr === "credit") ||
        (activeFilter === "sitelinked" && tx.hasSiteProject && tx.siteProjectId);

      const matchesSearch =
        query === "" ||
        fromName.includes(query) ||
        toName.includes(query) ||
        remarkStr.includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [ledgerTransactions, activeFilter, searchQuery, ledgers]);

  const sortedTransactions = useMemo(() => {
    if (!sortConfig.key) return filteredTransactions;
    return [...filteredTransactions].sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case "date":
          aVal = new Date(a.date || 0).getTime();
          bVal = new Date(b.date || 0).getTime();
          break;
        case "fromLedger":
          aVal = getLedgerName(a.fromLedgerId).toLowerCase();
          bVal = getLedgerName(b.fromLedgerId).toLowerCase();
          break;
        case "toLedger":
          aVal = getLedgerName(a.toLedgerId).toLowerCase();
          bVal = getLedgerName(b.toLedgerId).toLowerCase();
          break;
        case "type":
          aVal = (a.transactionType || "Debit").toLowerCase();
          bVal = (b.transactionType || "Debit").toLowerCase();
          break;
        case "amount":
          aVal = Number(a.amount || 0);
          bVal = Number(b.amount || 0);
          break;
        case "site":
          aVal = getSiteName(a.siteProjectId).toLowerCase();
          bVal = getSiteName(b.siteProjectId).toLowerCase();
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



  return (
    <PermissionGuard module="Ledger">
      <div className="space-y-5 select-none gi-page">
        {/* Page Heading & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b gi-divider pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
              Ledger Transactions
            </h1>
            <p className="text-xs gi-text-secondary mt-0.5">
              Record bank/cash transfers and ledger adjustments
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/ledgers">
              <button
                type="button"
                className="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition gi-surface-interactive cursor-pointer gi-text-primary shrink-0"
              >
                <IoWalletOutline className="text-base" />
                <span>View Ledgers</span>
              </button>
            </Link>

            {hasPermission("Ledger", "Create") && (
              <Link href="/addLedgerTransaction">
                <button
                  type="button"
                  className="px-3.5 py-2 rounded-lg gi-btn-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <IoAdd className="text-base" />
                  <span>Add Transaction</span>
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Summary KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold gi-text-secondary">
                Total Transferred Volume
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono gi-text-primary mt-1">
                ₹{totalVolume.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <span className="p-2 rounded-lg gi-badge-info text-lg">
              <IoSwapHorizontalOutline />
            </span>
          </div>

          <div className="p-4 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold gi-text-secondary">
                Total Transactions
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono gi-text-primary mt-1">
                {totalTxCount}
              </p>
              <p className="text-[10px] gi-text-muted mt-0.5">Recorded in system</p>
            </div>
            <span className="p-2 rounded-lg gi-badge-info text-lg">
              <IoLayersOutline />
            </span>
          </div>

          <div className="p-4 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold gi-text-secondary">
                Site / Project Linked
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono gi-text-primary mt-1">
                {siteLinkedCount}
              </p>
              <p className="text-[10px] gi-text-muted mt-0.5">Tagged to active site</p>
            </div>
            <span className="p-2 rounded-lg gi-badge-success text-lg">
              <IoLocationOutline />
            </span>
          </div>

          <div className="p-4 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold gi-text-secondary">
                Total Credit Value
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{creditTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <span className="p-2 rounded-lg gi-badge-success text-lg">
              <IoWalletOutline />
            </span>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl gi-card shadow-xs">
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: "all", label: "All Transactions" },
              { id: "debit", label: "Debit" },
              { id: "credit", label: "Credit" },
              { id: "sitelinked", label: "Site Linked" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs transition cursor-pointer whitespace-nowrap ${activeFilter === tab.id
                    ? "gi-filter-active"
                    : "gi-filter-inactive font-medium"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 gi-text-muted text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ledger or remark..."
              className="w-full h-8 pl-8 pr-3 rounded-lg gi-input text-xs outline-none transition"
            />
          </div>
        </div>

        {/* Transactions Data Table */}
        <div className="gi-table-container shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs gi-table border-collapse">
              <thead>
                <tr>
                  {[
                    { key: "date", label: "Date & Time", align: "left" },
                    { key: "fromLedger", label: "From Ledger", align: "left" },
                    { key: "toLedger", label: "To Ledger", align: "left" },
                    { key: "type", label: "Type", align: "left" },
                    { key: "amount", label: "Amount", align: "right" },
                    { key: "site", label: "Site / Project", align: "left" },
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
                  <th className="py-3 px-4">Remark</th>
                  <th className="py-3 px-4 text-center">Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y gi-divider">
                {sortedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center gi-text-muted text-xs">
                      No ledger transactions found. Click &quot;Add Transaction&quot; to record a new ledger transfer.
                    </td>
                  </tr>
                ) : (
                  sortedTransactions.map((tx) => {
                    const isCredit = tx.transactionType === "Credit";
                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-[var(--gi-hover)] transition cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold gi-text-primary">{tx.date}</div>
                          <div className="text-[10px] gi-text-muted">{tx.time || ""}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-rose-600 dark:text-rose-400">
                          {getLedgerName(tx.fromLedgerId)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                          {getLedgerName(tx.toLedgerId)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isCredit ? "gi-badge-success" : "gi-badge-danger"
                              }`}
                          >
                            {tx.transactionType || "Debit"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold gi-text-primary text-xs">
                          ₹{Number(tx.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4">
                          {tx.hasSiteProject && tx.siteProjectId ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium gi-text-primary">
                              <IoLocationOutline className="text-xs text-indigo-500 shrink-0" />
                              <span>{getSiteName(tx.siteProjectId)}</span>
                            </span>
                          ) : (
                            <span className="gi-text-muted text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs max-w-xs truncate gi-text-secondary" title={tx.remark || ""}>
                          {tx.remark || "—"}
                        </td>
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          {tx.imageProof ? (
                            <button
                              type="button"
                              onClick={() => setSelectedProofImg(tx.imageProof)}
                              className="p-1.5 rounded-md gi-badge-info transition inline-flex items-center gap-1 text-xs font-semibold"
                              title="View Proof Image"
                            >
                              <IoEyeOutline className="text-xs" />
                              <span>Proof</span>
                            </button>
                          ) : (
                            <span className="gi-text-muted text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

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
