import { Suspense } from "react";
import SalesInvoiceForm from "@/app/invoice/components/SalesInvoiceForm";

export default function SalesInvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SalesInvoiceForm />
    </Suspense>
  );
}