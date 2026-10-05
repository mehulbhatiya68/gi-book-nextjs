"use client";

export function SkeletonBox({ className = "" }) {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-zinc-800 rounded-md ${className}`} />
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="gi-table-container shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs gi-table border-collapse">
          <thead>
            <tr className="border-b gi-divider bg-black/5 dark:bg-white/5">
              {Array.from({ length: cols }).map((_, cIdx) => (
                <th key={cIdx} className="py-3 px-4">
                  <SkeletonBox className="h-4 w-20 rounded-md" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y gi-divider">
            {Array.from({ length: rows }).map((_, rIdx) => (
              <tr key={rIdx}>
                {Array.from({ length: cols }).map((_, cIdx) => (
                  <td key={cIdx} className="py-3 px-4">
                    <SkeletonBox className={`h-4 ${cIdx === 0 ? "w-32" : cIdx === cols - 1 ? "w-16 ml-auto" : "w-24"} rounded-md`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SkeletonCard({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="p-3.5 rounded-xl gi-card shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <SkeletonBox className="h-9 w-9 rounded-lg shrink-0" />
              <div className="space-y-1">
                <SkeletonBox className="h-4 w-28 rounded-md" />
                <SkeletonBox className="h-3 w-16 rounded-md" />
              </div>
            </div>
            <SkeletonBox className="h-5 w-14 rounded-full shrink-0" />
          </div>
          <div className="space-y-1.5 pt-1">
            <SkeletonBox className="h-3.5 w-full rounded" />
            <SkeletonBox className="h-3.5 w-3/4 rounded" />
          </div>
          <div className="pt-2 border-t gi-divider flex items-center justify-between">
            <SkeletonBox className="h-4 w-20 rounded-md" />
            <SkeletonBox className="h-6 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="p-4 rounded-xl gi-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <SkeletonBox className="h-3.5 w-24 rounded" />
            <SkeletonBox className="h-8 w-8 rounded-lg shrink-0" />
          </div>
          <SkeletonBox className="h-7 w-32 rounded-md" />
          <SkeletonBox className="h-3 w-20 rounded" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="p-3.5 rounded-xl gi-card shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <SkeletonBox className="h-9 w-9 rounded-lg shrink-0" />
            <div className="space-y-1 min-w-0">
              <SkeletonBox className="h-4 w-36 rounded-md" />
              <SkeletonBox className="h-3 w-24 rounded" />
            </div>
          </div>
          <div className="space-y-1 text-right shrink-0">
            <SkeletonBox className="h-4 w-20 ml-auto rounded-md" />
            <SkeletonBox className="h-3 w-14 ml-auto rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDetails() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between pb-3 border-b gi-divider">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-9 w-9 rounded-lg shrink-0" />
          <div className="space-y-1">
            <SkeletonBox className="h-5 w-40 rounded-md" />
            <SkeletonBox className="h-3 w-24 rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <SkeletonBox className="h-8 w-20 rounded-lg" />
          <SkeletonBox className="h-8 w-20 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 p-5 rounded-xl gi-card shadow-xs space-y-4">
          <SkeletonBox className="h-5 w-32 rounded-md" />
          <div className="grid grid-cols-2 gap-3">
            <SkeletonBox className="h-10 w-full rounded-lg" />
            <SkeletonBox className="h-10 w-full rounded-lg" />
            <SkeletonBox className="h-16 col-span-2 w-full rounded-lg" />
          </div>
        </div>
        <div className="p-5 rounded-xl gi-card shadow-xs space-y-4">
          <SkeletonBox className="h-5 w-28 rounded-md" />
          <SkeletonBox className="h-24 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGraph() {
  return (
    <div className="w-full bg-white dark:bg-[#161B22] rounded-3xl p-5 sm:p-6 shadow-xs space-y-6 select-none animate-pulse">
      {/* Top Header Card Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left Side: Sales Title, Main Amount & Growth Badge */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <SkeletonBox className="h-5 w-5 rounded-full shrink-0" />
            <SkeletonBox className="h-5 w-16 rounded-md" />
          </div>

          <div className="flex items-baseline gap-2.5 flex-wrap">
            <SkeletonBox className="h-8 w-44 rounded-md" />
            <SkeletonBox className="h-6 w-16 rounded-full" />
          </div>

          <div className="flex items-center gap-1.5 pt-0.5">
            <SkeletonBox className="h-2 w-2 rounded-full shrink-0" />
            <SkeletonBox className="h-3.5 w-24 rounded-md" />
          </div>
        </div>

        {/* Right Side: Compare Trigger Skeleton */}
        <div className="flex flex-col items-start sm:items-end text-left sm:text-right space-y-1">
          <SkeletonBox className="h-3 w-20 rounded" />
          <SkeletonBox className="h-5 w-28 rounded-md" />
          <SkeletonBox className="h-4 w-24 rounded-md" />
        </div>
      </div>

      {/* Chart Area Skeleton */}
      <div className="w-full h-[240px] sm:h-[260px] min-h-[240px] flex flex-col justify-between pt-4 pb-2">
        <div className="w-full border-b border-slate-100 dark:border-zinc-800/80" />
        <div className="w-full border-b border-slate-100 dark:border-zinc-800/80" />
        <div className="w-full border-b border-slate-100 dark:border-zinc-800/80" />
        <div className="w-full border-b border-slate-100 dark:border-zinc-800/80" />

        {/* X-axis Ticks */}
        <div className="flex justify-between items-center pt-4 px-2">
          <SkeletonBox className="h-3 w-7 rounded-full" />
          <SkeletonBox className="h-3 w-7 rounded-full" />
          <SkeletonBox className="h-3 w-7 rounded-full" />
          <SkeletonBox className="h-3 w-7 rounded-full" />
          <SkeletonBox className="h-3 w-7 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonHome() {
  return (
    <div className="space-y-6 select-none p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Welcome Bar Skeleton */}
      <div className="flex items-center justify-between pb-3 border-b gi-divider">
        <div className="space-y-1">
          <SkeletonBox className="h-6 w-36 rounded-md" />
          <SkeletonBox className="h-3.5 w-48 rounded-md" />
        </div>
        <SkeletonBox className="h-9 w-28 rounded-lg" />
      </div>

      {/* Two Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Right Column: Graph Skeleton (order-1 on mobile, order-2 on desktop) */}
        <div className="order-1 lg:order-2 lg:col-span-6 w-full">
          <SkeletonGraph />
        </div>

        {/* Left Column: Calculation Card + Recent Transactions (order-2 on mobile, order-1 on desktop) */}
        <div className="order-2 lg:order-1 lg:col-span-6 space-y-6">
          {/* Calculation Card Skeleton */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#161B22] border gi-divider shadow-xs space-y-4 animate-pulse">
            <SkeletonBox className="h-4 w-28 rounded" />
            <SkeletonBox className="h-9 w-52 rounded-lg" />
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <SkeletonBox className="h-5 w-24 rounded" />
                <SkeletonBox className="h-3.5 w-20 rounded" />
              </div>
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                <SkeletonBox className="h-5 w-24 rounded" />
                <SkeletonBox className="h-3.5 w-20 rounded" />
              </div>
            </div>
          </div>

          {/* Recent Transactions Skeleton */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#161B22] border gi-divider shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <SkeletonBox className="h-5 w-36 rounded" />
              <SkeletonBox className="h-4 w-24 rounded" />
            </div>
            <SkeletonTable rows={5} cols={4} />
          </div>
        </div>
      </div>
    </div>
  );
}

