import { Suspense } from "react";
import AddStaff from "@/app/staff/components/AddStaff";
import { SkeletonForm } from "@/components/Skeleton";

export default function AddStaffPage() {
  return (
    <Suspense fallback={<SkeletonForm />}>
      <AddStaff />
    </Suspense>
  );
}