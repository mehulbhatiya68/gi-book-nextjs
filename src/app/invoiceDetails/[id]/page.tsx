import { Suspense } from "react";
import InvoiceDetailsView from "@/app/invoice/components/InvoiceDetailsView";

export default function InvoiceDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-5 flex items-center justify-center gi-text-secondary">
          Loading invoice details...
        </div>
      }
    >
      <InvoiceDetailsView />
    </Suspense>
  );
}
