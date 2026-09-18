"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  IoArrowBack,
  IoSaveOutline,
  IoImageOutline,
  IoTrashOutline,
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";
import PermissionGuard from "./PermissionGuard";
import ToggleSwitch from "./ToggleSwitch";

export default function AddLedgerTransactionForm() {
  const router = useRouter();
  const { ledgers = [], siteProjects = [], addLedgerTransaction } = useApp();

  const [formData, setFormData] = useState({
    fromLedgerId: ledgers[0]?.id ? String(ledgers[0].id) : "",
    toLedgerId: ledgers[1]?.id ? String(ledgers[1].id) : (ledgers[0]?.id ? String(ledgers[0].id) : ""),
    amount: "",
    transactionType: "Debit",
    hasSiteProject: false,
    siteProjectId: siteProjects[0]?.id ? String(siteProjects[0].id) : "",
    remark: "",
    imageProof: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errorMsg) setErrorMsg("");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image size exceeds 5MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, imageProof: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const removeImageProof = () => {
    if (window.confirm("Are you sure you want to remove this image proof?")) {
      setFormData((prev) => ({ ...prev, imageProof: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fromLedgerId) {
      setErrorMsg("Please select From Ledger.");
      return;
    }
    if (!formData.toLedgerId) {
      setErrorMsg("Please select To Ledger.");
      return;
    }
    if (formData.fromLedgerId === formData.toLedgerId) {
      setErrorMsg("From Ledger and To Ledger cannot be the same account.");
      return;
    }
    const amt = Number(formData.amount);
    if (!amt || amt <= 0) {
      setErrorMsg("Please enter a valid transfer amount greater than 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      addLedgerTransaction({
        fromLedgerId: formData.fromLedgerId,
        toLedgerId: formData.toLedgerId,
        amount: amt,
        transactionType: formData.transactionType,
        hasSiteProject: formData.hasSiteProject,
        siteProjectId: formData.hasSiteProject ? formData.siteProjectId : null,
        remark: formData.remark.trim(),
        imageProof: formData.imageProof,
      });
      router.push("/ledgerTransactions");
    } catch (err) {
      console.error("Error adding ledger transaction:", err);
      setErrorMsg("Failed to record transaction. Please try again.");
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
              onClick={() => router.push("/ledgerTransactions")}
              className="p-2 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer shrink-0"
              title="Back to Ledger Transactions"
            >
              <IoArrowBack className="text-lg" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
                Record Ledger Transfer
              </h1>
              <p className="text-xs gi-text-secondary mt-0.5">
                Transfer funds or post entries between internal accounts
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

          {/* Ledger Selectors Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* From Ledger */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold gi-text-primary">
                From Ledger (Source) <span className="text-red-500">*</span>
              </label>
              <select
                name="fromLedgerId"
                value={formData.fromLedgerId}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 rounded-lg text-sm gi-input focus:outline-none cursor-pointer"
              >
                <option value="">Select From Ledger</option>
                {ledgers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.type} - ₹{Number(l.closingBalance !== undefined ? l.closingBalance : l.openingBalance || 0).toLocaleString("en-IN")})
                  </option>
                ))}
              </select>
            </div>

            {/* To Ledger */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold gi-text-primary">
                To Ledger (Destination) <span className="text-red-500">*</span>
              </label>
              <select
                name="toLedgerId"
                value={formData.toLedgerId}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 rounded-lg text-sm gi-input focus:outline-none cursor-pointer"
              >
                <option value="">Select To Ledger</option>
                {ledgers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.type} - ₹{Number(l.closingBalance !== undefined ? l.closingBalance : l.openingBalance || 0).toLocaleString("en-IN")})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount & Transaction Type Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold gi-text-primary">
                Transfer Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
                step="any"
                required
                min="0.01"
                className="w-full px-3.5 py-2 rounded-lg text-sm gi-input focus:outline-none font-bold"
              />
            </div>

            {/* Transaction Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold gi-text-primary">
                Transaction Type
              </label>
              <div className="flex items-center gap-2 pt-0.5">
                {["Debit", "Credit"].map((typeOption) => (
                  <button
                    key={typeOption}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, transactionType: typeOption }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      formData.transactionType === typeOption
                        ? typeOption === "Debit"
                          ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-700"
                          : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700"
                        : "gi-surface-interactive gi-text-secondary"
                    }`}
                  >
                    {typeOption}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Site / Project Selection Toggle */}
          <div className="p-4 rounded-xl border gi-divider bg-[var(--gi-surface)] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold gi-text-primary block">
                  Tag Site / Project
                </span>
                <span className="text-[11px] gi-text-secondary">
                  Optionally associate this ledger transaction with an active site project
                </span>
              </div>

              {/* Animated Interactive Switch Button */}
              <ToggleSwitch
                checked={formData.hasSiteProject}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    hasSiteProject: val,
                  }))
                }
                ariaLabel="Tag Site or Project"
              />
            </div>

            <AnimatePresence>
              {formData.hasSiteProject && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="pt-2 overflow-hidden space-y-1"
                >
                  <label className="block text-xs font-semibold gi-text-primary">
                    Select Site / Project
                  </label>
                  <select
                    name="siteProjectId"
                    value={formData.siteProjectId}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 rounded-lg text-sm gi-input focus:outline-none cursor-pointer"
                  >
                    <option value="">Select Site / Project</option>
                    {siteProjects.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.siteName || sp.name || "Site"} ({sp.city || sp.location || "Active"})
                      </option>
                    ))}
                  </select>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Remark / Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold gi-text-primary">
              Remark / Note
            </label>
            <textarea
              name="remark"
              rows={2}
              placeholder="Add transfer purpose, receipt reference, or note..."
              value={formData.remark}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-lg text-sm gi-input focus:outline-none resize-none"
            />
          </div>

          {/* Image Proof Upload */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold gi-text-primary">
              Image Proof / Attachment
            </label>

            {formData.imageProof ? (
              <div className="relative rounded-xl border gi-divider p-2 flex items-center justify-between bg-[var(--gi-surface)]">
                <div className="flex items-center gap-3">
                  <img
                    src={formData.imageProof}
                    alt="Proof Preview"
                    className="h-14 w-14 object-cover rounded-lg border gi-divider"
                  />
                  <div>
                    <span className="text-xs font-semibold gi-text-primary block">
                      Proof Uploaded
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Ready to submit
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={removeImageProof}
                  className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                  title="Remove Image"
                >
                  <IoTrashOutline className="text-lg" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed gi-divider rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors">
                <IoImageOutline className="text-2xl gi-text-secondary mb-1" />
                <span className="text-xs font-semibold gi-text-primary">
                  Click to upload proof photo / receipt
                </span>
                <span className="text-[11px] gi-text-secondary mt-0.5">
                  PNG, JPG or WebP (max 5MB)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t gi-divider">
            <button
              type="button"
              onClick={() => router.push("/ledgerTransactions")}
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
              <span>{isSubmitting ? "Processing..." : "Save Transaction"}</span>
            </button>
          </div>
        </form>
      </div>
    </PermissionGuard>
  );
}
