"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  IoArrowBack,
  IoWalletOutline,
  IoPersonOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoCardOutline,
  IoDocumentTextOutline,
  IoImageOutline,
  IoPrintOutline,
  IoShareSocialOutline,
  IoCheckmarkCircle,
  IoArrowDownOutline,
  IoArrowUpOutline,
  IoClose,
  IoChevronForward,
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";
import PermissionGuard from "./PermissionGuard";

export default function PaymentDetailsView() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params?.id;

  const { payments = [], parties = [], invoices = [], activeBusiness } = useApp();
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const handlePrint = () => {
    if (!payment) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Pop-up blocker prevented printing. Please allow pop-ups for this site.");
      return;
    }

    const bizName = activeBusiness?.name || "GI BOOK";
    const bizAddress =
      typeof activeBusiness?.address === "object" && activeBusiness?.address !== null
        ? [activeBusiness.address.address, activeBusiness.address.city, activeBusiness.address.state, activeBusiness.address.pinCode].filter(Boolean).join(", ")
        : (activeBusiness?.address || "");
    const bizPhone = activeBusiness?.phone || "";
    const bizEmail = activeBusiness?.email || "";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt #${payment.number || payment.id} - ${bizName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 35px; color: #0f172a; background: #ffffff; line-height: 1.5; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
            .biz-title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
            .biz-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
            .receipt-badge { background: ${isCredit ? "#059669" : "#e11d48"}; color: #ffffff; padding: 6px 14px; border-radius: 8px; font-weight: 700; font-size: 14px; text-transform: uppercase; }
            .grid-container { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; font-size: 13px; }
            .box-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 6px; }
            .amount-box { background: ${isCredit ? "#ecfdf5" : "#fff1f2"}; border: 2px solid ${isCredit ? "#10b981" : "#f43f5e"}; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 25px; }
            .amount-val { font-size: 28px; font-weight: 800; color: ${isCredit ? "#047857" : "#be123c"}; font-family: monospace; }
            .footer { margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="biz-title">${bizName}</h1>
              <p class="biz-sub">${bizAddress} ${bizPhone ? "• Ph: " + bizPhone : ""} ${bizEmail ? "• Email: " + bizEmail : ""}</p>
            </div>
            <div class="receipt-badge">${isCredit ? "PAYMENT RECEIPT (IN)" : "PAYMENT VOUCHER (OUT)"}</div>
          </div>

          <div class="grid-container">
            <div class="box">
              <div class="box-title">Receipt Information</div>
              <strong>Receipt No:</strong> #${payment.number || payment.id}<br/>
              <strong>Date:</strong> ${new Date(payment.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}<br/>
              <strong>Time:</strong> ${payment.time || "10:30 AM"}<br/>
              <strong>Payment Mode:</strong> ${payment.mode || "Cash"}
            </div>
            <div class="box">
              <div class="box-title">${isCredit ? "Received From (Party)" : "Paid To (Party)"}</div>
              <strong>${payment.partyName || payment.party?.partyName || "N/A"}</strong><br/>
              ${partyInfo?.phone ? "Phone: " + partyInfo.phone + "<br/>" : ""}
              ${partyInfo?.partyType ? "Party Type: " + partyInfo.partyType : ""}
            </div>
          </div>

          <div class="amount-box">
            <div class="box-title">Amount ${isCredit ? "Received" : "Paid"}</div>
            <div class="amount-val">₹${Number(payment.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            ${payment.referenceNumber ? `<div style="font-size: 12px; color: #475569; margin-top: 6px;">Ref/Txn No: <strong>${payment.referenceNumber}</strong></div>` : ""}
          </div>

          ${payment.notes ? `
            <div class="box" style="margin-bottom: 25px;">
              <div class="box-title">Remarks & Notes</div>
              ${payment.notes}
            </div>
          ` : ""}

          <div class="footer">
            <span>Generated via GI BOOK ERP</span>
            <span>Authorized Signature _____________________</span>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Find target payment
  const payment =
    !paymentId || !payments.length
      ? null
      : payments.find((p) => String(p.id) === String(paymentId)) ||
        payments.find((p) => String(p.number) === String(paymentId)) ||
        null;

  const partyNameStr = (payment?.partyName || "").toLowerCase().trim();
  const linkedInvoiceIdStr = payment?.linkedInvoiceId ? String(payment.linkedInvoiceId) : "";
  const paymentIdStr = payment?.id ? String(payment.id) : "";

  // Find party info
  const partyInfo = !payment
    ? null
    : payment.party
    ? payment.party
    : partyNameStr
    ? parties.find((p) => (p.partyName || "").toLowerCase().trim() === partyNameStr) || null
    : null;

  // Find linked invoice if available
  const linkedInvoice =
    !linkedInvoiceIdStr || !invoices.length
      ? null
      : invoices.find((inv) => String(inv.id) === linkedInvoiceIdStr) || null;

  // Related payments for this party
  const partyPayments =
    !paymentIdStr || !partyNameStr
      ? []
      : payments
          .filter(
            (p) =>
              String(p.id) !== paymentIdStr &&
              (p.partyName || "").toLowerCase().trim() === partyNameStr
          )
          .slice(0, 5);

  const formatCurrency = (val) => {
    return "₹" + Number(val || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const isCredit = payment?.type === "credit";

  if (!payment) {
    return (
      <PermissionGuard module="Payment">
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 select-none gi-page text-center">
          <div className="h-16 w-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-3xl">
            <IoWalletOutline />
          </div>
          <div>
            <h2 className="text-xl font-bold gi-text-primary">Payment Record Not Found</h2>
            <p className="text-xs gi-text-secondary mt-1">
              The payment details you are looking for might have been removed or does not exist.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/payments")}
            className="px-4 py-2 rounded-lg gi-btn-primary text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <IoArrowBack />
            <span>Back to Payments</span>
          </button>
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard module="Payment">
      <div className="space-y-6 select-none gi-page pb-12 w-full max-w-7xl mx-auto">
        {/* Top Header & Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--gi-divider)]">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 rounded-lg border border-[var(--gi-divider)] gi-surface-interactive gi-text-secondary cursor-pointer shrink-0"
              title="Go Back"
            >
              <IoArrowBack className="text-lg" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
                  Payment Details
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border border-[var(--gi-divider)] bg-[var(--gi-surface-secondary)] gi-text-primary">
                  #{payment.number || payment.id}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                    isCredit
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                  }`}
                >
                  {isCredit ? <IoArrowDownOutline /> : <IoArrowUpOutline />}
                  <span>{isCredit ? "Payment In (Received)" : "Payment Out (Paid)"}</span>
                </span>
              </div>
              <p className="text-xs gi-text-secondary mt-0.5">
                Recorded on {new Date(payment.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-lg border border-[var(--gi-divider)] gi-surface-interactive gi-text-secondary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <IoPrintOutline className="text-sm" />
              <span className="hidden sm:inline">Print Receipt</span>
            </button>
            <Link href="/payments">
              <button
                type="button"
                className="px-3.5 py-2 rounded-lg border border-[var(--gi-divider)] gi-surface-interactive gi-text-secondary text-xs font-semibold cursor-pointer"
              >
                All Payments
              </button>
            </Link>
          </div>
        </div>

        {/* Wide Screen Main Layout: 2 Columns on Desktop / Ultrawide */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Column (2/3 width on wide screens) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Payment Banner */}
            <div
              className={`rounded-2xl p-6 sm:p-8 border shadow-xs relative overflow-hidden ${
                isCredit
                  ? "bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20"
                  : "bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/20"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider gi-text-secondary">
                    Total Amount {isCredit ? "Received" : "Paid"}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight ${
                        isCredit
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <IoCheckmarkCircle className="text-sm" /> Transaction Completed
                    </span>
                  </div>
                </div>

                {/* Key Timestamps Grid */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-[var(--gi-divider)] bg-[var(--gi-surface)]/80 backdrop-blur-xs min-w-[240px]">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-[11px] gi-text-secondary font-medium">
                      <IoCalendarOutline />
                      <span>Payment Date</span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold gi-text-primary">
                      {new Date(payment.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-[11px] gi-text-secondary font-medium">
                      <IoTimeOutline className="text-indigo-500" />
                      <span>Payment Time</span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold gi-text-primary">
                      {payment.time || "10:30 AM"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Party Information Card */}
            <div className="gi-card p-6 rounded-2xl border border-[var(--gi-divider)] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--gi-divider)] pb-3">
                <h3 className="text-sm font-bold gi-text-primary flex items-center gap-2">
                  <IoPersonOutline className="text-indigo-500 text-base" />
                  <span>Party Information</span>
                </h3>
                {partyInfo && (
                  <Link
                    href={`/parties/${partyInfo.id}`}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>View Party Profile</span>
                    <IoChevronForward />
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider gi-text-muted">
                    Party Name
                  </p>
                  <p className="text-base font-bold gi-text-primary">
                    {payment.partyName || payment.party?.partyName || "N/A"}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider gi-text-muted">
                    Party Type
                  </p>
                  <span className="inline-block text-xs px-2.5 py-0.5 rounded font-semibold capitalize gi-badge-info">
                    {partyInfo?.partyType || "Customer / Supplier"}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider gi-text-muted">
                    Contact Phone
                  </p>
                  <p className="text-xs sm:text-sm font-semibold gi-text-primary font-mono">
                    {partyInfo?.phone || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Technical Breakdown Grid */}
            <div className="gi-card p-6 rounded-2xl border border-[var(--gi-divider)] shadow-xs space-y-4">
              <h3 className="text-sm font-bold gi-text-primary flex items-center gap-2 border-b border-[var(--gi-divider)] pb-3">
                <IoCardOutline className="text-indigo-500 text-base" />
                <span>Payment &amp; Transaction Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider gi-text-muted">
                    Unique Receipt No.
                  </p>
                  <p className="text-sm font-mono font-bold gi-text-primary">
                    #{payment.number || payment.id}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider gi-text-muted">
                    Payment Mode
                  </p>
                  <p className="text-xs sm:text-sm font-semibold gi-text-primary">
                    {payment.mode || "Cash"}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider gi-text-muted">
                    Reference / Transaction ID
                  </p>
                  <p className="text-xs sm:text-sm font-mono font-semibold gi-text-primary">
                    {payment.referenceNumber || payment.refNo || "N/A"}
                  </p>
                </div>

                {linkedInvoice && (
                  <div className="space-y-1 sm:col-span-2 md:col-span-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider gi-text-muted">
                      Linked Invoice / Bill
                    </p>
                    <div className="p-3 rounded-xl border border-[var(--gi-divider)] bg-[var(--gi-surface-secondary)] flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold gi-text-primary">
                          Invoice #{linkedInvoice.invoiceNumberStr || linkedInvoice.id}
                        </p>
                        <p className="text-[11px] gi-text-secondary mt-0.5">
                          Bill Amount: {formatCurrency(linkedInvoice.totalAmount)}
                        </p>
                      </div>
                      <Link
                        href={`/invoice?id=${linkedInvoice.id}`}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        View Bill &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes Section */}
              <div className="pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider gi-text-muted mb-1.5">
                  Notes &amp; Remarks
                </p>
                <div className="p-4 rounded-xl border border-[var(--gi-divider)] bg-[var(--gi-surface-secondary)] text-xs gi-text-primary leading-relaxed min-h-[60px]">
                  {payment.notes || payment.note || payment.remarks || "No additional notes or remarks recorded for this payment."}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (1/3 width on wide screens) */}
          <div className="space-y-6">
            {/* Photo Proof Attachment Card */}
            <div className="gi-card p-6 rounded-2xl border border-[var(--gi-divider)] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--gi-divider)] pb-3">
                <h3 className="text-sm font-bold gi-text-primary flex items-center gap-2">
                  <IoImageOutline className="text-indigo-500 text-base" />
                  <span>Photo Proof Attachment</span>
                </h3>
              </div>

              {payment.attachmentUrl ? (
                <div className="space-y-3">
                  <div
                    onClick={() => setShowPhotoModal(true)}
                    className="relative rounded-xl overflow-hidden border border-[var(--gi-divider)] group cursor-pointer aspect-4/3 bg-black/5"
                  >
                    <img
                      src={payment.attachmentUrl}
                      alt="Payment Photo Proof"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-semibold text-xs gap-1.5">
                      <IoImageOutline className="text-lg" />
                      <span>Click to Enlarge</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-secondary px-1">
                    <span className="truncate max-w-[180px]">
                      {payment.attachmentName || "Receipt_Proof.jpg"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPhotoModal(true)}
                      className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                    >
                      View Full Size
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-[var(--gi-divider)] rounded-xl flex flex-col items-center justify-center text-center space-y-2 bg-[var(--gi-surface-secondary)]">
                  <IoImageOutline className="text-3xl gi-text-muted" />
                  <p className="text-xs font-semibold gi-text-secondary">No Photo Proof Attached</p>
                  <p className="text-[11px] gi-text-muted">
                    No image proof was uploaded during transaction entry.
                  </p>
                </div>
              )}
            </div>

            {/* Recent Payments from Same Party */}
            {partyPayments.length > 0 && (
              <div className="gi-card p-6 rounded-2xl border border-[var(--gi-divider)] shadow-xs space-y-4">
                <h3 className="text-sm font-bold gi-text-primary flex items-center gap-2 border-b border-[var(--gi-divider)] pb-3">
                  <IoWalletOutline className="text-indigo-500 text-base" />
                  <span>Other Transactions from {payment.partyName}</span>
                </h3>

                <div className="space-y-2.5">
                  {partyPayments.map((p) => (
                    <Link
                      key={p.id}
                      href={`/paymentDetails/${p.id}`}
                      className="p-3 rounded-xl border border-[var(--gi-divider)] gi-surface-interactive flex items-center justify-between gap-3 block group transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono gi-text-primary">
                            #{p.number || p.id}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                              p.type === "credit"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {p.type === "credit" ? "In" : "Out"}
                          </span>
                        </div>
                        <p className="text-[11px] gi-text-secondary mt-0.5">
                          {p.date} • {p.time || "10:30 AM"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-bold font-mono gi-text-primary">
                          {formatCurrency(p.amount)}
                        </p>
                        <span className="text-[10px] gi-text-secondary group-hover:text-indigo-500 transition">
                          View &rarr;
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lightbox Photo Proof Modal */}
        {showPhotoModal && payment.attachmentUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative max-w-4xl max-h-[90vh] w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-4 bg-slate-800/90 text-white border-b border-slate-700">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <IoImageOutline className="text-indigo-400" />
                  <span>Photo Proof Attachment — #{payment.number || payment.id}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <IoClose className="text-xl" />
                </button>
              </div>

              <div className="p-4 flex-1 flex items-center justify-center overflow-auto">
                <img
                  src={payment.attachmentUrl}
                  alt="Full Size Payment Proof"
                  className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-lg"
                />
              </div>

              <div className="p-3 bg-slate-800/90 text-slate-300 text-xs flex items-center justify-between border-t border-slate-700">
                <span>{payment.attachmentName || "Receipt_Proof.jpg"}</span>
                <a
                  href={payment.attachmentUrl}
                  download={payment.attachmentName || "Receipt_Proof.jpg"}
                  className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
                >
                  Download Image
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
