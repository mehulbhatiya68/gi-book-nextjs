import { Suspense } from "react";
import AdjustStock from "../../../../components/AdjustStock";

export default function AdjustStockPage() {
    return (
        <Suspense fallback={<div className="min-h-screen p-5 flex items-center justify-center text-black/50">Loading stock adjustment...</div>}>
            <AdjustStock />
        </Suspense>
    );
}