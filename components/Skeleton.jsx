"use client";

export function SkeletonBox({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-zinc-800 rounded-lg ${className}`}
    />
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="gi-table-container shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs gi-table border-collapse">
          <thead>
            <tr className="border-b gi-divider bg-black/5">
              {Array.from({ length: cols }).map((_, cIdx) => (
                <th key={cIdx} className="py-3 px-4">
                  <SkeletonBox className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y gi-divider">
            {Array.from({ length: rows }).map((_, rIdx) => (
              <tr key={rIdx}>
                {Array.from({ length: cols }).map((_, cIdx) => (
                  <td key={cIdx} className="py-3 px-4">
                    <SkeletonBox
                      className={`h-4 ${
                        cIdx === 0
                          ? "w-32"
                          : cIdx === cols - 1
                          ? "w-16 ml-auto"
                          : "w-24"
                      }`}
                    />
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="gi-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SkeletonBox className="h-9 w-9 rounded-lg" />
              <div className="space-y-1">
                <SkeletonBox className="h-4 w-28" />
                <SkeletonBox className="h-3 w-16" />
              </div>
            </div>
            <SkeletonBox className="h-5 w-14 rounded-full" />
          </div>
          <SkeletonBox className="h-3 w-full" />
          <SkeletonBox className="h-3 w-3/4" />
          <div className="pt-3 border-t gi-divider flex items-center justify-between">
            <SkeletonBox className="h-3 w-20" />
            <SkeletonBox className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDetails() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b gi-divider">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-9 w-9 rounded-lg" />
          <div className="space-y-1">
            <SkeletonBox className="h-5 w-40" />
            <SkeletonBox className="h-3 w-24" />
          </div>
        </div>
        <div className="flex gap-2">
          <SkeletonBox className="h-8 w-20 rounded-lg" />
          <SkeletonBox className="h-8 w-20 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 gi-card p-6 space-y-4">
          <SkeletonBox className="h-5 w-32" />
          <div className="grid grid-cols-2 gap-4">
            <SkeletonBox className="h-12 w-full" />
            <SkeletonBox className="h-12 w-full" />
            <SkeletonBox className="h-16 col-span-2 w-full" />
          </div>
        </div>
        <div className="gi-card p-6 space-y-4">
          <SkeletonBox className="h-5 w-28" />
          <SkeletonBox className="h-24 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
