import { Suspense } from "react";
import AddStaff from "@/app/staff/components/AddStaff";

export default function AddStaffPage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-5 flex items-center justify-center text-black/50">Loading staff form...</div>}>
      <AddStaff />
    </Suspense>
  );
}