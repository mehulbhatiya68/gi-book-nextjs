"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePreferences } from "@/lib/hooks/usePreferences";

export default function RootPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (isLoggedIn) {
      router.replace("/home");
    } else {
      router.replace("/login");
    }
  }, [isLoggedIn, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center gi-page">
      <div className="gi-card p-6 rounded-2xl border gi-divider shadow-xs font-medium gi-text-secondary text-sm">
        Loading GI Book Application...
      </div>
    </div>
  );
}