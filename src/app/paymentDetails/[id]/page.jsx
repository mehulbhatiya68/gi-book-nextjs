import { Suspense } from "react";
import PaymentDetailsView from "../../../../components/PaymentDetailsView";

export default function PaymentDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-5 flex items-center justify-center gi-text-secondary">Loading payment details...</div>}>
      <PaymentDetailsView />
    </Suspense>
  );
}
