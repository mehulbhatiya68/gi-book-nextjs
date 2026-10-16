import { Suspense } from "react";
import AddLedgerForm from "@/app/ledgers/components/AddLedgerForm";
import { SkeletonForm } from "@/components/Skeleton";

export default function AddLedgerPage() {
  return (
    <Suspense fallback={<SkeletonForm />}>
      <AddLedgerForm />
    </Suspense>
  );
}
