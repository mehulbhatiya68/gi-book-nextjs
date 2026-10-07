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
    <div className="space-y-5 select-none animate-pulse">
      <div className="flex items-center justify-between pb-3 border-b gi-divider">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-9 w-20 rounded-xl" />
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

export function SkeletonInvoiceDetails() {
  return (
    <div className="space-y-6 pb-12 select-none gi-page">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b gi-divider">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-9 w-20 rounded-xl" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <SkeletonBox className="h-6 w-36 rounded-md" />
              <SkeletonBox className="h-5 w-16 rounded-full" />
            </div>
            <SkeletonBox className="h-3.5 w-48 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-9 w-24 rounded-xl" />
          <SkeletonBox className="h-9 w-24 rounded-xl" />
          <SkeletonBox className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Main Grid: Document (Left/Main) + Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Invoice Main Document Card */}
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#161B22] border gi-divider shadow-xs space-y-6">
          {/* Seller / Buyer Header Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b gi-divider">
            {/* Seller Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <SkeletonBox className="h-10 w-10 rounded-xl shrink-0" />
                <SkeletonBox className="h-5 w-40 rounded-md" />
              </div>
              <SkeletonBox className="h-3.5 w-48 rounded-md" />
              <SkeletonBox className="h-3.5 w-36 rounded-md" />
              <SkeletonBox className="h-3.5 w-28 rounded-md" />
            </div>
            {/* Buyer Info */}
            <div className="space-y-2 sm:text-right">
              <SkeletonBox className="h-3.5 w-20 rounded-md sm:ml-auto" />
              <SkeletonBox className="h-5 w-36 rounded-md sm:ml-auto" />
              <SkeletonBox className="h-3.5 w-44 rounded-md sm:ml-auto" />
              <SkeletonBox className="h-3.5 w-32 rounded-md sm:ml-auto" />
            </div>
          </div>

          {/* Dates & Status Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50">
            <div className="space-y-1">
              <SkeletonBox className="h-3 w-16 rounded" />
              <SkeletonBox className="h-4 w-24 rounded-md" />
            </div>
            <div className="space-y-1">
              <SkeletonBox className="h-3 w-16 rounded" />
              <SkeletonBox className="h-4 w-24 rounded-md" />
            </div>
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <SkeletonBox className="h-3 w-16 rounded" />
              <SkeletonBox className="h-4 w-20 rounded-md" />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <SkeletonBox className="h-4 w-28 rounded" />
            <SkeletonTable rows={3} cols={5} />
          </div>

          {/* Totals Summary Footer */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-4 border-t gi-divider">
            <div className="space-y-2 max-w-sm w-full">
              <SkeletonBox className="h-3.5 w-24 rounded" />
              <SkeletonBox className="h-16 w-full rounded-xl" />
            </div>
            <div className="space-y-2.5 w-full sm:w-64 p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50">
              <div className="flex justify-between">
                <SkeletonBox className="h-3.5 w-20 rounded" />
                <SkeletonBox className="h-3.5 w-16 rounded" />
              </div>
              <div className="flex justify-between">
                <SkeletonBox className="h-3.5 w-20 rounded" />
                <SkeletonBox className="h-3.5 w-16 rounded" />
              </div>
              <div className="pt-2 border-t gi-divider flex justify-between items-center">
                <SkeletonBox className="h-4 w-24 rounded-md" />
                <SkeletonBox className="h-6 w-24 rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment History Sidebar Card */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-[#161B22] border gi-divider shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b gi-divider">
            <SkeletonBox className="h-5 w-32 rounded-md" />
            <SkeletonBox className="h-4 w-12 rounded" />
          </div>
          <SkeletonList count={3} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonPaymentDetails() {
  return (
    <div className="space-y-5 select-none gi-page pb-12 animate-pulse">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b gi-divider">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-9 w-20 rounded-xl" />
          <div className="space-y-1">
            <SkeletonBox className="h-7 w-48 rounded-md" />
            <SkeletonBox className="h-3.5 w-32 rounded" />
          </div>
        </div>
        <SkeletonBox className="h-9 w-36 rounded-xl" />
      </div>

      {/* Main Responsive Grid Layout (7 cols + 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left / Main Section (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-6 rounded-2xl border gi-border bg-white dark:bg-[#161B22] shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <SkeletonBox className="h-3.5 w-36 rounded" />
              <SkeletonBox className="h-6 w-24 rounded-full" />
            </div>

            <SkeletonBox className="h-10 w-52 rounded-md" />

            <div className="border-b border-dashed gi-divider" />

            {/* From Ledger -> Arrow -> To Ledger Flow */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 space-y-1">
                <SkeletonBox className="h-3 w-20 rounded" />
                <SkeletonBox className="h-5 w-28 rounded-md" />
                <SkeletonBox className="h-3 w-16 rounded" />
              </div>
              <SkeletonBox className="h-8 w-8 rounded-full shrink-0" />
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 space-y-1">
                <SkeletonBox className="h-3 w-20 rounded" />
                <SkeletonBox className="h-5 w-28 rounded-md" />
                <SkeletonBox className="h-3 w-16 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Section (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-2xl border gi-border bg-white dark:bg-[#161B22] shadow-xs space-y-4">
            <SkeletonBox className="h-5 w-32 rounded-md" />
            <div className="space-y-3">
              <div className="flex justify-between">
                <SkeletonBox className="h-3.5 w-24 rounded" />
                <SkeletonBox className="h-3.5 w-20 rounded" />
              </div>
              <div className="flex justify-between">
                <SkeletonBox className="h-3.5 w-24 rounded" />
                <SkeletonBox className="h-3.5 w-20 rounded" />
              </div>
              <div className="flex justify-between">
                <SkeletonBox className="h-3.5 w-24 rounded" />
                <SkeletonBox className="h-3.5 w-20 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonItemDetails() {
  return (
    <div className="space-y-6 pb-12 select-none gi-page animate-pulse">
      {/* Mobile View (< 768px) */}
      <div className="block md:hidden space-y-4 pb-12 select-none">
        {/* Top Header Row */}
        <div className="flex items-center justify-between py-1 border-b gi-divider pb-3">
          <SkeletonBox className="h-8 w-20 rounded-xl" />
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-8 w-28 rounded-xl" />
            <SkeletonBox className="h-8 w-8 rounded-full" />
            <SkeletonBox className="h-8 w-8 rounded-full" />
            <SkeletonBox className="h-8 w-8 rounded-full" />
          </div>
        </div>

        {/* Item Profile Info Header */}
        <div className="flex items-center gap-4 py-1">
          <SkeletonBox className="h-14 w-14 rounded-full shrink-0" />
          <SkeletonBox className="h-7 w-48 rounded-md" />
        </div>

        {/* Item Specifications */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 shadow-xs space-y-3.5">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <SkeletonBox className="h-3 w-16 rounded" />
              <SkeletonBox className="h-4 w-12 rounded" />
            </div>
            <div className="space-y-1">
              <SkeletonBox className="h-3 w-16 rounded" />
              <SkeletonBox className="h-4 w-12 rounded" />
            </div>
            <div className="space-y-1">
              <SkeletonBox className="h-3 w-16 rounded" />
              <SkeletonBox className="h-4 w-8 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <SkeletonBox className="h-3 w-16 rounded" />
              <SkeletonBox className="h-4 w-12 rounded" />
            </div>
            <div className="space-y-1">
              <SkeletonBox className="h-3 w-16 rounded" />
              <SkeletonBox className="h-4 w-16 rounded" />
            </div>
          </div>
          <div className="space-y-1">
            <SkeletonBox className="h-3 w-24 rounded" />
            <SkeletonBox className="h-4 w-3/4 rounded" />
          </div>
        </div>

        {/* Pricing & Stock Metrics */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 shadow-xs">
          <div className="space-y-1">
            <SkeletonBox className="h-3 w-16 rounded" />
            <SkeletonBox className="h-5 w-20 rounded" />
          </div>
          <div className="space-y-1">
            <SkeletonBox className="h-3 w-20 rounded" />
            <SkeletonBox className="h-5 w-20 rounded" />
          </div>
          <div className="space-y-1">
            <SkeletonBox className="h-3 w-20 rounded" />
            <SkeletonBox className="h-5 w-16 rounded" />
          </div>
          <div className="space-y-1">
            <SkeletonBox className="h-3 w-16 rounded" />
            <SkeletonBox className="h-5 w-24 rounded" />
          </div>
        </div>

        {/* Item Timeline Section */}
        <div className="pt-3 space-y-3">
          <SkeletonBox className="h-4 w-28 rounded" />
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
                <div className="space-y-1 min-w-0">
                  <SkeletonBox className="h-4 w-36 rounded" />
                  <SkeletonBox className="h-3 w-20 rounded" />
                </div>
                <SkeletonBox className="h-4 w-16 rounded shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop View (>= 768px) */}
      <div className="hidden md:block space-y-6">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b gi-divider">
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-9 w-20 rounded-xl" />
            <div className="space-y-1">
              <SkeletonBox className="h-7 w-48 rounded-md" />
              <SkeletonBox className="h-3.5 w-60 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-8 w-28 rounded-lg" />
            <SkeletonBox className="h-8 w-24 rounded-lg" />
            <SkeletonBox className="h-8 w-28 rounded-lg" />
            <SkeletonBox className="h-8 w-20 rounded-lg" />
          </div>
        </div>

        {/* 2-Column Main Layout (5 cols left + 7 cols right on Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column (5 cols): Product Specifications & Pricing Card */}
          <div className="lg:col-span-5 rounded-xl bg-white dark:bg-[#161B22] border gi-divider p-4.5 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4 pb-4 border-b gi-divider">
              <div className="flex items-center gap-3.5 min-w-0">
                <SkeletonBox className="h-12 w-12 rounded-xl shrink-0" />
                <div className="space-y-2 min-w-0">
                  <SkeletonBox className="h-5 w-40 rounded-md" />
                  <div className="flex items-center gap-2">
                    <SkeletonBox className="h-4 w-16 rounded-full" />
                    <SkeletonBox className="h-3.5 w-20 rounded" />
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-right shrink-0">
                <SkeletonBox className="h-3 w-20 rounded ml-auto" />
                <SkeletonBox className="h-6 w-24 rounded-md ml-auto" />
              </div>
            </div>

            {/* Info Grid (2 Columns) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/50 space-y-1.5">
                <SkeletonBox className="h-3 w-16 rounded" />
                <SkeletonBox className="h-5 w-24 rounded-md" />
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/50 space-y-1.5">
                <SkeletonBox className="h-3 w-20 rounded" />
                <SkeletonBox className="h-5 w-24 rounded-md" />
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/50 space-y-1.5">
                <SkeletonBox className="h-3 w-16 rounded" />
                <SkeletonBox className="h-5 w-24 rounded-md" />
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/50 space-y-1.5">
                <SkeletonBox className="h-3 w-16 rounded" />
                <SkeletonBox className="h-5 w-20 rounded-md" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/50 space-y-1.5">
                <SkeletonBox className="h-3 w-20 rounded" />
                <SkeletonBox className="h-4 w-24 rounded-md" />
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/50 space-y-1.5">
                <SkeletonBox className="h-3 w-20 rounded" />
                <SkeletonBox className="h-4 w-24 rounded-md" />
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-800/50 space-y-1.5">
              <SkeletonBox className="h-3 w-32 rounded" />
              <SkeletonBox className="h-4 w-3/4 rounded" />
            </div>
          </div>

          {/* Right Column (7 cols): Stock Movement Log Card */}
          <div className="lg:col-span-7 rounded-xl bg-white dark:bg-[#161B22] border gi-divider p-4.5 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-3 pb-3 border-b gi-divider">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <SkeletonBox className="h-5 w-40 rounded-md" />
                  <SkeletonBox className="h-4 w-20 rounded-full" />
                </div>
                <SkeletonBox className="h-3 w-64 rounded" />
              </div>
              <SkeletonBox className="h-6 w-16 rounded-lg shrink-0" />
            </div>

            {/* Stock Movement Log Cards */}
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="p-3 rounded-xl border gi-divider bg-slate-50 dark:bg-zinc-800/50 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <SkeletonBox className="h-4 w-44 rounded-md" />
                      <SkeletonBox className="h-3 w-28 rounded" />
                    </div>
                    <SkeletonBox className="h-4 w-20 rounded-md shrink-0 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonSiteDetails() {
  return (
    <div className="space-y-6 pb-12 select-none gi-page animate-pulse">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b gi-divider">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-9 w-20 rounded-xl" />
          <div className="space-y-1">
            <SkeletonBox className="h-7 w-48 rounded-md" />
            <SkeletonBox className="h-3.5 w-64 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-9 w-24 rounded-xl" />
          <SkeletonBox className="h-9 w-20 rounded-xl" />
        </div>
      </div>

      {/* Content Layout Grid (2 Columns on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Site Information Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#161B22] border gi-divider shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b gi-divider pb-4">
              <SkeletonBox className="h-10 w-10 rounded-xl shrink-0" />
              <div className="space-y-1">
                <SkeletonBox className="h-5 w-36 rounded-md" />
                <SkeletonBox className="h-3 w-48 rounded" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-800/50 space-y-1.5">
                <SkeletonBox className="h-3 w-20 rounded" />
                <SkeletonBox className="h-5 w-32 rounded-md" />
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-800/50 space-y-1.5">
                <SkeletonBox className="h-3 w-28 rounded" />
                <SkeletonBox className="h-5 w-16 rounded-full" />
              </div>
              <div className="sm:col-span-2 p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-800/50 space-y-1.5">
                <SkeletonBox className="h-3 w-36 rounded" />
                <SkeletonBox className="h-4 w-3/4 rounded" />
              </div>
              <div className="sm:col-span-2 p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-800/50 space-y-1.5">
                <SkeletonBox className="h-3 w-24 rounded" />
                <SkeletonBox className="h-4 w-28 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Parent Project Card */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#161B22] border gi-divider shadow-xs space-y-5">
            <div className="flex items-center gap-3 border-b gi-divider pb-4">
              <SkeletonBox className="h-10 w-10 rounded-xl shrink-0" />
              <div className="space-y-1">
                <SkeletonBox className="h-5 w-32 rounded-md" />
                <SkeletonBox className="h-3 w-40 rounded" />
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 space-y-2">
              <SkeletonBox className="h-4 w-16 rounded-full" />
              <SkeletonBox className="h-5 w-36 rounded-md" />
            </div>
            <SkeletonBox className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>

      {/* Site Transactions Table Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-8 w-8 rounded-lg shrink-0" />
          <div className="space-y-1">
            <SkeletonBox className="h-5 w-48 rounded-md" />
            <SkeletonBox className="h-3.5 w-60 rounded" />
          </div>
        </div>
        <SkeletonTable rows={4} cols={6} />
      </div>
    </div>
  );
}

export function SkeletonProjectDetails() {
  return (
    <div className="space-y-6 pb-12 select-none gi-page animate-pulse">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b gi-divider">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-9 w-20 rounded-xl" />
          <div className="space-y-1">
            <SkeletonBox className="h-7 w-48 rounded-md" />
            <SkeletonBox className="h-3.5 w-64 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-9 w-24 rounded-xl" />
          <SkeletonBox className="h-9 w-24 rounded-xl" />
          <SkeletonBox className="h-9 w-20 rounded-xl" />
        </div>
      </div>

      {/* Project Overview Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#161B22] border gi-divider shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b gi-divider pb-4">
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-10 w-10 rounded-xl shrink-0" />
            <div className="space-y-1">
              <SkeletonBox className="h-5 w-40 rounded-md" />
              <SkeletonBox className="h-3 w-52 rounded" />
            </div>
          </div>
          <div className="space-y-1 text-right">
            <SkeletonBox className="h-3 w-24 rounded" />
            <SkeletonBox className="h-6 w-8 ml-auto rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-800/50 space-y-1.5">
            <SkeletonBox className="h-3 w-24 rounded" />
            <SkeletonBox className="h-5 w-36 rounded-md" />
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-800/50 space-y-1.5">
            <SkeletonBox className="h-3 w-28 rounded" />
            <SkeletonBox className="h-5 w-20 rounded-full" />
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-800/50 space-y-1.5">
            <SkeletonBox className="h-3 w-24 rounded" />
            <SkeletonBox className="h-4 w-28 rounded" />
          </div>
          <div className="md:col-span-3 p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-800/50 space-y-1.5">
            <SkeletonBox className="h-3 w-36 rounded" />
            <SkeletonBox className="h-4 w-3/4 rounded" />
          </div>
        </div>
      </div>

      {/* Assigned Sites Grid Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-8 w-8 rounded-lg shrink-0" />
          <div className="space-y-1">
            <SkeletonBox className="h-5 w-44 rounded-md" />
            <SkeletonBox className="h-3.5 w-56 rounded" />
          </div>
        </div>
        <SkeletonCard count={3} />
      </div>

      {/* Project Transactions Table Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-8 w-8 rounded-lg shrink-0" />
          <div className="space-y-1">
            <SkeletonBox className="h-5 w-52 rounded-md" />
            <SkeletonBox className="h-3.5 w-64 rounded" />
          </div>
        </div>
        <SkeletonTable rows={4} cols={6} />
      </div>
    </div>
  );
}

export function SkeletonStaffDetails() {
  return (
    <div className="space-y-6 pb-12 select-none gi-page max-w-5xl mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b gi-divider">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-9 w-20 rounded-xl" />
          <SkeletonBox className="h-7 w-40 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-9 w-9 rounded-full" />
          <SkeletonBox className="h-9 w-9 rounded-full" />
        </div>
      </div>

      {/* Main Staff Profile Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#161B22] border gi-divider shadow-xs space-y-6">
        <div className="flex items-center gap-4">
          <SkeletonBox className="h-16 w-16 rounded-full shrink-0" />
          <div className="space-y-2">
            <SkeletonBox className="h-6 w-44 rounded-md" />
            <SkeletonBox className="h-5 w-24 rounded-full" />
            <div className="flex items-center gap-4 pt-1">
              <SkeletonBox className="h-3.5 w-32 rounded" />
              <SkeletonBox className="h-3.5 w-40 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Summary Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#161B22] border gi-divider shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b gi-divider">
          <SkeletonBox className="h-5 w-36 rounded-md" />
          <SkeletonBox className="h-6 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 space-y-1.5">
              <SkeletonBox className="h-4 w-28 rounded-md" />
              <SkeletonBox className="h-3 w-36 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonLedgerDetails() {
  return (
    <div className="space-y-3 sm:space-y-5 pb-20 select-none gi-page animate-pulse">
      {/* Desktop View (>= 768px) */}
      <div className="hidden md:block space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b gi-divider">
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-9 w-20 rounded-xl" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <SkeletonBox className="h-6 w-48 rounded-md" />
                <SkeletonBox className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-9 w-40 rounded-xl" />
            <SkeletonBox className="h-9 w-32 rounded-xl" />
            <SkeletonBox className="h-9 w-20 rounded-xl" />
            <SkeletonBox className="h-9 w-20 rounded-xl" />
          </div>
        </div>

        {/* Top 4-Column Spec Box */}
        <div className="grid grid-cols-4 gap-4 p-4 rounded-2xl border gi-border gi-card text-xs mb-2">
          <div className="space-y-1">
            <SkeletonBox className="h-3 w-20 rounded" />
            <SkeletonBox className="h-4.5 w-28 rounded" />
          </div>
          <div className="space-y-1">
            <SkeletonBox className="h-3 w-20 rounded" />
            <SkeletonBox className="h-4.5 w-32 rounded" />
          </div>
          <div className="space-y-1">
            <SkeletonBox className="h-3 w-24 rounded" />
            <SkeletonBox className="h-4.5 w-40 rounded" />
          </div>
          <div className="space-y-1">
            <SkeletonBox className="h-3 w-24 rounded" />
            <SkeletonBox className="h-4.5 w-40 rounded" />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 pb-1">
          <SkeletonBox className="h-9 w-24 rounded-xl" />
          <SkeletonBox className="h-9 w-24 rounded-xl" />
        </div>

        {/* Desktop Transactions Table */}
        <SkeletonTable rows={6} cols={5} />
      </div>

      {/* Mobile View (< 768px) */}
      <div className="block md:hidden space-y-3">
        {/* Mobile Header Bar */}
        <div className="flex items-center justify-between py-1">
          <SkeletonBox className="h-9 w-20 rounded-xl" />
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-8 w-28 rounded-xl" />
            <SkeletonBox className="h-8 w-8 rounded-full" />
            <SkeletonBox className="h-8 w-8 rounded-full" />
            <SkeletonBox className="h-8 w-8 rounded-full" />
          </div>
        </div>

        {/* Mobile Profile & Balance Row */}
        <div className="flex items-center justify-between gap-3 pt-0 pb-1">
          <div className="space-y-1">
            <SkeletonBox className="h-5 w-36 rounded" />
            <SkeletonBox className="h-3.5 w-20 rounded" />
          </div>
          <SkeletonBox className="h-6 w-24 rounded-md" />
        </div>

        {/* Mobile Spec Cards */}
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 p-3.5 grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <SkeletonBox className="h-3 w-16 rounded" />
              <SkeletonBox className="h-4 w-24 rounded" />
            </div>
            <div className="space-y-1">
              <SkeletonBox className="h-3 w-16 rounded" />
              <SkeletonBox className="h-4 w-24 rounded" />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 p-3.5 grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <SkeletonBox className="h-3 w-20 rounded" />
              <SkeletonBox className="h-4 w-28 rounded" />
            </div>
            <div className="space-y-1">
              <SkeletonBox className="h-3 w-20 rounded" />
              <SkeletonBox className="h-4 w-28 rounded" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 pt-1">
          <SkeletonBox className="h-8 w-24 rounded-xl" />
          <SkeletonBox className="h-8 w-24 rounded-xl" />
        </div>

        {/* Mobile Transaction Cards */}
        <div className="space-y-3 pt-1">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <SkeletonBox className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-1 min-w-0">
                  <SkeletonBox className="h-4 w-32 rounded" />
                  <SkeletonBox className="h-3 w-20 rounded" />
                </div>
              </div>
              <div className="space-y-1 text-right shrink-0">
                <SkeletonBox className="h-4 w-12 rounded ml-auto" />
                <SkeletonBox className="h-4 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="space-y-6 pb-12 select-none gi-page max-w-5xl mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b gi-divider">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-9 w-20 rounded-xl" />
          <SkeletonBox className="h-7 w-48 rounded-md" />
        </div>
        <SkeletonBox className="h-9 w-28 rounded-xl" />
      </div>

      {/* Form Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#161B22] border gi-divider shadow-xs space-y-6">
        {/* Top Field Box (Party Selection / Main Title) */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 space-y-2">
          <SkeletonBox className="h-3.5 w-28 rounded" />
          <SkeletonBox className="h-10 w-full rounded-xl" />
        </div>

        {/* 2 Column Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <SkeletonBox className="h-3.5 w-24 rounded" />
            <SkeletonBox className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <SkeletonBox className="h-3.5 w-24 rounded" />
            <SkeletonBox className="h-10 w-full rounded-xl" />
          </div>
        </div>

        {/* Items or Details Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <SkeletonBox className="h-4 w-32 rounded-md" />
            <SkeletonBox className="h-8 w-24 rounded-lg" />
          </div>
          <SkeletonTable rows={3} cols={4} />
        </div>

        {/* Action Button Bar */}
        <div className="pt-4 border-t gi-divider flex justify-end gap-3">
          <SkeletonBox className="h-10 w-28 rounded-xl" />
          <SkeletonBox className="h-10 w-36 rounded-xl" />
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
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#161B22] border gi-divider shadow-xs space-y-4 animate-pulse">
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

