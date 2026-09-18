"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  IoArrowBack,
  IoPrintOutline,
  IoDocumentTextOutline,
  IoCardOutline,
  IoCallOutline,
  IoMailOutline,
  IoChevronForward,
  IoReceiptOutline,
} from "react-icons/io5";
import { LiaFileInvoiceSolid } from "react-icons/lia";
import { FaFileInvoiceDollar } from "react-icons/fa6";
import { useApp } from "@/context/AppContext";
import PermissionGuard from "./PermissionGuard";

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

export default function InvoiceDetailsView() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params?.id;

  const { invoices = [], activeBusiness, currentUser, payments = [], hasPermission } = useApp();
  const [includePaymentHistory, setIncludePaymentHistory] = useState(false);

  const invoice = useMemo(() => {
    if (!invoiceId) return null;
    return invoices.find((inv) => String(inv.id) === String(invoiceId));
  }, [invoices, invoiceId]);

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

  if (!invoice) {
    return (
      <PermissionGuard module="Invoice">
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center p-6">
          <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-2xl text-slate-400">
            <IoDocumentTextOutline />
          </div>
          <div>
            <h2 className="text-lg font-bold gi-text-primary">Invoice Not Found</h2>
            <p className="text-xs gi-text-secondary mt-1 max-w-sm">
              The invoice details you are looking for may have been removed or does not exist.
            </p>
          </div>
          <Link href="/invoice">
            <button
              type="button"
              className="px-4 py-2 rounded-lg gi-btn-primary text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <IoArrowBack />
              Back to Invoices
            </button>
          </Link>
        </div>
      </PermissionGuard>
    );
  }

  const isSales = (invoice.invoiceType || invoice.type) === "sales";
  const party = invoice.party || invoice.supplier;
  const partyName = invoice.partyName || party?.partyName || "Party";
  const partyId = party?.id || invoice.partyId || invoice.supplierId;

  // Business / Seller Info
  const sellerName =
    activeBusiness?.name || currentUser?.businessName || "GI Books Business";
  const sellerAddress =
    formatAddress(activeBusiness?.address) || "Registered Business Office";
  const sellerPhone = activeBusiness?.phone || currentUser?.mobile || "";
  const sellerEmail = activeBusiness?.email || currentUser?.email || "";
  const sellerGSTIN = activeBusiness?.gstNumber || activeBusiness?.gstin || "";
  const sellerPAN = activeBusiness?.panNumber || "";
  const sellerLogo = activeBusiness?.logo || null;

  // Customer / Buyer Info
  const customerAddress =
    formatAddress(party?.billingAddress || party?.address) || "Address Not Provided";
  const customerShipping =
    formatAddress(party?.shippingAddress) || (party?.shippingAddress ? customerAddress : "");
  const customerPhone = party?.phone || party?.mobile || "";
  const customerEmail = party?.email || "";
  const customerGSTIN = party?.gstNumber || party?.gstin || "";
  const customerPAN = party?.panNumber || "";

  const invNum =
    typeof invoice.invoiceNumber === "object" && invoice.invoiceNumber !== null
      ? `${invoice.invoiceNumber.prefixEnabled ? invoice.invoiceNumber.prefix + " " : ""}${invoice.invoiceNumber.number || ""}${invoice.invoiceNumber.suffixEnabled ? " " + invoice.invoiceNumber.suffix : ""}`.trim() || "INV-0001"
      : String(invoice.invoiceNumberStr || invoice.invoiceNumber || `INV-${invoice.id}`);

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

  // Line Item & Tax Calculations
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
    <PermissionGuard module="Invoice">
      <div className="space-y-6 pb-12 select-none gi-page">
        {/* Navigation & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b gi-divider">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.replace("/invoice")}
              className="p-2 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer shrink-0 transition"
              title="Back to Invoices"
            >
              <IoArrowBack className="text-lg" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isSales ? "gi-badge-info" : "gi-badge-warning"}`}>
                  {isSales ? "Sales Invoice" : "Purchase Invoice"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${invoice.status === "paid"
                      ? "gi-badge-success"
                      : invoice.status === "partially_paid"
                        ? "gi-badge-warning"
                        : "gi-badge-danger"
                    }`}
                >
                  {invoice.status === "partially_paid" ? "Partially Paid" : (invoice.status || "unpaid")}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight mt-1">
                {invNum}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium gi-text-secondary select-none px-3 py-2 rounded-lg border gi-surface-interactive transition">
              <input
                type="checkbox"
                checked={includePaymentHistory}
                onChange={(e) => setIncludePaymentHistory(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
              <span>Include Payment History in Print</span>
            </label>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-lg gi-btn-primary text-xs font-semibold flex items-center gap-2 cursor-pointer transition shadow-xs"
            >
              <IoPrintOutline className="text-base" />
              <span>Print Invoice</span>
            </button>

            {dueAmount > 0 && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/payment/receivedPayment?type=${isSales ? "credit" : "debit"}&invoiceId=${invoice.id}&partyId=${partyId || ""}`
                  )
                }
                className="px-3.5 py-2 rounded-lg gi-badge-success text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
              >
                <IoCardOutline className="text-base" />
                <span>Record Payment</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="space-y-6">
          {/* Parties Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Seller / Business Details Card */}
            <div className="gi-card p-5 space-y-2 text-xs">
              <span className="gi-text-muted font-bold uppercase text-[10px] tracking-wider block border-b gi-divider pb-2">
                {isSales ? "Billed By (Seller / Business)" : "Billed To (Buyer / Business)"}
              </span>
              <p className="font-bold gi-text-primary text-sm pt-1">{sellerName}</p>
              <p className="gi-text-secondary leading-relaxed text-xs">{sellerAddress}</p>
              {sellerPhone && (
                <p className="gi-text-secondary flex items-center gap-1">
                  <IoCallOutline className="gi-text-muted" /> Phone: {sellerPhone}
                </p>
              )}
              {sellerEmail && (
                <p className="gi-text-secondary flex items-center gap-1">
                  <IoMailOutline className="gi-text-muted" /> Email: {sellerEmail}
                </p>
              )}
              {sellerGSTIN && (
                <p className="gi-text-primary font-medium">
                  GSTIN: <span className="font-semibold">{sellerGSTIN}</span>
                </p>
              )}
              {sellerPAN && <p className="gi-text-secondary">PAN: {sellerPAN}</p>}
            </div>

            {/* Buyer / Customer Details Card */}
            <div className="gi-card p-5 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b gi-divider pb-2">
                <span className="gi-text-muted font-bold uppercase text-[10px] tracking-wider">
                  {isSales ? "Billed To (Customer / Buyer)" : "Billed By (Supplier / Vendor)"}
                </span>
                {partyId && (
                  <Link
                    href={`/parties/${partyId}`}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <span>View Ledger</span>
                    <IoChevronForward className="text-xs" />
                  </Link>
                )}
              </div>
              <p className="font-bold gi-text-primary text-sm pt-1">{partyName}</p>
              <p className="gi-text-secondary leading-relaxed text-xs">{customerAddress}</p>
              {customerShipping && customerShipping !== customerAddress && (
                <p className="gi-text-muted text-[11px]">Ship To: {customerShipping}</p>
              )}
              {customerPhone && (
                <p className="gi-text-secondary flex items-center gap-1">
                  <IoCallOutline className="gi-text-muted" /> Phone: {customerPhone}
                </p>
              )}
              {customerEmail && (
                <p className="gi-text-secondary flex items-center gap-1">
                  <IoMailOutline className="gi-text-muted" /> Email: {customerEmail}
                </p>
              )}
              {customerGSTIN && (
                <p className="gi-text-primary font-medium">
                  GSTIN: <span className="font-semibold">{customerGSTIN}</span>
                </p>
              )}
              {customerPAN && <p className="gi-text-secondary">PAN: {customerPAN}</p>}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="gi-card p-5 space-y-4">
            <h2 className="text-base font-bold gi-text-primary">Line Items & Specifications</h2>

            <div className="gi-table-container overflow-x-auto">
              <table className="w-full text-left text-xs gi-table border-collapse">
                <thead>
                  <tr>
                    <th className="py-2.5 px-3 text-center w-10">#</th>
                    <th className="py-2.5 px-3">Item & Description</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                    <th className="py-2.5 px-3 text-right">Tax Rate</th>
                    <th className="py-2.5 px-3 text-right">Taxable Amt (₹)</th>
                    <th className="py-2.5 px-3 text-right">Tax Amt (₹)</th>
                    <th className="py-2.5 px-3 text-right">Total Line Amt (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y gi-divider">
                  {itemRowsData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center gi-text-muted text-xs">
                        No items attached to this invoice.
                      </td>
                    </tr>
                  ) : (
                    itemRowsData.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-[var(--gi-hover)] transition">
                        <td className="py-2.5 px-3 text-center gi-text-muted font-semibold">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold gi-text-primary">
                          {item.itemName || item.name || "Item"}
                          {item.hsnCode && (
                            <span className="block text-[10px] gi-text-muted font-normal">HSN: {item.hsnCode}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right gi-text-secondary">
                          {item.qty} {item.unit || ""}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono gi-text-secondary">
                          ₹{item.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right gi-text-secondary">
                          {item.formattedTax}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono gi-text-secondary">
                          ₹{item.taxableAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-indigo-600 dark:text-indigo-400">
                          ₹{item.taxAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold gi-text-primary">
                          ₹{item.lineAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 dark:border-zinc-700 font-bold bg-slate-50 dark:bg-zinc-800/60">
                    <td colSpan={2} className="py-3 px-3 text-right gi-text-primary uppercase text-[11px]">Column Totals:</td>
                    <td className="py-3 px-3 text-right gi-text-primary font-mono">{totalQty}</td>
                    <td className="py-3 px-3 text-right gi-text-muted">-</td>
                    <td className="py-3 px-3 text-right gi-text-muted">-</td>
                    <td className="py-3 px-3 text-right font-mono gi-text-primary">₹{computedTaxableSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-3 text-right font-mono text-indigo-600 dark:text-indigo-400">₹{computedTotalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-3 text-right font-mono text-sm gi-text-primary">₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Financial Breakdown & Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment History List Card */}
            <div className="gi-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b gi-divider pb-3">
                <h2 className="text-sm font-bold gi-text-primary flex items-center gap-2">
                  <IoReceiptOutline className="text-base text-indigo-600 dark:text-indigo-400" />
                  <span>Payment History &amp; Receipts</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold gi-badge-info">
                  {resolvedPaymentHistory.length} {resolvedPaymentHistory.length === 1 ? "Receipt" : "Receipts"}
                </span>
              </div>

              {resolvedPaymentHistory.length === 0 ? (
                <div className="py-6 text-center text-xs gi-text-muted">
                  No payment receipts recorded for this bill. (Outstanding Due: ₹{dueAmount.toLocaleString("en-IN")})
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs gi-table border-collapse">
                    <thead>
                      <tr className="text-[10px] uppercase gi-text-muted">
                        <th className="py-2 px-2">Receipt #</th>
                        <th className="py-2 px-2">Date &amp; Time</th>
                        <th className="py-2 px-2">Mode</th>
                        <th className="py-2 px-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y gi-divider">
                      {resolvedPaymentHistory.map((ph, idx) => (
                        <tr key={ph.id || idx} className="hover:bg-[var(--gi-hover)] transition">
                          <td className="py-2 px-2 font-bold gi-text-primary">#{ph.number || ph.id}</td>
                          <td className="py-2 px-2 gi-text-secondary">{ph.date} {ph.time && <span className="gi-text-muted">• {ph.time}</span>}</td>
                          <td className="py-2 px-2 gi-text-secondary">{ph.mode || "Cash"}</td>
                          <td className="py-2 px-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{Number(ph.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Financial Totals Breakdown Card */}
            <div className="gi-card p-5 space-y-3 text-xs">
              <h2 className="text-sm font-bold gi-text-primary border-b gi-divider pb-3">
                Financial Breakdown
              </h2>

              <div className="space-y-2">
                <div className="flex justify-between gi-text-secondary">
                  <span>Taxable Subtotal (Excl. Tax)</span>
                  <span className="font-mono font-semibold gi-text-primary">₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between text-indigo-600 dark:text-indigo-400 font-semibold">
                  <span>Total Calculated GST Tax</span>
                  <span className="font-mono">+ ₹{totalTaxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Discount</span>
                    <span className="font-mono">- ₹{discountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {additionalCharges.length > 0 &&
                  additionalCharges.map((ch, idx) => (
                    <div key={idx} className="flex justify-between gi-text-secondary">
                      <span>{ch.name || "Additional Charge"}</span>
                      <span className="font-mono">+ ₹{Number(ch.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}

                {roundOffAmount !== 0 && (
                  <div className="flex justify-between gi-text-muted">
                    <span>Round Off Adjustment</span>
                    <span className="font-mono">{roundOffAmount > 0 ? "+" : ""}₹{roundOffAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-3 border-t-2 gi-divider flex justify-between items-center text-sm font-extrabold gi-text-primary">
                  <span>Grand Total Amount</span>
                  <span className="font-mono text-base sm:text-lg">₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="pt-2 border-t border-dashed gi-divider flex justify-between items-center font-bold text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400">Total Paid: ₹{paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  <span className={dueAmount > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                    Net Balance Due: ₹{dueAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes / Terms & Conditions Block */}
          {invoice.notes && (
            <div className="gi-card p-5 space-y-1">
              <span className="gi-text-muted font-semibold uppercase text-[10px] tracking-wider">
                Terms &amp; Conditions / Notes
              </span>
              <p className="gi-text-secondary text-xs leading-relaxed">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </PermissionGuard>
  );
}
