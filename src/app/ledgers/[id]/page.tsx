import { Suspense } from "react";
import LedgerDetailsView from "@/app/ledgers/components/LedgerDetailsView";
import { SkeletonDetails } from "@/components/Skeleton";

export default function LedgerDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <SkeletonDetails />
        </div>
      }
    >
      <LedgerDetailsView />
    </Suspense>
  );
}
