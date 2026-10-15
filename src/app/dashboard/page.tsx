import { Suspense } from "react";
import HomeContent from "@/components/HomeContent";
import { SkeletonHome } from "@/components/Skeleton";

export const metadata = {
  title: "Dashboard - GI Book",
  description: "GI Book Business Accounting & Management Dashboard",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<SkeletonHome />}>
      <HomeContent />
    </Suspense>
  );
}
