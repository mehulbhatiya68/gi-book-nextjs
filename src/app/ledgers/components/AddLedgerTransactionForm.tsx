"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { handleSmartBack } from "@/lib/utils/smartNavigation";
import { motion, AnimatePresence } from "motion/react";
import {
  IoSaveOutline,
  IoImageOutline,
  IoTrashOutline,
  IoCashOutline,
  IoCardOutline,
  IoDocumentTextOutline,
  IoGlobeOutline,
} from "react-icons/io5";
import { useAuth } from "@/context/AuthContext";
import PermissionGuard from "@/components/PermissionGuard";
import PageHeader from "@/components/PageHeader";
import ToggleSwitch from "@/components/ToggleSwitch";
import { ledgerApi } from "@/lib/api/ledger";
import { transactionApi } from "@/lib/api/transaction";
import { siteProjectApi } from "@/lib/api/siteProject";
import { toast } from "react-toastify";
import LimitReachedView from "@/components/LimitReachedView";
import { useLimitCheck } from "@/lib/hooks/useLimitCheck";
import CustomSelect from "@/components/CustomSelect";
import PaymentSettlementChecklistModal from "@/components/PaymentSettlementChecklistModal";

interface AddLedgerTransactionFormProps {
  txToEdit?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PAYMENT_MODES = [
  { id: "Cash", label: "Cash", icon: IoCashOutline },
  { id: "Bank", label: "Bank", icon: IoCardOutline },
  { id: "Cheque", label: "Cheque", icon: IoDocumentTextOutline },
  { id: "Online", label: "Online", icon: IoGlobeOutline },
];

export default function AddLedgerTransactionForm({ txToEdit, onSuccess, onCancel }: AddLedgerTransactionFormProps = {}) {
  const { activeBusiness } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlEditId = searchParams?.get("id") || searchParams?.get("edit");
  const isEdit = Boolean(txToEdit?.id || urlEditId);

  const { isLimitReached, used, quota, featureName } = useLimitCheck("transaction", isEdit);

  const [ledgers, setLedgers] = useState<any[]>([]);
  const [siteProjects, setSiteProjects] = useState<any[]>([]);

  const [isLoadingSiteProjects, setIsLoadingSiteProjects] = useState(true);

  useEffect(() => {
    setIsLoadingSiteProjects(true);
    Promise.all([
      ledgerApi.getLedgers({ per_page: "all" }).catch(() => ({ body: [] })),
      siteProjectApi.getSiteProjects(activeBusiness?.id).catch(() => ({ body: [] }))
    ]).then(([ledgersRes, siteProjectsRes]) => {
      const lList = Array.isArray((ledgersRes as any)?.body)
        ? (ledgersRes as any).body
        : ((ledgersRes as any)?.body?.ledgers || (ledgersRes as any)?.body?.data || []);
      
      let spList: any[] = [];
      const resBody = (siteProjectsRes as any)?.body || (siteProjectsRes as any)?.data || siteProjectsRes;
      if (Array.isArray(resBody)) {
        spList = resBody;
      } else if (resBody && typeof resBody === "object") {
        const sites = resBody.sites || resBody.siteList || [];
        const projects = resBody.projects || resBody.projectList || [];
        const data = resBody.data || [];
        spList = [...(Array.isArray(sites) ? sites : []), ...(Array.isArray(projects) ? projects : []), ...(Array.isArray(data) ? data : [])];
      }
      setLedgers(lList);
      setSiteProjects(spList);
      setIsLoadingSiteProjects(false);
    }).catch(() => {
      setIsLoadingSiteProjects(false);
    });
  }, [activeBusiness?.id]);

  // Filtered Ledgers: Bank / Cash / Company Ledgers for Paying Account
  const bankCashLedgers = useMemo(() => {
    const filtered = ledgers.filter((l) => {
      const t = String(l.type || l.ledger_type || "").toLowerCase();
      const name = String(l.name || "").toLowerCase();
      return (
        ["bank", "cash", "company", "capital", "cash_in_hand", "bank_account", "cash_account"].includes(t) ||
        name.includes("bank") ||
        name.includes("cash") ||
        name.includes("company")
      );
    });
    return filtered.length > 0 ? filtered : ledgers;
  }, [ledgers]);

  // Filtered Ledgers: Party Ledgers (Customers, Suppliers, Parties, Vendors, Clients, Expenses, etc. - strictly excluding Company/Bank/Cash)
  const partyLedgers = useMemo(() => {
    return ledgers.filter((l) => {
      const t = String(l.type || l.ledger_type || "").toLowerCase();
      const name = String(l.name || "").toLowerCase();
      const isCompanyBankOrCash =
        ["bank", "cash", "company", "capital", "cash_in_hand", "bank_account", "cash_account"].includes(t) ||
        name.includes("bank") ||
        name.includes("cash") ||
        name.includes("company");
      return !isCompanyBankOrCash;
    });
  }, [ledgers]);

  const [formData, setFormData] = useState({
    paymentMode: "Cash" as "Cash" | "Bank" | "Cheque" | "Online",
    fromLedgerId: "",
    toLedgerId: "",
    amount: "",
    hasSiteProject: false,
    siteProjectId: "",
    remark: "",
    imageProof: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [checklistData, setChecklistData] = useState<{
    isOpen: boolean;
    amount: number;
    partyName: string;
    paymentType: "credit" | "debit";
  }>({
    isOpen: false,
    amount: 0,
    partyName: "",
    paymentType: "credit",
  });

  useEffect(() => {
    if (txToEdit) {
      const spId = String(txToEdit.project_id || txToEdit.site_id || txToEdit.siteProjectId || "");
      setFormData((prev) => ({
        ...prev,
        paymentMode: (txToEdit.payment_mode || txToEdit.paymentMode || "Cash") as any,
        fromLedgerId: String(txToEdit.payment_ledger_id || txToEdit.fromLedgerId || prev.fromLedgerId || ""),
        toLedgerId: String(txToEdit.party_ledger_id || txToEdit.toLedgerId || prev.toLedgerId || ""),
        amount: String(txToEdit.amount || ""),
        hasSiteProject: Boolean(spId),
        siteProjectId: spId,
        remark: txToEdit.remark || "",
        imageProof: txToEdit.proof_image || txToEdit.imageProof || "",
      }));
    } else if (urlEditId) {
      transactionApi.getTransactionById(urlEditId).then((res: any) => {
        const target = res?.body?.transaction || res?.body?.payment || res?.body?.data || res?.body;
        if (target && typeof target === "object" && (target.id || target.amount)) {
          const spId = String(target.project_id || target.site_id || target.siteProjectId || "");
          setFormData((prev) => ({
            ...prev,
            paymentMode: (target.payment_mode || target.paymentMode || "Cash") as any,
            fromLedgerId: String(target.payment_ledger_id || target.fromLedgerId || prev.fromLedgerId || ""),
            toLedgerId: String(target.party_ledger_id || target.toLedgerId || prev.toLedgerId || ""),
            amount: String(target.amount || ""),
            hasSiteProject: Boolean(spId),
            siteProjectId: spId,
            remark: target.remark || "",
            imageProof: target.proof_image || target.imageProof || "",
          }));
        }
      }).catch(() => {});
    } else if (searchParams) {
      const qFrom = searchParams.get("fromLedgerId") || searchParams.get("payment_ledger_id");
      const qTo = searchParams.get("toLedgerId") || searchParams.get("party_ledger_id");
      const qLedgerId = searchParams.get("ledger_id");

      if (qFrom) {
        setFormData((prev) => ({ ...prev, fromLedgerId: String(qFrom) }));
      }
      if (qTo) {
        setFormData((prev) => ({ ...prev, toLedgerId: String(qTo) }));
      }

      if (qLedgerId && !qFrom && !qTo && ledgers.length > 0) {
        const found = ledgers.find((l) => String(l.id) === String(qLedgerId));
        if (found) {
          const t = String(found.type || found.ledger_type || "").toLowerCase();
          const name = String(found.name || "").toLowerCase();
          const isBankCashOrCompany =
            ["bank", "cash", "company", "capital", "cash_in_hand", "bank_account", "cash_account"].includes(t) ||
            name.includes("bank") ||
            name.includes("cash") ||
            name.includes("company");

          if (isBankCashOrCompany) {
            setFormData((prev) => ({ ...prev, fromLedgerId: String(qLedgerId) }));
          } else {
            setFormData((prev) => ({ ...prev, toLedgerId: String(qLedgerId) }));
          }
        }
      }
    }
  }, [txToEdit, urlEditId, searchParams, ledgers]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errorMsg) setErrorMsg("");
  };

  const handleImageUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image size exceeds 5MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const resStr = typeof reader.result === 'string' ? reader.result : '';
      setFormData((prev) => ({ ...prev, imageProof: resStr }));
    };
    reader.readAsDataURL(file);
  };

  const removeImageProof = () => {
    setFormData((prev) => ({ ...prev, imageProof: "" }));
  };

  const getLedgerPartyType = (ledger: any): "customer" | "supplier" | null => {
    if (!ledger) return null;
    const t = String(
      ledger.type ||
      ledger.ledger_type ||
      ledger.party_type ||
      ledger.group ||
      ledger.category ||
      ledger.nature ||
      ""
    ).toLowerCase();

    if (
      t === "customer" ||
      t === "client" ||
      t === "debtor" ||
      t.includes("debtor") ||
      t.includes("customer") ||
      ledger.is_customer === true ||
      ledger.is_customer === 1
    ) {
      return "customer";
    }

    if (
      t === "supplier" ||
      t === "vendor" ||
      t === "creditor" ||
      t.includes("creditor") ||
      t.includes("supplier") ||
      t.includes("expense") ||
      ledger.is_supplier === true ||
      ledger.is_supplier === 1
    ) {
      return "supplier";
    }

    return null;
  };

  const selectedPartyType = useMemo(() => {
    if (!formData.toLedgerId) return null;
    const found = ledgers.find((l) => String(l.id) === String(formData.toLedgerId));
    return getLedgerPartyType(found);
  }, [formData.toLedgerId, ledgers]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.fromLedgerId) {
      setErrorMsg("Please select Bank / Cash Account.");
      return;
    }
    if (!formData.toLedgerId) {
      setErrorMsg("Please select Party.");
      return;
    }
    if (formData.fromLedgerId === formData.toLedgerId) {
      setErrorMsg("Bank / Cash Account and Party cannot be the same account.");
      return;
    }
    const amt = Number(formData.amount);
    if (!amt || amt <= 0) {
      setErrorMsg("Please enter a valid amount greater than 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const todayDate = new Date().toISOString().split("T")[0];
      const selectedPartyLedger = ledgers.find((l) => String(l.id) === String(formData.toLedgerId));
      const partyType = getLedgerPartyType(selectedPartyLedger);

      let determinedType = "payment_out";
      if (partyType === "customer") {
        determinedType = "payment_in";
      } else if (partyType === "supplier") {
        determinedType = "payment_out";
      } else if (txToEdit?.type || txToEdit?.transactionType) {
        determinedType = txToEdit.type || txToEdit.transactionType;
      }

      const payload: any = {
        payment_ledger_id: formData.fromLedgerId,
        party_ledger_id: formData.toLedgerId,
        project_id: formData.hasSiteProject && formData.siteProjectId ? formData.siteProjectId : null,
        amount: amt,
        type: determinedType,
        transaction_date: todayDate,
        remark: formData.remark.trim() || undefined,
        proof_image: formData.imageProof || null,
        payment_mode: formData.paymentMode,
      };

      const targetEditId = txToEdit?.id || urlEditId;
      if (isEdit && targetEditId) {
        await transactionApi.updateTransaction(targetEditId, payload);
        toast.success("Transaction updated successfully!");
      } else {
        await transactionApi.storeTransaction(payload);
        toast.success("Transaction recorded successfully!");
      }

      setChecklistData({
        isOpen: true,
        amount: amt,
        partyName: selectedPartyLedger?.name || "Party Account",
        paymentType: determinedType === "payment_in" ? "credit" : "debit",
      });
      setIsSubmitting(false);
    } catch (err: any) {
      console.error("Error saving ledger transaction:", err);
      const msg = err.message || "Failed to save transaction. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (onCancel) {
      onCancel();
    } else {
      handleSmartBack(router, pathname, searchParams ? searchParams.get("from") : null, "/ledgerTransactions");
    }
  };

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
      <div className="max-w-2xl mx-auto space-y-6 pb-12 gi-page select-none">
        {/* Top Controls */}
        <PageHeader
          title={isEdit ? "Edit Ledger Transaction" : "Record Ledger Transfer"}
          subtitle={isEdit ? "Modify payment transaction entry" : "Record payment from bank/cash account to party"}
          onBack={handleBack}
        />

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="gi-card p-6 rounded-xl border gi-divider space-y-5 shadow-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Payment Mode Selector (Replaces Transaction Type) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold gi-text-primary">
              Payment Mode <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PAYMENT_MODES.map((mode) => {
                const IconComponent = mode.icon;
                const isSelected = formData.paymentMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, paymentMode: mode.id as any }))}
                    className={`p-3 rounded-xl flex items-center gap-2.5 border transition cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs"
                        : "gi-surface-interactive gi-text-secondary border-gi-divider hover:border-gray-400"
                    }`}
                  >
                    <IconComponent className="text-lg" />
                    <span className="text-xs font-bold">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ledger Selectors Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bank / Cash Account (Replaces From Ledger) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold gi-text-primary">
                Bank / Cash Account <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                value={formData.fromLedgerId}
                onChange={(val) => setFormData((prev) => ({ ...prev, fromLedgerId: val }))}
                placeholder="Select Bank / Cash Account *"
                options={bankCashLedgers.map((l) => {
                  const bal = Number(l.current_balance ?? l.closingBalance ?? l.opening_balance ?? l.openingBalance ?? 0);
                  return {
                    value: String(l.id),
                    label: l.name,
                    sublabel: `Balance: ₹${bal.toLocaleString("en-IN")}`,
                    badge: (l.type || "Account").toUpperCase(),
                  };
                })}
              />
            </div>

            {/* Party (Replaces To Ledger) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold gi-text-primary">
                  Party <span className="text-red-500">*</span>
                </label>
                {selectedPartyType && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      selectedPartyType === "customer"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {selectedPartyType === "customer" ? "Payment In (Customer)" : "Payment Out (Supplier)"}
                  </span>
                )}
              </div>
              <CustomSelect
                value={formData.toLedgerId}
                onChange={(val) => setFormData((prev) => ({ ...prev, toLedgerId: val }))}
                placeholder="Select Party *"
                options={partyLedgers.map((l) => {
                  const bal = Number(l.current_balance ?? l.closingBalance ?? l.opening_balance ?? l.openingBalance ?? 0);
                  const pType = getLedgerPartyType(l);
                  return {
                    value: String(l.id),
                    label: l.name,
                    sublabel: `Balance: ₹${bal.toLocaleString("en-IN")}`,
                    badge: (pType || l.type || "Party").toUpperCase(),
                  };
                })}
              />
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold gi-text-primary">
              Amount (₹) <span className="text-red-500">*</span>
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
              className="w-full px-3.5 py-2.5 rounded-lg text-sm gi-input focus:outline-none font-bold"
            />
          </div>

          {/* Site / Project Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold gi-text-primary">
              Tag Site / Project <span className="gi-text-muted font-normal">(Optional)</span>
            </label>
            <CustomSelect
              value={formData.siteProjectId}
              onChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  siteProjectId: val,
                  hasSiteProject: Boolean(val),
                }))
              }
              placeholder={isLoadingSiteProjects ? "Loading sites & projects..." : siteProjects.length === 0 ? "No Sites or Projects Found" : "Select Site / Project..."}
              options={[
                { value: "", label: "None (No Site/Project Tagged)" },
                ...siteProjects.map((sp) => {
                  const name = sp.name || sp.siteName || sp.site_name || sp.projectName || sp.project_name || sp.title || "Site/Project";
                  const sublabel = sp.location || sp.city || sp.address || sp.description || (sp.type ? `${sp.type}` : "Active");
                  const typeBadge = String(sp.type || (sp.siteName || sp.site_name || sp.location ? "Site" : "Project")).toUpperCase();
                  return {
                    value: String(sp.id || sp.site_id || sp.project_id),
                    label: name,
                    sublabel,
                    badge: typeBadge,
                  };
                })
              ]}
            />
          </div>

          {/* Remark / Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold gi-text-primary">
              Remark / Note
            </label>
            <textarea
              name="remark"
              rows={2}
              placeholder="Add payment purpose, reference number, or note..."
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
              onClick={handleBack}
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
              <span>{isSubmitting ? "Processing..." : isEdit ? "Update Transaction" : "Save Transaction"}</span>
            </button>
          </div>
        </form>

        {/* Payment Settlement Checklist Animation Modal */}
        <PaymentSettlementChecklistModal
          isOpen={checklistData.isOpen}
          amount={checklistData.amount}
          partyName={checklistData.partyName}
          paymentType={checklistData.paymentType}
          settledInvoices={[]}
          onComplete={() => {
            setChecklistData((prev) => ({ ...prev, isOpen: false }));
            if (onSuccess) {
              onSuccess();
            } else {
              handleSmartBack(router, pathname, searchParams ? searchParams.get("from") : null, "/ledgerTransactions");
            }
          }}
          onClose={() => {
            setChecklistData((prev) => ({ ...prev, isOpen: false }));
            if (onSuccess) {
              onSuccess();
            } else {
              handleSmartBack(router, pathname, searchParams ? searchParams.get("from") : null, "/ledgerTransactions");
            }
          }}
        />
      </div>
    </PermissionGuard>
  );
}
