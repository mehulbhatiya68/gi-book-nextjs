"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IoArrowBack, IoSaveOutline } from "react-icons/io5";
import { useApp } from "@/context/AppContext";
import PermissionGuard from "./PermissionGuard";

export default function AddLedgerForm() {
  const router = useRouter();
  const { addLedger } = useApp();

  const [formData, setFormData] = useState({
    name: "",
    type: "Bank",
    openingBalance: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg("Ledger Name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      addLedger({
        name: formData.name.trim(),
        type: formData.type,
        openingBalance: Number(formData.openingBalance) || 0,
      });
      router.push("/ledgers");
    } catch (err) {
      console.error("Error creating ledger:", err);
      setErrorMsg("Failed to create ledger. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <PermissionGuard module="Ledger" action="Create">
      <div className="max-w-2xl mx-auto space-y-6 pb-12 gi-page select-none">
        {/* Top Controls */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b gi-divider">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/ledgers")}
              className="p-2 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer shrink-0"
              title="Back to Ledgers"
            >
              <IoArrowBack className="text-lg" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
                Create New Ledger
              </h1>
              <p className="text-xs gi-text-secondary mt-0.5">
                Set up financial account or bank ledger
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="gi-card p-6 rounded-xl border gi-divider space-y-5 shadow-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Ledger Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold gi-text-primary">
              Ledger Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. ICICI Corporate Account, Office Petty Cash..."
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2 rounded-lg text-sm gi-input focus:outline-none"
            />
          </div>

          {/* Ledger Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold gi-text-primary">
              Ledger Type <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-lg text-sm gi-input focus:outline-none cursor-pointer"
            >
              <option value="Bank">Bank</option>
              <option value="Cash">Cash</option>
              <option value="Expense">Expense</option>
              <option value="Others">Others</option>
            </select>
          </div>

          {/* Opening Balance */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold gi-text-primary">
              Opening Balance (₹)
            </label>
            <input
              type="number"
              name="openingBalance"
              placeholder="0"
              value={formData.openingBalance}
              onChange={handleChange}
              step="any"
              className="w-full px-3.5 py-2 rounded-lg text-sm gi-input focus:outline-none"
            />
            <p className="text-[11px] gi-text-secondary">
              Initial balance available in this ledger at setup time.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t gi-divider">
            <button
              type="button"
              onClick={() => router.push("/ledgers")}
              className="px-4 py-2 rounded-lg text-xs font-semibold border gi-surface-interactive gi-text-secondary cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg gi-btn-primary text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <IoSaveOutline className="text-base" />
              <span>{isSubmitting ? "Saving..." : "Save Ledger"}</span>
            </button>
          </div>
        </form>
      </div>
    </PermissionGuard>
  );
}
