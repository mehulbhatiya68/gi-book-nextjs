"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LandingPage from "@/components/LandingPage";

export default function RootPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (isLoggedIn) {
      router.replace("/dashboard");
    }
  }, [isLoggedIn, isLoading, router]);

  if (isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D1117]">
        <div className="p-6 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800 shadow-md flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
            Opening your Dashboard...
          </span>
        </div>
      </div>
    );
  }

  return <LandingPage />;
}