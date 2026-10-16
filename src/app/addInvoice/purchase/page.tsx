import { Suspense } from "react";
import PurchaseInvoiceForm from "@/app/invoice/components/PurchaseInvoiceForm";
import { SkeletonForm } from "@/components/Skeleton";

export default function PurchaseInvoicePage() {
  return (
    <Suspense fallback={<SkeletonForm />}>
      <PurchaseInvoiceForm />
    </Suspense>
  );
}