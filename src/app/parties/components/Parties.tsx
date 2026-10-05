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
import { useAuth } from "@/context/AuthContext";
import { partyApi } from "@/lib/api/party";
import { useDebounce } from "@/hooks/useDebounce";
import PermissionGuard from "@/components/PermissionGuard";
import PaginationControls from "@/components/PaginationControls";
import { SkeletonBox, SkeletonCard } from "@/components/Skeleton";
import FilterTabs from "@/components/FilterTabs";

export default function Parties() {
  const router = useRouter();
  const { activeBusiness, hasPermission } = useAuth();

  const [parties, setParties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    if (activeBusiness?.id) {
      setIsLoading(true);
      partyApi.getParties(activeBusiness.id)
        .then((res: any) => {
          const list = Array.isArray(res?.body)
            ? res.body
            : (res?.body?.data || res?.body?.parties || res?.body?.ledgers || []);
          setParties(Array.isArray(list) ? list : []);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      setParties([]);
    }
  }, [activeBusiness?.id]);

  const { totalReceivables, totalPayables } = useMemo(() => {
    let rec = 0;
    let pay = 0;
    parties.forEach((p: any) => {
      const pType = String(p.type || p.partyType || p.party_type || "").toLowerCase();
      const isSupplier = pType === "supplier" || p.is_supplier === true || p.is_supplier === 1;
      const bal = Math.abs(Number(p.current_balance ?? p.closing_balance ?? p.closingBalance ?? p.net_balance ?? p.balance ?? p.opening_balance ?? 0));
      if (isSupplier) {
        pay += bal;
      } else {
        rec += bal;
      }
    });
    return { totalReceivables: rec, totalPayables: pay };
  }, [parties]);

  const filteredParties = useMemo(() => {
    const query = debouncedSearch.toLowerCase().trim();

    return parties.filter((party: any) => {
      const name = party.name || party.partyName || "";
      const phone = party.contact_number || party.phone || party.mobile || "";
      const gst = party.gst_number || party.gstNumber || party.gstin || "";
      const pType = (party.type || party.partyType || "").toLowerCase();

      const matchesSearch =
        query === "" ||
        name.toLowerCase().includes(query) ||
        phone.includes(query) ||
        gst.toLowerCase().includes(query);

      const matchesFilter =
        activeFilter === "all"
          ? true
          : activeFilter === "customers"
            ? pType === "customer"
            : activeFilter === "suppliers"
              ? pType === "supplier"
              : pType !== "customer" && pType !== "supplier";

      return matchesFilter && matchesSearch;
    });
  }, [parties, activeFilter, debouncedSearch]);

  const sortedParties = useMemo(() => {
    if (!sortConfig.key) return filteredParties;
    return [...filteredParties].sort((a: any, b: any) => {
      let aVal: any, bVal: any;
      switch (sortConfig.key) {
        case "partyName":
          aVal = (a.name || a.partyName || "").toLowerCase();
          bVal = (b.name || b.partyName || "").toLowerCase();
          break;
        case "partyType":
          aVal = (a.type || a.partyType || "customer").toLowerCase();
          bVal = (b.type || b.partyType || "customer").toLowerCase();
          break;
        case "phone":
          aVal = (a.contact_number || a.phone || a.mobile || "").toLowerCase();
          bVal = (b.contact_number || b.phone || b.mobile || "").toLowerCase();
          break;
        case "gstNumber":
          aVal = (a.gst_number || a.gstNumber || a.gstin || "").toLowerCase();
          bVal = (b.gst_number || b.gstNumber || b.gstin || "").toLowerCase();
          break;
        case "closingBalance":
          aVal = Number(a.current_balance ?? a.closingBalance ?? 0);
          bVal = Number(b.current_balance ?? b.closingBalance ?? 0);
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
        <div className="flex items-center justify-between gap-4 pb-3 border-b gi-divider">
          <div>
            <h1 className="text-2xl font-bold gi-text-primary tracking-tight">
              Parties
            </h1>
          </div>

          {hasPermission("Ledger", "Create") && (
            <Link href="/addParty" className="shrink-0">
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-lg gi-btn-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer whitespace-nowrap"
              >
                <IoAdd className="text-base" />
                <span>Add Party</span>
              </button>
            </Link>
          )}
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
              className="w-full h-8 pl-9 pr-4 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs focus:outline-none focus:border-indigo-500 transition shadow-2xs"
            />
          </div>

          {/* Mobile Single Dropdown Filter (renders exactly 1 filter on mobile) */}
          <div className="sm:hidden">
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="w-full h-8 px-3 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs font-semibold focus:outline-none focus:border-indigo-500 shadow-2xs"
            >
              <option value="all">All Parties</option>
              <option value="customers">Customers</option>
              <option value="suppliers">Suppliers</option>
              <option value="other">Others</option>
            </select>
          </div>

          {/* Desktop Filter Pills */}
          <FilterTabs
            options={[
              { id: "all", label: "All Parties" },
              { id: "customers", label: "Customers" },
              { id: "suppliers", label: "Suppliers" },
              { id: "other", label: "Others" },
            ]}
            activeId={activeFilter}
            onChange={setActiveFilter}
            layoutId="partiesFilterPill"
            className="hidden sm:flex sm:ml-auto"
          />
        </div>

        {/* Financial Balance Summaries */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold gi-text-secondary uppercase tracking-wider">
                Customer Receivables (To Receive)
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono mt-0.5" style={{ color: "var(--gi-success)" }}>
                ₹{Number(totalReceivables).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <span className="p-2 rounded-lg gi-badge-success text-lg">
              <IoPeopleOutline />
            </span>
          </div>

          <div className="p-3 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold gi-text-secondary uppercase tracking-wider">
                Supplier Payables (To Pay)
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono mt-0.5" style={{ color: "var(--gi-danger)" }}>
                ₹{Number(totalPayables).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <span className="p-2 rounded-lg gi-badge-danger text-lg">
              <IoPeopleOutline />
            </span>
          </div>
        </div>

        {/* Mobile Responsive Cards View (< 768px) */}
        <div className="block md:hidden space-y-3">
          {isLoading ? (
            <SkeletonCard count={4} />
          ) : sortedParties.length === 0 ? (
            <div className="p-6 text-center gi-card rounded-xl gi-text-muted text-xs border gi-divider">
              No parties found matching your criteria.
            </div>
          ) : (
            sortedParties.map((party: any) => {
              const pName = party.name || party.partyName || "Party";
              const pType = party.type || party.partyType || party.party_type || "Customer";
              const isSupplier = String(pType).toLowerCase() === "supplier" || party.is_supplier === true || party.is_supplier === 1;
              const pPhone = party.contact_number || party.phone || party.mobile || "";
              const balance = Number(party.current_balance ?? party.closing_balance ?? party.closingBalance ?? party.net_balance ?? party.balance ?? party.opening_balance ?? 0);
              const isReceive = !isSupplier && balance !== 0;
              const isPay = isSupplier && balance !== 0;
              const labelText = balance === 0 ? "Settled" : isSupplier ? "To Pay" : "To Receive";

              return (
                <div
                  key={party.id}
                  onClick={() => router.push(`/parties/${party.id}`)}
                  className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-3.5 shadow-2xs cursor-pointer hover:border-slate-300 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 font-bold text-sm text-slate-700 dark:text-slate-200 uppercase">
                      {pName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">{pName}</h3>
                      <p className="text-[11px] gi-text-muted mt-0.5 truncate">
                        {pPhone || pType}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300">
                      {pType}
                    </span>
                    <p
                      className={`font-mono font-bold text-xs mt-1 ${
                        isReceive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : isPay
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-slate-800 dark:text-slate-100"
                      }`}
                    >
                      {balance !== 0
                        ? `₹${Math.abs(balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                        : "₹0.00"}
                    </p>
                    <span className="text-[10px] block font-semibold text-slate-400">
                      {labelText}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Parties Data Table (>= 768px) */}
        <div className="hidden md:block gi-table-container shadow-xs">
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
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, rIdx) => (
                    <tr key={rIdx}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <SkeletonBox className="h-7 w-7 rounded-md shrink-0" />
                          <SkeletonBox className="h-4 w-36 rounded-md" />
                        </div>
                      </td>
                      <td className="py-3 px-4"><SkeletonBox className="h-5 w-16 rounded" /></td>
                      <td className="py-3 px-4"><SkeletonBox className="h-4 w-24 rounded-md" /></td>
                      <td className="py-3 px-4"><SkeletonBox className="h-4 w-28 rounded-md" /></td>
                      <td className="py-3 px-4 text-right"><SkeletonBox className="h-4 w-20 ml-auto rounded-md" /></td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <SkeletonBox className="h-7 w-7 rounded-md" />
                          <SkeletonBox className="h-7 w-7 rounded-md" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : sortedParties.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center gi-text-muted text-xs">
                      No parties found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  sortedParties.map((party: any) => {
                    const pName = party.name || party.partyName || "Party";
                    const pType = party.type || party.partyType || party.party_type || "Customer";
                    const isSupplier = String(pType).toLowerCase() === "supplier" || party.is_supplier === true || party.is_supplier === 1;
                    const pPhone = party.contact_number || party.phone || party.mobile || "";
                    const pGst = party.gst_number || party.gstNumber || party.gstin || "";
                    const balance = Number(party.current_balance ?? party.closing_balance ?? party.closingBalance ?? party.net_balance ?? party.balance ?? party.opening_balance ?? 0);
                    const isReceive = !isSupplier && balance !== 0;
                    const isPay = isSupplier && balance !== 0;
                    const balanceLabel = balance === 0 ? "Settled" : isSupplier ? "To Pay" : "To Receive";

                    return (
                      <tr
                        key={party.id}
                        onClick={() => router.push(`/parties/${party.id}`)}
                        className="hover:bg-[var(--gi-hover)] transition cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-md gi-badge-info font-bold text-xs flex items-center justify-center shrink-0">
                              {pName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="gi-mob-primary font-semibold gi-text-primary">{pName}</p>
                              <div className="gi-mob-secondary">
                                <span className="gi-badge-info px-1 py-0 rounded text-[9px] font-bold uppercase">{pType}</span>
                                {pPhone && <><span className="gi-text-muted">·</span><span>{pPhone}</span></>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-badge-info">
                            {pType}
                          </span>
                        </td>
                        <td className="py-3 px-4 gi-text-secondary">
                          {pPhone ? (
                            <span className="flex items-center gap-1 font-mono">
                              <IoCallOutline className="gi-text-muted text-xs" /> {pPhone}
                            </span>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono gi-text-muted">
                          {pGst || "Unregistered"}
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
                            {balanceLabel}
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
