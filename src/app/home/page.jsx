"use client";

import { Suspense } from "react";
import HomeContent from "../../../components/HomeContent";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-5 flex items-center justify-center gi-text-secondary text-sm">Loading Home Dashboard...</div>}>
      <HomeContent />
    </Suspense>
  );
}