import { Suspense } from "react";
import HomeContent from "@/components/HomeContent";
import { SkeletonHome } from "@/components/Skeleton";

export default function HomePage() {
  return (
    <Suspense fallback={<SkeletonHome />}>
      <HomeContent />
    </Suspense>
  );
}