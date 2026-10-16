import { Suspense } from "react";
import AddItem from "@/app/items/components/AddItem";
import { SkeletonForm } from "@/components/Skeleton";

export default function EditItemPage() {
  return (
    <Suspense fallback={<SkeletonForm />}>
      <AddItem />
    </Suspense>
  );
}
