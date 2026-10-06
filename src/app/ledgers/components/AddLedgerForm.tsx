"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IoSaveOutline } from "react-icons/io5";
import PermissionGuard from "@/components/PermissionGuard";
import PageHeader from "@/components/PageHeader";
import { ledgerApi } from "@/lib/api/ledger";
import { partyApi } from "@/lib/api/party";
import { toast } from "react-toastify";
import LimitReachedView from "@/components/LimitReachedView";
import { useLimitCheck } from "@/lib/hooks/useLimitCheck";
import CustomSelect from "@/components/CustomSelect";
import AddParty from "@/app/parties/components/AddParty";

interface AddLedgerFormProps {
  ledgerToEdit?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AddLedgerForm({ ledgerToEdit, onSuccess, onCancel }: AddLedgerFormProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = ledgerToEdit?.id || searchParams?.get("id");
  const fromParam = searchParams?.get("from");
  const isEdit = Boolean(editId);

  const { isLimitReached, used, quota, featureName } = useLimitCheck("ledger", isEdit);

  const [formData, setFormData] = useState({
    name: "",
    type: "bank",
    openingBalance: "0",
    openingBalanceType: "debit",
  });

  const [fetchedLedger, setFetchedLedger] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(Boolean(editId && !ledgerToEdit));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (editId && !ledgerToEdit) {
      setIsLoadingDetail(true);
      Promise.all([
        ledgerApi.getLedger(editId).catch(() => null),
        partyApi.getPartyDetails(editId).catch(() => null),
      ])
        .then(([lRes, pRes]: any[]) => {
          const lData = lRes?.body?.ledger || lRes?.body?.party || lRes?.body?.data || lRes?.body;
          const pData = pRes?.body?.party || pRes?.body?.ledger || pRes?.body?.data || pRes?.body;
          const data = pData || lData;
          if (data) {
            setFetchedLedger(data);
          }
        })
        .finally(() => {
          setIsLoadingDetail(false);
        });
    }
  }, [editId, ledgerToEdit]);

  const activeLedger = ledgerToEdit || fetchedLedger;
  const activeType = String(activeLedger?.type || activeLedger?.partyType || activeLedger?.party_type || "").toLowerCase().trim();
  const isPartyLedger = activeType === "customer" || activeType === "supplier";

  useEffect(() => {
    if (activeLedger) {
      let lType = (activeLedger.type || "bank").toLowerCase();
      if (!["bank", "cash", "expense"].includes(lType)) {
        lType = "others";
      }
      setFormData({
        name: activeLedger.name || activeLedger.partyName || "",
        type: lType,
        openingBalance: String(activeLedger.opening_balance ?? activeLedger.openingBalance ?? "0"),
        openingBalanceType: (activeLedger.opening_balance_type || activeLedger.openingBalanceType || "debit").toLowerCase(),
      });
    }
  }, [activeLedger]);

  const handleBack = () => {
    if (onCancel) {
      onCancel();
    } else if (fromParam) {
      router.push(fromParam);
    } else if (isEdit && editId) {
      router.push(`/ledgers/${editId}`);
    } else {
      router.push("/ledgers");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errorMsg) setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg("Ledger Name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const apiType = formData.type === "others" ? "expense" : formData.type;

      const payload: any = {
        name: formData.name.trim(),
        type: apiType as any,
        opening_balance: Number(formData.openingBalance) || 0,
        opening_balance_type: formData.openingBalanceType as "debit" | "credit",
      };

      if (isEdit && editId) {
        await ledgerApi.updateLedger(editId, payload);
        toast.success("Ledger updated successfully!");
      } else {
        await ledgerApi.storeLedger(payload);
        toast.success("Ledger created successfully!");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        handleBack();
      }
    } catch (err: any) {
      console.error("Error saving ledger:", err);
      const msg = err.message || "Failed to save ledger. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  if (isPartyLedger) {
    return <AddParty />;
  }

  if (isLoadingDetail) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center gi-page">
        <div className="gi-card p-6 rounded-xl border gi-divider text-center shadow-xs">
          <p className="text-sm gi-text-secondary">Loading ledger details...</p>
        </div>
      </div>
    );
  }

  if (isLimitReached) {
    return (
      <LimitReachedView
        featureName={featureName}
        usedCount={used}
        quotaLimit={quota}
        onBack={handleBack}
      />
    );
  }

  return (
    <PermissionGuard module="Ledger" action={isEdit ? "Edit" : "Create"}>
      <div className="max-w-xl mx-auto space-y-6 pb-12 gi-page select-none">
        {/* Top Controls */}
        <PageHeader
          title={isEdit ? "Edit Ledger" : "Create New Ledger"}
          subtitle={isEdit ? "Update account details and balance" : "Set up financial account ledger"}
          onBack={handleBack}
        />

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="gi-card p-6 rounded-2xl border gi-divider space-y-5 shadow-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* 1. Ledger Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold gi-text-primary">
              Ledger Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter ledger name (e.g. HDFC Bank, Office Cash, Rent Expense)"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 rounded-xl text-sm gi-input focus:outline-none"
            />
          </div>

          {/* 2. Ledger Type Input (Bank, Cash, Expense, Others) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold gi-text-primary">
              Ledger Type <span className="text-red-500">*</span>
            </label>
            <CustomSelect
              value={formData.type}
              onChange={(val) => setFormData((prev) => ({ ...prev, type: val }))}
              options={[
                { value: "bank", label: "Bank Account", badge: "ASSET" },
                { value: "cash", label: "Cash in Hand", badge: "ASSET" },
                { value: "expense", label: "Expense Account", badge: "EXPENSE" },
                { value: "others", label: "Others", badge: "GENERAL" },
              ]}
            />
          </div>

          {/* 3. Opening Balance Input & Balance Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
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
                className="w-full px-3.5 py-2.5 rounded-xl text-sm gi-input focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold gi-text-primary">
                Type
              </label>
              <CustomSelect
                value={formData.openingBalanceType}
                onChange={(val) => setFormData((prev) => ({ ...prev, openingBalanceType: val }))}
                options={[
                  { value: "debit", label: "Debit (Dr)" },
                  { value: "credit", label: "Credit (Cr)" },
                ]}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t gi-divider">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 rounded-xl text-xs font-semibold border gi-surface-interactive gi-text-secondary cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl gi-btn-primary text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <IoSaveOutline className="text-base" />
              <span>{isSubmitting ? "Saving..." : isEdit ? "Update Ledger" : "Save Ledger"}</span>
            </button>
          </div>
        </form>
      </div>
    </PermissionGuard>
  );
}
