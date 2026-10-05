"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  IoClose,
  IoEyeOutline,
  IoCallOutline,
  IoMailOutline,
  IoReceiptOutline,
  IoWalletOutline,
  IoPencilOutline,
  IoChevronForward,
} from "react-icons/io5";
import { LiaFileInvoiceSolid } from "react-icons/lia";
import { FaFileInvoiceDollar } from "react-icons/fa6";
import { useAuth } from "@/context/AuthContext";
import { usePreferences } from "@/lib/hooks/usePreferences";
import { paymentApi } from "@/lib/api/payment";
import { invoiceApi } from "@/lib/api/invoice";

const formatAddress = (addr: any) => {
  if (!addr) return "";
  if (typeof addr === "string") return addr.trim();
  if (typeof addr === "object") {
    const parts = [addr.street || addr.address, addr.city, addr.state, addr.pin || addr.pinCode || addr.pincode].filter(
      (part) => typeof part === "string" && part.trim().length > 0
    );
    return parts.join(", ");
  }
  return String(addr);
};

export default function InvoiceDetailsModal({ invoice, onClose, onRecordPayment }: { invoice: any; onClose: () => void; onRecordPayment?: (inv: any) => void }) {
  const router = useRouter();
  const { activeBusiness, currentUser } = useAuth();

  const [fullInvoice, setFullInvoice] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    if (invoice?.id) {
      invoiceApi.getInvoiceDetails(invoice.id)
        .then((res: any) => {
          const detail = res?.body?.invoice || res?.body || res;
          if (detail && typeof detail === "object") {
            setFullInvoice(detail);
          }
        })
        .catch(() => setFullInvoice(null));
    } else {
      setFullInvoice(null);
    }
  }, [invoice?.id]);

  useEffect(() => {
    if (activeBusiness?.id) {
      paymentApi.getPayments({ silentError: true }).then((res: any) => {
        const list = Array.isArray(res?.body) ? res.body : (res?.body?.data || res?.body?.payments || []);
        setPayments(Array.isArray(list) ? list : []);
      }).catch(() => setPayments([]));
    } else {
      setPayments([]);
    }
  }, [activeBusiness?.id]);

  const invObj = fullInvoice || invoice;

  const resolvedPaymentHistory = useMemo(() => {
    if (!invObj) return [];

    const explicitHistory = Array.isArray(invObj.payments) ? invObj.payments : (Array.isArray(invObj.paymentHistory) ? invObj.paymentHistory : []);
    const invIdStr = String(invObj.id);
    const invNumStr = String(invObj.invoice_number || invObj.invoiceNumberStr || invObj.invoiceNumber || "").toLowerCase().trim();
    const invDate = invObj.invoice_date || invObj.invoiceDate || invObj.date || new Date().toISOString().split("T")[0];

    const appPayments = (payments || []).filter((p) => {
      // Exclude transfers (account-to-account transfers)
      const isTransfer = Boolean(
        p.is_transfer ||
        p.type === "transfer" ||
        p.transaction_type === "transfer" ||
        p.category === "transfer" ||
        p.is_ledger_transfer
      );
      if (isTransfer) return false;

      const pInvId = String(p.sales_invoice_id || p.purchase_invoice_id || p.invoice_id || p.invoiceId || "");
      const pInvNum = String(p.invoice_number || p.invoiceNumber || p.invoiceNo || "").toLowerCase().trim();

      if (pInvId && pInvId === invIdStr) return true;
      if (invNumStr && pInvNum && pInvNum === invNumStr) return true;
      return false;
    });

    const combined: any[] = [];
    explicitHistory.forEach((eh: any) => {
      const isTransfer = Boolean(eh.is_transfer || eh.type === "transfer" || eh.transaction_type === "transfer");
      if (isTransfer) return;

      combined.push({
        id: eh.id || `eh-${Math.random()}`,
        number: eh.number || eh.transaction_number || eh.receiptNo || (eh.id ? `TXN-${String(eh.id).slice(0, 8).toUpperCase()}` : "—"),
        date: eh.date || eh.transaction_date || invDate,
        time: eh.time || "",
        mode: eh.mode || eh.payment_ledger?.name || "Cash / Bank",
        referenceNumber: eh.referenceNumber || eh.remark || eh.reference || "-",
        recordedBy: eh.recordedBy || "System",
        amount: Number(eh.amount || 0),
      });
    });

    appPayments.forEach((ap) => {
      const exists = combined.some(
        (cp) => String(cp.id) === String(ap.id) || (cp.number && String(cp.number) === String(ap.transaction_number || ap.number || ap.id))
      );
      if (!exists) {
        combined.push({
          id: ap.id,
          number: ap.transaction_number || ap.number || ap.receiptNo || (ap.id ? `TXN-${String(ap.id).slice(0, 8).toUpperCase()}` : "—"),
          date: ap.transaction_date || ap.date || (ap.created_at ? ap.created_at.split("T")[0] : invDate),
          time: ap.time || "",
          mode: ap.payment_ledger?.name || ap.mode || ap.paymentMode || "Cash",
          referenceNumber: ap.remark || ap.referenceNumber || ap.refNo || "",
          recordedBy: ap.createdBy || ap.recordedBy || "System",
          amount: Number(ap.amount || 0),
        });
      }
    });

    return combined;
  }, [invObj, payments]);

  if (!invObj) return null;

  const isSales = (invObj.invoiceType || invObj.type || "sales") === "sales";
  const party = invObj.ledger || invObj.party || invObj.supplier || {};
  const partyName = party?.name || party?.partyName || invObj.partyName || "Party";
  const partyId = party?.id || party?.ledger_id || invObj.ledger_id || invObj.party_id;

  // Business / Seller Info
  const sellerName = activeBusiness?.name || currentUser?.businessName || "Business Name";
  const sellerAddress = formatAddress(activeBusiness?.address) || "Registered Business Office";
  const sellerPhone = activeBusiness?.phone || currentUser?.mobile || "";
  const sellerEmail = activeBusiness?.email || currentUser?.email || "";
  const sellerGSTIN = activeBusiness?.gst_number || activeBusiness?.gstNumber || activeBusiness?.gstin || "";
  const sellerPAN = activeBusiness?.panNumber || "";
  const sellerLogo = activeBusiness?.logo || null;

  // Customer / Buyer Info
  const customerAddress = formatAddress(party?.billing_address || party?.billingAddress || party?.address) || "Address Not Provided";
  const customerShipping = formatAddress(party?.shipping_address || party?.shippingAddress) || customerAddress;
  const customerPhone = party?.contact_number || party?.phone || party?.mobile || "";
  const customerEmail = party?.email || "";
  const customerGSTIN = party?.gst_number || party?.gstNumber || party?.gstin || "";
  const customerPAN = party?.panNumber || "";

  const invNum = String(invObj.invoice_number || invObj.invoiceNumberStr || invObj.invoiceNumber || `INV-${invObj.id}`);
  const invDate = invObj.invoice_date || invObj.invoiceDate || invObj.date || new Date().toISOString().split("T")[0];
  const dueDate = invObj.due_date || invObj.dueDate || invDate;

  const items = Array.isArray(invObj.items) ? invObj.items : [];
  const totalAmount = Number(invObj.total_amount ?? invObj.totalAmount ?? invObj.grandTotal ?? 0);
  const paidAmount = Number(invObj.paid_amount ?? invObj.paidAmount ?? 0);
  const dueAmount = Number(invObj.balance_due ?? invObj.dueAmount ?? Math.max(0, totalAmount - paidAmount));

  const parseGstRate = (gstVal: any) => {
    if (!gstVal || gstVal === "None") return 0;
    const num = parseFloat(String(gstVal).replace(/[^\d.]/g, ""));
    return isNaN(num) ? 0 : num;
  };

  // Detailed Line Item & Tax Calculations
  const itemRowsData = items.map((item: any) => {
    const itemName = item.item?.name || item.itemName || item.name || item.title || "Item";
    const hsnCode = item.item?.hsn_sac_code || item.hsn_sac_code || item.hsnCode || "";
    const qty = Number(item.quantity ?? item.qty ?? 1);
    const rate = Number(item.rate ?? item.price ?? item.salesPrice ?? item.purchasePrice ?? 0);
    const gstRate = item.tax_rate ?? item.gstRate ?? parseGstRate(item.gst || item.tax);
    const rawTaxStr = item.tax || item.gst || (gstRate ? `${gstRate}%` : "0%");
    const formattedTax = String(rawTaxStr).includes("%") ? String(rawTaxStr) : `${rawTaxStr}%`;

    let taxableAmt = Number(item.taxableAmount);
    let taxAmt = Number(item.tax_amount ?? item.taxAmount);
    let lineAmt = Number(item.amount ?? item.lineTotal ?? item.total);

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
      itemName,
      hsnCode,
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
  let computedTotalLineAmount = 0;
  let totalQty = 0;

  itemRowsData.forEach((row: any) => {
    computedTaxableSubtotal += row.taxableAmt;
    computedTotalTax += row.taxAmt;
    computedTotalLineAmount += row.lineAmt;
    totalQty += row.qty;
  });

  const subtotal = invObj.subtotal !== undefined && invObj.subtotal !== null
    ? Number(invObj.subtotal)
    : (computedTaxableSubtotal > 0 ? computedTaxableSubtotal : (totalAmount - computedTotalTax));

  const totalTaxAmount = invObj.tax_amount !== undefined && invObj.tax_amount !== null
    ? Number(invObj.tax_amount)
    : (invObj.taxAmount !== undefined ? Number(invObj.taxAmount) : computedTotalTax);

  const discountAmount = Number(invObj.discount_amount ?? invObj.discountAmount ?? invObj.discount ?? 0);
  const discountPercentage = Number(invObj.discount_percentage ?? invObj.discountPercentage ?? 0);

  const rawAddChargesModal = invObj.additional_charges ?? invObj.additionalCharges;
  const additionalChargesList: Array<{ name: string; amount: number }> = Array.isArray(rawAddChargesModal)
    ? rawAddChargesModal.map((ch: any) => ({ name: ch.name || ch.title || "Additional Charge", amount: Number(ch.amount || 0) }))
    : Number(rawAddChargesModal || 0) > 0
    ? [{ name: "Additional Charges", amount: Number(rawAddChargesModal) }]
    : [];

  const roundOffAmount = Number(invObj.round_off_amount ?? invObj.roundOffAmount ?? 0);
  const notesText = invObj.note || invObj.notes || invObj.terms || invObj.remark || "";

  const handleViewOnline = async () => {
    try {
      await invoiceApi.viewOnline(invObj.id);
    } catch (err: any) {
      console.error("View online error:", err);
    }
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
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${invObj.status === "paid"
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : invObj.status === "partially_paid"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                  >
                    {invObj.status === "partially_paid" ? "Partially Paid" : (invObj.status || "unpaid")}
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
              {itemRowsData.length === 0 ? (
                <div className="p-3 text-center text-xs text-black/40">
                  No line items attached.
                </div>
              ) : (
                itemRowsData.map((item: any, idx: number) => {
                  return (
                    <div key={item.id || idx} className="px-3 py-2 grid grid-cols-12 items-center">
                      <span className="col-span-1 text-black/40 font-semibold">{idx + 1}</span>

                      <div className="col-span-4 min-w-0 pr-2">
                        <p className="font-semibold text-xs sm:text-sm truncate">{item.itemName}</p>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-black/50 mt-0.5">
                          {item.hsnCode && <span>HSN: {item.hsnCode}</span>}
                          {item.formattedTax && item.formattedTax !== "0%" && (
                            <span className="bg-purple-100 text-purple-700 px-1 py-0.2 rounded font-medium text-[9px]">
                              Tax: {item.formattedTax}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="col-span-2 text-center font-medium text-xs">
                        {item.qty} {item.unit || ""}
                      </span>

                      <span className="col-span-2 text-right text-black/70 text-xs">
                        ₹{item.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>

                      <div className="col-span-3 text-right">
                        <p className="font-bold text-xs sm:text-sm">
                          ₹{item.lineAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>
                        {item.taxAmt > 0 && (
                          <p className="text-[9px] text-purple-700">
                            Incl. ₹{item.taxAmt.toFixed(2)} Tax
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

            {totalTaxAmount > 0 && (
              <div className="flex items-center justify-between text-purple-800 font-medium">
                <span>Calculated Tax / GST</span>
                <span>+ ₹{totalTaxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-green-700 font-medium">
                <span>Discount {discountPercentage > 0 ? `(${discountPercentage.toFixed(2)}%)` : ""}</span>
                <span>- ₹{discountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {additionalChargesList.length > 0 &&
              additionalChargesList.map((ch, idx) => (
                <div key={idx} className="flex items-center justify-between text-black/70">
                  <span>{ch.name}</span>
                  <span>+ ₹{ch.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
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
              <span className={dueAmount > 0 ? (isSales ? "text-green-700 font-bold" : "text-amber-700 font-bold") : "text-green-700"}>
                {isSales ? "To Collect: " : "To Pay: "}₹{dueAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Payment Receipts History */}
          {resolvedPaymentHistory.length > 0 && (
            <div className="rounded-xl border border-black/10 p-3 space-y-2 text-xs bg-black/[0.02]">
              <div className="flex items-center justify-between font-bold border-b border-black/10 pb-1.5 text-[11px] text-black/70">
                <span>Payment History &amp; Receipts ({resolvedPaymentHistory.length})</span>
                <span className="text-[10px] text-black/50 font-normal">Click receipt to view payment details</span>
              </div>
              <div className="divide-y divide-black/5 max-h-36 overflow-y-auto">
                {resolvedPaymentHistory.map((ph: any, idx: number) => (
                  <div
                    key={ph.id || idx}
                    onClick={() => {
                      if (ph.id && !String(ph.id).startsWith("auto-tx-")) {
                        onClose();
                        const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
                        router.push(`/paymentDetails/${ph.id}${currentPath ? `?from=${encodeURIComponent(currentPath)}` : ""}`);
                      }
                    }}
                    className={`py-1.5 flex items-center justify-between transition ${
                      !String(ph.id).startsWith("auto-tx-") ? "cursor-pointer hover:bg-black/5 px-1 rounded" : ""
                    }`}
                  >
                    <div>
                      <span className="font-bold text-indigo-700">#{ph.number || ph.id}</span>
                      <span className="text-black/50 text-[10px] ml-2">{ph.date} • {ph.mode || "Cash"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-700">₹{Number(ph.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      {!String(ph.id).startsWith("auto-tx-") && (
                        <IoChevronForward className="text-black/40 text-xs" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes & Terms */}
          {notesText && (
            <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-2.5 text-xs text-amber-900">
              <p className="font-semibold uppercase tracking-wider text-[9px] text-amber-700">Terms & Conditions / Notes</p>
              <p className="mt-0.5 leading-relaxed text-[11px]">{notesText}</p>
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
                onClick={() => {
                  onClose();
                  router.push(
                    isSales
                      ? `/addInvoice/sales?editId=${invObj.id}`
                      : `/addInvoice/purchase?editId=${invObj.id}`
                  );
                }}
                className="px-4 py-2.5 rounded-xl border border-black/20 hover:bg-black/5 transition text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <IoPencilOutline className="text-lg" />
                <span>Edit Invoice</span>
              </button>

              <button
                type="button"
                onClick={() => invoiceApi.downloadPdf(invObj.id, invNum, invObj, activeBusiness, currentUser)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <LiaFileInvoiceSolid className="text-lg" />
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={handleViewOnline}
                className="px-4 py-2.5 rounded-xl border border-black/20 hover:bg-black/5 transition text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <IoEyeOutline className="text-lg" />
                <span>View Online</span>
              </button>
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
                  <span>{isSales ? "Collect Payment" : "Pay Supplier"}</span>
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

