import { Suspense } from "react";
import SiteDetailsView from "@/app/siteProject/components/SiteDetailsView";

export default function SiteDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-5 flex items-center justify-center gi-text-secondary">
          Loading site details...
        </div>
      }
    >
      <SiteDetailsView />
    </Suspense>
  );
}
