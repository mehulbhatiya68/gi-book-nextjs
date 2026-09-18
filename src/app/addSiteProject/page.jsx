import { Suspense } from "react";
import AddSiteProject from "../../../components/AddSiteProject";

export default function AddSiteProjectPage() {
    return (
        <Suspense fallback={<div className="min-h-screen p-5 flex items-center justify-center text-black/50">Loading project form...</div>}>
            <AddSiteProject />
        </Suspense>
    );
}