import { Suspense } from "react";
import AddItem from "../../../components/AddItem";

export default function AddItemPage() {
    return (
        <Suspense fallback={<div className="min-h-screen p-5 flex items-center justify-center gi-text-secondary">Loading item editor...</div>}>
            <AddItem />
        </Suspense>
    );
}