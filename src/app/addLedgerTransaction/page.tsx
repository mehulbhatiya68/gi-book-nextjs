import { Suspense } from "react";
import AddLedgerTransactionForm from "@/app/ledgers/components/AddLedgerTransactionForm";
import { SkeletonForm } from "@/components/Skeleton";

export default function AddLedgerTransactionPage() {
  return (
    <Suspense fallback={<SkeletonForm />}>
      <AddLedgerTransactionForm />
    </Suspense>
  );
}
