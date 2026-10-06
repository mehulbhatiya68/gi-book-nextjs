import { SkeletonBox, SkeletonCard } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="w-full min-h-[50vh] bg-[#F6F7F9] dark:bg-[#0D1117] space-y-6 animate-pulse select-none p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between pb-3 border-b gi-divider">
        <SkeletonBox className="h-8 w-40 rounded-xl" />
        <SkeletonBox className="h-9 w-32 rounded-xl" />
      </div>

      {/* Metric / Summary Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SkeletonBox className="h-24 rounded-2xl" />
        <SkeletonBox className="h-24 rounded-2xl" />
        <SkeletonBox className="h-24 rounded-2xl" />
      </div>

      {/* Content List / Table Skeleton */}
      <div className="space-y-3">
        <SkeletonCard count={4} />
      </div>
    </div>
  );
}
