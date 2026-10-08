"use client";

import { Suspense, useEffect, useState, useMemo, startTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { handleSmartBack } from "@/lib/utils/smartNavigation";
import {
  IoArrowBack,
  IoChevronBack,
  IoChevronDown,
  IoSearch,
  IoClose,
  IoCloudUploadOutline,
  IoTrashOutline,
  IoPersonOutline,
  IoAdd,
  IoCheckmarkCircle,
} from "react-icons/io5";
import { LiaFileInvoiceSolid } from "react-icons/lia";
import { useAuth } from "@/context/AuthContext";
import { partyApi } from "@/lib/api/party";
import { ledgerApi } from "@/lib/api/ledger";
import { paymentApi } from "@/lib/api/payment";
import { transactionApi } from "@/lib/api/transaction";
import { siteProjectApi } from "@/lib/api/siteProject";
import { invoiceApi } from "@/lib/api/invoice";
import PermissionGuard from "@/components/PermissionGuard";
import PageHeader from "@/components/PageHeader";
import LimitReachedView from "@/components/LimitReachedView";
import { useLimitCheck } from "@/lib/hooks/useLimitCheck";
import { SkeletonForm } from "@/components/Skeleton";
import CustomSelect from "@/components/CustomSelect";
import { toast } from "react-toastify";
import PaymentSettlementChecklistModal, { SettledInvoiceInfo } from "@/components/PaymentSettlementChecklistModal";

function ReceivedPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { activeBusiness } = useAuth();

  // URL Params
  const urlType = searchParams?.get("type");
  const partyIdParam = searchParams?.get("partyId");
  const invoiceIdParam = searchParams?.get("invoiceId");
  const paymentIdParam =
    searchParams?.get("id") || searchParams?.get("paymentId") || searchParams?.get("edit");

  const isEdit = Boolean(paymentIdParam);
  const { isLimitReached, used, quota, featureName } = useLimitCheck("transaction", isEdit);

  // Data Collections directly from API
  const [parties, setParties] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [siteProjects, setSiteProjects] = useState<any[]>([]);
  const [existingTransactions, setExistingTransactions] = useState<any[]>([]);
  const [linkedInvoice, setLinkedInvoice] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Unpaid Invoices & Allocation State directly from API
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [isLoadingUnpaidInvoices, setIsLoadingUnpaidInvoices] = useState<boolean>(false);
  const [allocationMode, setAllocationMode] = useState<"auto" | "custom">("auto");
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [manualAllocations, setManualAllocations] = useState<{ [key: string]: string }>({});

  // Form State
  const initialType = urlType === "debit" || urlType === "payment_out" ? "debit" : "credit";
  const [paymentType, setPaymentType] = useState<"credit" | "debit">(initialType);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [amount, setAmount] = useState<string>("");
  const [selectedAssetLedgerId, setSelectedAssetLedgerId] = useState<string>("");
  const [selectedSiteProjectId, setSelectedSiteProjectId] = useState<string>("");
  const [remark, setRemark] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  // Modals State
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [partySearch, setPartySearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Settlement Checklist Animation Modal State
  const [checklistData, setChecklistData] = useState<{
    isOpen: boolean;
    amount: number;
    partyName: string;
    paymentType: "credit" | "debit";
    settledInvoices: SettledInvoiceInfo[];
    redirectPath: string;
  }>({
    isOpen: false,
    amount: 0,
    partyName: "",
    paymentType: "credit",
    settledInvoices: [],
    redirectPath: "/payments",
  });

  // Fetch selected party's unpaid/pending invoices from API
  useEffect(() => {
    if (!selectedParty) {
      setUnpaidInvoices([]);
      setSelectedInvoiceIds([]);
      setManualAllocations({});
      return;
    }

    const partyLedgerId = selectedParty.ledger_id || selectedParty.ledger?.id || selectedParty.id;
    if (!partyLedgerId) return;

    setIsLoadingUnpaidInvoices(true);
    invoiceApi
      .getInvoices({ ledger_id: partyLedgerId, per_page: "all", silentError: true })
      .then((res: any) => {
        const invList = Array.isArray(res?.body)
          ? res.body
          : res?.body?.invoices || res?.body?.data || (Array.isArray(res) ? res : []);

        const pending = (Array.isArray(invList) ? invList : []).filter((inv: any) => {
          const st = String(inv.status || "").toLowerCase();
          if (st === "paid") return false;
          const due = Number(inv.balance_due ?? inv.due_amount ?? (Number(inv.amount || 0) - Number(inv.paid_amount || 0)));
          return due > 0;
        });

        setUnpaidInvoices(pending);
        setSelectedInvoiceIds(pending.map((inv: any) => String(inv.id)));
      })
      .catch((err) => {
        console.warn("Could not fetch party unpaid invoices:", err);
        setUnpaidInvoices([]);
      })
      .finally(() => {
        setIsLoadingUnpaidInvoices(false);
      });
  }, [selectedParty?.id, selectedParty?.ledger_id]);

  // Auto FIFO Allocation computation
  const autoAllocations = useMemo(() => {
    const totalAmt = Number(amount || 0);
    let remainingToAllocate = totalAmt;
    const allocMap: { [key: string]: number } = {};

    for (const inv of unpaidInvoices) {
      const invId = String(inv.id);
      const invDue = Number(
        inv.balance_due ?? inv.due_amount ?? (Number(inv.amount || 0) - Number(inv.paid_amount || 0))
      );
      if (remainingToAllocate > 0) {
        const alloc = Math.min(remainingToAllocate, invDue);
        allocMap[invId] = alloc;
        remainingToAllocate -= alloc;
      } else {
        allocMap[invId] = 0;
      }
    }
    return allocMap;
  }, [amount, unpaidInvoices]);

  // Active Allocations computation for UI display & form submission
  const activeAllocations = useMemo(() => {
    const list: { invoice: any; allocatedAmount: number }[] = [];
    if (linkedInvoice) {
      const due = Number(
        linkedInvoice.balance_due ?? linkedInvoice.due_amount ?? (Number(linkedInvoice.amount || 0) - Number(linkedInvoice.paid_amount || 0))
      );
      const totalAmt = Number(amount || 0);
      list.push({
        invoice: linkedInvoice,
        allocatedAmount: totalAmt > 0 ? Math.min(totalAmt, due > 0 ? due : totalAmt) : 0,
      });
      return list;
    }

    if (allocationMode === "auto") {
      for (const inv of unpaidInvoices) {
        const invId = String(inv.id);
        const alloc = autoAllocations[invId] || 0;
        if (alloc > 0) {
          list.push({ invoice: inv, allocatedAmount: alloc });
        }
      }
    } else {
      for (const inv of unpaidInvoices) {
        const invId = String(inv.id);
        if (selectedInvoiceIds.includes(invId)) {
          const userVal = manualAllocations[invId];
          const invDue = Number(
            inv.balance_due ?? inv.due_amount ?? (Number(inv.amount || 0) - Number(inv.paid_amount || 0))
          );
          const valNum = userVal !== undefined && userVal !== "" ? Number(userVal) : (autoAllocations[invId] || 0);
          if (valNum > 0) {
            list.push({ invoice: inv, allocatedAmount: Math.min(valNum, invDue) });
          }
        }
      }
    }
    return list;
  }, [linkedInvoice, allocationMode, unpaidInvoices, autoAllocations, selectedInvoiceIds, manualAllocations, amount]);

  const totalAllocatedAmount = useMemo(() => {
    return activeAllocations.reduce((acc, item) => acc + item.allocatedAmount, 0);
  }, [activeAllocations]);

  const unallocatedAmount = useMemo(() => {
    const totalAmt = Number(amount || 0);
    return Math.max(0, totalAmt - totalAllocatedAmount);
  }, [amount, totalAllocatedAmount]);

  const isPartySupplier = (p: any) => {
    if (!p) return false;
    const t = String(p.partyType || p.party_type || p.type || "").toLowerCase();
    return t.includes("supplier") || t.includes("vendor") || t.includes("expense");
  };

  const handleSelectParty = (p: any) => {
    setSelectedParty(p);
    setShowPartyModal(false);
    if (p) {
      const isSupplier = isPartySupplier(p);
      const newType: "credit" | "debit" = isSupplier ? "debit" : "credit";
      setPaymentType(newType);
    }
  };

  const getPartyDisplayName = (p: any) => {
    if (!p) return "";
    return p.partyName || p.name || p.party_name || p.title || p.ledger_name || "Party";
  };

  const getPartyPhone = (p: any) => {
    if (!p) return "";
    return p.phone || p.mobile || p.contact_number || p.contact || "";
  };

  const getPartyType = (p: any) => {
    if (!p) return "";
    return p.partyType || p.party_type || p.type || (isPartySupplier(p) ? "Supplier" : "Customer");
  };

  const getPartyBalance = (p: any) => {
    if (!p) return 0;
    return Number(p.current_balance ?? p.closingBalance ?? p.balance ?? p.opening_balance ?? 0);
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      ledgerApi.getLedgers({ per_page: "all", silentError: true }).catch(() => ({ body: [] })),
      partyApi.getParties().catch(() => ({ body: [] })),
      siteProjectApi.getSiteProjects(activeBusiness?.id).catch(() => ({ body: [] })),
      transactionApi.getTransactions({ per_page: "all", silentError: true }).catch(() => ({ body: [] })),
      invoiceIdParam ? invoiceApi.getInvoice(invoiceIdParam).catch(() => null) : Promise.resolve(null),
    ])
      .then(async ([ledgersRes, partiesRes, siteProjectsRes, txRes, invoiceRes]: any[]) => {
        if (!isMounted) return;

        const lList = Array.isArray(ledgersRes?.body)
          ? ledgersRes.body
          : ledgersRes?.body?.ledgers || ledgersRes?.body?.data || (Array.isArray(ledgersRes) ? ledgersRes : []);

        const pList = Array.isArray(partiesRes?.body)
          ? partiesRes.body
          : partiesRes?.body?.parties || partiesRes?.body?.data || (Array.isArray(partiesRes) ? partiesRes : []);

        let spList: any[] = [];
        const spBody = siteProjectsRes?.body || siteProjectsRes?.data || siteProjectsRes;
        if (Array.isArray(spBody)) {
          spList = spBody;
        } else if (spBody && typeof spBody === "object") {
          const sites = spBody.sites || spBody.siteList || [];
          const projects = spBody.projects || spBody.projectList || [];
          const data = spBody.data || [];
          spList = [...(Array.isArray(sites) ? sites : []), ...(Array.isArray(projects) ? projects : []), ...(Array.isArray(data) ? data : [])];
        }

        const tList = Array.isArray(txRes?.body)
          ? txRes.body
          : txRes?.body?.transactions || txRes?.body?.data || txRes?.body?.payments || (Array.isArray(txRes) ? txRes : []);

        const partyMap = new Map();
        (Array.isArray(pList) ? pList : []).forEach((p: any) => {
          if (p && (p.id || p.ledger_id)) {
            partyMap.set(String(p.id || p.ledger_id), p);
          }
        });
        (Array.isArray(lList) ? lList : []).forEach((l: any) => {
          const lType = String(l.type || "").toLowerCase();
          if (["customer", "supplier", "expense"].includes(lType) && l && l.id && !partyMap.has(String(l.id))) {
            partyMap.set(String(l.id), l);
          }
        });
        const combinedParties = Array.from(partyMap.values());

        const finalLedgers = Array.isArray(lList) ? lList : [];
        const finalSiteProjects = Array.isArray(spList) ? spList : [];
        const finalTransactions = Array.isArray(tList) ? tList : [];

        const cashAndBank = finalLedgers.filter((l: any) => {
          const t = String(l.type || "").toLowerCase();
          return t === "cash" || t === "bank";
        });

        startTransition(() => {
          setParties(combinedParties);
          setLedgers(finalLedgers);
          setSiteProjects(finalSiteProjects);
          setExistingTransactions(finalTransactions);

          if (cashAndBank.length > 0 && !selectedAssetLedgerId) {
            setSelectedAssetLedgerId(cashAndBank[0].id);
          }

          const inv = invoiceRes?.body?.invoice || invoiceRes?.body?.data || invoiceRes?.body;
          if (inv && (inv.id || inv.invoice_number)) {
            setLinkedInvoice(inv);
            const due = Number(inv.balance_due ?? inv.due_amount ?? (Number(inv.amount || 0) - Number(inv.paid_amount || 0)));
            if (due > 0) {
              setAmount(String(due));
            } else if (inv.amount) {
              setAmount(String(inv.amount));
            }

            const targetPartyLedgerId = inv.ledger_id || inv.ledger?.id || inv.party_id;
            if (targetPartyLedgerId && combinedParties.length > 0) {
              const matched = combinedParties.find(
                (p: any) =>
                  String(p.id) === String(targetPartyLedgerId) ||
                  String(p.ledger_id) === String(targetPartyLedgerId)
              );
              if (matched) {
                setSelectedParty(matched);
                setPaymentType(isPartySupplier(matched) ? "debit" : "credit");
              }
            }
          } else if (partyIdParam && combinedParties.length > 0) {
            const matched = combinedParties.find(
              (p: any) => String(p.id) === String(partyIdParam) || String(p.ledger_id) === String(partyIdParam)
            );
            if (matched) {
              setSelectedParty(matched);
              setPaymentType(isPartySupplier(matched) ? "debit" : "credit");
            }
          }
        });
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeBusiness?.id, partyIdParam, invoiceIdParam]);

  // Load existing payment details if in Edit mode directly from API
  useEffect(() => {
    if (!paymentIdParam) return;

    let isMounted = true;
    transactionApi.getTransactionById(paymentIdParam).then((res: any) => {
      if (!isMounted) return;
      const target = res?.body?.transaction || res?.body?.payment || res?.body?.data || res?.body;
      if (target && typeof target === "object" && (target.id || target.amount)) {
        if (target.type === "payment_in" || target.type === "credit") {
          setPaymentType("credit");
        } else if (target.type === "payment_out" || target.type === "debit") {
          setPaymentType("debit");
        }

        if (target.amount) setAmount(String(target.amount));
        if (target.payment_ledger_id) setSelectedAssetLedgerId(target.payment_ledger_id);
        if (target.remark) setRemark(target.remark);
        if (target.proof_image) setAttachmentPreview(target.proof_image);
        if (target.transaction_date) setPaymentDate(target.transaction_date);
        if (target.project_id || target.site_id) setSelectedSiteProjectId(target.project_id || target.site_id);

        if (target.party_ledger_id && parties.length > 0) {
          const matched = parties.find(
            (p: any) => String(p.id) === String(target.party_ledger_id) || String(p.ledger_id) === String(target.party_ledger_id)
          );
          if (matched) setSelectedParty(matched);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [paymentIdParam, parties]);

  const assetLedgers = useMemo(() => {
    return ledgers.filter((l: any) => {
      const t = String(l.type || "").toLowerCase();
      return t === "cash" || t === "bank";
    });
  }, [ledgers]);

  const handleAssetLedgerChange = (ledgerId: string) => {
    setSelectedAssetLedgerId(ledgerId);
  };

  const filteredParties = useMemo(() => {
    const query = partySearch.toLowerCase().trim();
    return parties.filter((p: any) => {
      const name = getPartyDisplayName(p).toLowerCase();
      const phone = getPartyPhone(p);
      const pType = getPartyType(p).toLowerCase();
      return query === "" || name.includes(query) || phone.includes(query) || pType.includes(query);
    });
  }, [parties, partySearch]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size exceeds 5MB limit.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!selectedParty) {
      toast.error("Please select a party.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    if (allocationMode === "custom" && totalAllocatedAmount > Number(amount)) {
      toast.error(
        `Total allocated amount (₹${totalAllocatedAmount.toLocaleString("en-IN")}) cannot exceed payment amount (₹${Number(
          amount
        ).toLocaleString("en-IN")}).`
      );
      return;
    }

    const partyLedgerId = selectedParty.ledger_id || selectedParty.ledger?.id || selectedParty.id;
    if (!partyLedgerId) {
      toast.error("Selected party does not have a valid ledger ID.");
      return;
    }

    let assetLedgerId = selectedAssetLedgerId;
    if (!assetLedgerId && assetLedgers.length > 0) {
      assetLedgerId = assetLedgers[0].id;
    }
    if (!assetLedgerId) {
      toast.error("Please select a Cash or Bank account for this payment.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        payment_ledger_id: assetLedgerId,
        party_ledger_id: partyLedgerId,
        amount: Number(amount),
        type: paymentType === "credit" ? "payment_in" : "payment_out",
        transaction_date: paymentDate,
        remark: remark.trim() || undefined,
        proof_image: attachmentPreview || undefined,
      };

      if (selectedSiteProjectId) {
        payload.project_id = selectedSiteProjectId;
      }

      const settledInvoicesList: SettledInvoiceInfo[] = activeAllocations.map(({ invoice: inv, allocatedAmount }) => {
        const invDue = Number(inv.balance_due ?? inv.due_amount ?? (Number(inv.amount || 0) - Number(inv.paid_amount || 0)));
        const isFullySettled = allocatedAmount >= invDue;
        return {
          invoiceNumber: String(inv.invoice_number || inv.number || `#${inv.id}`),
          amountApplied: allocatedAmount,
          isFullySettled,
          partyName: getPartyDisplayName(selectedParty),
        };
      });

      let targetRedirect = "/payments";

      if (paymentIdParam) {
        await paymentApi.updatePayment(paymentIdParam, payload);
        toast.success("Payment record updated successfully!");
        targetRedirect = "/payments";
      } else if (invoiceIdParam || linkedInvoice?.id) {
        const targetInvId = invoiceIdParam || linkedInvoice?.id;
        await invoiceApi.receivePayment(targetInvId, payload);
        toast.success("Invoice payment recorded successfully!");
        targetRedirect = `/invoiceDetails/${targetInvId}`;
      } else if (activeAllocations.length === 1) {
        const { invoice: inv, allocatedAmount } = activeAllocations[0];
        const singlePayload = {
          ...payload,
          amount: allocatedAmount,
          remark: payload.remark || `Payment for ${inv.invoice_number || inv.number || inv.id}`,
        };
        await invoiceApi.receivePayment(inv.id, singlePayload);
        toast.success(`Invoice payment recorded successfully for ${inv.invoice_number || inv.number || inv.id}!`);
        targetRedirect = "/payments";
      } else if (activeAllocations.length > 1) {
        const totalPaymentAmt = Number(amount);
        let successCount = 0;

        for (let i = 0; i < activeAllocations.length; i++) {
          const { invoice: inv, allocatedAmount } = activeAllocations[i];
          const invNum = inv.invoice_number || inv.number || inv.id;
          const bulkRemark = `Bulk payment - ₹${allocatedAmount.toLocaleString("en-IN")} for ${invNum}${remark ? ` • ${remark.trim()}` : ""}`;

          const splitPayload = {
            ...payload,
            amount: allocatedAmount,
            remark: bulkRemark,
          };

          await invoiceApi.receivePayment(inv.id, splitPayload);
          successCount++;
        }

        toast.success(`Bulk payment of ₹${totalPaymentAmt.toLocaleString("en-IN")} allocated across ${successCount} invoices successfully!`);
        targetRedirect = "/payments";
      } else {
        await paymentApi.createPayment(payload);
        toast.success(
          paymentType === "credit" ? "Payment Received successfully!" : "Payment Out recorded successfully!"
        );
        targetRedirect = "/payments";
      }

      setChecklistData({
        isOpen: true,
        amount: Number(amount),
        partyName: getPartyDisplayName(selectedParty),
        paymentType,
        settledInvoices: settledInvoicesList,
        redirectPath: targetRedirect,
      });
      setIsSubmitting(false);
    } catch (err: any) {
      console.error("[App Payment Error]:", err);
      toast.error(err?.message || "Failed to save payment record.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PermissionGuard module="Payment">
        <SkeletonForm />
      </PermissionGuard>
    );
  }

  if (isLimitReached) {
    return (
      <LimitReachedView
        featureName={featureName}
        usedCount={used}
        quotaLimit={quota}
        onBack={() => router.back()}
      />
    );
  }

  const pageTitle = isEdit
    ? paymentType === "credit"
      ? "Edit Received Payment"
      : "Edit Payment Out"
    : selectedParty
      ? paymentType === "credit"
        ? "Received Payment"
        : "Payment Out"
      : "Record Payment";

  return (
    <PermissionGuard module="Payment" action="Create">
      <div className="space-y-6 select-none gi-page pb-16 w-full max-w-7xl mx-auto">
        {/* Desktop Top Header */}
        <div className="hidden md:block mb-5">
          <PageHeader
            title={pageTitle}
            backUrl="/payments"
            badge={
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  selectedParty
                    ? paymentType === "credit"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                    : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-300 dark:border-zinc-700"
                }`}
              >
                {selectedParty
                  ? paymentType === "credit"
                    ? "Credit"
                    : "Debit"
                  : "Payment"}
              </span>
            }
          />
        </div>

        {/* Mobile Top Header Bar */}
        <div className="flex md:hidden items-center gap-3 py-3 mb-1">
          <button
            type="button"
            onClick={() => handleSmartBack(router, pathname, searchParams ? searchParams.get("from") : null, "/payments/history")}
            className="gi-back-btn"
            aria-label="Back"
          >
            <IoChevronBack />
            <span className="gi-back-label">Back</span>
          </button>
          <h1 className="text-2xl font-bold gi-text-primary tracking-tight">{pageTitle}</h1>
        </div>

        {/* Responsive Content Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Input Form Section (2 Cols on Desktop) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Party Selection Card */}
            <section className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-wider font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <IoPersonOutline className="text-base text-slate-600 dark:text-zinc-400" />
                  {selectedParty
                    ? paymentType === "credit"
                      ? "Customer / Party Received From *"
                      : "Supplier / Vendor Paid To *"
                    : "Select Party *"}
                </label>
                {selectedParty && (
                  <button
                    type="button"
                    onClick={() => setShowPartyModal(true)}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Change Party
                  </button>
                )}
              </div>

              {selectedParty ? (
                <div
                  onClick={() => setShowPartyModal(true)}
                  className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 flex items-center justify-between gap-4 cursor-pointer hover:border-slate-300 dark:hover:border-zinc-700 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-bold flex items-center justify-center shrink-0 border border-slate-200 dark:border-zinc-700">
                      {getPartyDisplayName(selectedParty).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {getPartyDisplayName(selectedParty)}
                        </h4>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold capitalize border ${
                            isPartySupplier(selectedParty)
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          }`}
                        >
                          {getPartyType(selectedParty)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        Phone: {getPartyPhone(selectedParty) || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                      ₹
                      {Math.abs(getPartyBalance(selectedParty)).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      <span className="text-[10px] font-sans font-normal text-slate-400">
                        {getPartyBalance(selectedParty) < 0 ? "Dr" : "Cr"}
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPartyModal(true)}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-600 bg-slate-50/50 dark:bg-zinc-800/40 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                >
                  <IoAdd className="text-lg text-slate-500 dark:text-zinc-400" />
                  Select Party
                </button>
              )}
            </section>

            {/* Linked Invoice Banner */}
            {invoiceIdParam && linkedInvoice && (
              <section className="rounded-xl bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/50 p-4 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <IoCheckmarkCircle className="text-emerald-600 dark:text-emerald-400 text-xl shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Settling Invoice:{" "}
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {linkedInvoice.invoice_number || linkedInvoice.number || linkedInvoice.id}
                      </span>
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Amount & Entry Type Card */}
            <section className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
              <label className="block text-xs uppercase tracking-wider font-bold text-slate-900 dark:text-white">
                Payment Amount *
              </label>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-2 p-3 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex-1 shadow-2xs focus-within:border-indigo-500">
                  <span className="text-sm font-bold text-slate-500 dark:text-zinc-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white outline-none bg-transparent"
                  />
                </div>

                <div className="shrink-0 flex items-center">
                  {selectedParty && (
                    <div
                      className={`px-4 py-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                        paymentType === "credit"
                          ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                          : "border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0 bg-current"></span>
                      <span>
                        {paymentType === "credit"
                          ? "Credit"
                          : "Debit"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Unpaid Invoices Allocation Card */}
            {selectedParty && !invoiceIdParam && (
              <section className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <LiaFileInvoiceSolid className="text-lg text-indigo-600 dark:text-indigo-400" />
                      Unpaid Invoices Allocation
                      {unpaidInvoices.length > 0 && (
                        <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                          {unpaidInvoices.length} Pending
                        </span>
                      )}
                    </h3>
                  </div>

                  {unpaidInvoices.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 p-1 rounded-lg self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setAllocationMode("auto")}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                          allocationMode === "auto"
                            ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                            : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        ⚡ Auto (FIFO)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllocationMode("custom")}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                          allocationMode === "custom"
                            ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                            : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        ✏️ Custom
                      </button>
                    </div>
                  )}
                </div>

                {isLoadingUnpaidInvoices ? (
                  <div className="py-6 text-center text-xs text-slate-400 dark:text-zinc-500 flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </div>
                ) : unpaidInvoices.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 text-xs text-slate-500 dark:text-zinc-400 text-center">
                    No unpaid invoices found.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {unpaidInvoices.map((inv: any) => {
                        const invId = String(inv.id);
                        const invNum = inv.invoice_number || inv.number || inv.invoiceNumberStr || invId;
                        const invDateStr = inv.invoice_date || inv.date || (inv.created_at ? inv.created_at.split("T")[0] : "—");
                        const totalAmt = Number(inv.amount || 0);
                        const paidAmt = Number(inv.paid_amount || 0);
                        const dueAmt = Number(
                          inv.balance_due ?? inv.due_amount ?? (totalAmt - paidAmt)
                        );
                        const isSelected = selectedInvoiceIds.includes(invId);
                        const allocatedAmt =
                          allocationMode === "auto"
                            ? autoAllocations[invId] || 0
                            : isSelected
                              ? Number(manualAllocations[invId] ?? (autoAllocations[invId] || 0))
                              : 0;

                        return (
                          <div
                            key={invId}
                            className={`p-3.5 rounded-xl border transition ${
                              allocatedAmt > 0
                                ? "border-indigo-300 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/20"
                                : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                {allocationMode === "custom" && (
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedInvoiceIds((prev) => [...prev, invId]);
                                      } else {
                                        setSelectedInvoiceIds((prev) => prev.filter((id) => id !== invId));
                                      }
                                    }}
                                    className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-zinc-700 cursor-pointer"
                                  />
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                                      {invNum}
                                    </span>
                                    <span className="text-xs text-slate-400 dark:text-zinc-500">
                                      Date: {invDateStr}
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-3">
                                    <span>Total: ₹{totalAmt.toLocaleString("en-IN")}</span>
                                    <span>Paid: ₹{paidAmt.toLocaleString("en-IN")}</span>
                                    <span className="font-bold text-slate-700 dark:text-zinc-200">
                                      Due: ₹{dueAmt.toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2">
                                {allocationMode === "auto" ? (
                                  <span
                                    className={`font-mono font-bold text-sm ${
                                      allocatedAmt > 0
                                        ? "text-indigo-600 dark:text-indigo-400"
                                        : "text-slate-400 dark:text-zinc-600"
                                    }`}
                                  >
                                    ₹{allocatedAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-400">₹</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max={dueAmt}
                                      step="any"
                                      disabled={!isSelected}
                                      value={manualAllocations[invId] ?? (autoAllocations[invId] || "")}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setManualAllocations((prev) => ({ ...prev, [invId]: val }));
                                      }}
                                      placeholder="0.00"
                                      className="w-28 px-2 py-1 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div>
                          <span className="text-slate-500 dark:text-zinc-400">Total:</span>{" "}
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            ₹{Number(amount || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-zinc-400">Allocated:</span>{" "}
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            ₹{totalAllocatedAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-zinc-400">On Account:</span>{" "}
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{unallocatedAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Asset Accounts & Site/Project Selection Card */}
            <section className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Deposit / Withdrawal Account *
                  </label>
                  <CustomSelect
                    value={selectedAssetLedgerId}
                    onChange={(val) => handleAssetLedgerChange(val)}
                    placeholder={
                      assetLedgers.length === 0
                        ? "No Cash/Bank Accounts Found"
                        : "Select Cash/Bank Account *"
                    }
                    options={assetLedgers.map((l: any) => {
                      const bal = Number(l.current_balance ?? l.opening_balance ?? 0);
                      return {
                        value: String(l.id),
                        label: l.name,
                        sublabel: `Balance: ₹${Math.abs(bal).toLocaleString("en-IN")} ${bal < 0 ? "Dr" : "Cr"}`,
                        badge: String(l.type).toUpperCase(),
                      };
                    })}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Link Project / Site
                  </label>
                  <CustomSelect
                    value={selectedSiteProjectId}
                    onChange={(val) => setSelectedSiteProjectId(val)}
                    placeholder="None"
                    options={[
                      { value: "", label: "None" },
                      ...siteProjects.map((sp: any) => {
                        const name = sp.name || sp.siteName || sp.site_name || sp.projectName || sp.project_name || sp.title || "Site/Project";
                        const badgeType = String(sp.type || (sp.siteName || sp.site_name || sp.location ? "Site" : "Project")).toUpperCase();
                        return {
                          value: String(sp.id || sp.site_id || sp.project_id),
                          label: name,
                          badge: badgeType,
                        };
                      }),
                    ]}
                  />
                </div>
              </div>
            </section>

            {/* Payment Remark */}
            <section className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 shadow-sm space-y-2">
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-700 dark:text-zinc-300">
                Remark / Note
              </label>
              <textarea
                rows={3}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Remark"
                className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-xs text-slate-900 dark:text-white outline-none resize-none focus:border-indigo-500"
              />
            </section>
          </div>

          {/* Right Column Sidebar (Calculation Summary & Actions) */}
          <div className="lg:col-span-1 space-y-6">
            <section className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 shadow-sm space-y-4 sticky top-20">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-200 dark:border-zinc-800 pb-2.5">
                Payment Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                  <span>Type</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      paymentType === "credit"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                    }`}
                  >
                    {paymentType === "credit" ? "Credit" : "Debit"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                  <span>Party Account</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                    {selectedParty ? getPartyDisplayName(selectedParty) : "Not Selected"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                  <span>Payment Ledger</span>
                  <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
                    {assetLedgers.find((l: any) => String(l.id) === String(selectedAssetLedgerId))
                      ?.name || "Cash/Bank Account"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                  <span>Linked Invoices</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[150px]">
                    {activeAllocations.length === 0
                      ? "On Account"
                      : activeAllocations.length === 1
                        ? activeAllocations[0].invoice?.invoice_number || activeAllocations[0].invoice?.number || activeAllocations[0].invoice?.id
                        : `Bulk Split (${activeAllocations.length})`}
                  </span>
                </div>

                {selectedSiteProjectId && (
                  <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                    <span>Project/Site</span>
                    <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
                      {siteProjects.find((sp: any) => String(sp.id) === String(selectedSiteProjectId))
                        ?.name || "Linked Site"}
                    </span>
                  </div>
                )}
              </div>

              {/* Proof Image Section */}
              <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Attachment
                </label>
                {attachmentPreview ? (
                  <div className="relative inline-block border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden group">
                    <img
                      src={attachmentPreview}
                      alt="Proof Attachment"
                      className="w-32 h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setAttachmentPreview(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition cursor-pointer"
                      title="Remove image"
                    >
                      <IoTrashOutline className="text-sm" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 cursor-pointer hover:border-slate-400 transition">
                    <IoCloudUploadOutline className="text-xl text-slate-400 mb-1" />
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                      Upload image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Total Amount & Submit Button */}
              <div className="pt-3 border-t border-slate-200 dark:border-zinc-800">
                <p className="text-xs uppercase font-semibold text-slate-400 dark:text-zinc-500">
                  Total Amount
                </p>
                <p
                  className={`text-2xl font-extrabold mt-0.5 font-mono ${
                    paymentType === "credit"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  ₹
                  {Number(amount || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSave}
                className={`w-full h-10 rounded-lg text-white font-semibold text-xs sm:text-sm shadow-sm transition cursor-pointer disabled:opacity-50 ${
                  paymentType === "credit"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-rose-600 hover:bg-rose-500"
                }`}
              >
                {isSubmitting
                  ? isEdit ? "Updating..." : "Saving..."
                  : isEdit
                    ? paymentType === "credit"
                      ? "Update Payment Received"
                      : "Update Payment Out"
                    : paymentType === "credit"
                      ? "Record Payment Received"
                      : "Record Payment Out"}
              </button>
            </section>
          </div>
        </div>

        {/* Select Party Modal */}
        {showPartyModal && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs p-4 flex items-center justify-center"
            onClick={() => setShowPartyModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 space-y-3 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2.5">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Select Party
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPartyModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <IoClose className="text-lg" />
                </button>
              </div>

              <div className="relative">
                <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  value={partySearch}
                  onChange={(e) => setPartySearch(e.target.value)}
                  placeholder="Search party..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white outline-none focus:border-slate-400 dark:focus:border-zinc-600"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                {filteredParties.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                    No matching party found.
                  </div>
                ) : (
                  filteredParties.map((p) => {
                    const isSelected =
                      selectedParty?.id === p.id || selectedParty?.ledger_id === p.ledger_id;
                    const bal = getPartyBalance(p);

                    return (
                      <div
                        key={p.id || p.ledger_id}
                        onClick={() => handleSelectParty(p)}
                        className={`p-3 rounded-xl text-xs flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? "bg-slate-100 dark:bg-zinc-800 font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-zinc-700"
                            : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-900 dark:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-bold flex items-center justify-center shrink-0 border border-slate-200 dark:border-zinc-700">
                            {getPartyDisplayName(p).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold">{getPartyDisplayName(p)}</p>
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                              {getPartyPhone(p) || ""}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p
                            className={`font-mono font-bold text-xs ${
                              bal < 0
                                ? "text-rose-600 dark:text-rose-400"
                                : bal > 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            ₹{Math.abs(bal).toLocaleString("en-IN")} {bal < 0 ? "Dr" : "Cr"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Settlement Checklist Animation Modal */}
        <PaymentSettlementChecklistModal
          isOpen={checklistData.isOpen}
          amount={checklistData.amount}
          partyName={checklistData.partyName}
          paymentType={checklistData.paymentType}
          settledInvoices={checklistData.settledInvoices}
          onComplete={() => {
            setChecklistData((prev) => ({ ...prev, isOpen: false }));
            router.replace(checklistData.redirectPath);
          }}
          onClose={() => {
            setChecklistData((prev) => ({ ...prev, isOpen: false }));
            router.replace(checklistData.redirectPath);
          }}
        />
      </div>
    </PermissionGuard>
  );
}

export default function ReceivedPaymentView() {
  return <ReceivedPaymentContent />;
}
