"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  IoArrowBack,
  IoWalletOutline,
  IoSearch,
  IoAdd,
  IoArrowDownOutline,
  IoArrowUpOutline,
  IoSwapHorizontalOutline,
  IoClose,
  IoImageOutline,
  IoEyeOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoPersonOutline,
  IoSwapVerticalOutline,
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";
import PermissionGuard from "./PermissionGuard";
import PaginationControls from "./PaginationControls";

export default function PaymentHistoryView() {
  const router = useRouter();
  const { payments = [], hasPermission } = useApp();
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

  // KPI Calculations
  const { totalReceived, totalPaid, netFlow } = useMemo(() => {
    let rec = 0;
    let paid = 0;

    payments.forEach((p) => {
      const amt = Number(p.amount || 0);
      if (p.type === "credit") {
        rec += amt;
      } else {
        paid += amt;
      }
    });

    return {
      totalReceived: rec,
      totalPaid: paid,
      netFlow: rec - paid,
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return payments.filter((payment) => {
      const partyName = (payment.partyName || payment.party?.partyName || "").toLowerCase();
      const pNumber = String(payment.number || payment.id || "").toLowerCase();
      const pMode = (payment.mode || "").toLowerCase();
      const pNote = (payment.note || payment.notes || payment.remarks || "").toLowerCase();
      const pAmountStr = String(payment.amount ?? "").toLowerCase();
      const pAmountFormatted = Number(payment.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }).toLowerCase();

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "collected" && payment.type === "credit") ||
        (activeFilter === "paid" && payment.type === "debit");

      const matchesSearch =
        query === "" ||
        partyName.includes(query) ||
        pNumber.includes(query) ||
        pMode.includes(query) ||
        pNote.includes(query) ||
        pAmountStr.includes(query) ||
        pAmountFormatted.includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [payments, activeFilter, searchQuery]);

  const sortedPayments = useMemo(() => {
    if (!sortConfig.key) return filteredPayments;
    return [...filteredPayments].sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case "date":
          aVal = new Date(a.date || 0).getTime();
          bVal = new Date(b.date || 0).getTime();
          break;
        case "partyName":
          aVal = (a.partyName || a.party?.partyName || "").toLowerCase();
          bVal = (b.partyName || b.party?.partyName || "").toLowerCase();
          break;
        case "type":
          aVal = (a.type || "").toLowerCase();
          bVal = (b.type || "").toLowerCase();
          break;
        case "mode":
          aVal = (a.mode || "").toLowerCase();
          bVal = (b.mode || "").toLowerCase();
          break;
        case "recordedBy":
          aVal = (a.recordedBy || a.userName || "").toLowerCase();
          bVal = (b.recordedBy || b.userName || "").toLowerCase();
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

  const filters = [
    { id: "all", label: "All Payments" },
    { id: "collected", label: "Payment In (Received)" },
    { id: "paid", label: "Payment Out (Paid)" },
  ];

  return (
    <PermissionGuard module="Payment">
      <div className="space-y-5 select-none gi-page">
        {/* Page Heading & Controls */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b gi-divider">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer shrink-0"
              title="Go Back to Payments"
            >
              <IoArrowBack className="text-lg" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
                Payment History
              </h1>
              <p className="text-xs gi-text-secondary mt-0.5">
                Complete audit log of all recorded party payment transactions
              </p>
            </div>
          </div>

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

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold gi-text-secondary">
                Total Payment Received (In)
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono mt-1" style={{ color: "var(--gi-success)" }}>
                {formatCurrency(totalReceived)}
              </p>
            </div>
            <span className="p-2.5 rounded-xl gi-badge-success text-xl shrink-0">
              <IoArrowDownOutline />
            </span>
          </div>

          <div className="p-4 rounded-xl gi-card shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold gi-text-secondary">
                Total Payment Made (Out)
              </p>
              <p className="text-lg sm:text-xl font-bold font-mono mt-1" style={{ color: "var(--gi-danger)" }}>
                {formatCurrency(totalPaid)}
              </p>
            </div>
            <span className="p-2.5 rounded-xl gi-badge-danger text-xl shrink-0">
              <IoArrowUpOutline />
            </span>
          </div>

          <div className="p-4 rounded-xl gi-card shadow-xs flex items-center justify-between sm:col-span-1 col-span-1">
            <div>
              <p className="text-xs font-semibold gi-text-secondary">
                Net Cash Flow
              </p>
              <p className={`text-lg sm:text-xl font-bold font-mono mt-1 ${netFlow >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {netFlow >= 0 ? "+" : ""}{formatCurrency(netFlow)}
              </p>
            </div>
            <span className="p-2.5 rounded-xl gi-surface-secondary gi-text-primary text-xl shrink-0">
              <IoSwapHorizontalOutline />
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
              placeholder="Search party, receipt #, amount, mode..."
              className="w-full h-9 pl-9 pr-4 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs focus:outline-none focus:border-indigo-500 transition shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl gi-card shadow-xs overflow-x-auto">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`px-3 py-1.5 rounded-md text-xs transition cursor-pointer whitespace-nowrap ${
                  activeFilter === f.id ? "gi-filter-active" : "gi-filter-inactive font-medium"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Payment History Listing Container */}
        <div className="rounded-xl gi-card shadow-xs overflow-hidden">
          {filteredPayments.length === 0 ? (
            <div className="py-16 text-center gi-text-muted">
              <IoWalletOutline className="text-4xl mx-auto mb-2 opacity-50" />
              <p className="font-bold text-sm gi-text-primary">
                No Payment Transactions Found
              </p>
              <p className="text-xs gi-text-muted mt-1 max-w-sm mx-auto">
                {searchQuery || activeFilter !== "all"
                  ? "No transactions match your current search or filter criteria. Try resetting filters."
                  : "Your payment transaction history will appear here once payments are recorded."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View (md:table) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="gi-surface-secondary border-b border-[var(--gi-divider)] text-[11px] font-bold gi-text-secondary uppercase tracking-wider">
                      {[
                        { key: "date", label: "Date & Time", align: "left" },
                        { key: "partyName", label: "Party Name", align: "left" },
                        { key: "type", label: "Payment Type", align: "left" },
                        { key: "mode", label: "Mode", align: "left" },
                        { key: "recordedBy", label: "Recorded By", align: "left" },
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
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--gi-divider)]">
                    {sortedPayments.map((payment) => {
                      const partyName = payment.partyName || payment.party?.partyName || "Party";
                      const isPaid = payment.type === "debit";

                      return (
                        <tr
                          key={payment.id}
                          onClick={() => router.push(`/paymentDetails/${payment.id}`)}
                          className="hover:bg-[var(--gi-hover)] transition cursor-pointer"
                        >
                          <td className="py-3 px-4 font-mono">
                            <div className="text-xs gi-text-primary font-semibold flex items-center gap-1.5">
                              <IoCalendarOutline className="text-sm gi-text-muted" />
                              <span>{payment.date || "N/A"}</span>
                            </div>
                            <div className="text-[11px] gi-text-muted mt-0.5 flex items-center gap-1.5">
                              <IoTimeOutline className="text-xs" />
                              <span>{payment.time || "12:00 PM"}</span>
                              <span>•</span>
                              <span>#{payment.number || payment.id}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="min-w-0">
                              <p className="font-semibold gi-text-primary truncate text-xs sm:text-sm">
                                {partyName}
                              </p>
                              {(payment.note || payment.notes || payment.remarks) && (
                                <p className="text-[11px] gi-text-muted truncate max-w-xs">
                                  {payment.note || payment.notes || payment.remarks}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isPaid ? "gi-badge-danger" : "gi-badge-success"
                              }`}
                            >
                              {isPaid ? (
                                <>
                                  <IoArrowUpOutline />
                                  <span>Payment Out</span>
                                </>
                              ) : (
                                <>
                                  <IoArrowDownOutline />
                                  <span>Payment Received</span>
                                </>
                              )}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-md gi-surface-secondary gi-text-primary font-medium text-xs">
                              {payment.mode || "Cash"}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            {payment.createdBy ? (
                              <div className="flex items-center gap-1.5 gi-text-secondary text-xs">
                                <IoPersonOutline className="text-xs gi-text-muted" />
                                <span>{payment.createdBy}</span>
                                {payment.createdByRole && (
                                  <span className="text-[10px] gi-text-muted">
                                    ({payment.createdByRole})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="gi-text-muted text-[11px] italic">System</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                            <span
                              className={isPaid ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}
                            >
                              {isPaid ? "-" : "+"}{formatCurrency(payment.amount)}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase gi-badge-info">
                              {payment.status || "Completed"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View (block md:hidden) */}
              <div className="block md:hidden divide-y divide-[var(--gi-divider)]">
                {filteredPayments.map((payment) => {
                  const partyName = payment.partyName || payment.party?.partyName || "Party";
                  const isPaid = payment.type === "debit";

                  return (
                    <div
                      key={payment.id}
                      onClick={() => router.push(`/paymentDetails/${payment.id}`)}
                      className="p-4 hover:bg-[var(--gi-hover)] transition cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm shadow-xs ${
                            isPaid ? "gi-badge-danger" : "gi-badge-success"
                          }`}
                        >
                          {isPaid ? <IoArrowUpOutline className="text-lg" /> : <IoArrowDownOutline className="text-lg" />}
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-xs gi-text-primary truncate">
                            {partyName}
                          </p>

                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span
                              className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                isPaid ? "gi-badge-danger" : "gi-badge-success"
                              }`}
                            >
                              {isPaid ? "Payment Out" : "Received"}
                            </span>
                            <span className="text-[11px] gi-text-muted">
                              Mode: <span className="font-semibold gi-text-primary">{payment.mode || "Cash"}</span>
                            </span>
                          </div>

                          <p className="text-[11px] gi-text-muted mt-1">
                            Date: {payment.date} {payment.time ? `• ${payment.time}` : ""}
                            {payment.createdBy && ` • ${payment.createdBy}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={`font-mono font-bold text-sm sm:text-base ${
                            isPaid ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isPaid ? "-" : "+"}{formatCurrency(payment.amount)}
                        </p>
                        <span className="inline-block mt-0.5 text-[10px] uppercase font-bold px-2 py-0.5 rounded gi-surface-secondary gi-text-muted font-mono">
                          #{payment.number || payment.id}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
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
                    View Party Profile
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="flex-1 py-2.5 rounded-xl gi-btn-primary text-xs font-semibold transition cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </PermissionGuard>
  );
}
