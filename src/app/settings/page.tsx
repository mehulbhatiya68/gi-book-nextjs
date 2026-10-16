import { Suspense } from "react";
import Settings from "@/app/settings/components/Settings";
import { SkeletonForm } from "@/components/Skeleton";

export default function SettingsPage() {
  return (
    <Suspense fallback={<SkeletonForm />}>
      <Settings />
    </Suspense>
  );
}