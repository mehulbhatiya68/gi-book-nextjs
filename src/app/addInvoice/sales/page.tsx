import { Suspense } from "react";
import SalesInvoiceForm from "@/app/invoice/components/SalesInvoiceForm";
import { SkeletonForm } from "@/components/Skeleton";

export default function SalesInvoicePage() {
  return (
    <Suspense fallback={<SkeletonForm />}>
      <SalesInvoiceForm />
    </Suspense>
  );
}