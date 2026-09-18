import { Suspense } from "react";
import InvoicesView from "../../../components/InvoicesView";

export default function InvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-6 flex items-center justify-center gi-text-muted text-xs font-semibold">
          Loading Invoices...
        </div>
      }
    >
      <InvoicesView />
    </Suspense>
  );
}
