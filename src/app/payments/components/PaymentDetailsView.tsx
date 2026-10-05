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
} from "react-icons/io5";
import { useAuth } from "@/context/AuthContext";
import PermissionGuard from "@/components/PermissionGuard";
import { SkeletonDetails } from "@/components/Skeleton";
import { ledgerApi } from "@/lib/api/ledger";
import { paymentApi } from "@/lib/api/payment";
import { transactionApi } from "@/lib/api/transaction";
import { partyApi } from "@/lib/api/party";
import { invoiceApi } from "@/lib/api/invoice";

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

  const fromLedgerId = payment?.payment_ledger_id || payment?.fromLedgerId;
  const toLedgerId = payment?.party_ledger_id || payment?.toLedgerId;

  const foundFromLedger: any = ledgers.find((l: any) => String(l.id) === String(fromLedgerId));
  const foundToLedger: any = ledgers.find((l: any) => String(l.id) === String(toLedgerId));

  const fromLedger = payment?.payment_ledger || payment?.fromLedger || foundFromLedger || {};
  const toLedger = payment?.party_ledger || payment?.party || payment?.toLedger || foundToLedger || {};

  const pTypeStr = String(payment?.type || payment?.transactionType || "").toLowerCase();

  const isJournal = pTypeStr === "journal" || String(payment?.type || "").toLowerCase() === "journal";
  const isCredit = !isJournal && (pTypeStr === "payment_in" || pTypeStr === "credit" || pTypeStr === "in");

  const fromLedgerName = fromLedger.name || payment?.payment_ledger_name || (isCredit ? "Bank" : partyNameStr || "Cash");
  const fromLedgerType = String(fromLedger.type || fromLedger.group || (isCredit ? "BANK" : "CUSTOMER")).toUpperCase();

  const toLedgerName = toLedger.name || toLedger.partyName || partyNameStr || "Ledger";
  const toLedgerType = String(toLedger.type || toLedger.group || (isCredit ? "CUSTOMER" : "SUPPLIER")).toUpperCase();

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
        <div className="p-4 sm:p-6 max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto">
          <SkeletonDetails />
        </div>
      </PermissionGuard>
    );
  }

  if (!payment) {
    return (
      <PermissionGuard module="Payment">
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 select-none gi-page text-center max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto px-4">
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
            onClick={() => handleSmartBack(router, pathname, searchParams ? searchParams.get("from") : null, "/payments/history")}
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

  // Badge & Color Theme rules matching screenshots
  let badgeText = "PAYMENT OUT";
  let badgeClass = "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300";
  let amountClass = "text-rose-600 dark:text-rose-400";
  let amountSign = "-";

  if (isJournal) {
    badgeText = "JOURNAL";
    badgeClass = "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300";
    amountClass = "text-purple-700 dark:text-purple-300";
    amountSign = "+";
  } else if (isCredit) {
    badgeText = "PAYMENT IN";
    badgeClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
    amountClass = "text-emerald-600 dark:text-emerald-400";
    amountSign = "+";
  }

  return (
    <PermissionGuard module="Payment">
      <div className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-6 select-none gi-page">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleSmartBack(router, pathname, searchParams ? searchParams.get("from") : null, "/payments/history")}
            className="gi-back-btn"
            aria-label="Back"
          >
            <IoChevronBack />
            <span className="gi-back-label">Back</span>
          </button>

          {hasPermission("Payment", "Edit") && (
            <button
              type="button"
              onClick={() => {
                if (payment?.id) router.push(`/payment/receivedPayment?id=${payment.id}&type=${isCredit ? "credit" : "debit"}`);
              }}
              className="px-3 py-1.5 rounded-full text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Edit Transaction"
            >
              <IoPencilOutline className="text-lg sm:text-xl" />
              <span className="hidden sm:inline">Edit Transaction</span>
            </button>
          )}
        </div>

        {/* Main Details Card (Optimized for Mobile & Desktop) */}
        <div className="p-4 sm:p-6 md:p-8 rounded-2xl border gi-border gi-card shadow-xs space-y-4 sm:space-y-6">
          {/* Top row: Transaction Number & Type Badge */}
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs sm:text-sm font-bold gi-text-primary uppercase tracking-tight">
              {pNumber}
            </span>
            <span className={`text-[10px] sm:text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${badgeClass}`}>
              {badgeText}
            </span>
          </div>

          {/* Middle row: From Ledger -> Arrow -> To Ledger */}
          <div className="flex items-center justify-between gap-3 sm:gap-6 pt-1">
            <div className="min-w-0">
              <p className="font-bold text-sm sm:text-base md:text-lg gi-text-primary truncate">{fromLedgerName}</p>
              <p className="text-[10px] sm:text-xs gi-text-muted uppercase tracking-wider font-semibold mt-0.5">{fromLedgerType}</p>
            </div>

            <span className="gi-text-muted font-bold text-base sm:text-xl shrink-0 px-1 sm:px-3">
              <IoArrowForward />
            </span>

            <div className="min-w-0 text-right">
              <p className="font-bold text-sm sm:text-base md:text-lg gi-text-primary truncate">{toLedgerName}</p>
              <p className="text-[10px] sm:text-xs gi-text-muted uppercase tracking-wider font-semibold mt-0.5">{toLedgerType}</p>
            </div>
          </div>

          {/* Dashed Divider */}
          <div className="border-b border-dashed gi-divider my-2 sm:my-3" />

          {/* Bottom row: Date & Formatted Amount */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm gi-text-muted font-medium">{pDate}</span>
            <span className={`font-mono font-bold text-base sm:text-xl md:text-2xl ${amountClass}`}>
              {amountSign} ₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Details Below Card */}
        <div className="space-y-4 sm:space-y-5 px-1">
          {/* Linked Invoice Info */}
          {linkedInvoiceNumber && (
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-semibold gi-text-secondary capitalize">{linkedInvoiceLabel}</p>
              {matchingInvoice?.id ? (
                <Link
                  href={`/invoiceDetails/${matchingInvoice.id}`}
                  className="text-xs sm:text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1.5"
                >
                  <span>{linkedInvoiceNumber}</span>
                  <IoDocumentTextOutline className="text-xs sm:text-sm" />
                </Link>
              ) : (
                <p className="text-xs sm:text-sm font-mono font-medium gi-text-primary">{linkedInvoiceNumber}</p>
              )}
            </div>
          )}

          {/* Remark Info */}
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-semibold gi-text-secondary">Remark</p>
            <p className="text-xs sm:text-sm gi-text-primary leading-relaxed whitespace-pre-wrap">
              {pRemarks || "No remark provided"}
            </p>
          </div>

          {/* Photo Proof Attachment (if present) */}
          {pProofImage && (
            <div className="space-y-2 pt-2">
              <p className="text-xs sm:text-sm font-semibold gi-text-secondary">Photo Proof</p>
              <div
                onClick={() => setShowPhotoModal(true)}
                className="relative rounded-xl overflow-hidden border gi-border bg-slate-100 dark:bg-zinc-800 max-w-xs sm:max-w-sm cursor-pointer group aspect-4/3"
              >
                <img
                  src={pProofImage}
                  alt="Proof Attachment"
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs sm:text-sm font-semibold gap-1.5">
                  <IoImageOutline className="text-base sm:text-lg" />
                  <span>View Proof</span>
                </div>
              </div>
            </div>
          )}
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
