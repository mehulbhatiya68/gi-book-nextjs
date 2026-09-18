"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  IoAdd,
  IoTimeOutline,
  IoArrowDownOutline,
  IoArrowUpOutline,
  IoSearch,
  IoClose,
  IoImageOutline,
  IoEyeOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoSwapVerticalOutline,
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";
import PermissionGuard from "./PermissionGuard";

export default function PaymentsView() {
  const router = useRouter();
  const { payments = [], parties = [], hasPermission } = useApp();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
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

  // Dynamic calculations from party balances
  const totalReceivable = parties
    .filter((p) => Number(p.closingBalance || 0) > 0)
    .reduce((sum, p) => sum + Number(p.closingBalance || 0), 0);

  const totalDue = parties
    .filter((p) => Number(p.closingBalance || 0) < 0)
    .reduce((sum, p) => sum + Math.abs(Number(p.closingBalance || 0)), 0);

  const filteredPayments = payments.filter((payment) => {
    const partyName = payment.partyName || payment.party?.partyName || "";
    const pNumber = String(payment.number || payment.id || "");
    const pMode = payment.mode || payment.paymentMode || "";
    const pAmountStr = String(payment.amount ?? "");
    const pAmountFormatted = Number(payment.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

    const query = searchQuery.toLowerCase().trim();

    const matchesSearch =
      query === "" ||
      partyName.toLowerCase().includes(query) ||
      pNumber.toLowerCase().includes(query) ||
      pMode.toLowerCase().includes(query) ||
      pAmountStr.toLowerCase().includes(query) ||
      pAmountFormatted.toLowerCase().includes(query);

    const matchesFilter =
      activeFilter === "all"
        ? true
        : activeFilter === "toPay"
          ? payment.type === "debit"
          : payment.type === "credit";

    return matchesSearch && matchesFilter;
  });

  const sortedPayments = useMemo(() => {
    if (!sortConfig.key) return filteredPayments;
    return [...filteredPayments].sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case "partyName":
          aVal = (a.partyName || a.party?.partyName || "").toLowerCase();
          bVal = (b.partyName || b.party?.partyName || "").toLowerCase();
          break;
        case "type":
          aVal = (a.type || "").toLowerCase();
          bVal = (b.type || "").toLowerCase();
          break;
        case "mode":
          aVal = (a.mode || a.paymentMode || "").toLowerCase();
          bVal = (b.mode || b.paymentMode || "").toLowerCase();
          break;
        case "date":
          aVal = new Date(a.date || 0).getTime();
          bVal = new Date(b.date || 0).getTime();
          break;
        case "amount":
          aVal = Number(a.amount || 0);
          bVal = Number(b.amount || 0);
          break;
        default:
          return 0;
      }
      if (typeof aVal === "string") {
        return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [filteredPayments, sortConfig]);

  const formatCurrency = (val) => {
    return "₹" + Number(val || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <PermissionGuard module="Payment">
      <div className="space-y-5 select-none gi-page">
        {/* Page Heading & Action Buttons */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
              Payments
            </h1>
            <p className="text-xs gi-text-secondary mt-0.5">
              Track incoming payments and outgoing party disbursements
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/paymentHistory" className="shrink-0">
              <button
                type="button"
                className="px-3 py-2 rounded-lg gi-btn-secondary text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
              >
                <IoTimeOutline className="text-base" />
                <span>History</span>
              </button>
            </Link>

            {hasPermission("Payment", "Create") && (
              <Link href="/payment/receivedPayment" className="shrink-0">
                <button
                  type="button"
                  className="px-3.5 py-2 rounded-lg gi-btn-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <IoAdd className="text-base" />
                  <span>Record Payment</span>
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold gi-text-secondary">
                Total Receivable (To Collect)
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono mt-1" style={{ color: "var(--gi-success)" }}>
                {formatCurrency(totalReceivable)}
              </p>
            </div>
            <span className="p-2 rounded-lg gi-badge-success text-xl">
              <IoArrowDownOutline />
            </span>
          </div>

          <div className="p-4 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold gi-text-secondary">
                Total Payable (To Pay)
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono mt-1" style={{ color: "var(--gi-danger)" }}>
                {formatCurrency(totalDue)}
              </p>
            </div>
            <span className="p-2 rounded-lg gi-badge-danger text-xl">
              <IoArrowUpOutline />
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
              placeholder="Search by party name, receipt #, amount, mode..."
              className="w-full h-9 pl-9 pr-4 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs focus:outline-none focus:border-indigo-500 transition shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex items-center gap-1 p-1 rounded-xl gi-card shadow-xs">
              {[
                { id: "all", label: "All Payments" },
                { id: "toCollect", label: "Payment In (Received)" },
                { id: "toPay", label: "Payment Out (Paid)" },
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
          </div>
        </div>

        {/* Transactions Table Container */}
        <div className="rounded-xl gi-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="gi-surface-secondary border-b border-[var(--gi-divider)] text-[11px] font-bold gi-text-secondary uppercase tracking-wider">
                  {[
                    { key: "partyName", label: "Party Name", align: "left" },
                    { key: "type", label: "Type", align: "left" },
                    { key: "mode", label: "Mode", align: "left" },
                    { key: "date", label: "Date & Time", align: "left" },
                    { key: "amount", label: "Amount", align: "right" },
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
              <tbody className="divide-y divide-[var(--gi-divider)]">
                {sortedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center gi-text-muted text-xs">
                      No payment records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  sortedPayments.map((payment) => {
                    const partyName = payment.partyName || payment.party?.partyName || "Party";
                    const isCredit = payment.type === "credit";

                    return (
                      <tr
                        key={payment.id}
                        onClick={() => router.push(`/paymentDetails/${payment.id}`)}
                        className="hover:bg-[var(--gi-hover)] transition cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`h-7 w-7 rounded-md font-bold text-xs flex items-center justify-center shrink-0 ${isCredit ? "gi-badge-success" : "gi-badge-danger"}`}>
                              {isCredit ? <IoArrowDownOutline /> : <IoArrowUpOutline />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold gi-text-primary text-xs sm:text-sm truncate">{partyName}</p>
                              {(payment.note || payment.notes || payment.remarks) && (
                                <p className="text-[11px] gi-text-muted truncate max-w-xs">
                                  {payment.note || payment.notes || payment.remarks}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isCredit ? "gi-badge-success" : "gi-badge-danger"}`}>
                            {isCredit ? "Payment In" : "Payment Out"}
                          </span>
                        </td>
                        <td className="py-3 px-4 capitalize gi-text-secondary">
                          {payment.mode || "Cash"}
                        </td>
                        <td className="py-3 px-4 gi-text-muted whitespace-nowrap font-mono">
                          <div>{payment.date || "N/A"}</div>
                          <div className="text-[11px] gi-text-muted mt-0.5 flex items-center gap-1">
                            <IoTimeOutline className="text-xs" />
                            <span>{payment.time || "12:00 PM"}</span>
                            <span>•</span>
                            <span>#{payment.number || payment.id}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                          <span style={{ color: isCredit ? "var(--gi-success)" : "var(--gi-danger)" }}>
                            {isCredit ? "+" : "-"}{formatCurrency(payment.amount)}
                          </span>
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

      {/* Payment Details & Photo Proof Modal */}
      <AnimatePresence>
        {selectedPayment && (
          <div
            onClick={() => setSelectedPayment(null)}
            className="fixed inset-0 z-50 flex items-center justify-center gi-modal-overlay backdrop-blur-sm p-4 overflow-y-auto"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl gi-modal-content shadow-2xl p-5 sm:p-6 space-y-5 my-8 select-text"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--gi-divider)]">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      selectedPayment.type === "debit" ? "gi-badge-danger" : "gi-badge-success"
                    }`}
                  >
                    {selectedPayment.type === "debit" ? "Payment Out" : "Payment Received"}
                  </span>
                  <span className="text-xs font-semibold gi-text-muted">
                    Date: {selectedPayment.date || "N/A"} {selectedPayment.time ? `• ${selectedPayment.time}` : ""}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="p-1.5 rounded-lg gi-surface-interactive gi-text-secondary hover:gi-text-primary transition cursor-pointer"
                >
                  <IoClose className="text-xl" />
                </button>
              </div>

              {/* Amount & Party Card */}
              <div className="p-4 rounded-xl gi-surface-secondary space-y-2 text-center border border-[var(--gi-border)]">
                <p className="text-xs font-bold uppercase tracking-wider gi-text-secondary">
                  {selectedPayment.type === "debit" ? "Paid To (Supplier / Party)" : "Received From (Customer / Party)"}
                </p>
                <h2 className="text-lg sm:text-xl font-bold gi-text-primary">
                  {selectedPayment.partyName || selectedPayment.party?.partyName || "Party"}
                </h2>
                <p
                  className={`text-2xl sm:text-3xl font-bold font-mono ${
                    selectedPayment.type === "debit"
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {selectedPayment.type === "debit" ? "-" : "+"}{formatCurrency(selectedPayment.amount)}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg gi-card border border-[var(--gi-border)]">
                  <p className="text-[10px] font-bold uppercase tracking-wider gi-text-muted">Unique Receipt No.</p>
                  <p className="font-semibold gi-text-primary mt-0.5 font-mono">#{selectedPayment.number || selectedPayment.id}</p>
                </div>

                <div className="p-3 rounded-lg gi-card border border-[var(--gi-border)]">
                  <p className="text-[10px] font-bold uppercase tracking-wider gi-text-muted">Payment Made Time</p>
                  <p className="font-semibold gi-text-primary mt-0.5">{selectedPayment.time || "12:00 PM"}</p>
                </div>

                <div className="p-3 rounded-lg gi-card border border-[var(--gi-border)]">
                  <p className="text-[10px] font-bold uppercase tracking-wider gi-text-muted">Payment Mode</p>
                  <p className="font-semibold gi-text-primary mt-0.5">{selectedPayment.mode || "Cash"}</p>
                </div>

                <div className="p-3 rounded-lg gi-card border border-[var(--gi-border)]">
                  <p className="text-[10px] font-bold uppercase tracking-wider gi-text-muted">Reference / Transaction No.</p>
                  <p className="font-semibold gi-text-primary mt-0.5 truncate">{selectedPayment.referenceNumber || "N/A"}</p>
                </div>

                <div className="p-3 rounded-lg gi-card border border-[var(--gi-border)]">
                  <p className="text-[10px] font-bold uppercase tracking-wider gi-text-muted">Recorded By</p>
                  <p className="font-semibold gi-text-primary mt-0.5">{selectedPayment.createdBy || "System Owner"}</p>
                </div>

                <div className="p-3 rounded-lg gi-card border border-[var(--gi-border)]">
                  <p className="text-[10px] font-bold uppercase tracking-wider gi-text-muted">Status</p>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize mt-0.5">{selectedPayment.status || "Completed"}</p>
                </div>
              </div>

              {/* Notes & Remarks if available */}
              {(selectedPayment.note || selectedPayment.notes || selectedPayment.remarks) && (
                <div className="p-3 rounded-lg gi-card border border-[var(--gi-border)] text-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider gi-text-muted">Notes &amp; Remarks</p>
                  <p className="gi-text-primary mt-1">{selectedPayment.note || selectedPayment.notes || selectedPayment.remarks}</p>
                </div>
              )}

              {/* Photo Proof / Receipt Attachment Section */}
              <div className="space-y-2 pt-2 border-t border-[var(--gi-divider)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider gi-text-primary flex items-center gap-1.5">
                    <IoImageOutline className="text-sm" />
                    <span>Photo Proof &amp; Receipt Attachment</span>
                  </h3>
                  {(selectedPayment.attachmentUrl || selectedPayment.imageProof || selectedPayment.proofImage || selectedPayment.attachment) && (
                    <a
                      href={selectedPayment.attachmentUrl || selectedPayment.imageProof || selectedPayment.proofImage || selectedPayment.attachment}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <IoEyeOutline />
                      <span>View Full Size</span>
                    </a>
                  )}
                </div>

                {(selectedPayment.attachmentUrl || selectedPayment.imageProof || selectedPayment.proofImage || selectedPayment.attachment) ? (
                  <div className="rounded-xl overflow-hidden border border-[var(--gi-border)] bg-[var(--gi-surface-secondary)] p-2">
                    <img
                      src={selectedPayment.attachmentUrl || selectedPayment.imageProof || selectedPayment.proofImage || selectedPayment.attachment}
                      alt="Payment Photo Proof"
                      className="w-full max-h-72 object-contain rounded-lg shadow-xs"
                    />
                    {selectedPayment.attachmentName && (
                      <p className="text-[11px] gi-text-muted text-center mt-2 font-mono">
                        {selectedPayment.attachmentName}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-[var(--gi-border)] bg-[var(--gi-surface-secondary)] text-center text-xs gi-text-muted">
                    <IoImageOutline className="text-3xl mx-auto mb-1.5 opacity-40" />
                    <p className="font-semibold gi-text-primary">No Photo Proof Attached</p>
                    <p className="text-[11px] gi-text-muted mt-0.5">No photo proof or receipt attachment was uploaded for this payment.</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const id = selectedPayment.id;
                    setSelectedPayment(null);
                    router.push(`/paymentDetails/${id}`);
                  }}
                  className="flex-1 py-2.5 rounded-xl gi-btn-primary text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <IoEyeOutline className="text-sm" />
                  <span>Full Screen Details</span>
                </button>
                {selectedPayment.party?.id && (
                  <button
                    type="button"
                    onClick={() => {
                      const partyId = selectedPayment.party.id;
                      setSelectedPayment(null);
                      router.push(`/parties/${partyId}`);
                    }}
                    className="flex-1 py-2.5 rounded-xl gi-btn-secondary text-xs font-semibold transition cursor-pointer"
                  >
                    Party Profile
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="px-3 py-2.5 rounded-xl gi-surface-interactive text-xs font-semibold gi-text-secondary transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </PermissionGuard>
  );
}
