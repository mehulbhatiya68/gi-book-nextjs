"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { IoChevronBack, IoCardOutline, IoSparklesOutline } from "react-icons/io5";

interface LimitReachedViewProps {
  featureName: string;
  usedCount?: number;
  quotaLimit?: number | string;
  message?: string;
  onBack?: () => void;
}

export default function LimitReachedView({
  featureName,
  usedCount,
  quotaLimit,
  message,
  onBack,
}: LimitReachedViewProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/home");
    }
  };

  const handleUpgrade = () => {
    router.push("/settings?tab=subscription");
  };

  const formattedQuota =
    quotaLimit !== undefined && quotaLimit !== null
      ? quotaLimit === -1 || quotaLimit === "-1" || quotaLimit === "unlimited"
        ? "Unlimited"
        : quotaLimit
      : null;

  return (
    <div className="relative w-full flex flex-col items-center justify-center py-6 px-4 select-none">
      {/* Top Left Back Button */}
      <button
        type="button"
        onClick={handleBack}
        className="gi-back-btn absolute top-5 left-5 z-20"
        aria-label="Go Back"
        title="Go Back"
      >
        <IoChevronBack />
        <span className="gi-back-label">Back</span>
      </button>

      {/* Main Centered Content */}
      <div className="flex flex-col items-center justify-center text-center max-w-md w-full mx-auto py-8 px-4">
        {/* Amber / Indigo Pulsing Glow Badge Container */}
        <div className="relative mb-6">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 opacity-30 blur-lg animate-pulse" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-lg">
            <IoCardOutline className="text-3xl sm:text-4xl" />
          </div>
        </div>

        {/* Quota Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-semibold mb-3 border border-amber-200 dark:border-amber-800/80">
          <IoSparklesOutline className="text-sm" />
          <span>Plan Limit Reached</span>
        </div>

        {/* Heading */}
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight mb-2">
          Creation Limit Reached for {featureName}
        </h1>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 font-normal leading-relaxed mb-6 max-w-sm">
          {message ||
            `You have used ${
              usedCount !== undefined && formattedQuota
                ? `${usedCount} of ${formattedQuota}`
                : "all available"
            } ${featureName.toLowerCase()} creations allowed in your current plan. Upgrade your plan to add more ${featureName.toLowerCase()}.`}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          <button
            type="button"
            onClick={handleUpgrade}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl gi-btn-primary font-semibold text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
          >
            <IoCardOutline className="text-base" />
            <span>Upgrade Plan</span>
          </button>

          <button
            type="button"
            onClick={handleBack}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold text-xs sm:text-sm transition cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
