"use client";

import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { IoShieldOutline, IoArrowBack } from "react-icons/io5";

export default function PermissionGuard({ module, action = "View", children }) {
  const { hasPermission, currentUser } = useApp();

  if (hasPermission(module, action)) {
    return children;
  }

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-md text-center flex flex-col items-center">
        <div className="h-14 w-14 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center mb-4 text-rose-600 dark:text-rose-400">
          <IoShieldOutline className="text-3xl" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Access Restricted</h2>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">
          Your staff account (<strong>{currentUser?.name || "Staff"}</strong>) does not have permission to access the <strong>{module}</strong> module.
        </p>

        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2">
          Please contact your business owner to update your staff permissions.
        </p>

        <Link
          href="/home"
          className="mt-6 px-5 py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <IoArrowBack className="text-base" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
