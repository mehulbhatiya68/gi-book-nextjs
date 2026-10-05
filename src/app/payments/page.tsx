import { Suspense } from "react";
import PaymentsView from "@/app/payments/components/PaymentsView";

export default function PaymentsPage() {
  return (
    <Suspense fallback={null}>
      <PaymentsView />
    </Suspense>
  );
}
