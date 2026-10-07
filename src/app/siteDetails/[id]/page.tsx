import { Suspense } from "react";
import SiteDetailsView from "@/app/siteProject/components/SiteDetailsView";
import { SkeletonDetails } from "@/components/Skeleton";

export default function SiteDetailsPage() {
  return (
    <Suspense fallback={<SkeletonDetails />}>
      <SiteDetailsView />
    </Suspense>
  );
}
