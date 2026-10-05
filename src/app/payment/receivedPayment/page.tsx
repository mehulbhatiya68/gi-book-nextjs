import { Suspense } from "react";
import ReceivedPaymentView from "./components/ReceivedPaymentView";

export const metadata = {
  title: "Add Payment | GI-Book",
  description: "Record incoming customer payment receipts and outgoing vendor disbursements",
};

export default function ReceivedPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-6 flex items-center justify-center gi-text-muted text-xs font-semibold">
          Loading Payment Form...
        </div>
      }
    >
      <ReceivedPaymentView />
    </Suspense>
  );
}
