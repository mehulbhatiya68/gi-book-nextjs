import { Suspense } from "react";
import ProjectDetailsView from "@/app/siteProject/components/ProjectDetailsView";
import { SkeletonDetails } from "@/components/Skeleton";

export default function ProjectDetailsPage() {
  return (
    <Suspense fallback={<SkeletonDetails />}>
      <ProjectDetailsView />
    </Suspense>
  );
}
