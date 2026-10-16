import { Suspense } from "react";
import AddSiteProject from "@/app/siteProject/components/AddSiteProject";
import { SkeletonForm } from "@/components/Skeleton";

export default function AddSiteProjectPage() {
  return (
    <Suspense fallback={<SkeletonForm />}>
      <AddSiteProject />
    </Suspense>
  );
}