import { Suspense } from "react";
import AddParty from "@/app/parties/components/AddParty";
import { SkeletonForm } from "@/components/Skeleton";

export default function AddPartyPage() {
  return (
    <Suspense fallback={<SkeletonForm />}>
      <AddParty />
    </Suspense>
  );
}