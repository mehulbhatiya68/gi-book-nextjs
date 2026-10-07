import { Suspense } from "react";
import InvoiceDetailsView from "@/app/invoice/components/InvoiceDetailsView";
import { SkeletonDetails } from "@/components/Skeleton";

export default function InvoiceDetailsPage() {
  return (
    <Suspense fallback={<SkeletonDetails />}>
      <InvoiceDetailsView />
    </Suspense>
  );
}
