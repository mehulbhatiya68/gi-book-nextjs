"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter, usePathname, useSearchParams } from "next/navigation";
import { handleSmartBack } from "@/lib/utils/smartNavigation";
import {
  IoArrowBack,
  IoChevronBack,
  IoPencilOutline,
  IoArrowForward,
  IoClose,
  IoImageOutline,
  IoDocumentTextOutline,
  IoWalletOutline,
  IoReceiptOutline,
  IoCalendarOutline,
  IoCardOutline,
  IoChevronForward,
} from "react-icons/io5";
import { useAuth } from "@/context/AuthContext";
import PermissionGuard from "@/components/PermissionGuard";
import { SkeletonPaymentDetails } from "@/components/Skeleton";
import { ledgerApi } from "@/lib/api/ledger";
import { paymentApi } from "@/lib/api/payment";
import { transactionApi } from "@/lib/api/transaction";
import { partyApi } from "@/lib/api/party";
import { invoiceApi } from "@/lib/api/invoice";
import { getPaymentModeDisplay } from "@/lib/utils/transactionDisplayUtils";

export interface PaymentDetailsViewProps {
  initialPaymentId?: string;
  initialPayment?: any;
  initialInvoices?: any[];
  initialParties?: any[];
  initialLedgers?: any[];
}

export default function PaymentDetailsView({
  initialPaymentId = "",
  initialPayment = null,
  initialInvoices = [],
  initialParties = [],
  initialLedgers = [],
}: PaymentDetailsViewProps) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawPaymentId = params?.id || initialPaymentId;
  const paymentId = Array.isArray(rawPaymentId) ? rawPaymentId[0] : rawPaymentId;

  const { activeBusiness, hasPermission } = useAuth();

  const [payments, setPayments] = useState<any[]>(initialPayment ? [initialPayment] : []);
  const [parties, setParties] = useState<any[]>(initialParties);
  const [invoices, setInvoices] = useState<any[]>(initialInvoices);
  const [ledgers, setLedgers] = useState<any[]>(initialLedgers);
  const [singlePayment, setSinglePayment] = useState<any>(initialPayment);
  const [isLoading, setIsLoading] = useState(!initialPayment);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const ledgersMap = useMemo(() => {
    const map = new Map<string, any>();
    (ledgers || []).forEach((l: any) => {
      if (l?.id) {
        map.set(String(l.id), l);
      }
    });
    return map;
  }, [ledgers]);

  useEffect(() => {
    let isMounted = true;
    if (!paymentId) return;

    if (!singlePayment) {
      setIsLoading(true);
    }

    const detailPromise = paymentApi.getPaymentDetails(paymentId).catch(() => null);
    const paymentsPromise = paymentApi.getPayments({}).catch(() => ({ body: [] }));
    const partiesPromise = activeBusiness?.id
      ? partyApi.getParties(activeBusiness.id).catch(() => ({ body: [] }))
      : partyApi.getParties().catch(() => ({ body: [] }));
    const invoicesPromise = invoiceApi.getInvoices({ per_page: "all", silentError: true }).catch(() => ({ body: [] }));
    const ledgersPromise = ledgerApi.getLedgers({ per_page: "all", silentError: true }).catch(() => ({ body: [] }));

    Promise.all([detailPromise, paymentsPromise, partiesPromise, invoicesPromise, ledgersPromise])
      .then(async ([detailRes, paymentsRes, partiesRes, invoicesRes, ledgersRes]: any[]) => {
        if (!isMounted) return;

        let targetTx = detailRes?.body?.payment || detailRes?.body?.transaction || detailRes?.body?.data || detailRes?.body;

        const payList = Array.isArray(paymentsRes?.body)
          ? paymentsRes.body
          : paymentsRes?.body?.data || paymentsRes?.body?.payments || paymentsRes?.data || (Array.isArray(paymentsRes) ? paymentsRes : []);
        setPayments(Array.isArray(payList) ? payList : []);

        const partyList = Array.isArray(partiesRes?.body)
          ? partiesRes.body
          : partiesRes?.body?.data || partiesRes?.body?.parties || partiesRes?.body?.ledgers || partiesRes?.data || (Array.isArray(partiesRes) ? partiesRes : []);
        if (Array.isArray(partyList) && partyList.length > 0) {
          setParties(partyList);
        }

        const invList = Array.isArray(invoicesRes?.body)
          ? invoicesRes.body
          : invoicesRes?.body?.data || invoicesRes?.body?.invoices || invoicesRes?.data || (Array.isArray(invoicesRes) ? invoicesRes : []);
        if (Array.isArray(invList) && invList.length > 0) {
          setInvoices((prev) => {
            const combined = [...prev];
            invList.forEach((newInv: any) => {
              if (!combined.some((c) => String(c.id) === String(newInv.id))) {
                combined.push(newInv);
              }
            });
            return combined;
          });
        }

        const ledgerList = Array.isArray(ledgersRes?.body)
          ? ledgersRes.body
          : ledgersRes?.body?.ledgers || ledgersRes?.body?.data || (Array.isArray(ledgersRes) ? ledgersRes : []);
        if (Array.isArray(ledgerList) && ledgerList.length > 0) {
          setLedgers(ledgerList);
        }

        if (targetTx && typeof targetTx === "object" && (targetTx.id || targetTx.transaction_number)) {
          setSinglePayment(targetTx);
        } else if (Array.isArray(payList) && payList.length > 0) {
          const found = payList.find(
            (p: any) =>
              String(p.id) === String(paymentId) ||
              String(p.number) === String(paymentId) ||
              String(p.transaction_number) === String(paymentId)
          );
          if (found) {
            targetTx = found;
            setSinglePayment(found);
          }
        }

        if (!targetTx || !targetTx.id) {
          try {
            const allTxRes: any = await transactionApi.getTransactions({ per_page: "all", silentError: true }).catch(() => null);
            const allTxs = Array.isArray(allTxRes?.body)
              ? allTxRes.body
              : allTxRes?.body?.transactions || allTxRes?.body?.data || [];

            const matchInTx = Array.isArray(allTxs)
              ? allTxs.find(
                (tx: any) =>
                  String(tx.id) === String(paymentId) ||
                  String(tx.transaction_number) === String(paymentId) ||
                  String(tx.number) === String(paymentId)
              )
              : null;

            if (matchInTx && isMounted) {
              setSinglePayment(matchInTx);
            }
          } catch (e) {
            // Ignore
          }
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [paymentId, activeBusiness?.id]);

  const payment = singlePayment || (
    !paymentId || !payments.length
      ? null
      : payments.find((p: any) => String(p.id) === String(paymentId)) ||
      payments.find((p: any) => String(p.number) === String(paymentId)) ||
      payments.find((p: any) => String(p.transaction_number) === String(paymentId)) ||
      null
  );

  const getPartyName = (p: any) => {
    if (!p) return "N/A";
    if (p.party_ledger?.name) return p.party_ledger.name;
    if (p.partyName) return p.partyName;
    if (p.party?.partyName) return p.party.partyName;
    if (p.party?.name) return p.party.name;
    const match = parties.find(
      (item: any) => String(item.id) === String(p.party_ledger_id) || String(item.ledger_id) === String(p.party_ledger_id)
    );
    if (match) return match.partyName || match.name || match.title;
    return "N/A";
  };

  const partyNameStr = payment ? getPartyName(payment) : "";

  const pNumber = payment ? payment.transaction_number || payment.number || payment.id : "";
  const pDateRaw = payment ? payment.transaction_date || payment.date || (payment.created_at ? payment.created_at.split("T")[0] : "") : "";

  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return "—";
    const dObj = new Date(dStr);
    if (!isNaN(dObj.getTime())) {
      const day = String(dObj.getDate()).padStart(2, "0");
      const month = String(dObj.getMonth() + 1).padStart(2, "0");
      const year = dObj.getFullYear();
      return `${day}-${month}-${year}`;
    }
    return dStr;
  };

  const pDate = formatDisplayDate(pDateRaw);

  const pRemarks = payment ? payment.remark || payment.notes || payment.note || payment.remarks || "" : "";
  const pProofImage = payment ? payment.proof_image || payment.attachmentUrl || payment.imageProof || payment.attachment : null;

  const pTypeStr = String(payment?.type || payment?.transactionType || "").toLowerCase();
  const isJournal = pTypeStr === "journal" || String(payment?.type || "").toLowerCase() === "journal";
  const isCredit = !isJournal && (pTypeStr === "payment_in" || pTypeStr === "credit" || pTypeStr === "in");

  const fromLedgerId = isCredit
    ? (payment?.party_ledger_id || payment?.partyLedgerId || payment?.from_ledger_id || payment?.fromLedgerId)
    : (payment?.from_ledger_id || payment?.fromLedgerId || payment?.payment_ledger_id || payment?.paymentLedgerId);
  const toLedgerId = isCredit
    ? (payment?.payment_ledger_id || payment?.paymentLedgerId || payment?.to_ledger_id || payment?.toLedgerId)
    : (payment?.to_ledger_id || payment?.toLedgerId || payment?.party_ledger_id || payment?.partyLedgerId);

  const foundFromLedger: any = ledgers.find((l: any) => String(l.id) === String(fromLedgerId));
  const foundToLedger: any = ledgers.find((l: any) => String(l.id) === String(toLedgerId));

  const fromLedger = isCredit
    ? (payment?.party_ledger || payment?.partyLedger || payment?.party || payment?.from_ledger || payment?.fromLedger || foundFromLedger || {})
    : (payment?.from_ledger || payment?.fromLedger || payment?.payment_ledger || payment?.paymentLedger || foundFromLedger || {});
  const toLedger = isCredit
    ? (payment?.payment_ledger || payment?.paymentLedger || payment?.to_ledger || payment?.toLedger || foundToLedger || {})
    : (payment?.to_ledger || payment?.toLedger || payment?.party_ledger || payment?.partyLedger || payment?.party || foundToLedger || {});

  const fromLedgerName = fromLedger.name || payment?.from_ledger_name || (isCredit ? partyNameStr || "Party" : payment?.payment_ledger_name || "Cash / Bank");
  const fromLedgerType = String(fromLedger.type || fromLedger.group || (isCredit ? "CUSTOMER" : "BANK")).toUpperCase();

  const toLedgerName = toLedger.name || toLedger.partyName || payment?.to_ledger_name || (isCredit ? "Cash / Bank" : partyNameStr || "Party");
  const toLedgerType = String(toLedger.type || toLedger.group || (isCredit ? "BANK" : "SUPPLIER")).toUpperCase();

  // Find linked invoice if available
  const matchingInvoice = useMemo(() => {
    if (!payment) return null;
    if (payment.sales_invoice && payment.sales_invoice.id) return payment.sales_invoice;
    if (payment.invoice && payment.invoice.id) return payment.invoice;
    if (payment.purchase_invoice && payment.purchase_invoice.id) return payment.purchase_invoice;

    const targetInvId = String(payment.sales_invoice_id || payment.invoice_id || payment.purchase_invoice_id || "");
    if (targetInvId) {
      return invoices.find((i: any) => String(i.id) === targetInvId) || null;
    }
    return null;
  }, [payment, invoices]);

  const linkedInvoiceNumber = matchingInvoice
    ? (matchingInvoice.invoice_number || matchingInvoice.number || matchingInvoice.id)
    : (payment?.sales_invoice_number || payment?.invoice_number || null);

  const linkedInvoiceLabel = matchingInvoice
    ? (matchingInvoice.isSales === false || String(linkedInvoiceNumber || "").toLowerCase().startsWith("pi") ? "purchase_invoice" : "sales_invoice")
    : (pRemarks.toLowerCase().includes("pi-") ? "purchase_invoice" : "sales_invoice");

  if (isLoading && !payment) {
    return (
      <PermissionGuard module="Payment">
        <SkeletonPaymentDetails />
      </PermissionGuard>
    );
  }

  if (!payment) {
    return (
      <PermissionGuard module="Payment">
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 select-none gi-page text-center px-4 pb-12">
          <div className="h-16 w-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-3xl">
            <IoWalletOutline />
          </div>
          <div>
            <h2 className="text-xl font-bold gi-text-primary">Transaction Not Found</h2>
            <p className="text-xs gi-text-secondary mt-1">
              The transaction details you are looking for might have been removed or does not exist.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSmartBack(router, pathname, searchParams ? searchParams.get("from") : null, null, "/paymentHistory")}
            className="gi-back-btn"
          >
            <IoChevronBack />
            <span className="gi-back-label">Back</span>
          </button>
        </div>
      </PermissionGuard>
    );
  }

  const amt = Number(payment?.amount || 0);
  const isNegativeAmt = amt < 0;
  const absAmt = Math.abs(amt);

  // Badge & Color Theme rules
  let badgeText = "PAYMENT OUT";
  let badgeClass = "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50";
  let amountClass = "text-rose-600 dark:text-rose-400";
  let amountSign = isNegativeAmt ? "-" : (isCredit ? "+" : isJournal ? "+" : "-");

  if (isJournal) {
    badgeText = "JOURNAL";
    badgeClass = "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50";
    amountClass = "text-purple-700 dark:text-purple-300";
  } else if (isCredit) {
    badgeText = "PAYMENT IN";
    badgeClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50";
    amountClass = "text-emerald-600 dark:text-emerald-400";
  }

  return (
    <PermissionGuard module="Payment">
      <div className="space-y-5 select-none gi-page pb-12">
        {/* Top Header Bar */}
        <div className="flex flex sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b gi-divider">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSmartBack(router, pathname, searchParams ? searchParams.get("from") : null, null, "/paymentHistory")}
              className="gi-back-btn shrink-0"
              aria-label="Back"
            >
              <IoChevronBack />
              <span className="gi-back-label">Back</span>
            </button>

            <div>
              <div className="flex flex-row items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
                  {isJournal ? "Journal Voucher" : isCredit ? "Payment Received" : "Payment Out"}
                </h1>

              </div>
              <p className="text-xs gi-text-muted mt-0.5 font-mono">
                Ref #{pNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {hasPermission("Payment", "Edit") && (
              <button
                type="button"
                onClick={() => {
                  if (payment?.id) router.push(`/payment/receivedPayment?id=${payment.id}&type=${isCredit ? "credit" : "debit"}`);
                }}
                className="px-3.5 py-2 rounded-xl gi-surface-interactive border gi-border gi-text-primary hover:bg-[var(--gi-hover)] transition cursor-pointer flex items-center gap-2 text-xs font-bold shadow-2xs"
                title="Edit Transaction"
              >
                <IoPencilOutline className="text-base text-indigo-500" />
                <span>Edit Transaction</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left / Main Section (7 cols on Desktop) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Main Transaction Summary Banner Card */}
            <div className="p-5 sm:p-6 md:p-8 rounded-2xl border gi-border gi-card shadow-xs space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold gi-text-muted uppercase tracking-wider">Amount Transferred</span>
                <span className="text-xs gi-text-muted font-medium flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
                  <IoCalendarOutline className="text-xs text-indigo-500" />
                  <span>{pDate}</span>
                </span>
              </div>

              {/* Big Amount Banner */}
              <div className="py-2">
                <span className={`font-mono font-extrabold text-2xl sm:text-3xl md:text-4xl tracking-tight ${amountClass}`}>
                  {amountSign} ₹{absAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="border-b border-dashed gi-divider my-2" />

              {/* Flow Visualizer: From Ledger -> To Ledger */}
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-3 items-center">
                {/* From Ledger Card */}
                <div className="p-2.5 sm:p-3.5 rounded-xl gi-surface-secondary border gi-border space-y-0.5 sm:space-y-1 min-w-0">
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">
                    {isCredit ? "Received In (Debit)" : "Paid From (Credit)"}
                  </span>
                  <p className="font-bold text-xs sm:text-sm gi-text-primary truncate" title={fromLedgerName}>{fromLedgerName}</p>
                  <span className="inline-block text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 gi-text-secondary uppercase">
                    {fromLedgerType}
                  </span>
                </div>

                {/* Arrow Indicator */}
                <div className="flex justify-center shrink-0">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full gi-surface-secondary border gi-border flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                    <IoArrowForward className="text-xs sm:text-base" />
                  </div>
                </div>

                {/* To Ledger Card */}
                <div className="p-2.5 sm:p-3.5 rounded-xl gi-surface-secondary border gi-border space-y-0.5 sm:space-y-1 text-right min-w-0">
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block truncate">
                    {isCredit ? "Received From (Credit)" : "Paid To (Debit)"}
                  </span>
                  <p className="font-bold text-xs sm:text-sm gi-text-primary truncate" title={toLedgerName}>{toLedgerName}</p>
                  <span className="inline-block text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 gi-text-secondary uppercase">
                    {toLedgerType}
                  </span>
                </div>
              </div>
            </div>

            {/* Remarks Card */}
            <div className="p-5 sm:p-6 rounded-2xl border gi-border gi-card shadow-xs space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider gi-text-muted flex items-center gap-1.5">
                <IoDocumentTextOutline className="text-sm text-indigo-500" />
                <span>Remarks &amp; Notes</span>
              </h3>
              <p className="text-sm gi-text-primary leading-relaxed whitespace-pre-wrap pt-1 font-normal">
                {pRemarks || "No remark provided for this transaction."}
              </p>
            </div>
          </div>

          {/* Right / Sidebar Section (5 cols on Desktop) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Metadata Card */}
            <div className="p-5 sm:p-6 rounded-2xl border gi-border gi-card shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider gi-text-muted border-b gi-divider pb-3 flex items-center gap-1.5">
                <IoReceiptOutline className="text-sm text-indigo-500" />
                <span>Transaction Metadata</span>
              </h3>

              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center gap-2">
                  <span className="gi-text-muted">Transaction ID</span>
                  <span className="font-mono font-bold gi-text-primary">{pNumber}</span>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <span className="gi-text-muted">Payment Type</span>
                  <span className="font-semibold gi-text-primary capitalize">{pTypeStr.replace("_", " ") || "Payment"}</span>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <span className="gi-text-muted">Payment Mode</span>
                  <span className="font-semibold gi-text-primary capitalize">{getPaymentModeDisplay(payment, ledgersMap)}</span>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <span className="gi-text-muted">Date</span>
                  <span className="font-semibold gi-text-primary">{pDate}</span>
                </div>

                {payment?.created_at && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="gi-text-muted">Created Timestamp</span>
                    <span className="font-mono text-[11px] gi-text-secondary">
                      {new Date(payment.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Linked Invoice Card */}
            {linkedInvoiceNumber && (
              <div className="p-5 sm:p-6 rounded-2xl border gi-border gi-card shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider gi-text-muted flex items-center gap-1.5">
                  <IoCardOutline className="text-sm text-indigo-500" />
                  <span>Linked Document</span>
                </h3>

                <div className="p-3.5 rounded-xl gi-surface-secondary border gi-border flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold gi-text-muted uppercase">{linkedInvoiceLabel.replace("_", " ")}</p>
                    <p className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400 truncate">
                      {linkedInvoiceNumber}
                    </p>
                  </div>
                  {matchingInvoice?.id && (
                    <Link
                      href={`/invoiceDetails/${matchingInvoice.id}`}
                      className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-500/20 transition shrink-0 flex items-center gap-1"
                    >
                      <span>View</span>
                      <IoChevronForward className="text-xs" />
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Photo Proof Attachment Card */}
            {pProofImage && (
              <div className="p-5 sm:p-6 rounded-2xl border gi-border gi-card shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider gi-text-muted flex items-center gap-1.5">
                  <IoImageOutline className="text-sm text-indigo-500" />
                  <span>Attachment / Photo Proof</span>
                </h3>

                <div
                  onClick={() => setShowPhotoModal(true)}
                  className="relative rounded-xl overflow-hidden border gi-border bg-slate-100 dark:bg-zinc-800 cursor-pointer group aspect-16/9"
                >
                  <img
                    src={pProofImage}
                    alt="Proof Attachment"
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1.5 backdrop-blur-2xs">
                    <IoImageOutline className="text-lg" />
                    <span>Click to Expand</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lightbox Photo Proof Modal */}
        {showPhotoModal && pProofImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative max-w-3xl max-h-[90vh] w-full gi-card rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b gi-divider">
                <h4 className="text-xs sm:text-sm font-bold gi-text-primary">Photo Proof — {pNumber}</h4>
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="p-1 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer"
                >
                  <IoClose className="text-lg" />
                </button>
              </div>

              <div className="p-4 flex-1 flex items-center justify-center overflow-auto bg-black/10">
                <img
                  src={pProofImage}
                  alt="Payment Proof"
                  className="max-h-[70vh] max-w-full object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}

