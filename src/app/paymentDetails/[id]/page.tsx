import { Suspense } from "react";
import PaymentDetailsView from "@/app/payments/components/PaymentDetailsView";
import { SkeletonDetails } from "@/components/Skeleton";

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function PaymentDetailsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const paymentId = resolvedParams?.id;

  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <SkeletonDetails />
        </div>
      }
    >
      <PaymentDetailsView initialPaymentId={paymentId} />
    </Suspense>
  );
}

