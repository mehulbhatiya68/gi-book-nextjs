"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, usePathname, useSearchParams } from "next/navigation";
import { handleSmartBack } from "@/lib/utils/smartNavigation";
import {
  IoArrowBack,
  IoChevronBack,
  IoDocumentTextOutline,
  IoCardOutline,
  IoCallOutline,
  IoMailOutline,
  IoChevronForward,
  IoReceiptOutline,
  IoPencilOutline,
  IoEyeOutline,
  IoTrashOutline,
  IoClose,
} from "react-icons/io5";
import { LiaFileInvoiceSolid } from "react-icons/lia";
import { FaFileInvoiceDollar } from "react-icons/fa6";
import { useAuth } from "@/context/AuthContext";
import { usePreferences } from "@/lib/hooks/usePreferences";
import PermissionGuard from "@/components/PermissionGuard";
import PageHeader from "@/components/PageHeader";
import { invoiceApi } from "@/lib/api/invoice";
import { paymentApi } from "@/lib/api/payment";
import { transactionApi } from "@/lib/api/transaction";
import { ledgerApi } from "@/lib/api/ledger";
import { apiClient } from "@/lib/api/client";
import { toast } from "react-toastify";
import { isPurchaseInvoice, isSalesInvoice, getInvoiceNumber, getInvoicePartyName, getInvoicePartyId } from "@/lib/utils/invoiceUtils";

const formatAddress = (addr: any) => {
  if (!addr) return "";
  if (typeof addr === "string") return addr.trim();
  if (typeof addr === "object") {
    const parts = [
      addr.address || addr.street || addr.address_line1 || addr.addressLine1,
      addr.address_line2 || addr.addressLine2,
      addr.city,
      addr.state,
      addr.pinCode || addr.pin_code || addr.pincode || addr.pin || addr.postal_code,
      addr.country,
    ].filter(
      (part) => typeof part === "string" && part.trim().length > 0
    );
    return parts.join(", ");
  }
  return String(addr);
};

export default function InvoiceDetailsView() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const invoiceId = params?.id;

  const { activeBusiness, currentUser, hasPermission } = useAuth();

  const [invoice, setInvoice] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [partyDetails, setPartyDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTxModal, setShowTxModal] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<any | null>(null);
  const [showDeleteInvoiceModal, setShowDeleteInvoiceModal] = useState(false);

  useEffect(() => {
    const idStr = Array.isArray(invoiceId) ? invoiceId[0] : invoiceId;
    if (activeBusiness?.id && idStr) {
      setIsLoading(true);

      // Fetch primary invoice details first to render UI instantly
      invoiceApi
        .getInvoiceDetails(String(idStr), { silentError: true })
        .then((invoiceRes: any) => {
          const inv =
            invoiceRes?.body?.invoice ||
            invoiceRes?.body?.data ||
            invoiceRes?.invoice ||
            invoiceRes?.data ||
            (invoiceRes?.body && typeof invoiceRes?.body === "object" && !Array.isArray(invoiceRes?.body)
              ? invoiceRes.body
              : invoiceRes);
          const rawInv = inv && typeof inv === "object" && !Array.isArray(inv) ? inv : Array.isArray(inv) && inv.length > 0 ? inv[0] : null;

          if (rawInv) {
            setInvoice(rawInv);
            setIsLoading(false);

            // Asynchronously fetch payment history and full ledger profile in background without blocking invoice view
            const targetLedgerId = rawInv?.ledger_id || rawInv?.party_ledger_id || rawInv?.party?.id || rawInv?.supplier?.id;
            Promise.all([
              paymentApi.getPayments({ silentError: true }).catch(() => null),
              targetLedgerId
                ? transactionApi.getTransactions({ type: "ledger", id: targetLedgerId, per_page: "all", silentError: true }).catch(() => null)
                : Promise.resolve(null),
              targetLedgerId
                ? ledgerApi.getLedger(targetLedgerId, { silentError: true }).catch(() => null)
                : Promise.resolve(null),
            ])
              .then(([payRes, ledgerTxRes, ledgerDetailRes]: any[]) => {
                const list = payRes?.body?.payments || payRes?.body?.data || (Array.isArray(payRes?.body) ? payRes.body : payRes?.data || []);
                let combinedPayments = Array.isArray(list) ? [...list] : [];

                const ledgerTxs = ledgerTxRes?.body?.transactions || ledgerTxRes?.body?.data || (Array.isArray(ledgerTxRes?.body) ? ledgerTxRes.body : []);
                if (Array.isArray(ledgerTxs)) {
                  combinedPayments = [...combinedPayments, ...ledgerTxs];
                }
                setPayments(combinedPayments);

                const fullLedger = ledgerDetailRes?.body?.ledger || ledgerDetailRes?.body?.data || ledgerDetailRes?.body || ledgerDetailRes;
                if (fullLedger && typeof fullLedger === "object") {
                  setPartyDetails(fullLedger);
                }
              })
              .catch(() => {});
          } else {
            throw new Error("Invoice null");
          }
        })
        .catch(async () => {
          // Fallback: search in full invoices list by ID or invoice_number
          try {
            const listRes: any = await invoiceApi.getInvoices({ per_page: "all", silentError: true });
            const list = listRes?.body?.invoices || listRes?.body?.data || (Array.isArray(listRes?.body) ? listRes.body : []);
            const match = Array.isArray(list)
              ? list.find(
                  (i: any) =>
                    String(i.id) === String(idStr) ||
                    String(i.invoice_number || i.invoiceNumberStr || i.invoiceNumber || "").toLowerCase() === String(idStr).toLowerCase()
                )
              : null;
            setInvoice(match || null);
            if (match) {
              const fallbackPartyId = match?.ledger_id || match?.party_ledger_id || match?.party?.id || match?.supplier?.id;
              if (fallbackPartyId) {
                ledgerApi.getLedger(fallbackPartyId, { silentError: true })
                  .then((res: any) => {
                    const l = res?.body?.ledger || res?.body?.data || res?.body;
                    if (l) setPartyDetails(l);
                  })
                  .catch(() => {});
              }
            }
          } catch {
            setInvoice(null);
          } finally {
            setIsLoading(false);
          }
        });
    } else {
      setInvoice(null);
      setPayments([]);
      setPartyDetails(null);
      setIsLoading(false);
    }
  }, [activeBusiness?.id, invoiceId]);

  const resolvedPaymentHistory = useMemo(() => {
    if (!invoice) return [];

    const explicitHistory = Array.isArray(invoice.transactions)
      ? invoice.transactions
      : Array.isArray(invoice.payments)
      ? invoice.payments
      : Array.isArray(invoice.ledger_transactions)
      ? invoice.ledger_transactions
      : Array.isArray(invoice.paymentHistory)
      ? invoice.paymentHistory
      : Array.isArray(invoice.payment_history)
      ? invoice.payment_history
      : Array.isArray(invoice.payments_history)
      ? invoice.payments_history
      : [];

    const invIdStr = String(invoice.id);
    const invNumStr = String(
      invoice.invoice_number ||
      invoice.invoiceNumberStr ||
      (typeof invoice.invoiceNumber === "object" ? invoice.invoiceNumber?.number : invoice.invoiceNumber) ||
      ""
    ).toLowerCase().trim();

    const matchedAppPayments = (payments || []).filter((p: any) => {
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
      const pRemark = String(p.remark || p.notes || p.description || p.reference || "").toLowerCase().trim();

      // Must explicitly match this invoice ID, invoice number, or remark containing invoice number
      if (pInvId && pInvId === invIdStr) return true;
      if (invNumStr && pInvNum && pInvNum === invNumStr) return true;
      if (invNumStr && pRemark && pRemark.includes(invNumStr)) return true;
      return false;
    });

    const combined: any[] = [];

    // Add explicit history items if they belong to this invoice and are not transfers
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

    // Add matched API payments
    matchedAppPayments.forEach((ap: any) => {
      const exists = combined.some(
        (cp) => String(cp.id) === String(ap.id) || (cp.number && String(cp.number) === String(ap.transaction_number || ap.number || ap.id))
      );
      if (!exists) {
        const txDate = ap.transaction_date || ap.date || (ap.created_at ? String(ap.created_at).split("T")[0] : invDate);
        const txTime = ap.time || (ap.created_at ? new Date(ap.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "");
        combined.push({
          id: ap.id,
          number: ap.transaction_number || ap.number || ap.receiptNo || (ap.id ? `TXN-${String(ap.id).slice(0, 8).toUpperCase()}` : "—"),
          date: txDate,
          time: txTime,
          mode: ap.payment_ledger?.name || ap.mode || ap.paymentMode || "Cash / Bank",
          referenceNumber: ap.remark || ap.reference_number || ap.reference || ap.notes || "-",
          recordedBy: ap.createdBy || ap.recordedBy || "System",
          amount: Number(ap.amount || 0),
        });
      }
    });

    // If invoice is marked as paid or partially paid, but no separate payment transaction object was returned, synthesize the transaction entry
    if (combined.length === 0) {
      const isPaidStatus = String(invoice.status || "").toLowerCase() === "paid" || invoice.is_paid === true || invoice.isPaid === true;
      const totalAmt = Number(invoice.amount ?? invoice.total_amount ?? invoice.totalAmount ?? invoice.grandTotal ?? invoice.grand_total ?? 0);
      const paidAmt = Number(invoice.paid_amount ?? invoice.paidAmount ?? (isPaidStatus ? totalAmt : 0));
      const txDate = invoice.due_date || invoice.invoice_date || invoice.invoiceDate || invoice.date || (invoice.created_at ? String(invoice.created_at).split("T")[0] : new Date().toISOString().split("T")[0]);

      if (isPaidStatus || paidAmt > 0) {
        const receiptNo = invoice.invoice_number || invoice.invoiceNumberStr || (typeof invoice.invoiceNumber === "object" ? invoice.invoiceNumber?.number : invoice.invoiceNumber) || `REC-${invoice.id}`;
        combined.push({
          id: `auto-tx-${invoice.id}`,
          number: `RECEIPT #${receiptNo}`,
          date: txDate,
          time: "",
          mode: invoice.payment_mode || invoice.paymentMode || "Cash / Bank",
          referenceNumber: isPaidStatus ? "Full Invoice Settlement" : "Partial Invoice Payment",
          recordedBy: "System",
          amount: paidAmt > 0 ? paidAmt : totalAmt,
        });
      }
    }

    return combined;
  }, [invoice, payments]);

  if (isLoading) {
    return (
      <PermissionGuard module="Invoice">
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-center p-6 gi-text-muted">
          <div className="w-8 h-8 border-3 border-[var(--gi-primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Loading invoice details from backend API...</span>
        </div>
      </PermissionGuard>
    );
  }

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
          <button
            type="button"
            onClick={() => handleSmartBack(router, pathname, searchParams ? searchParams.get("from") : null, "/invoice")}
            className="gi-back-btn"
          >
            <IoChevronBack />
            <span className="gi-back-label">Back</span>
          </button>
        </div>
      </PermissionGuard>
    );
  }

  const isSales = isSalesInvoice(invoice);
  const party = partyDetails || invoice.ledger || invoice.party || invoice.supplier || {};
  const partyName = partyDetails?.name || getInvoicePartyName(invoice);
  const partyId = partyDetails?.id || getInvoicePartyId(invoice);
  const partyType = partyDetails?.type || party?.type || (isSales ? "customer" : "supplier");

  // Business / Seller Info
  const sellerName =
    activeBusiness?.name || currentUser?.businessName || "Business Name";
  const sellerAddress =
    formatAddress(activeBusiness?.address) || "Registered Business Office";
  const sellerPhone = activeBusiness?.phone || currentUser?.mobile || "";
  const sellerEmail = activeBusiness?.email || currentUser?.email || "";
  const sellerGSTIN = activeBusiness?.gstNumber || activeBusiness?.gstin || "";
  const sellerPAN = activeBusiness?.panNumber || "";
  const sellerLogo = activeBusiness?.logo || null;

  // Customer / Supplier Info
  const customerAddress =
    formatAddress(
      party?.billing_address ||
      party?.billingAddress ||
      party?.address ||
      invoice.billing_address ||
      invoice.partyAddress
    ) || "";
  const customerShipping =
    formatAddress(
      party?.shipping_address ||
      party?.shippingAddress ||
      invoice.shipping_address
    ) || (party?.shipping_address ? customerAddress : "");
  const customerPhone =
    party?.contact_number ||
    party?.phone ||
    party?.mobile ||
    party?.contactNumber ||
    invoice.partyPhone ||
    invoice.contact_number ||
    "";
  const customerEmail =
    party?.email ||
    party?.contact_email ||
    invoice.partyEmail ||
    invoice.email ||
    "";
  const customerGSTIN =
    party?.gst_number ||
    party?.gstin ||
    party?.gstNumber ||
    party?.gst ||
    invoice.partyGst ||
    invoice.gst_number ||
    "";
  const customerPAN =
    party?.pan_number ||
    party?.panNumber ||
    party?.pan ||
    "";
  const currentLedgerBalance =
    party?.current_balance !== undefined && party?.current_balance !== null
      ? Number(party.current_balance)
      : null;

  const invNum = getInvoiceNumber(invoice);

  const rawIssueDate = invoice.invoice_date || invoice.invoiceDate || invoice.date || (invoice.created_at ? String(invoice.created_at).split("T")[0] : null);
  const rawDueDate = invoice.due_date || invoice.dueDate || null;
  const invDate = rawIssueDate || rawDueDate || new Date().toISOString().split("T")[0];
  const dueDateStr = rawDueDate || invDate;

  const items = invoice.items || invoice.invoice_items || invoice.sales_invoice_items || invoice.purchase_invoice_items || invoice.invoiceItems || invoice.items_list || invoice.details || [];

  const historyPaidSum = resolvedPaymentHistory.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
  const totalAmount = Number(invoice.amount ?? invoice.total_amount ?? invoice.totalAmount ?? invoice.grandTotal ?? 0);
  const paidAmount = Number(invoice.paid_amount ?? invoice.paidAmount ?? (historyPaidSum > 0 ? historyPaidSum : 0));
  const dueAmount = Number(invoice.balance_due ?? invoice.dueAmount ?? Math.max(0, totalAmount - paidAmount));

  // Discounts & Additional Charges & Round Off
  const discountAmount = Number(invoice.discount_amount ?? invoice.discountAmount ?? invoice.discount ?? 0);
  const discountPercentage = Number(invoice.discount_percentage ?? invoice.discountPercentage ?? 0);

  const rawAddCharges = invoice.additional_charges ?? invoice.additionalCharges;
  const additionalChargesList: Array<{ name: string; amount: number }> = Array.isArray(rawAddCharges)
    ? rawAddCharges.map((ch: any) => ({ name: ch.name || ch.title || "Additional Charge", amount: Number(ch.amount || 0) }))
    : Number(rawAddCharges || 0) > 0
    ? [{ name: "Additional Charges", amount: Number(rawAddCharges) }]
    : [];
  const totalAddChargesSum = additionalChargesList.reduce((sum, ch) => sum + ch.amount, 0);

  const parseGstRate = (gstVal: any) => {
    if (!gstVal || gstVal === "None") return 0;
    const num = parseFloat(String(gstVal).replace(/[^\d.]/g, ""));
    return isNaN(num) ? 0 : num;
  };

  // Line Item & Tax Calculations
  const itemRowsData = items.map((item: any) => {
    const qty = Number(item.quantity ?? item.qty ?? 1);
    const rate = Number(item.price ?? item.rate ?? item.unit_price ?? item.salesPrice ?? item.purchasePrice ?? 0);
    const gstRate = item.gst_rate ?? item.gstRate ?? item.tax_rate ?? item.taxRate ?? parseGstRate(item.gst || item.tax);
    const rawTaxStr = item.tax || item.gst || (gstRate ? `${gstRate}%` : "0%");
    const formattedTax = String(rawTaxStr).includes("%") ? String(rawTaxStr) : `${rawTaxStr}%`;

    let taxableAmt = Number(item.taxable_amount ?? item.taxableAmount);
    let taxAmt = Number(item.tax_amount ?? item.taxAmount ?? item.gst_amount ?? item.gstAmount);
    let lineAmt = Number(item.line_total ?? item.lineTotal ?? item.total_amount ?? item.amount ?? item.total);

    if (isNaN(taxableAmt) || taxableAmt <= 0) {
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
    } else if (isNaN(taxAmt) || taxAmt < 0) {
      if (gstRate > 0) {
        taxAmt = taxableAmt * (gstRate / 100);
      } else {
        taxAmt = 0;
      }
    }

    if (isNaN(lineAmt)) lineAmt = taxableAmt + taxAmt;

    return {
      ...item,
      itemName: item.item_name || item.itemName || item.name || item.item?.name || "Item",
      description: item.description || item.item_description || item.hsn_code || item.hsnCode || item.hsn || "",
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

  itemRowsData.forEach((row) => {
    computedTaxableSubtotal += row.taxableAmt;
    computedTotalTax += row.taxAmt;
    computedTotalLineAmount += row.lineAmt;
    totalQty += row.qty;
  });

  const subtotal = invoice.subtotal !== undefined && invoice.subtotal !== null
    ? Number(invoice.subtotal)
    : (computedTaxableSubtotal > 0 ? computedTaxableSubtotal : (totalAmount - computedTotalTax));

  const totalTaxAmount = invoice.taxAmount !== undefined && invoice.taxAmount !== null
    ? Number(invoice.taxAmount)
    : computedTotalTax;

  const roundOffAmount = Number(invoice.round_off_amount ?? invoice.roundOffAmount ?? 0);
  const notesText = invoice.note || invoice.notes || invoice.terms || invoice.remark || "";

  const handleViewOnline = async () => {
    try {
      await invoiceApi.viewOnline(invoice.id);
    } catch (err: any) {
      console.error("View online error:", err);
    }
  };

  const handleToggleStatus = async () => {
    const currentStatus = String(invoice.status || "unpaid").toLowerCase();
    const nextStatus = currentStatus === "paid" ? "unpaid" : "paid";
    try {
      const invId = String(invoice.id);
      const isPurchase = isPurchaseInvoice(invoice);

      if (nextStatus === "paid") {
        const ledgersRes: any = await ledgerApi.getLedgers({ silentError: true }).catch(() => null);
        const ledgerList = ledgersRes?.body?.data || ledgersRes?.body?.ledgers || (Array.isArray(ledgersRes?.body) ? ledgersRes.body : []);
        const paymentLedger = ledgerList.find((l: any) => l.type === "cash" || l.type === "bank");
        const partyLedgerId = getInvoicePartyId(invoice);
        const dueAmt = Number(invoice.balance_due ?? invoice.dueAmount ?? invoice.amount ?? invoice.totalAmount ?? 0);

        if (paymentLedger?.id) {
          if (isPurchase && partyLedgerId) {
            await transactionApi.storeTransaction({
              type: "payment_out",
              payment_ledger_id: paymentLedger.id,
              party_ledger_id: partyLedgerId,
              amount: dueAmt,
              transaction_date: new Date().toISOString().split("T")[0],
              remark: `Payment for Purchase Invoice #${invNum}`,
            }).catch(() => {});
          } else {
            await invoiceApi.receivePayment(invId, {
              payment_ledger_id: paymentLedger.id,
              amount: dueAmt,
              transaction_date: new Date().toISOString().split("T")[0],
              remark: `Payment for Sales Invoice #${invNum}`,
            }).catch(() => {});
          }
        }
      }

      await invoiceApi.updateInvoiceStatus(invId, nextStatus as any);
      toast.success(`Invoice status updated to ${nextStatus.toUpperCase()}!`);
      setInvoice((prev: any) => ({
        ...prev,
        status: nextStatus,
        paid_amount: nextStatus === "paid" ? Number(prev.amount || prev.totalAmount || 0) : 0,
        balance_due: nextStatus === "paid" ? 0 : Number(prev.amount || prev.totalAmount || 0),
      }));
    } catch (err: any) {
      console.error("Failed to update invoice status:", err);
      toast.error(err?.message || "Failed to update invoice status.");
    }
  };

  const handleDeleteInvoice = async () => {
    setShowDeleteInvoiceModal(false);
    try {
      await invoiceApi.deleteInvoice(String(invoice.id));
      toast.success("Invoice deleted successfully!");
      router.push("/invoice");
    } catch (err: any) {
      toast.error("Failed to delete invoice: " + (err.message || "Unknown error"));
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      if (invoice?.id && !String(paymentId).startsWith("auto-tx-")) {
        let deleteRes: any = null;
        try {
          deleteRes = await invoiceApi.deleteInvoicePayment(String(invoice.id), String(paymentId));
        } catch (err: any) {
          await transactionApi.deleteTransaction(String(paymentId));
        }
        toast.success("Payment deleted successfully!");
        setPayments((prev) => prev.filter((p: any) => String(p.id) !== String(paymentId)));
        
        const updatedFromDelete = deleteRes?.body?.invoice || deleteRes?.body?.data;
        if (updatedFromDelete) {
          setInvoice((prev: any) => ({ ...prev, ...updatedFromDelete }));
        } else {
          invoiceApi.getInvoiceDetails(String(invoice.id), { silentError: true }).then((res: any) => {
            const updated = res?.body?.invoice || res?.body?.data || res?.invoice || res?.data;
            if (updated) setInvoice(updated);
          });
        }
      } else {
        toast.info("Auto-settled payment entry. Toggle invoice status to unpaid to remove.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete payment");
    }
  };

  return (
    <PermissionGuard module="Invoice">
      <div className="space-y-6 pb-12 select-none gi-page">
        {/* ==========================================================================
           MOBILE-ONLY REDESIGNED VIEW (< 768px) — Clean Mobile Layout
           ========================================================================== */}
        <div className="block md:hidden space-y-3 pb-8">
          {/* Mobile Header Bar */}
          <div className="flex items-center justify-between pb-2 border-b gi-divider">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSmartBack(router, pathname, searchParams ? searchParams.get("from") : null, "/invoice")}
                className="gi-back-btn"
              >
                <IoChevronBack />
                <span className="gi-back-label">Back</span>
              </button>
              <h1 className="text-base font-bold gi-text-primary tracking-tight">
                Invoice #{invNum}
              </h1>
            </div>

            {/* Top Right Action Icons */}
            <div className="flex items-center gap-3 gi-text-primary text-lg">
              <button
                type="button"
                onClick={handleViewOnline}
                title="View Online"
                className="p-1 hover:text-indigo-600 transition cursor-pointer"
              >
                <IoEyeOutline />
              </button>
              <button
                type="button"
                onClick={() => invoiceApi.downloadPdf(invoice.id, invNum, invoice, activeBusiness, currentUser)}
                title="Download PDF"
                className="p-1 hover:text-emerald-600 transition cursor-pointer"
              >
                <LiaFileInvoiceSolid />
              </button>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    isSales
                      ? `/addInvoice/sales?editId=${invoice.id}`
                      : `/addInvoice/purchase?editId=${invoice.id}`
                  )
                }
                title="Edit Invoice"
                className="p-1 hover:text-indigo-600 transition cursor-pointer"
              >
                <IoPencilOutline />
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteInvoiceModal(true)}
                title="Delete Invoice"
                className="p-1 hover:text-rose-600 transition cursor-pointer"
              >
                <IoTrashOutline />
              </button>
            </div>
          </div>

          {/* Billed To / Billed By (Customer or Supplier Details Card) */}
          <div className="gi-card p-4 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b gi-divider pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  {isSales ? "Billed To (Customer)" : "Billed By (Supplier)"}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  isSales ? "gi-badge-info" : "gi-badge-warning"
                }`}>
                  {partyType}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleStatus}
                title="Click to toggle payment status"
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:opacity-80 transition ${
                  invoice.status === "paid"
                    ? "gi-badge-success"
                    : invoice.status === "partially_paid"
                    ? "gi-badge-warning"
                    : "gi-badge-danger"
                }`}
              >
                {invoice.status === "partially_paid" ? "Partially Paid" : (invoice.status || "Unpaid")}
              </button>
            </div>

            <div>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-bold gi-text-primary leading-snug">
                  {partyName}
                </h2>
                {partyId && (
                  <Link
                    href={`/parties/${partyId}`}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5 text-xs shrink-0"
                  >
                    <span>View Ledger</span>
                    <IoChevronForward className="text-xs" />
                  </Link>
                )}
              </div>
              <p className="text-[11px] gi-text-muted mt-0.5">Inv Date: {invDate} • Due Date: {dueDateStr}</p>
            </div>

            {/* Comprehensive Customer/Supplier Info: Phone, Email, GSTIN, PAN, Balance, Address */}
            <div className="space-y-1.5 pt-2 text-xs gi-text-secondary border-t gi-divider">
              {customerPhone && (
                <div className="flex items-center gap-2">
                  <IoCallOutline className="text-sm gi-text-muted shrink-0" />
                  <a href={`tel:${customerPhone}`} className="hover:underline font-medium gi-text-primary">
                    {customerPhone}
                  </a>
                </div>
              )}
              {customerEmail && (
                <div className="flex items-center gap-2">
                  <IoMailOutline className="text-sm gi-text-muted shrink-0" />
                  <a href={`mailto:${customerEmail}`} className="hover:underline truncate gi-text-primary">
                    {customerEmail}
                  </a>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-0.5">
                {customerGSTIN && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-mono">
                      GSTIN
                    </span>
                    <span className="font-mono text-[11px] font-semibold gi-text-primary">{customerGSTIN}</span>
                  </div>
                )}
                {customerPAN && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-mono">
                      PAN
                    </span>
                    <span className="font-mono text-[11px] font-semibold gi-text-primary">{customerPAN}</span>
                  </div>
                )}
              </div>
              {currentLedgerBalance !== null && !isNaN(currentLedgerBalance) && (
                <div className="text-[11px] pt-1">
                  <span className="text-slate-400 dark:text-zinc-500 font-medium">Ledger Balance: </span>
                  <span className={`font-mono font-bold ${currentLedgerBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    ₹{Math.abs(currentLedgerBalance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    {currentLedgerBalance >= 0 ? " (Cr)" : " (Dr)"}
                  </span>
                </div>
              )}
              {customerAddress && customerAddress !== "Address Not Provided" && (
                <div className="pt-1.5 text-[11px] leading-relaxed gi-text-secondary">
                  <span className="font-bold gi-text-muted block text-[10px] uppercase tracking-wider mb-0.5">
                    Billing Address:
                  </span>
                  <span>{customerAddress}</span>
                </div>
              )}
              {customerShipping && customerShipping !== customerAddress && (
                <div className="pt-1 text-[11px] leading-relaxed gi-text-muted">
                  <span className="font-bold block text-[10px] uppercase tracking-wider mb-0.5">
                    Shipping Address:
                  </span>
                  <span>{customerShipping}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-1.5 pt-1">
            <p className="text-xs font-semibold gi-text-muted px-1">Items</p>
            <div className="gi-card rounded-2xl shadow-xs p-3.5 space-y-3">
              {itemRowsData.length === 0 ? (
                <div className="py-4 text-center text-xs gi-text-muted">
                  No items added to this invoice.
                </div>
              ) : (
                itemRowsData.map((item, idx) => (
                  <div key={item.id || idx} className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold gi-text-primary text-sm">
                        {item.itemName || item.name || "Item"}
                      </span>
                      {item.formattedTax && item.formattedTax !== "0%" && (
                        <span className="text-[11px] gi-text-muted">
                          GST @ {item.formattedTax} (+₹{item.taxAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs gi-text-secondary">
                      <span>
                        Qty x Rate &nbsp;&nbsp;&nbsp; {item.qty} {item.unit || "PCS"} x ₹{item.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="font-mono font-bold gi-text-primary text-sm">
                        ₹{item.lineAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))
              )}

              {/* Item Subtotal Footer Line */}
              <div className="pt-2 border-t gi-divider flex items-center justify-between text-xs font-bold gi-text-primary">
                <span>Item Subtotal</span>
                <span className="font-mono text-sm">
                  ₹{computedTotalLineAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Total Amount Card */}
          <div className="gi-card rounded-2xl shadow-xs p-3.5 flex items-center justify-between">
            <span className="text-xs font-bold gi-text-primary">Total Amount</span>
            <span className="font-mono font-extrabold gi-text-primary text-base">
              ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Invoice Calculations Breakdown Card */}
          <div className="gi-card rounded-2xl shadow-xs p-3.5 space-y-2 text-xs">
            <p className="font-bold gi-text-primary border-b gi-divider pb-2">
              Invoice Calculations &amp; Breakdown
            </p>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between gi-text-secondary">
                <span>Taxable Subtotal (Excl. Tax)</span>
                <span className="font-mono font-semibold gi-text-primary">
                  ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {totalTaxAmount > 0 && (
                <div className="flex justify-between text-indigo-600 dark:text-indigo-400 font-semibold">
                  <span>GST Tax Amount</span>
                  <span className="font-mono">+ ₹{totalTaxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Discount {discountPercentage > 0 ? `(${discountPercentage.toFixed(2)}%)` : ""}</span>
                  <span className="font-mono">- ₹{discountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              {additionalChargesList.length > 0 &&
                additionalChargesList.map((ch, idx) => (
                  <div key={idx} className="flex justify-between gi-text-secondary">
                    <span>{ch.name}</span>
                    <span className="font-mono">+ ₹{ch.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}

              {roundOffAmount !== 0 && (
                <div className="flex justify-between gi-text-muted">
                  <span>Round Off Adjustment</span>
                  <span className="font-mono">{roundOffAmount > 0 ? "+" : ""}₹{roundOffAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="pt-2 border-t-2 gi-divider flex justify-between items-center text-sm font-extrabold gi-text-primary">
                <span>Grand Total Amount</span>
                <span className="font-mono text-base">
                  ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="pt-1.5 border-t border-dashed gi-divider flex justify-between items-center font-bold text-xs">
                <span className="text-emerald-600 dark:text-emerald-400">
                  Paid: ₹{paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
                <span className={dueAmount > 0 ? (isSales ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400") : "text-emerald-600 dark:text-emerald-400"}>
                  {isSales ? "To Collect: " : "To Pay: "}₹{dueAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Transactions Card */}
          <div
            onClick={() => setShowTxModal(true)}
            className="gi-card rounded-2xl shadow-xs p-3.5 flex items-center justify-between cursor-pointer hover:bg-[var(--gi-hover)] transition"
          >
            <div>
              <p className="text-xs font-bold gi-text-primary">Transactions</p>
              <p className="text-xs gi-text-muted mt-0.5">
                {resolvedPaymentHistory.length} transactions
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400">
              <span>View All</span>
              <IoChevronForward className="text-sm" />
            </div>
          </div>

          {/* Quick Receive Payment Action Button */}
          {dueAmount > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/payment/receivedPayment?type=${isSales ? "credit" : "debit"}&invoiceId=${invoice.id}&partyId=${partyId || ""}`
                  )
                }
                className="w-full py-3 rounded-xl gi-btn-primary font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98 transition"
              >
                <IoCardOutline className="text-base" />
                <span>Receive Payment (Due: ₹{dueAmount.toLocaleString("en-IN")})</span>
              </button>
            </div>
          )}

          {/* Mobile Transactions Modal / Bottom Sheet */}
          {showTxModal && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center p-0 md:hidden">
              <div className="gi-card w-full max-h-[80vh] rounded-t-2xl p-4 space-y-4 overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between border-b gi-divider pb-3">
                  <div>
                    <h3 className="text-sm font-bold gi-text-primary">Transactions &amp; Receipts</h3>
                    <p className="text-[11px] gi-text-muted">{resolvedPaymentHistory.length} receipts recorded</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTxModal(false)}
                    className="p-1 rounded-lg gi-hover gi-text-muted text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>

                {resolvedPaymentHistory.length === 0 ? (
                  <div className="py-8 text-center text-xs gi-text-muted">
                    No payment receipts recorded for this bill yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {resolvedPaymentHistory.map((ph, idx) => (
                      <div
                        key={ph.id || idx}
                        onClick={() => {
                          if (ph.id && !String(ph.id).startsWith("auto-tx-")) {
                            setShowTxModal(false);
                            router.push(`/paymentDetails/${ph.id}?from=${encodeURIComponent(pathname)}`);
                          }
                        }}
                        className={`p-3 rounded-xl gi-surface-secondary border gi-divider space-y-1 ${
                          !String(ph.id).startsWith("auto-tx-") ? "cursor-pointer hover:border-indigo-500/40 transition" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold gi-text-primary">
                          <span className="text-indigo-600 dark:text-indigo-400 font-mono">#{ph.number || ph.id}</span>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400">
                              ₹{Number(ph.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                            {!String(ph.id).startsWith("auto-tx-") && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setPaymentToDelete(ph)}
                                  title="Delete receipt"
                                  className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition cursor-pointer"
                                >
                                  <IoTrashOutline className="text-xs" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] gi-text-muted">
                          <span>{ph.date} {ph.time && `• ${ph.time}`}</span>
                          <span>{ph.mode || "Cash"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="w-full py-2.5 rounded-xl border gi-border font-semibold text-xs gi-text-primary cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ==========================================================================
           DESKTOP VIEW (>= 768px) — Maintained Unchanged
           ========================================================================== */}
        <div className="hidden md:block space-y-6">
        <PageHeader
          title={invNum}
          backUrl="/invoice"
          badge={
            <>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isSales ? "gi-badge-info" : "gi-badge-warning"}`}>
                {isSales ? "Sales Invoice" : "Purchase Invoice"}
              </span>
              <button
                type="button"
                onClick={handleToggleStatus}
                title="Click to toggle payment status"
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:opacity-80 transition ${invoice.status === "paid"
                  ? "gi-badge-success"
                  : invoice.status === "partially_paid"
                    ? "gi-badge-warning"
                    : "gi-badge-danger"
                  }`}
              >
                {invoice.status === "partially_paid" ? "Partially Paid" : (invoice.status || "unpaid")}
              </button>
            </>
          }
          actions={
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    isSales
                      ? `/addInvoice/sales?editId=${invoice.id}`
                      : `/addInvoice/purchase?editId=${invoice.id}`
                  )
                }
                className="px-3 py-1.5 rounded-lg border gi-surface-interactive text-xs font-semibold gi-text-primary flex items-center gap-1.5 cursor-pointer transition shadow-xs shrink-0 whitespace-nowrap"
              >
                <IoPencilOutline className="text-sm" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => invoiceApi.downloadPdf(invoice.id, invNum, invoice, activeBusiness, currentUser)}
                className="px-3 py-1.5 rounded-lg gi-badge-info text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-xs shrink-0 whitespace-nowrap"
              >
                <LiaFileInvoiceSolid className="text-sm" />
                <span>PDF</span>
              </button>

              <button
                type="button"
                onClick={handleViewOnline}
                className="px-3 py-1.5 rounded-lg border gi-surface-interactive text-xs font-semibold gi-text-primary flex items-center gap-1.5 cursor-pointer transition shadow-xs shrink-0 whitespace-nowrap"
              >
                <IoEyeOutline className="text-sm" />
                <span>View Online</span>
              </button>

              {dueAmount > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/payment/receivedPayment?type=${isSales ? "credit" : "debit"}&invoiceId=${invoice.id}&partyId=${partyId || ""}`
                    )
                  }
                  className="px-3 py-1.5 rounded-lg gi-badge-success text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shrink-0 whitespace-nowrap"
                >
                  <IoCardOutline className="text-sm" />
                  <span>{isSales ? "Collect Payment" : "Pay Supplier"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowDeleteInvoiceModal(true)}
                className="px-3 py-1.5 rounded-lg gi-badge-danger text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-xs shrink-0 whitespace-nowrap"
              >
                <IoTrashOutline className="text-sm" />
                <span>Delete</span>
              </button>
            </div>
          }
        />

        {/* Main Content Layout */}
        <div className="space-y-6">
          {/* Key Invoice Summary Grid Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="gi-card p-3.5 rounded-2xl space-y-1 text-center sm:text-left shadow-xs">
              <span className="gi-text-muted font-semibold uppercase text-[10px] tracking-wider block">Invoice Date</span>
              <span className="font-bold gi-text-primary text-xs sm:text-sm">{invDate}</span>
            </div>
            <div className="gi-card p-3.5 rounded-2xl space-y-1 text-center sm:text-left shadow-xs">
              <span className="gi-text-muted font-semibold uppercase text-[10px] tracking-wider block">Payment Due Date</span>
              <span className="font-bold gi-text-primary text-xs sm:text-sm">{dueDateStr}</span>
            </div>
            <div className="gi-card p-3.5 rounded-2xl space-y-1 text-center sm:text-left shadow-xs">
              <span className="gi-text-muted font-semibold uppercase text-[10px] tracking-wider block">Grand Total</span>
              <span className="font-mono font-extrabold gi-text-primary text-xs sm:text-sm">₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="gi-card p-3.5 rounded-2xl space-y-1 text-center sm:text-left shadow-xs">
              <span className="gi-text-muted font-semibold uppercase text-[10px] tracking-wider block">
                {isSales ? "To Collect (Balance)" : "To Pay (Balance)"}
              </span>
              <span className={`font-mono font-extrabold text-xs sm:text-sm ${dueAmount > 0 ? (isSales ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400") : "text-emerald-600 dark:text-emerald-400"}`}>
                ₹{dueAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Parties Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Seller / Business Details Card */}
            <div className="gi-card p-5 rounded-2xl shadow-xs space-y-2 text-xs">
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
            <div className="gi-card p-5 rounded-2xl shadow-xs space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b gi-divider pb-2">
                <div className="flex items-center gap-2">
                  <span className="gi-text-muted font-bold uppercase text-[10px] tracking-wider">
                    {isSales ? "Billed To (Customer / Buyer)" : "Billed By (Supplier / Vendor)"}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    isSales ? "gi-badge-info" : "gi-badge-warning"
                  }`}>
                    {partyType}
                  </span>
                </div>
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
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold gi-text-primary text-sm pt-0.5">{partyName}</p>
                {currentLedgerBalance !== null && !isNaN(currentLedgerBalance) && (
                  <span className={`text-[11px] font-mono font-bold ${currentLedgerBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    Balance: ₹{Math.abs(currentLedgerBalance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    {currentLedgerBalance >= 0 ? " (Cr)" : " (Dr)"}
                  </span>
                )}
              </div>
              {customerAddress && (
                <div className="gi-text-secondary leading-relaxed text-xs">
                  <span className="font-semibold gi-text-muted block text-[10px] uppercase">Billing Address:</span>
                  <span>{customerAddress}</span>
                </div>
              )}
              {customerShipping && customerShipping !== customerAddress && (
                <div className="gi-text-muted text-[11px] leading-relaxed">
                  <span className="font-semibold block text-[10px] uppercase">Shipping Address:</span>
                  <span>{customerShipping}</span>
                </div>
              )}
              {customerPhone && (
                <p className="gi-text-secondary flex items-center gap-1.5 pt-0.5">
                  <IoCallOutline className="gi-text-muted text-sm" />
                  <a href={`tel:${customerPhone}`} className="hover:underline font-medium gi-text-primary">
                    {customerPhone}
                  </a>
                </p>
              )}
              {customerEmail && (
                <p className="gi-text-secondary flex items-center gap-1.5">
                  <IoMailOutline className="gi-text-muted text-sm" />
                  <a href={`mailto:${customerEmail}`} className="hover:underline gi-text-primary">
                    {customerEmail}
                  </a>
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {customerGSTIN && (
                  <p className="gi-text-primary font-medium flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-mono">
                      GSTIN
                    </span>
                    <span className="font-semibold font-mono">{customerGSTIN}</span>
                  </p>
                )}
                {customerPAN && (
                  <p className="gi-text-secondary flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-mono">
                      PAN
                    </span>
                    <span className="font-mono">{customerPAN}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Line Items View (< 768px) */}
          <div className="block md:hidden space-y-2.5">
            <h2 className="text-sm font-bold gi-text-primary px-1">Line Items &amp; Specifications ({itemRowsData.length})</h2>
            {itemRowsData.length === 0 ? (
              <div className="py-6 text-center gi-card rounded-xl gi-text-muted text-xs">
                No items attached to this invoice.
              </div>
            ) : (
              itemRowsData.map((item, idx) => (
                <div key={item.id || idx} className="gi-card p-3 rounded-xl shadow-xs space-y-1.5 text-xs">
                  <div className="flex items-start justify-between gap-2 border-b gi-divider pb-2">
                    <div>
                      <span className="font-bold gi-text-primary text-xs block">{item.itemName || item.name || "Item"}</span>
                      {item.hsnCode && <span className="text-[10px] gi-text-muted block">HSN: {item.hsnCode}</span>}
                    </div>
                    <span className="font-mono font-bold gi-text-primary text-xs shrink-0">
                      ₹{item.lineAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] gi-text-secondary pt-0.5">
                    <span>Qty: <strong className="gi-text-primary">{item.qty} {item.unit || ""}</strong> × ₹{item.rate.toLocaleString("en-IN")}</span>
                    <span>Tax: <strong className="gi-text-primary">{item.formattedTax}</strong> (₹{item.taxAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })})</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Line Items Table (>= 768px) */}
          <div className="hidden md:block gi-card p-5 rounded-2xl shadow-xs space-y-4">
            <h2 className="text-base font-bold gi-text-primary">Line Items &amp; Specifications</h2>

            <div className="gi-table-container overflow-hidden rounded-xl border gi-divider">
              <table className="w-full text-left text-xs gi-table border-collapse">
                <thead>
                  <tr>
                    <th className="py-2.5 px-3 text-center w-10">#</th>
                    <th className="py-2.5 px-3">Item &amp; Description</th>
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
                    <td className="py-3 px-3 text-right font-mono text-sm gi-text-primary">₹{computedTotalLineAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Financial Breakdown & Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment History List Card */}
            <div className="gi-card p-5 rounded-2xl shadow-xs space-y-3">
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
                        <th className="py-2 px-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y gi-divider">
                      {resolvedPaymentHistory.map((ph, idx) => (
                        <tr
                          key={ph.id || idx}
                          onClick={() => {
                            if (ph.id && !String(ph.id).startsWith("auto-tx-")) {
                              router.push(`/paymentDetails/${ph.id}?from=${encodeURIComponent(pathname)}`);
                            }
                          }}
                          className={`hover:bg-[var(--gi-hover)] transition ${
                            !String(ph.id).startsWith("auto-tx-") ? "cursor-pointer" : ""
                          }`}
                        >
                          <td className="py-2 px-2 font-bold text-indigo-600 dark:text-indigo-400">#{ph.number || ph.id}</td>
                          <td className="py-2 px-2 gi-text-secondary">{ph.date} {ph.time && <span className="gi-text-muted">• {ph.time}</span>}</td>
                          <td className="py-2 px-2 gi-text-secondary">{ph.mode || "Cash"}</td>
                          <td className="py-2 px-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{Number(ph.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-2 text-right" onClick={(e) => e.stopPropagation()}>
                            {!String(ph.id).startsWith("auto-tx-") && (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setPaymentToDelete(ph)}
                                  title="Delete payment receipt"
                                  className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                >
                                  <IoTrashOutline className="text-sm" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Financial Totals Breakdown Card */}
            <div className="gi-card p-5 rounded-2xl shadow-xs space-y-3 text-xs">
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
                    <span>Discount {discountPercentage > 0 ? `(${discountPercentage.toFixed(2)}%)` : ""}</span>
                    <span className="font-mono">- ₹{discountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {additionalChargesList.length > 0 &&
                  additionalChargesList.map((ch, idx) => (
                    <div key={idx} className="flex justify-between gi-text-secondary">
                      <span>{ch.name}</span>
                      <span className="font-mono">+ ₹{ch.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
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
          {notesText && (
            <div className="gi-card p-5 rounded-2xl shadow-xs space-y-1">
              <span className="gi-text-muted font-semibold uppercase text-[10px] tracking-wider">
                Terms &amp; Conditions / Notes
              </span>
              <p className="gi-text-secondary text-xs leading-relaxed">{notesText}</p>
            </div>
          )}
        </div>
        {/* Delete Invoice Confirmation Modal */}
        {showDeleteInvoiceModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative max-w-md w-full gi-card p-6 rounded-2xl shadow-2xl border gi-divider space-y-4">
              <div className="flex items-center justify-between border-b pb-3 gi-divider">
                <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">Delete Invoice</h3>
                <button
                  type="button"
                  onClick={() => setShowDeleteInvoiceModal(false)}
                  className="p-1 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer"
                >
                  <IoClose className="text-base" />
                </button>
              </div>

              <p className="text-xs gi-text-secondary leading-relaxed">
                Are you sure you want to delete <strong className="gi-text-primary">Invoice #{invNum}</strong>? This action cannot be undone and will update inventory and transaction records accordingly.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteInvoiceModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border gi-surface-interactive gi-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteInvoice}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Delete Invoice
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Delete Payment Confirmation Modal */}
        {paymentToDelete && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative max-w-md w-full gi-card p-6 rounded-2xl shadow-2xl border gi-divider space-y-4">
              <div className="flex items-center justify-between border-b pb-3 gi-divider">
                <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">Delete Payment Receipt</h3>
                <button
                  type="button"
                  onClick={() => setPaymentToDelete(null)}
                  className="p-1 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer"
                >
                  <IoClose className="text-base" />
                </button>
              </div>

              <p className="text-xs gi-text-secondary leading-relaxed">
                Are you sure you want to delete this payment receipt of <strong className="gi-text-primary">₹{Number(paymentToDelete.amount || 0).toLocaleString("en-IN")}</strong>? This will reverse payment allocation on this invoice.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentToDelete(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border gi-surface-interactive gi-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const pid = paymentToDelete.id;
                    setPaymentToDelete(null);
                    await handleDeletePayment(String(pid));
                  }}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Delete Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </PermissionGuard>
  );
}

