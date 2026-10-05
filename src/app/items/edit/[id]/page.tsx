import { Suspense } from "react";
import AddItem from "@/app/items/components/AddItem";

export default function EditItemPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-5 flex items-center justify-center gi-text-secondary">
          Loading item editor...
        </div>
      }
    >
      <AddItem />
    </Suspense>
  );
}
