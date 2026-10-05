"use client";

import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { IoChevronBack } from "react-icons/io5";
import { handleSmartBack } from "@/lib/utils/smartNavigation";

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  backUrl?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  backUrl,
  onBack,
  actions,
  badge,
  className = "",
}: PageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleBack = () => {
    handleSmartBack(
      router,
      pathname,
      searchParams ? searchParams.get("from") : null,
      backUrl,
      undefined,
      onBack
    );
  };

  return (
    <div className={`flex items-center justify-between gap-3 pb-4 mb-6 border-b gi-divider ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={handleBack}
          className="gi-back-btn"
          title="Go Back"
          aria-label="Go Back"
        >
          <IoChevronBack />
          <span className="gi-back-label">Back</span>
        </button>

        <div className="min-w-0">
          <h1 className="text-2xl font-bold gi-text-primary tracking-tight truncate">
            {title}
          </h1>
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
