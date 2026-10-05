import { Suspense } from "react";
import PaymentDetailsView from "@/app/payments/components/PaymentDetailsView";
import { transactionApi } from "@/lib/api/transaction";
import { invoiceApi } from "@/lib/api/invoice";
import { partyApi } from "@/lib/api/party";
import { ledgerApi } from "@/lib/api/ledger";
import { SkeletonDetails } from "@/components/Skeleton";

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function PaymentDetailsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const paymentId = resolvedParams?.id;

  let initialPayment: any = null;
  let initialInvoices: any[] = [];
  let initialParties: any[] = [];
  let initialLedgers: any[] = [];

  if (paymentId) {
    try {
      // 1. Fetch single transaction details, invoices, parties, and ledgers in parallel on the server
      const [txRes, invoicesRes, partiesRes, ledgersRes]: any = await Promise.all([
        transactionApi.getTransactionById(paymentId, { silentError: true }).catch(() => null),
        invoiceApi.getInvoices({ per_page: "all", silentError: true }).catch(() => null),
        partyApi.getParties().catch(() => null),
        ledgerApi.getLedgers({ per_page: "all", silentError: true }).catch(() => null),
      ]);

      // Extract transaction / payment from API response
      initialPayment =
        txRes?.body?.transaction ||
        txRes?.body?.payment ||
        txRes?.body?.data ||
        (txRes?.body && typeof txRes.body === "object" && !Array.isArray(txRes.body) && txRes.body.id ? txRes.body : null);

      // Extract invoices list
      const invList = Array.isArray(invoicesRes?.body)
        ? invoicesRes.body
        : invoicesRes?.body?.invoices || invoicesRes?.body?.data || (Array.isArray(invoicesRes) ? invoicesRes : []);
      initialInvoices = Array.isArray(invList) ? invList : [];

      // Extract parties list
      const partyList = Array.isArray(partiesRes?.body)
        ? partiesRes.body
        : partiesRes?.body?.data || partiesRes?.body?.parties || partiesRes?.body?.ledgers || (Array.isArray(partiesRes) ? partiesRes : []);
      initialParties = Array.isArray(partyList) ? partyList : [];

      // Extract ledgers list
      const ledgerList = Array.isArray(ledgersRes?.body)
        ? ledgersRes.body
        : ledgersRes?.body?.ledgers || ledgersRes?.body?.data || (Array.isArray(ledgersRes) ? ledgersRes : []);
      initialLedgers = Array.isArray(ledgerList) ? ledgerList : [];

      // If payment has a sales_invoice_id or invoice_id, ensure that full invoice is fetched from API
      const directInvId = initialPayment?.sales_invoice_id || initialPayment?.invoice_id || initialPayment?.purchase_invoice_id;
      if (directInvId && !initialInvoices.some((i: any) => String(i.id) === String(directInvId))) {
        try {
          const singleInvRes: any = await invoiceApi.getInvoice(directInvId, { silentError: true }).catch(() => null);
          const singleInv = singleInvRes?.body?.invoice || singleInvRes?.body?.data || singleInvRes?.body;
          if (singleInv && singleInv.id) {
            initialInvoices.push(singleInv);
          }
        } catch (_) { }
      }

      // If initialPayment itself has sales_invoice object attached from API, ensure it is in the list
      if (initialPayment?.sales_invoice && initialPayment.sales_invoice.id) {
        if (!initialInvoices.some((i: any) => String(i.id) === String(initialPayment.sales_invoice.id))) {
          initialInvoices.push(initialPayment.sales_invoice);
        }
      }
    } catch (err) {
      console.error("[SSR PaymentDetailsPage] Failed to pre-fetch payment details on server:", err);
    }
  }

  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <SkeletonDetails />
        </div>
      }
    >
      <PaymentDetailsView
        initialPaymentId={paymentId}
        initialPayment={initialPayment}
        initialInvoices={initialInvoices}
        initialParties={initialParties}
        initialLedgers={initialLedgers}
      />
    </Suspense>
  );
}
