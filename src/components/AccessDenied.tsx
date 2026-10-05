"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { IoChevronBack, IoLockClosedOutline } from "react-icons/io5";

interface AccessDeniedProps {
  moduleName?: string;
  message?: string;
}

export default function AccessDenied({ moduleName, message }: AccessDeniedProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/home");
    }
  };

  const targetModule = moduleName || "this page";

  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden select-none">
      {/* Top Left Back Button */}
      <button
        type="button"
        onClick={handleBack}
        className="absolute top-5 left-5 sm:top-8 sm:left-8 md:top-10 md:left-12 text-slate-800 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer z-20 flex items-center justify-center"
        aria-label="Go Back"
        title="Go Back"
      >
        <IoChevronBack className="text-xl sm:text-2xl md:text-3xl" />
      </button>

      {/* Main Centered Content (No Card Container) */}
      <div className="flex flex-col items-center justify-center text-center max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl w-full mx-auto my-auto py-6 sm:py-10">
        {/* Soft Red/Pink Circle with Red Lock Icon */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center mb-6 sm:mb-8 text-rose-500 dark:text-rose-400 shrink-0">
          <IoLockClosedOutline className="text-3xl sm:text-4xl md:text-5xl" />
        </div>

        {/* Heading */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-zinc-100 tracking-tight mb-2 sm:mb-3">
          Access Denied
        </h1>

        {/* Description Text */}
        <p className="text-xs sm:text-sm md:text-base text-slate-500 dark:text-zinc-400 font-normal leading-relaxed mb-1 sm:mb-2">
          {message || `You don't have permission to access ${targetModule}.`}
        </p>

        {/* Secondary Administrator Message */}
        <p className="text-xs sm:text-sm md:text-base text-slate-400 dark:text-zinc-500 font-normal leading-relaxed">
          Please contact your administrator to grant you access.
        </p>
      </div>
    </div>
  );
}
