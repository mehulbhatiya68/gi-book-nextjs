"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  IoClose,
  IoPrintOutline,
  IoCallOutline,
  IoMailOutline,
  IoReceiptOutline,
  IoWalletOutline,
} from "react-icons/io5";
import { LiaFileInvoiceSolid } from "react-icons/lia";
import { FaFileInvoiceDollar } from "react-icons/fa6";
import { useApp } from "@/context/AppContext";

const formatAddress = (addr) => {
  if (!addr) return "";
  if (typeof addr === "string") return addr.trim();
  if (typeof addr === "object") {
    const parts = [addr.address, addr.city, addr.state, addr.pinCode].filter(
      (part) => typeof part === "string" && part.trim().length > 0
    );
    return parts.join(", ");
  }
  return String(addr);
};

export default function InvoiceDetailsModal({ invoice, onClose, onRecordPayment }) {
  const { activeBusiness, currentUser, payments = [] } = useApp();
  const [includePaymentHistory, setIncludePaymentHistory] = useState(false);

  const resolvedPaymentHistory = useMemo(() => {
    if (!invoice) return [];

    const explicitHistory = Array.isArray(invoice.paymentHistory) ? invoice.paymentHistory : [];
    const invIdStr = String(invoice.id);
    const invNumStr = typeof invoice.invoiceNumber === "object"
      ? String(invoice.invoiceNumber?.number || "")
      : String(invoice.invoiceNumberStr || invoice.invoiceNumber || "");
    const invDate = invoice.invoiceDate || invoice.date || new Date().toISOString().split("T")[0];
    const paidAmount = Number(invoice.paidAmount || 0);

    const appPayments = (payments || []).filter((p) => {
      if (p.invoiceId && String(p.invoiceId) === invIdStr) return true;
      if (p.invoiceNumber && invNumStr && String(p.invoiceNumber).toLowerCase() === invNumStr.toLowerCase()) return true;
      if (p.invoiceNo && invNumStr && String(p.invoiceNo).toLowerCase() === invNumStr.toLowerCase()) return true;
      return false;
    });

    const combined = [...explicitHistory];
    appPayments.forEach((ap) => {
      const exists = combined.some(
        (cp) => String(cp.id) === String(ap.id) || (cp.number && String(cp.number) === String(ap.number || ap.receiptNo))
      );
      if (!exists) {
        combined.push({
          id: ap.id,
          number: ap.number || ap.receiptNo || `REC-${ap.id}`,
          date: ap.date || (ap.createdAt ? new Date(ap.createdAt).toLocaleDateString("en-IN") : invDate),
          time: ap.time || (ap.createdAt ? new Date(ap.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""),
          mode: ap.mode || ap.paymentMode || "Cash",
          referenceNumber: ap.referenceNumber || ap.refNo || "",
          recordedBy: ap.createdBy || ap.recordedBy || "System",
          amount: Number(ap.amount || 0),
        });
      }
    });

    if (combined.length === 0 && paidAmount > 0) {
      combined.push({
        id: `init-${invoice.id}`,
        number: `REC-${invoice.id}`,
        date: invDate,
        time: "Initial Payment",
        mode: invoice.paymentMode || "Cash",
        referenceNumber: "Payment on Invoice Issue",
        recordedBy: invoice.createdBy || "Business Owner",
        amount: paidAmount,
      });
    }

    return combined;
  }, [invoice, payments]);

  if (!invoice) return null;

  const isSales = (invoice.invoiceType || invoice.type) === "sales";
  const party = invoice.party || invoice.supplier;
  const partyName = invoice.partyName || party?.partyName || "Party";
  const partyId = party?.id;

  // Business / Seller Info
  const sellerName =
    activeBusiness?.name || currentUser?.businessName || "GI Books Business";
  const sellerAddress =
    formatAddress(activeBusiness?.address) || "Registered Business Office";
  const sellerPhone =
    activeBusiness?.phone || currentUser?.mobile || "";
  const sellerEmail =
    activeBusiness?.email || currentUser?.email || "";
  const sellerGSTIN =
    activeBusiness?.gstNumber || activeBusiness?.gstin || "";
  const sellerPAN = activeBusiness?.panNumber || "";
  const sellerLogo = activeBusiness?.logo || null;

  // Customer / Buyer Info
  const customerAddress =
    formatAddress(party?.billingAddress || party?.address) || "Address Not Provided";
  const customerShipping =
    formatAddress(party?.shippingAddress) || (party?.shippingAddress ? customerAddress : "");
  const customerPhone = party?.phone || "";
  const customerEmail = party?.email || "";
  const customerGSTIN = party?.gstNumber || party?.gstin || "";
  const customerPAN = party?.panNumber || "";

  const invNum =
    typeof invoice.invoiceNumber === "object" && invoice.invoiceNumber !== null
      ? `${invoice.invoiceNumber.prefixEnabled ? invoice.invoiceNumber.prefix + " " : ""}${invoice.invoiceNumber.number || ""}${invoice.invoiceNumber.suffixEnabled ? " " + invoice.invoiceNumber.suffix : ""}`.trim() || "INV-0001"
      : String(invoice.invoiceNumberStr || invoice.invoiceNumber || "INV-0001");

  const invDate = invoice.invoiceDate || invoice.date || new Date().toISOString().split("T")[0];
  const items = invoice.items || [];
  const totalAmount = Number(invoice.totalAmount || 0);
  const paidAmount = Number(invoice.paidAmount || 0);
  const dueAmount = Math.max(0, totalAmount - paidAmount);

  const parseGstRate = (gstVal) => {
    if (!gstVal || gstVal === "None") return 0;
    const num = parseFloat(String(gstVal).replace(/[^\d.]/g, ""));
    return isNaN(num) ? 0 : num;
  };

  // Detailed Line Item & Tax Calculations
  const itemRowsData = items.map((item) => {
    const qty = Number(item.quantity || item.qty || 1);
    const rate = Number(item.price || item.rate || item.salesPrice || item.purchasePrice || 0);
    const gstRate = item.gstRate ?? parseGstRate(item.gst || item.tax);
    const rawTaxStr = item.tax || item.gst || (gstRate ? `${gstRate}%` : "0%");
    const formattedTax = String(rawTaxStr).includes("%") ? String(rawTaxStr) : `${rawTaxStr}%`;

    let taxableAmt = Number(item.taxableAmount);
    let taxAmt = Number(item.taxAmount);
    let lineAmt = Number(item.lineTotal || item.amount || item.total);

    if (isNaN(taxableAmt) || isNaN(taxAmt) || taxableAmt <= 0) {
      if (isNaN(lineAmt) || lineAmt <= 0) {
        lineAmt = qty * rate;
      }
      if (gstRate > 0) {
        taxableAmt = lineAmt / (1 + gstRate / 100);
        taxAmt = lineAmt - taxableAmt;
      } else {
        taxableAmt = lineAmt;
        taxAmt = 0;
      }
    }

    if (isNaN(lineAmt)) lineAmt = taxableAmt + taxAmt;

    return {
      ...item,
      qty,
      rate,
      gstRate,
      formattedTax,
      taxableAmt,
      taxAmt,
      lineAmt,
    };
  });

  let computedTaxableSubtotal = 0;
  let computedTotalTax = 0;
  let totalQty = 0;

  itemRowsData.forEach((row) => {
    computedTaxableSubtotal += row.taxableAmt;
    computedTotalTax += row.taxAmt;
    totalQty += row.qty;
  });

  const subtotal = invoice.subtotal !== undefined && invoice.subtotal !== null
    ? Number(invoice.subtotal)
    : (computedTaxableSubtotal > 0 ? computedTaxableSubtotal : (totalAmount - computedTotalTax));

  const totalTaxAmount = invoice.taxAmount !== undefined && invoice.taxAmount !== null
    ? Number(invoice.taxAmount)
    : computedTotalTax;

  const discountAmount = Number(invoice.discountAmount || 0);
  const additionalCharges = invoice.additionalCharges || [];
  const roundOffAmount = Number(invoice.roundOffAmount || 0);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Pop-up blocker prevented printing. Please allow pop-ups for this site.");
      return;
    }

    const bizName = sellerName;
    const bizAddress = sellerAddress;
    const bizPhone = sellerPhone;
    const bizEmail = sellerEmail;
    const bizGSTIN = sellerGSTIN;
    const customerName = partyName;

    const paymentHistoryHTML = includePaymentHistory
      ? `
        <div style="margin-top: 25px; page-break-inside: avoid;">
          <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
            <span>Payment &amp; Transaction Details</span>
            <span style="font-size: 11px; font-weight: 600; color: #475569;">(${resolvedPaymentHistory.length} ${resolvedPaymentHistory.length === 1 ? "Receipt" : "Receipts"})</span>
          </div>
          ${resolvedPaymentHistory.length > 0 ? `
            <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="width: 35px; text-align: center; border: 1px solid #cbd5e1; padding: 8px;">#</th>
                  <th style="border: 1px solid #cbd5e1; padding: 8px;">Receipt / Txn No.</th>
                  <th style="border: 1px solid #cbd5e1; padding: 8px;">Date &amp; Time</th>
                  <th style="border: 1px solid #cbd5e1; padding: 8px;">Payment Mode</th>
                  <th style="border: 1px solid #cbd5e1; padding: 8px;">Ref / Instrument No.</th>
                  <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Amount Paid (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${resolvedPaymentHistory.map((p, idx) => `
                  <tr>
                    <td style="text-align: center; border: 1px solid #e2e8f0; padding: 7px;">${idx + 1}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 7px;"><strong>#${p.number || p.id || ("REC-" + (idx + 1))}</strong></td>
                    <td style="border: 1px solid #e2e8f0; padding: 7px;">${p.date || invDate} ${p.time ? `<span style="color: #64748b;">• ${p.time}</span>` : ""}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 7px;">${p.mode || "Cash"}</td>
                    <td style="border: 1px solid #e2e8f0; padding: 7px;">${p.referenceNumber || "-"}</td>
                    <td style="text-align: right; border: 1px solid #e2e8f0; padding: 7px; font-weight: bold; color: #059669;">₹${Number(p.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join("")}
              </tbody>
              <tfoot>
                <tr style="background: #ecfdf5; font-weight: 800; border: 2px solid #10b981;">
                  <td colspan="5" style="text-align: right; padding: 8px 12px; color: #047857;">TOTAL AMOUNT PAID:</td>
                  <td style="text-align: right; padding: 8px 12px; font-size: 12px; color: #047857;">₹${paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
          ` : `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 11px; color: #64748b; text-align: center;">
              No payment receipts recorded for this invoice yet. (Net Balance Due: ₹${dueAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })})
            </div>
          `}
        </div>
      `
      : "";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${isSales ? "Sales Invoice" : "Purchase Invoice"} #${invNum} - ${bizName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #0f172a; background: #ffffff; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
            .biz-name { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
            .biz-sub { font-size: 12px; color: #475569; margin-top: 4px; }
            .inv-badge { font-size: 18px; font-weight: 800; text-transform: uppercase; color: #4f46e5; text-align: right; }
            .inv-meta { font-size: 12px; color: #475569; margin-top: 4px; text-align: right; }
            .addresses { display: flex; justify-content: space-between; margin-bottom: 25px; gap: 20px; }
            .addr-box { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; font-size: 12px; }
            .addr-title { font-weight: 700; text-transform: uppercase; color: #64748b; font-size: 11px; margin-bottom: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th { background: #f1f5f9; text-align: left; padding: 10px 12px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f172a; }
            td { padding: 9px 12px; border: 1px solid #e2e8f0; color: #334155; }
            tr:nth-child(even) { background: #f8fafc; }
            .totals-container { display: flex; justify-content: flex-end; margin-top: 20px; }
            .totals-table { width: 340px; font-size: 12px; }
            .totals-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .totals-grand { font-weight: 800; font-size: 15px; border-top: 2px solid #0f172a; padding-top: 8px; margin-top: 6px; color: #0f172a; }
            .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="biz-name">${bizName}</h1>
              <p class="biz-sub">${bizAddress} ${bizPhone ? "• Ph: " + bizPhone : ""} ${bizEmail ? "• Email: " + bizEmail : ""} ${bizGSTIN ? "• GSTIN: " + bizGSTIN : ""}</p>
            </div>
            <div>
              <div class="inv-badge">${isSales ? "TAX INVOICE" : "PURCHASE INVOICE"}</div>
              <div class="inv-meta">
                <strong>Invoice #:</strong> ${invNum}<br/>
                <strong>Date:</strong> ${invDate}<br/>
                <strong>Status:</strong> ${invoice.status ? invoice.status.toUpperCase() : "COMPLETED"}
              </div>
            </div>
          </div>

          <div class="addresses">
            <div class="addr-box">
              <div class="addr-title">Billed By (Seller / Business)</div>
              <strong>${sellerName}</strong><br/>
              ${sellerAddress ? sellerAddress + "<br/>" : ""}
              ${sellerPhone ? "Phone: " + sellerPhone + "<br/>" : ""}
              ${sellerEmail ? "Email: " + sellerEmail + "<br/>" : ""}
              ${sellerGSTIN ? "GSTIN: " + sellerGSTIN : ""}
            </div>
            <div class="addr-box">
              <div class="addr-title">Billed To (Customer / Buyer)</div>
              <strong>${customerName}</strong><br/>
              ${customerAddress ? customerAddress + "<br/>" : ""}
              ${customerPhone ? "Phone: " + customerPhone + "<br/>" : ""}
              ${customerEmail ? "Email: " + customerEmail + "<br/>" : ""}
              ${customerGSTIN ? "GSTIN: " + customerGSTIN : ""}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 35px; text-align: center;">#</th>
                <th>Item &amp; Description</th>
                <th style="text-align: right;">Qty</th>
                <th style="text-align: right;">Rate (₹)</th>
                <th style="text-align: right;">Tax Rate</th>
                <th style="text-align: right;">Taxable Amount (₹)</th>
                <th style="text-align: right;">Tax Amount (₹)</th>
                <th style="text-align: right;">Total Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${itemRowsData.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align: center; color: #94a3b8; padding: 20px;">No line items attached.</td>
                </tr>
              ` : itemRowsData.map((item, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td><strong>${item.itemName || item.name || "Item"}</strong>${item.hsnCode ? `<br/><span style="font-size: 10px; color: #64748b;">HSN: ${item.hsnCode}</span>` : ""}</td>
                  <td style="text-align: right;">${item.qty} ${item.unit || ""}</td>
                  <td style="text-align: right;">₹${item.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td style="text-align: right;">${item.formattedTax}</td>
                  <td style="text-align: right;">₹${item.taxableAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td style="text-align: right;">₹${item.taxAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td style="text-align: right; font-weight: bold;">₹${item.lineAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
              `).join("")}
            </tbody>
            <tfoot>
              <tr style="background: #f1f5f9; font-weight: 800; border-top: 2px solid #0f172a;">
                <td colspan="2" style="text-align: right; padding: 10px 12px; color: #0f172a;">COLUMN TOTALS:</td>
                <td style="text-align: right; padding: 10px 12px; color: #0f172a;">${totalQty}</td>
                <td style="text-align: right; padding: 10px 12px;">-</td>
                <td style="text-align: right; padding: 10px 12px;">-</td>
                <td style="text-align: right; padding: 10px 12px; font-size: 12px; color: #0f172a;">₹${computedTaxableSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td style="text-align: right; padding: 10px 12px; font-size: 12px; color: #4f46e5;">₹${computedTotalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td style="text-align: right; padding: 10px 12px; font-size: 13px; color: #0f172a;">₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>

          <div class="totals-container">
            <div class="totals-table">
              <div class="totals-row"><span>Taxable Subtotal (Excl. Tax):</span> <span>₹${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
              <div class="totals-row" style="color: #4f46e5; font-weight: 600;"><span>Total GST Tax Amount:</span> <span>+ ₹${totalTaxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
              ${discountAmount > 0 ? `<div class="totals-row" style="color: #059669;"><span>Discount:</span> <span>- ₹${discountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>` : ""}
              <div class="totals-row totals-grand"><span>Grand Total (Incl. Tax):</span> <span>₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
              <div class="totals-row"><span>Total Amount Paid:</span> <span>₹${paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
              <div class="totals-row" style="font-weight: 700; color: ${dueAmount > 0 ? "#e11d48" : "#059669"};"><span>Net Balance Due:</span> <span>₹${dueAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
            </div>
          </div>

          ${paymentHistoryHTML}

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

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 md:p-6 overflow-y-auto"
        onClick={onClose}
      >
        <style jsx global>{`
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              visibility: hidden;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
            #printable-invoice-area, #printable-invoice-area * {
              visibility: visible;
            }
            #printable-invoice-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              max-width: 100% !important;
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              padding: 20px !important;
              background: white !important;
              color: black !important;
              margin: 0 !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        <motion.div
          id="printable-invoice-area"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-zinc-900 p-4 sm:p-7 shadow-2xl space-y-5 text-slate-900 dark:text-white border border-slate-200 dark:border-zinc-800"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3 min-w-0">
              {sellerLogo ? (
                <div className="h-12 w-12 rounded-2xl border border-black/10 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  <img src={sellerLogo} alt="Logo" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div
                  className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${isSales ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                    }`}
                >
                  {isSales ? (
                    <LiaFileInvoiceSolid className="text-2xl" />
                  ) : (
                    <FaFileInvoiceDollar className="text-xl" />
                  )}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold truncate">{invNum}</h2>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${invoice.status === "paid"
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : invoice.status === "partially_paid"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                  >
                    {invoice.status === "partially_paid" ? "Partially Paid" : (invoice.status || "unpaid")}
                  </span>
                </div>

                <p className="text-xs text-black/50 mt-0.5">
                  {isSales ? "TAX INVOICE (SALES)" : "PURCHASE BILL / INVOICE"} • Date:{" "}
                  {new Date(invDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="no-print h-9 w-9 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition cursor-pointer shrink-0"
            >
              <IoClose className="text-2xl" />
            </button>
          </div>

          {/* Both Parties' Details Card (Seller & Customer) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-black/[0.03] border border-black/10 text-xs">
            {/* Seller / Business Details */}
            <div className="space-y-0.5 pr-2 border-b sm:border-b-0 sm:border-r border-black/10 pb-2.5 sm:pb-0">
              <p className="text-[10px] uppercase font-bold text-black/40 tracking-wider">
                {isSales ? "Billed By (Seller / Business)" : "Billed To (Buyer / Business)"}
              </p>
              <p className="text-sm font-bold text-black truncate">{sellerName}</p>
              <p className="text-black/70 leading-relaxed text-[11px]">{sellerAddress}</p>
              {sellerPhone && (
                <p className="text-black/60 flex items-center gap-1 text-[11px]">
                  <IoCallOutline className="text-black/40" /> Phone: {sellerPhone}
                </p>
              )}
              {sellerEmail && (
                <p className="text-black/60 flex items-center gap-1 text-[11px]">
                  <IoMailOutline className="text-black/40" /> Email: {sellerEmail}
                </p>
              )}
              {sellerGSTIN && (
                <p className="font-medium text-black/80 text-[11px]">
                  GSTIN: <span className="font-semibold">{sellerGSTIN}</span>
                </p>
              )}
              {sellerPAN && <p className="text-black/60 text-[11px]">PAN: {sellerPAN}</p>}
            </div>

            {/* Customer / Party Details */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-bold text-black/40 tracking-wider">
                  {isSales ? "Billed To (Customer / Buyer)" : "Billed By (Supplier / Vendor)"}
                </p>
                {partyId && (
                  <Link
                    href={`/parties/${partyId}`}
                    onClick={onClose}
                    className="no-print text-[11px] text-sky-700 font-semibold hover:underline"
                  >
                    View Ledger →
                  </Link>
                )}
              </div>
              <p className="text-sm font-bold text-black truncate">{partyName}</p>
              <p className="text-black/70 leading-relaxed text-[11px]">{customerAddress}</p>
              {customerShipping && customerShipping !== customerAddress && (
                <p className="text-black/50 text-[11px]">
                  Ship To: {customerShipping}
                </p>
              )}
              {customerPhone && (
                <p className="text-black/60 flex items-center gap-1 text-[11px]">
                  <IoCallOutline className="text-black/40" /> Phone: {customerPhone}
                </p>
              )}
              {customerEmail && (
                <p className="text-black/60 flex items-center gap-1 text-[11px]">
                  <IoMailOutline className="text-black/40" /> Email: {customerEmail}
                </p>
              )}
              {customerGSTIN && (
                <p className="font-medium text-black/80 text-[11px]">
                  GSTIN: <span className="font-semibold">{customerGSTIN}</span>
                </p>
              )}
              {customerPAN && <p className="text-black/60 text-[11px]">PAN: {customerPAN}</p>}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-black/15 rounded-xl overflow-hidden">
            <div className="bg-black/5 px-3 py-2 grid grid-cols-12 text-[11px] font-bold text-black/70 uppercase tracking-wider">
              <span className="col-span-1">#</span>
              <span className="col-span-4">Item & Description</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-2 text-right">Rate</span>
              <span className="col-span-3 text-right">Amount</span>
            </div>

            <div className="divide-y divide-black/5 text-xs">
              {items.length === 0 ? (
                <div className="p-3 text-center text-xs text-black/40">
                  No line items attached.
                </div>
              ) : (
                items.map((item, idx) => {
                  const qty = Number(item.quantity || 1);
                  const price = Number(item.price || item.salesPrice || item.purchasePrice || 0);
                  const itemTotal = Number(item.lineTotal || (qty * price));
                  const itemTax = Number(item.taxAmount || 0);

                  return (
                    <div key={item.id || idx} className="px-3 py-2 grid grid-cols-12 items-center">
                      <span className="col-span-1 text-black/40 font-semibold">{idx + 1}</span>

                      <div className="col-span-4 min-w-0 pr-2">
                        <p className="font-semibold text-xs sm:text-sm truncate">{item.itemName || item.name}</p>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-black/50 mt-0.5">
                          {item.hsnCode && <span>HSN: {item.hsnCode}</span>}
                          {item.gst && item.gst !== "None" && (
                            <span className="bg-purple-100 text-purple-700 px-1 py-0.2 rounded font-medium text-[9px]">
                              {item.gst}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="col-span-2 text-center font-medium text-xs">
                        {qty} {item.unit || ""}
                      </span>

                      <span className="col-span-2 text-right text-black/70 text-xs">
                        ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>

                      <div className="col-span-3 text-right">
                        <p className="font-bold text-xs sm:text-sm">
                          ₹{itemTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>
                        {itemTax > 0 && (
                          <p className="text-[9px] text-purple-700">
                            Incl. ₹{itemTax.toFixed(2)} Tax
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Financial Breakdown & Summary */}
          <div className="rounded-xl bg-black/[0.03] border border-black/10 p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-black/60">
              <span>Taxable Subtotal</span>
              <span className="font-medium text-black">
                ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {Number(invoice.taxAmount || 0) > 0 && (
              <div className="flex items-center justify-between text-purple-800 font-medium">
                <span>Calculated Tax / GST</span>
                <span>+ ₹{Number(invoice.taxAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-green-700 font-medium">
                <span>Discount ({invoice.discountType === "percent" ? `${invoice.discountValue}%` : "Fixed"})</span>
                <span>- ₹{discountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {additionalCharges.length > 0 &&
              additionalCharges.map((ch, idx) => (
                <div key={idx} className="flex items-center justify-between text-black/70">
                  <span>{ch.name || "Additional Charge"}</span>
                  <span>+ ₹{Number(ch.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              ))}

            {roundOffAmount !== 0 && (
              <div className="flex items-center justify-between text-black/50">
                <span>Round Off Adjustment</span>
                <span>
                  {roundOffAmount > 0 ? "+" : ""}₹{roundOffAmount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="pt-1.5 border-t border-black/10 flex items-center justify-between text-sm sm:text-base font-bold">
              <span>Grand Total Amount</span>
              <span className="text-lg sm:text-xl font-extrabold text-black">
                ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-dashed border-black/10 font-semibold">
              <span className="text-green-700">Total Paid: ₹{paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              <span className={dueAmount > 0 ? "text-red-700 font-bold" : "text-green-700"}>
                Balance Due: ₹{dueAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Payment History Table Preview (Toggled by Checkbox & Printed accordingly) */}
          {includePaymentHistory && (
            <div className="rounded-xl bg-black/[0.02] border border-black/10 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs uppercase font-bold text-black/60 tracking-wider flex items-center gap-1.5">
                  <IoReceiptOutline className="text-sm" /> Payment & Transaction Details
                </p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 text-black/60 font-medium">
                  {resolvedPaymentHistory.length} {resolvedPaymentHistory.length === 1 ? "Receipt" : "Receipts"}
                </span>
              </div>

              {resolvedPaymentHistory.length === 0 ? (
                <div className="py-2 text-center text-xs text-black/40">
                  No payment receipts recorded for this bill. (Outstanding Balance: ₹{dueAmount.toLocaleString("en-IN")})
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-black/10 text-black/50 text-[10px]">
                        <th className="py-1 pr-2">Date & Time</th>
                        <th className="py-1 px-2">Mode / Ref</th>
                        <th className="py-1 px-2">Recorded By</th>
                        <th className="py-1 pl-2 text-right">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {resolvedPaymentHistory.map((ph, index) => (
                        <tr key={ph.id || index}>
                          <td className="py-1.5 pr-2 font-medium text-[11px]">
                            {ph.date} {ph.time && <span className="text-black/40 font-normal">• {ph.time}</span>}
                          </td>
                          <td className="py-1.5 px-2 text-black/70 text-[11px]">
                            <span className="font-semibold">{ph.mode || "Cash"}</span>
                            {ph.referenceNumber && (
                              <span className="text-black/40 block text-[9px]">Ref: {ph.referenceNumber}</span>
                            )}
                          </td>
                          <td className="py-1.5 px-2 text-black/60 text-[11px]">
                            {ph.recordedBy || "Owner"}
                          </td>
                          <td className="py-1.5 pl-2 text-right font-bold text-green-700 text-[11px]">
                            ₹{Number(ph.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Notes & Terms */}
          {invoice.notes && (
            <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-2.5 text-xs text-amber-900">
              <p className="font-semibold uppercase tracking-wider text-[9px] text-amber-700">Terms & Conditions / Notes</p>
              <p className="mt-0.5 leading-relaxed text-[11px]">{invoice.notes}</p>
            </div>
          )}

          {/* Signatory & Verification Block */}
          <div className="grid grid-cols-2 pt-3 border-t border-black/10 text-xs">
            <div>
              <p className="text-[10px] text-black/50 italic">Thank you for your business!</p>
              <p className="text-[9px] text-black/40 mt-0.5">Computer generated invoice. No signature required unless sealed.</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-black text-xs">{sellerName}</p>
              <div className="h-7"></div>
              <p className="text-[9px] uppercase font-bold text-black/40 border-t border-dashed border-black/20 pt-0.5 inline-block">
                Authorized Signatory
              </p>
            </div>
          </div>

          {/* Action Buttons (Hidden when printing) */}
          <div className="no-print flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2.5 rounded-xl bg-black text-white hover:bg-black/80 transition text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <IoPrintOutline className="text-lg" />
                <span>Print Invoice</span>
              </button>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-black/80 select-none bg-black/5 hover:bg-black/10 px-3 py-2 rounded-xl transition border border-black/5">
                <input
                  type="checkbox"
                  checked={includePaymentHistory}
                  onChange={(e) => setIncludePaymentHistory(e.target.checked)}
                  className="w-4 h-4 accent-black rounded cursor-pointer"
                />
                <span>Include Payment History</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              {onRecordPayment && dueAmount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRecordPayment(invoice);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-black/20 hover:bg-black/5 transition text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <IoWalletOutline className="text-lg" />
                  <span>Record Payment</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-black/10 hover:bg-black/20 transition text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
