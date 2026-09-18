"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IoAdd,
  IoSearch,
  IoWalletOutline,
  IoBusinessOutline,
  IoCashOutline,
  IoReceiptOutline,
  IoOptionsOutline,
  IoSwapHorizontalOutline,
  IoArrowForward,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoSwapVerticalOutline,
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";
import PermissionGuard from "./PermissionGuard";

export default function LedgersView() {
  const router = useRouter();
  const { ledgers = [], hasPermission } = useApp();

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
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

  const { bankBalance, cashBalance, expenseTotal, bankCount, cashCount, expenseCount, othersCount } = useMemo(() => {
    let bBal = 0;
    let cBal = 0;
    let eTotal = 0;
    let bCnt = 0;
    let cCnt = 0;
    let eCnt = 0;
    let oCnt = 0;

    ledgers.forEach((l) => {
      const type = (l.type || "").toLowerCase();
      const bal = Number(l.closingBalance !== undefined ? l.closingBalance : l.openingBalance || 0);

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
        (activeFilter === "others" && typeStr === "others");

      const matchesSearch = query === "" || nameStr.includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [ledgers, activeFilter, searchQuery]);

  const sortedLedgers = useMemo(() => {
    if (!sortConfig.key) return filteredLedgers;
    return [...filteredLedgers].sort((a, b) => {
      let aVal, bVal;
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
          aVal = Number(a.openingBalance || 0);
          bVal = Number(b.openingBalance || 0);
          break;
        case "closingBalance":
          aVal = Number(a.closingBalance !== undefined ? a.closingBalance : a.openingBalance || 0);
          bVal = Number(b.closingBalance !== undefined ? b.closingBalance : b.openingBalance || 0);
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

  const getTypeBadge = (type) => {
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
    return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-surface-secondary border gi-border gi-text-secondary">{type || "Others"}</span>;
  };

  return (
    <PermissionGuard module="Ledger">
      <div className="space-y-5 select-none gi-page">
        {/* Page Heading & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b gi-divider pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
              Ledgers
            </h1>
            <p className="text-xs gi-text-secondary mt-0.5">
              Manage bank accounts, cash registers, and expense ledgers
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/ledgerTransactions">
              <button
                type="button"
                className="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition gi-surface-interactive cursor-pointer gi-text-primary shrink-0"
              >
                <IoSwapHorizontalOutline className="text-base" />
                <span>Ledger Transfers</span>
              </button>
            </Link>

            {hasPermission("Ledger", "Create") && (
              <Link href="/addLedger">
                <button
                  type="button"
                  className="px-3.5 py-2 rounded-lg gi-btn-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <IoAdd className="text-base" />
                  <span>Create Ledger</span>
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
                Bank Ledgers Balance
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono gi-text-primary mt-1">
                ₹{bankBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] gi-text-muted mt-0.5">{bankCount} Bank Account{bankCount !== 1 ? "s" : ""}</p>
            </div>
            <span className="p-2 rounded-lg gi-badge-info text-lg">
              <IoBusinessOutline />
            </span>
          </div>

          <div className="p-4 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold gi-text-secondary">
                Cash Ledgers Balance
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono gi-text-primary mt-1">
                ₹{cashBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] gi-text-muted mt-0.5">{cashCount} Cash Account{cashCount !== 1 ? "s" : ""}</p>
            </div>
            <span className="p-2 rounded-lg gi-badge-success text-lg">
              <IoCashOutline />
            </span>
          </div>

          <div className="p-4 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold gi-text-secondary">
                Expense Ledgers Total
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono gi-text-primary mt-1">
                ₹{expenseTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] gi-text-muted mt-0.5">{expenseCount} Expense Account{expenseCount !== 1 ? "s" : ""}</p>
            </div>
            <span className="p-2 rounded-lg gi-badge-warning text-lg">
              <IoReceiptOutline />
            </span>
          </div>

          <div className="p-4 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold gi-text-secondary">
                Total Active Ledgers
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono gi-text-primary mt-1">
                {ledgers.length}
              </p>
              <p className="text-[10px] gi-text-muted mt-0.5">Created by user</p>
            </div>
            <span className="p-2 rounded-lg gi-badge-info text-lg">
              <IoWalletOutline />
            </span>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl gi-card shadow-xs">
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: "all", label: "All Ledgers" },
              { id: "bank", label: "Bank" },
              { id: "cash", label: "Cash" },
              { id: "expense", label: "Expense" },
              { id: "others", label: "Others" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs transition cursor-pointer whitespace-nowrap ${
                  activeFilter === tab.id
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
              placeholder="Search ledger by name..."
              className="w-full h-8 pl-8 pr-3 rounded-lg gi-input text-xs outline-none transition"
            />
          </div>
        </div>

        {/* Ledgers Data Table */}
        <div className="gi-table-container shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs gi-table border-collapse">
              <thead>
                <tr>
                  {[
                    { key: "name", label: "Ledger Name", align: "left" },
                    { key: "type", label: "Type", align: "left" },
                    { key: "openingBalance", label: "Opening Balance", align: "right" },
                    { key: "closingBalance", label: "Current Balance", align: "right" },
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
                {sortedLedgers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center gi-text-muted text-xs">
                      No ledgers found. Click &quot;Create Ledger&quot; to add your first account.
                    </td>
                  </tr>
                ) : (
                  sortedLedgers.map((l) => {
                    const currentBal = Number(l.closingBalance !== undefined ? l.closingBalance : l.openingBalance || 0);
                    return (
                      <tr
                        key={l.id}
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
                                <span>₹{currentBal.toLocaleString("en-IN")}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getTypeBadge(l.type)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono gi-text-secondary">
                          ₹{Number(l.openingBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold gi-text-primary">
                          ₹{currentBal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <Link href="/addLedgerTransaction">
                            <button
                              type="button"
                              className="p-1.5 rounded-md gi-badge-info transition inline-flex items-center gap-1 text-xs font-semibold"
                              title="Transfer Funds"
                            >
                              <span>Transfer</span>
                              <IoArrowForward className="text-xs" />
                            </button>
                          </Link>
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
