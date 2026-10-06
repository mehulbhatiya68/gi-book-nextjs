import { Suspense } from "react";
import AddLedgerForm from "@/app/ledgers/components/AddLedgerForm";

export default function AddLedgerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-5 flex items-center justify-center gi-page gi-text-muted">Loading ledger...</div>}>
      <AddLedgerForm />
    </Suspense>
  );
}

