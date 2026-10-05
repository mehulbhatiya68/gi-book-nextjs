import { Suspense } from "react";
import AddPurchaseInvoice from "@/app/invoice/components/AddPurchaseInvoice";

export default function PurchaseInvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AddPurchaseInvoice />
    </Suspense>
  );
}