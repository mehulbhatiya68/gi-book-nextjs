"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function RootPage() {
  const router = useRouter();
  const { isLoggedIn } = useApp();

  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/home");
    } else {
      router.replace("/login");
    }
  }, [isLoggedIn, router]);

  return (
    <div className="min-h-screen flex items-center justify-center gi-page">
      <div className="gi-card p-6 rounded-2xl border gi-divider shadow-xs font-medium gi-text-secondary text-sm">
        Loading GI Book Application...
      </div>
    </div>
  );
}