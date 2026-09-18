"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IoAdd,
  IoSearch,
  IoPeopleOutline,
  IoCallOutline,
  IoChevronForward,
  IoMailOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoSwapVerticalOutline,
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";
import { useDebounce } from "@/hooks/useDebounce";
import PermissionGuard from "./PermissionGuard";
import PaginationControls from "./PaginationControls";

export default function Parties() {
  const router = useRouter();
  const { parties = [], hasPermission } = useApp();

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

  const { totalReceivables, totalPayables } = useMemo(() => {
    let rec = 0;
    let pay = 0;
    parties.forEach((p) => {
      const bal = Number(p.closingBalance || 0);
      if (bal > 0) rec += bal;
      else if (bal < 0) pay += Math.abs(bal);
    });
    return { totalReceivables: rec, totalPayables: pay };
  }, [parties]);

  const filteredParties = useMemo(() => {
    const query = debouncedSearch.toLowerCase().trim();

    return parties.filter((party) => {
      const matchesSearch =
        query === "" ||
        party.partyName?.toLowerCase().includes(query) ||
        party.phone?.includes(query) ||
        party.gstNumber?.toLowerCase().includes(query);

      const matchesFilter =
        activeFilter === "all"
          ? true
          : activeFilter === "customers"
          ? party.partyType === "Customer"
          : activeFilter === "suppliers"
          ? party.partyType === "Supplier"
          : party.partyType === "Other";

      return matchesFilter && matchesSearch;
    });
  }, [parties, activeFilter, debouncedSearch]);

  const sortedParties = useMemo(() => {
    if (!sortConfig.key) return filteredParties;
    return [...filteredParties].sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case "partyName":
          aVal = (a.partyName || "").toLowerCase();
          bVal = (b.partyName || "").toLowerCase();
          break;
        case "partyType":
          aVal = (a.partyType || "Customer").toLowerCase();
          bVal = (b.partyType || "Customer").toLowerCase();
          break;
        case "phone":
          aVal = (a.phone || a.mobile || "").toLowerCase();
          bVal = (b.phone || b.mobile || "").toLowerCase();
          break;
        case "gstNumber":
          aVal = (a.gstNumber || a.gstin || "").toLowerCase();
          bVal = (b.gstNumber || b.gstin || "").toLowerCase();
          break;
        case "closingBalance":
          aVal = Number(a.closingBalance || 0);
          bVal = Number(b.closingBalance || 0);
          break;
        default:
          return 0;
      }
      if (typeof aVal === "string") {
        return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [filteredParties, sortConfig]);

  return (
    <PermissionGuard module="Ledger">
      <div className="space-y-5 select-none gi-page">
        {/* Page Heading & Action Button */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
              Parties
            </h1>
            <p className="text-xs gi-text-secondary mt-0.5">
              Manage customers, suppliers, vendors, and party balances
            </p>
          </div>

          {hasPermission("Ledger", "Create") && (
            <Link href="/addParty" className="shrink-0">
              <button
                type="button"
                className="px-3.5 py-2 rounded-lg gi-btn-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer whitespace-nowrap"
              >
                <IoAdd className="text-base" />
                <span>Add Party</span>
              </button>
            </Link>
          )}
        </div>

        {/* Financial Balance Summaries */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold gi-text-secondary">
                Total Customer Receivables (To Receive)
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono mt-1" style={{ color: "var(--gi-success)" }}>
                ₹{Number(totalReceivables).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <span className="p-2 rounded-lg gi-badge-success text-xl">
              <IoPeopleOutline />
            </span>
          </div>

          <div className="p-4 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold gi-text-secondary">
                Total Supplier Payables (To Pay)
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono mt-1" style={{ color: "var(--gi-danger)" }}>
                ₹{Number(totalPayables).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <span className="p-2 rounded-lg gi-badge-danger text-xl">
              <IoPeopleOutline />
            </span>
          </div>
        </div>

        {/* Search & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search party name, mobile, GSTIN..."
              className="w-full h-9 pl-9 pr-4 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs focus:outline-none focus:border-indigo-500 transition shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex items-center gap-1 p-1 rounded-xl gi-card shadow-xs">
              {[
                { id: "all", label: "All Parties" },
                { id: "customers", label: "Customers" },
                { id: "suppliers", label: "Suppliers" },
                { id: "other", label: "Others" },
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

        {/* Parties List Grid */}
        <div className="gi-table-container shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs gi-table border-collapse">
              <thead>
                <tr>
                  {[
                    { key: "partyName", label: "Party Name", align: "left" },
                    { key: "partyType", label: "Type", align: "left" },
                    { key: "phone", label: "Mobile / Contact", align: "left" },
                    { key: "gstNumber", label: "GSTIN", align: "left" },
                    { key: "closingBalance", label: "Closing Balance", align: "right" },
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
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y gi-divider">
                {sortedParties.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center gi-text-muted text-xs">
                      No parties found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  sortedParties.map((party) => {
                    const balance = Number(party.closingBalance || 0);
                    const isReceive = balance > 0;
                    const isPay = balance < 0;

                    return (
                      <tr
                        key={party.id}
                        onClick={() => router.push(`/parties/${party.id}`)}
                        className="hover:bg-[var(--gi-hover)] transition cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-md gi-badge-info font-bold text-xs flex items-center justify-center shrink-0">
                              {party.partyName?.charAt(0) || "P"}
                            </div>
                            <div className="min-w-0">
                              <p className="gi-mob-primary font-semibold gi-text-primary">{party.partyName}</p>
                              <div className="gi-mob-secondary">
                                <span className="gi-badge-info px-1 py-0 rounded text-[9px] font-bold uppercase">{party.partyType || "Customer"}</span>
                                {party.phone && <><span className="gi-text-muted">·</span><span>{party.phone}</span></>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-badge-info">
                            {party.partyType || "Customer"}
                          </span>
                        </td>
                        <td className="py-3 px-4 gi-text-secondary">
                          {party.phone ? (
                            <span className="flex items-center gap-1 font-mono">
                              <IoCallOutline className="gi-text-muted text-xs" /> {party.phone}
                            </span>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono gi-text-muted">
                          {party.gstNumber || "Unregistered"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span
                            style={{
                              color: isReceive
                                ? "var(--gi-success)"
                                : isPay
                                ? "var(--gi-danger)"
                                : "var(--gi-text-secondary)",
                            }}
                          >
                            ₹{Math.abs(balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] block font-semibold text-slate-400">
                            {isReceive ? "To Receive" : isPay ? "To Pay" : "Settled"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => router.push(`/parties/${party.id}`)}
                            className="p-1.5 rounded-md hover:bg-[var(--gi-hover)] gi-text-secondary transition"
                            title="View Ledger Details"
                          >
                            <IoChevronForward className="text-base" />
                          </button>
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
