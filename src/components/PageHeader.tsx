"use client";

import React, { Suspense } from "react";
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

function PageHeaderBackButton({ backUrl, onBack }: { backUrl?: string; onBack?: () => void }) {
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
  );
}

function FallbackBackButton({ backUrl, onBack }: { backUrl?: string; onBack?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleBack = () => {
    handleSmartBack(router, pathname, null, backUrl, undefined, onBack);
  };

  return (
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
  );
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
  return (
    <div className={`flex items-center justify-between gap-3 pb-4 mb-6 border-b gi-divider ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        <Suspense fallback={<FallbackBackButton backUrl={backUrl} onBack={onBack} />}>
          <PageHeaderBackButton backUrl={backUrl} onBack={onBack} />
        </Suspense>

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

