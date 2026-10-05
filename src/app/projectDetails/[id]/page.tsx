import { Suspense } from "react";
import ProjectDetailsView from "@/app/siteProject/components/ProjectDetailsView";

export default function ProjectDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-5 flex items-center justify-center gi-text-secondary">
          Loading project details...
        </div>
      }
    >
      <ProjectDetailsView />
    </Suspense>
  );
}
