"use client";

import Link from "next/link";
import { IoArrowBack, IoNotificationsOutline } from "react-icons/io5";

export default function NotificationsPage() {
  return (
    <div className="space-y-6 pb-12 text-slate-900 dark:text-zinc-100">
      {/* Top Controls */}
      <div className="flex items-center gap-3 pb-2">
        <Link href="/home">
          <button
            type="button"
            className="p-2 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer shrink-0"
            title="Back to Dashboard"
          >
            <IoArrowBack className="text-lg" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
            Notifications
          </h1>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-12 min-h-[360px] flex items-center justify-center shadow-sm">
        {/* Empty Notification State */}
        <div className="flex flex-col items-center text-center max-w-sm">
          <div className="h-16 w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            <IoNotificationsOutline className="text-3xl" />
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            No New Notifications
          </h2>

          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
            You&apos;re all caught up! Automated payment reminders and stock alerts will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}