import { Suspense } from "react";
import AddParty from "@/app/parties/components/AddParty";

export default function AddPartyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen p-5 flex items-center justify-center text-black/50">Loading party form...</div>}>
            <AddParty />
        </Suspense>
    );
}