import { Suspense } from "react";
import AddLedgerTransactionForm from "@/app/ledgers/components/AddLedgerTransactionForm";

export default function AddLedgerTransactionPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-xs gi-text-muted">Loading transaction form...</div>}>
      <AddLedgerTransactionForm />
    </Suspense>
  );
}

