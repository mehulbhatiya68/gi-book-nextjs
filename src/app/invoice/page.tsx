import { Suspense } from "react";
import InvoicesView from "@/app/invoice/components/InvoicesView";
import { SkeletonTable } from "@/components/Skeleton";

export default function InvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-4 sm:p-6 max-w-7xl mx-auto">
          <SkeletonTable rows={8} cols={6} />
        </div>
      }
    >
      <InvoicesView />
    </Suspense>
  );
}
