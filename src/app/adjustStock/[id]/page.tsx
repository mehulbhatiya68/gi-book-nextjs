import { Suspense } from "react";
import AdjustStock from "@/app/items/components/AdjustStock";
import { SkeletonForm } from "@/components/Skeleton";

export default function AdjustStockPage() {
  return (
    <Suspense fallback={<SkeletonForm />}>
      <AdjustStock />
    </Suspense>
  );
}