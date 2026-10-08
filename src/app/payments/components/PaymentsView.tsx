"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IoAdd,
  IoSearch,
  IoWalletOutline,
  IoBusinessOutline,
  IoCashOutline,
  IoReceiptOutline,
  IoArrowForward,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoSwapVerticalOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoClose,
  IoTimeOutline,
} from "react-icons/io5";
import { useAuth } from "@/context/AuthContext";
import { ledgerApi } from "@/lib/api/ledger";
import { partyApi } from "@/lib/api/party";
import { invoiceApi } from "@/lib/api/invoice";
import { isPurchaseInvoice, getInvoiceAmounts } from "@/lib/utils/invoiceUtils";
import PermissionGuard from "@/components/PermissionGuard";
import FilterTabs from "@/components/FilterTabs";
import { SkeletonBox, SkeletonCard, SkeletonStats } from "@/components/Skeleton";
import { toast } from "react-toastify";
import { useMinimumLoading } from "@/lib/hooks/useMinimumLoading";
import SmoothTransition from "@/components/SmoothTransition";

export default function PaymentsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawFilter = searchParams ? (searchParams.get("filter") || searchParams.get("tab")) : null;
  const { activeBusiness, hasPermission } = useAuth();

  const [ledgers, setLedgers] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const { isLoading, startLoading, stopLoading } = useMinimumLoading(true, 400);

  const [activeFilter, setActiveFilter] = useState(() => {
    if (rawFilter && ["all", "to_collect", "to_pay"].includes(rawFilter)) {
      return rawFilter;
    }
    return "all";
  });

  useEffect(() => {
    if (rawFilter && ["all", "to_collect", "to_pay"].includes(rawFilter)) {
      setActiveFilter(rawFilter);
    }
  }, [rawFilter]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" });

  // Modal state for Delete
  const [ledgerToDelete, setLedgerToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPaymentsData = useCallback(() => {
    if (activeBusiness?.id) {
      startLoading();
      Promise.all([
        ledgerApi.getLedgers({ per_page: "all", silentError: true }).catch(() => ({ body: [] })),
        partyApi.getParties(activeBusiness.id).catch(() => ({ body: [] })),
        invoiceApi.getInvoices({ silentError: true }).catch(() => ({ body: [] })),
      ])
        .then(([ledgersRes, partiesRes, invoicesRes]: any[]) => {
          const rawL = ledgersRes?.body?.ledgers || ledgersRes?.body?.data || (Array.isArray(ledgersRes?.body) ? ledgersRes.body : []);
          const lList = Array.isArray(rawL) ? rawL : [];
          const rawP = partiesRes?.body?.parties || partiesRes?.body?.data || (Array.isArray(partiesRes?.body) ? partiesRes.body : []);
          const pList = Array.isArray(rawP) ? rawP : [];
          const rawI = invoicesRes?.body?.invoices || invoicesRes?.body?.data || (Array.isArray(invoicesRes?.body) ? invoicesRes.body : []);
          const iList = Array.isArray(rawI) ? rawI : [];

          setLedgers(lList);
          setParties(pList);
          setInvoices(iList);
        })
        .finally(() => stopLoading());
    } else {
      setLedgers([]);
      setParties([]);
      setInvoices([]);
      stopLoading();
    }
  }, [activeBusiness?.id, startLoading, stopLoading]);

  useEffect(() => {
    fetchPaymentsData();
  }, [fetchPaymentsData]);

  const handleDeleteLedger = async () => {
    if (!ledgerToDelete?.id) return;
    setIsDeleting(true);
    try {
      await ledgerApi.deleteLedger(ledgerToDelete.id);
      toast.success("Ledger deleted successfully!");
      setLedgerToDelete(null);
      fetchPaymentsData();
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

  const { toCollect, toPay, toProvideInvoices, toReceiveInvoices } = useMemo(() => {
    let partyCollect = 0;
    let partyPay = 0;
    let customerProvideInvoices = 0;
    let supplierReceiveInvoices = 0;

    const validParties = parties.filter((p: any) => {
      const t = String(p.type || p.partyType || p.party_type || p.ledger_type || "").toLowerCase();
      const isSupplier = t === "supplier" || p.is_supplier === true || p.is_supplier === 1;
      const isCustomer = t === "customer" || p.is_customer === true || p.is_customer === 1;
      return isSupplier || isCustomer;
    });

    if (validParties.length > 0) {
      validParties.forEach((p: any) => {
        const pType = String(p.type || p.partyType || p.party_type || "").toLowerCase();
        const isSupplier = pType === "supplier" || p.is_supplier === true || p.is_supplier === 1;
        const bal = Number(p.current_balance ?? p.closing_balance ?? p.closingBalance ?? p.balance ?? p.opening_balance ?? 0);

        if (isSupplier) {
          if (bal > 0) {
            supplierReceiveInvoices += bal;
          } else {
            partyPay += Math.abs(bal);
          }
        } else {
          if (bal < 0) {
            customerProvideInvoices += Math.abs(bal);
          } else {
            partyCollect += bal;
          }
        }
      });
    } else {
      const list = Array.isArray(ledgers) ? ledgers : [];
      list.forEach((l: any) => {
        const t = String(l.type || l.partyType || l.party_type || l.group || "").toLowerCase();
        const isSupplier = t === "supplier" || l.is_supplier === true || l.is_supplier === 1;
        const isCustomer = t === "customer" || l.is_customer === true || l.is_customer === 1;
        if (!isSupplier && !isCustomer) return;

        const bal = Number(l.current_balance ?? l.closingBalance ?? l.opening_balance ?? l.openingBalance ?? 0);

        if (isSupplier) {
          if (bal > 0) {
            supplierReceiveInvoices += bal;
          } else {
            partyPay += Math.abs(bal);
          }
        } else {
          if (bal < 0) {
            customerProvideInvoices += Math.abs(bal);
          } else {
            partyCollect += bal;
          }
        }
      });
    }

    let invSalesDue = 0;
    let invPurchDue = 0;

    invoices.forEach((inv: any) => {
      const isPurchase = isPurchaseInvoice(inv);
      const { dueAmount, status } = getInvoiceAmounts(inv);

      if (status !== "paid" && dueAmount > 0) {
        if (isPurchase) invPurchDue += dueAmount;
        else invSalesDue += dueAmount;
      }
    });

    return {
      toCollect: (validParties.length > 0 || ledgers.length > 0) ? partyCollect : invSalesDue,
      toPay: (validParties.length > 0 || ledgers.length > 0) ? partyPay : invPurchDue,
      toProvideInvoices: customerProvideInvoices,
      toReceiveInvoices: supplierReceiveInvoices,
    };
  }, [parties, ledgers, invoices]);

  const filteredLedgers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    const list = Array.isArray(ledgers) ? ledgers : [];
    return list.filter((l) => {
      const typeStr = String(l.type || l.partyType || l.party_type || l.group || "").toLowerCase();
      const nameStr = String(l.name || l.partyName || l.party_name || "").toLowerCase();
      const bal = Number(l.current_balance ?? l.closingBalance ?? l.opening_balance ?? l.openingBalance ?? 0);

      const isSupplier = typeStr === "supplier" || l.is_supplier === true || l.is_supplier === 1;
      const isCustomer = typeStr === "customer" || l.is_customer === true || l.is_customer === 1;
      const isParty = isSupplier || isCustomer;

      if (!isParty) return false;

      const isToPay = isSupplier && bal <= 0;
      const isToCollect = isCustomer && bal >= 0;
      const isToProvideInvoices = isCustomer && bal < 0;
      const isToReceiveInvoices = isSupplier && bal > 0;

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "to_pay" && (isSupplier || isToPay)) ||
        (activeFilter === "to_collect" && (isCustomer || isToCollect)) ||
        (activeFilter === "to_provide_invoices" && isToProvideInvoices) ||
        (activeFilter === "to_receive_invoices" && isToReceiveInvoices);

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

  const getBalanceDetails = (bal: number) => {
    const isRed = bal < 0;
    const isGreen = bal > 0;

    const colorClass = bal === 0
      ? "gi-text-primary"
      : isGreen
        ? "text-emerald-600 dark:text-emerald-400 font-bold"
        : "text-rose-600 dark:text-rose-400 font-bold";

    const sign = bal > 0 ? "+" : bal < 0 ? "-" : "";
    const formatted = `${sign}₹${Math.abs(bal).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return {
      sign,
      formatted,
      colorClass,
      isRed,
      isGreen,
    };
  };

  const getTypeBadge = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t === "customer") {
      return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-badge-info">Customer</span>;
    }
    if (t === "supplier") {
      return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-badge-warning">Supplier</span>;
    }
    return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-surface-secondary border gi-border gi-text-secondary">{type || "Party"}</span>;
  };

  return (
    <PermissionGuard module="Ledger">
      <div className="space-y-5 select-none gi-page">
        {/* Page Heading & Action Buttons */}
        <div className="flex items-center justify-between gap-3 border-b gi-divider pb-3">
          <div>
            <h1 className="text-2xl font-bold gi-text-primary tracking-tight">
              Payments
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/paymentHistory">
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl sm:rounded-lg gi-btn-secondary text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap"
              >
                <IoTimeOutline className="text-sm" />
                <span>History</span>
              </button>
            </Link>

            {(hasPermission("Payment", "Create") || hasPermission("Ledger", "Create")) && (
              <Link href="/payment/receivedPayment">
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-xl sm:rounded-lg gi-btn-primary text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer whitespace-nowrap"
                >
                  <IoAdd className="text-base" />
                  <span>Add Payment</span>
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Summary KPI Row: 4 Calculation Cards */}
        {isLoading ? (
          <SkeletonStats count={4} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Total Receivable (To Collect) */}
            <div
              onClick={() => setActiveFilter(activeFilter === "to_collect" ? "all" : "to_collect")}
              className={`p-4 rounded-xl gi-card shadow-xs cursor-pointer transition hover:scale-[1.005] ${activeFilter === "to_collect" ? "border-2 border-emerald-500" : ""
                }`}
            >
              <p className="text-[11px] font-semibold gi-text-secondary uppercase tracking-wider">
                Total Receivable (To Collect)
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{Number(toCollect).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* 2. Total Due (To Pay) */}
            <div
              onClick={() => setActiveFilter(activeFilter === "to_pay" ? "all" : "to_pay")}
              className={`p-4 rounded-xl gi-card shadow-xs cursor-pointer transition hover:scale-[1.005] ${activeFilter === "to_pay" ? "border-2 border-rose-500" : ""
                }`}
            >
              <p className="text-[11px] font-semibold gi-text-secondary uppercase tracking-wider">
                Total Due (To Pay)
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
                ₹{Number(toPay).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* 3. Invoices to Provide (Customer -ve Balance) */}
            <div
              onClick={() => setActiveFilter(activeFilter === "to_provide_invoices" ? "all" : "to_provide_invoices")}
              className={`p-4 rounded-xl gi-card shadow-xs cursor-pointer transition hover:scale-[1.005] ${activeFilter === "to_provide_invoices" ? "border-2 border-indigo-500" : ""
                }`}
            >
              <p className="text-[11px] font-semibold gi-text-secondary uppercase tracking-wider">
                Invoices to Provide
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                ₹{Number(toProvideInvoices).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* 4. Invoices to Receive (Supplier +ve Balance) */}
            <div
              onClick={() => setActiveFilter(activeFilter === "to_receive_invoices" ? "all" : "to_receive_invoices")}
              className={`p-4 rounded-xl gi-card shadow-xs cursor-pointer transition hover:scale-[1.005] ${activeFilter === "to_receive_invoices" ? "border-2 border-amber-500" : ""
                }`}
            >
              <p className="text-[11px] font-semibold gi-text-secondary uppercase tracking-wider">
                Invoices to Receive
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                ₹{Number(toReceiveInvoices).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}

        {/* Filter Controls (BELOW CALCULATION CARDS - Right Aligned on Desktop) */}
        <div className="flex items-center justify-start sm:justify-end overflow-x-auto">
          <FilterTabs
            options={[
              { id: "all", label: "ALL" },
              { id: "to_pay", label: "To Pay" },
              { id: "to_collect", label: "To Collect" },
              { id: "to_provide_invoices", label: "To Provide Invoices" },
              { id: "to_receive_invoices", label: "To Receive Invoices" },
            ]}
            activeId={activeFilter}
            onChange={setActiveFilter}
            layoutId="paymentsFilterPill"
          />
        </div>

        {/* Mobile Responsive Cards View (< 768px) */}
        <div className="block md:hidden space-y-3">
          {isLoading ? (
            <SkeletonCard count={4} />
          ) : sortedLedgers.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs gi-text-muted font-medium">
              No ledgers found matching your selection.
            </div>
          ) : (
            sortedLedgers.map((l: any) => {
              const currentBal = Number(l.current_balance ?? l.closingBalance ?? l.opening_balance ?? l.openingBalance ?? 0);
              const curBalInfo = getBalanceDetails(currentBal);

              return (
                <div
                  key={l.id}
                  onClick={() => router.push(`/ledgers/${l.id}?from=/payments`)}
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
                    <p className={`font-mono font-bold text-xs ${curBalInfo.colorClass}`}>
                      {curBalInfo.formatted}
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
                    </tr>
                  ))
                ) : sortedLedgers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center gi-text-muted text-xs">
                      No ledgers found. Click &quot;Create Ledger&quot; to add your first account.
                    </td>
                  </tr>
                ) : (
                  sortedLedgers.map((l: any) => {
                    const currentBal = Number(l.current_balance ?? l.closingBalance ?? l.opening_balance ?? l.openingBalance ?? 0);
                    const openBal = Number(l.opening_balance ?? l.openingBalance ?? 0);
                    const curBalInfo = getBalanceDetails(currentBal);
                    const openBalInfo = getBalanceDetails(openBal);

                    return (
                      <tr
                        key={l.id}
                        onClick={() => router.push(`/ledgers/${l.id}?from=/payments`)}
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
                                <span className={curBalInfo.colorClass}>{curBalInfo.formatted}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getTypeBadge(l.type)}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono ${openBalInfo.colorClass}`}>
                          {openBalInfo.formatted}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-bold ${curBalInfo.colorClass}`}>
                          {curBalInfo.formatted}
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

