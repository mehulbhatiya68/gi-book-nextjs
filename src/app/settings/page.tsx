import { Suspense } from "react";
import Settings from "@/app/settings/components/Settings";

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-xs gi-text-muted">Loading settings...</div>}>
            <Settings />
        </Suspense>
    );
}