"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter, usePathname, useSearchParams } from "next/navigation";
import { handleSmartBack } from "@/lib/utils/smartNavigation";
import {
  IoArrowBack,
  IoChevronBack,
  IoPencilOutline,
  IoTrashOutline,
  IoAdd,
  IoSearch,
  IoWalletOutline,
  IoBusinessOutline,
  IoCashOutline,
  IoReceiptOutline,
  IoPrintOutline,
  IoLocationOutline,
  IoClose,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoSwapVerticalOutline,
  IoDocumentTextOutline,
  IoDownloadOutline,
} from "react-icons/io5";
import { useAuth } from "@/context/AuthContext";
import PermissionGuard from "@/components/PermissionGuard";
import FilterTabs from "@/components/FilterTabs";
import PageHeader from "@/components/PageHeader";
import { SkeletonDetails } from "@/components/Skeleton";
import { partyApi } from "@/lib/api/party";
import { ledgerApi } from "@/lib/api/ledger";
import { transactionApi } from "@/lib/api/transaction";
import { invoiceApi } from "@/lib/api/invoice";
import { paymentApi } from "@/lib/api/payment";
import { reportsApi } from "@/lib/api/reports";
import { toast } from "react-toastify";
import MobiscrollDatePicker from "@/components/MobiscrollDatePicker";
import AddLedgerForm from "./AddLedgerForm";
import AddLedgerTransactionForm from "./AddLedgerTransactionForm";

const formatAddress = (addr: any) => {
  if (!addr) return "-";
  if (typeof addr === "string") return addr.trim() || "-";
  if (typeof addr === "object") {
    const parts = [
      addr.address || addr.street || addr.address_line1 || addr.addressLine1 || addr.line1,
      addr.address_line2 || addr.addressLine2 || addr.line2,
      addr.city,
      addr.state,
      addr.pinCode || addr.pin_code || addr.pincode || addr.pin || addr.postal_code,
      addr.country,
    ].filter((part) => typeof part === "string" && part.trim().length > 0);
    return parts.length > 0 ? parts.join(", ") : "-";
  }
  return "-";
};

export default function LedgerDetailsView() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ledgerId = params?.id;
  const { currentUser, activeBusiness, hasPermission } = useAuth();

  // Determine correct back destination based on how this view was reached
  const backUrl = pathname?.startsWith("/parties") ? "/parties" : "/ledgers";

  const [ledger, setLedger] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Sorting
  const [activeFilter, setActiveFilter] = useState("invoices");
  const [activeMobileTab, setActiveMobileTab] = useState<"invoices" | "payments">("invoices");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" }>({ key: "date", direction: "desc" });

  // Modals
  const [isDeleteLedgerOpen, setIsDeleteLedgerOpen] = useState(false);
  const [isDeletingLedger, setIsDeletingLedger] = useState(false);

  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<any | null>(null);
  const [txToDelete, setTxToDelete] = useState<any | null>(null);
  const [isDeletingTx, setIsDeletingTx] = useState(false);

  const [selectedProofImg, setSelectedProofImg] = useState<string | null>(null);

  const fetchLedgerAndTransactions = async () => {
    const idStr = Array.isArray(ledgerId) ? ledgerId[0] : ledgerId;
    if (!activeBusiness?.id || !idStr) return;

    setIsLoading(true);
    try {
      const [ledgerRes, partyRes, txRes, invoicesRes, paymentsRes]: [any, any, any, any, any] = await Promise.all([
        ledgerApi.getLedger(idStr).catch(() => null),
        partyApi.getPartyDetails(idStr).catch(() => null),
        transactionApi.getTransactions({ type: 'ledger', id: idStr, per_page: 'all', silentError: true }).catch(() => ({ body: [] })),
        invoiceApi.getInvoices({ ledger_id: idStr, per_page: 'all', silentError: true }).catch(() => ({ body: [] })),
        paymentApi.getPayments({ party_ledger_id: idStr, silentError: true }).catch(() => ({ body: [] })),
      ]);

      const lData = ledgerRes?.body?.ledger || ledgerRes?.body?.party || ledgerRes?.body?.data || ledgerRes?.ledger || ledgerRes?.party || ledgerRes?.data || ledgerRes?.body
        || partyRes?.body?.party || partyRes?.body?.ledger || partyRes?.body?.data || partyRes?.party || partyRes?.ledger || partyRes?.data || partyRes?.body;

      if (lData) {
        lData.name = lData.name || lData.partyName || lData.party_name || lData.title || "Party Ledger";
      }

      setLedger(lData || null);

      const txList = Array.isArray(txRes?.body) ? txRes.body : (txRes?.body?.transactions || txRes?.body?.data || (Array.isArray(txRes) ? txRes : []));
      const invList = Array.isArray(invoicesRes?.body) ? invoicesRes.body : (invoicesRes?.body?.invoices || invoicesRes?.body?.data || (Array.isArray(invoicesRes) ? invoicesRes : []));
      const payList = Array.isArray(paymentsRes?.body) ? paymentsRes.body : (paymentsRes?.body?.payments || paymentsRes?.body?.data || (Array.isArray(paymentsRes) ? paymentsRes : []));

      const currentLedgerIdStr = String(idStr).toLowerCase().trim();
      const currentLedgerName = (lData?.name || lData?.partyName || lData?.party_name || "").toLowerCase().trim();

      const normalizedInvoices = invList
        .filter((inv: any) => {
          const invLedgerId = String(inv.ledger_id || inv.ledger?.id || inv.party?.id || inv.party_id || inv.partyId || inv.supplier?.id || inv.supplier_id || "").toLowerCase().trim();
          const invPartyName = (inv.partyName || inv.ledger?.name || inv.party?.name || inv.party?.partyName || inv.supplier?.partyName || "").toLowerCase().trim();
          if (invLedgerId && invLedgerId === currentLedgerIdStr) return true;
          if (invPartyName && currentLedgerName && invPartyName === currentLedgerName) return true;
          return !invLedgerId && !invPartyName;
        })
        .map((inv: any) => ({
          ...inv,
          id: inv.id,
          number: inv.invoice_number || inv.invoiceNumberStr || inv.invoiceNumber || `INV-${inv.id}`,
          invoice_number: inv.invoice_number || inv.invoiceNumberStr || inv.invoiceNumber || `INV-${inv.id}`,
          transaction_date: inv.invoice_date || inv.invoiceDate || inv.date || inv.created_at,
          amount: Number(inv.amount ?? inv.total_amount ?? inv.totalAmount ?? inv.total ?? 0),
          type: String(inv.invoiceType || inv.type || "sales").toLowerCase().includes("purchase") ? "purchase_invoice" : "sales_invoice",
          status: String(inv.status || "unpaid").toLowerCase(),
          isInvoice: true,
        }));

      const normalizedPayments = payList
        .filter((pay: any) => {
          const payLedgerId = String(pay.party_ledger_id || pay.party_id || pay.partyId || pay.ledger_id || pay.party_ledger?.id || pay.party?.id || "").toLowerCase().trim();
          const payPartyName = (pay.party_ledger?.name || pay.party_name || pay.partyName || pay.party?.name || "").toLowerCase().trim();
          if (payLedgerId && payLedgerId === currentLedgerIdStr) return true;
          if (payPartyName && currentLedgerName && payPartyName === currentLedgerName) return true;
          return !payLedgerId && !payPartyName;
        })
        .map((pay: any) => ({
          ...pay,
          id: pay.id,
          number: pay.transaction_number || pay.number || pay.receipt_number || pay.reference_number || (pay.id ? `TXN-${String(pay.id).slice(0, 8).toUpperCase()}` : "—"),
          transaction_number: pay.transaction_number || pay.number || pay.receipt_number || pay.reference_number || (pay.id ? `TXN-${String(pay.id).slice(0, 8).toUpperCase()}` : "—"),
          transaction_date: pay.transaction_date || pay.date || pay.created_at,
          amount: Number(pay.amount || pay.total || 0),
          type: pay.type || "payment_in",
          isPayment: true,
        }));

      const lType = String(lData?.type || lData?.group || lData?.category || "").toLowerCase().trim();
      const lName = String(lData?.name || lData?.partyName || lData?.party_name || "").toLowerCase().trim();
      const isComp = ["company", "capital", "equity", "company ledger", "company_ledger"].includes(lType) || lName.includes("company") || lName.includes("capital") || lName.includes("equity");
      const isCBComp = ["cash", "bank", "company", "capital", "equity", "expense", "expenses", "company ledger", "company_ledger"].includes(lType) || isComp;

      const txPayments = txList
        .filter((tx: any) => {
          if (isCBComp) return true;
          const t = String(tx.type || tx.transactionType || "").toLowerCase();
          const isInv = tx.isInvoice || !!tx.invoice_id || !!tx.invoice_number || t.includes("invoice") || t.includes("sales") || t.includes("purchase");
          return !isInv;
        })
        .map((tx: any) => ({
          ...tx,
          id: tx.id,
          number: tx.transaction_number || tx.number || tx.receipt_number || tx.reference_number || (tx.id ? `TXN-${String(tx.id).slice(0, 8).toUpperCase()}` : "—"),
          transaction_number: tx.transaction_number || tx.number || tx.receipt_number || tx.reference_number || (tx.id ? `TXN-${String(tx.id).slice(0, 8).toUpperCase()}` : "—"),
          transaction_date: tx.transaction_date || tx.date || tx.created_at,
          amount: Number(tx.amount || tx.total || 0),
          type: tx.type || "payment_in",
          isPayment: true,
        }));

      const combinedPayments = [...normalizedPayments, ...txPayments];
      const uniquePayments = Array.from(new Map(combinedPayments.map(p => [String(p.id), p])).values());

      setInvoices(normalizedInvoices);
      setPayments(uniquePayments);
    } catch (err) {
      console.error("Error fetching ledger details:", err);
      toast.error("Failed to load ledger details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerAndTransactions();
  }, [activeBusiness?.id, ledgerId]);

  const handleDeleteLedger = async () => {
    if (!ledger?.id) return;
    setIsDeletingLedger(true);
    try {
      await ledgerApi.deleteLedger(ledger.id);
      toast.success("Ledger deleted successfully!");
      handleSmartBack(router, pathname, searchParams ? searchParams.get("from") : null, "/ledgers");
    } catch (err: any) {
      console.error("Error deleting ledger:", err);
      toast.error(err.message || "Failed to delete ledger.");
      setIsDeletingLedger(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!txToDelete?.id) return;
    setIsDeletingTx(true);
    try {
      await transactionApi.deleteTransaction(txToDelete.id);
      toast.success("Transaction deleted successfully!");
      setTxToDelete(null);
      fetchLedgerAndTransactions();
    } catch (err: any) {
      console.error("Error deleting transaction:", err);
      toast.error(err.message || "Failed to delete transaction.");
    } finally {
      setIsDeletingTx(false);
    }
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        return { key: null, direction: "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const getLinkedInvoice = (tx: any) => {
    if (!tx) return null;
    if (tx.sales_invoice && tx.sales_invoice.id) {
      return {
        id: tx.sales_invoice.id,
        number: tx.sales_invoice.invoice_number || tx.sales_invoice.number || `INV-${tx.sales_invoice.id}`,
      };
    }
    if (tx.purchase_invoice && tx.purchase_invoice.id) {
      return {
        id: tx.purchase_invoice.id,
        number: tx.purchase_invoice.invoice_number || tx.purchase_invoice.number || `PI-${tx.purchase_invoice.id}`,
      };
    }
    if (tx.invoice && tx.invoice.id) {
      return {
        id: tx.invoice.id,
        number: tx.invoice.invoice_number || tx.invoice.number || `INV-${tx.invoice.id}`,
      };
    }

    const targetInvId = String(tx.sales_invoice_id || tx.purchase_invoice_id || tx.invoice_id || "");
    const targetInvNum = tx.sales_invoice_number || tx.purchase_invoice_number || tx.invoice_number;

    if (targetInvId) {
      const match = invoices.find((i: any) => String(i.id) === targetInvId);
      return {
        id: match?.id || targetInvId,
        number: match?.invoice_number || match?.number || targetInvNum || `#${targetInvId}`,
      };
    }

    if (targetInvNum) {
      return { id: null, number: targetInvNum };
    }

    return null;
  };

  const ledgerType = String(ledger?.type || ledger?.group || ledger?.category || "").toLowerCase().trim();
  const ledgerName = String(ledger?.name || ledger?.partyName || ledger?.party_name || "").toLowerCase().trim();
  const isCompanyLedger = ["company", "capital", "equity", "company ledger", "company_ledger"].includes(ledgerType) || ledgerName.includes("company") || ledgerName.includes("capital") || ledgerName.includes("equity");
  const isCashBankOrCompany = ["cash", "bank", "company", "capital", "equity", "expense", "expenses", "company ledger", "company_ledger"].includes(ledgerType) || isCompanyLedger;

  const activeTab = isCashBankOrCompany
    ? "payments"
    : (activeFilter === "payments" || activeMobileTab === "payments" ? "payments" : "invoices");
  const currentList = activeTab === "payments" ? payments : invoices;

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return currentList;

    return currentList.filter((item) => {
      const numStr = String(item.number || item.invoice_number || item.transaction_number || item.id || "").toLowerCase();
      const remarkStr = String(item.remark || item.notes || "").toLowerCase();
      return numStr.includes(query) || remarkStr.includes(query);
    });
  }, [currentList, searchQuery]);

  const sortedTransactions = useMemo(() => {
    if (!sortConfig.key) return filteredTransactions;
    return [...filteredTransactions].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortConfig.key) {
        case "date":
          aVal = new Date(a.transaction_date || a.date || 0).getTime();
          bVal = new Date(b.transaction_date || b.date || 0).getTime();
          break;
        case "type":
          aVal = (a.type || a.transactionType || "").toLowerCase();
          bVal = (b.type || b.transactionType || "").toLowerCase();
          break;
        case "amount":
          aVal = Number(a.amount || 0);
          bVal = Number(b.amount || 0);
          break;
        default:
          return 0;
      }
      if (typeof aVal === "string") {
        return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [filteredTransactions, sortConfig]);

  const getTxDirection = (tx: any) => {
    const t = String(tx.type || tx.transactionType || tx.invoiceType || "").toLowerCase();

    // Purchase invoice / Purchase journal -> (+) in
    if (t.includes("purchase")) return "in";

    // Sales invoice / Sales journal -> (-) out
    if (t.includes("sales")) return "out";

    // Payment In / Payment Out
    if (t === "payment_out" || t === "debit" || t === "out") return "out";
    if (t === "payment_in" || t === "credit" || t === "in") return "in";

    // Ledger-to-ledger relative evaluation
    const currentLedgerIdStr = String(ledger?.id || ledgerId || "").toLowerCase().trim();
    const payLedgerId = String(tx.payment_ledger_id || tx.payment_ledger?.id || tx.paymentLedgerId || "").toLowerCase().trim();
    const partyLedgerId = String(tx.party_ledger_id || tx.party_ledger?.id || tx.party_id || tx.partyLedgerId || "").toLowerCase().trim();

    if (currentLedgerIdStr) {
      if (payLedgerId === currentLedgerIdStr) return "out";
      if (partyLedgerId === currentLedgerIdStr) return "in";
    }

    const amt = Number(tx.amount || 0);
    if (amt < 0) return "out";

    return "in";
  };

  const printStatementData = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const startTs = startOfMonth.getTime();
    const endTs = endOfMonth.getTime();

    const initialOpenBal = Number(ledger?.opening_balance ?? ledger?.openingBalance ?? 0);
    const openBalType = String(ledger?.opening_balance_type || "").toLowerCase().trim();
    const lType = String(ledger?.type || ledger?.group || ledger?.category || "").toLowerCase().trim();

    const isCreditNature =
      openBalType === "cr" ||
      openBalType === "credit" ||
      ["supplier", "vendor", "company", "capital", "equity", "liability", "payables"].includes(lType);

    // Combine both invoices and payments into full statement history
    const normalizedInvoicesList = (invoices || []).map((inv: any) => {
      const tType = String(inv.type || inv.invoiceType || "").toLowerCase();
      const isPurchase = tType.includes("purchase");
      return {
        id: `inv-${inv.id}`,
        originalId: inv.id,
        isInvoice: true,
        isPurchase,
        date: inv.transaction_date || inv.invoice_date || inv.date || inv.created_at,
        number: inv.invoice_number || inv.number || `INV-${inv.id}`,
        amount: Number(inv.amount ?? inv.total_amount ?? inv.totalAmount ?? 0),
        description: inv.note || inv.notes || (isPurchase ? "Purchase Invoice" : "Sales Invoice"),
        paymentMode: "-",
        type: isPurchase ? "purchase_invoice" : "sales_invoice",
      };
    });

    const normalizedPaymentsList = (payments || []).map((pay: any) => {
      const tType = String(pay.type || pay.transactionType || "").toLowerCase();
      const isOut = tType === "payment_out" || tType === "debit" || tType === "out";
      return {
        id: `pay-${pay.id}`,
        originalId: pay.id,
        isPayment: true,
        isOut,
        payment_ledger_id: pay.payment_ledger_id || pay.payment_ledger?.id || pay.paymentLedgerId,
        party_ledger_id: pay.party_ledger_id || pay.party_ledger?.id || pay.party_id || pay.partyLedgerId,
        date: pay.transaction_date || pay.date || pay.created_at,
        number: pay.transaction_number || pay.number || pay.receipt_number || pay.id,
        amount: Number(pay.amount || pay.total || 0),
        description: pay.remark || pay.notes || pay.description || (isOut ? "Payment Out" : "Payment In"),
        paymentMode: pay.payment_mode || pay.paymentMode || pay.payment_ledger?.name || "Bank/Cash",
        type: pay.type || (isOut ? "payment_out" : "payment_in"),
      };
    });

    const allTxList = [...normalizedInvoicesList, ...normalizedPaymentsList];

    let periodOpeningBalance = initialOpenBal;
    let totalDebit = 0;
    let totalCredit = 0;

    const priorTx: Array<{ item: any; tTime: number }> = [];
    const currentMonthTx: Array<{ item: any; tTime: number }> = [];

    allTxList.forEach((item) => {
      const txDate = item.date;
      const dObj = txDate ? new Date(txDate) : null;
      const tTime = dObj && !isNaN(dObj.getTime()) ? dObj.getTime() : 0;

      if (tTime < startTs) {
        priorTx.push({ item, tTime });
      } else if (tTime <= endTs) {
        currentMonthTx.push({ item, tTime });
      }
    });

    const currentLedgerIdStr = String(ledger?.id || ledgerId || "").toLowerCase().trim();

    // Helper to compute debit, credit, and net balance delta according to double-entry accounting rules
    const getItemMetrics = (item: any) => {
      const amt = Number(item.amount || 0);
      let debit = 0;
      let credit = 0;

      if (item.isInvoice) {
        if (item.isPurchase) {
          credit = amt;
        } else {
          debit = amt;
        }
      } else {
        const tType = String(item.type || "").toLowerCase();
        const isPayLedger = item.payment_ledger_id && String(item.payment_ledger_id).toLowerCase().trim() === currentLedgerIdStr;
        const isPartyLedger = item.party_ledger_id && String(item.party_ledger_id).toLowerCase().trim() === currentLedgerIdStr;

        let isDebitAccount = false;

        if (isPayLedger) {
          // Bank/Cash (Payment ledger): payment_in = Debit (+), payment_out/contra/journal = Credit (-)
          if (tType === "payment_in" || tType === "in") isDebitAccount = true;
          else isDebitAccount = false;
        } else if (isPartyLedger) {
          // Party ledger: payment_out = Debit (expense/drawings/paid to supplier), payment_in = Credit
          if (tType === "payment_out" || tType === "out" || tType === "contra" || tType === "journal") isDebitAccount = true;
          else isDebitAccount = false;
        } else {
          // Fallback based on ledger account nature
          if (lType === "bank" || lType === "cash") {
            isDebitAccount = !item.isOut && (tType === "payment_in" || tType === "in");
          } else {
            isDebitAccount = item.isOut || tType === "payment_out" || tType === "out";
          }
        }

        if (isDebitAccount) {
          debit = amt;
        } else {
          credit = amt;
        }
      }

      const delta = isCreditNature ? (credit - debit) : (debit - credit);
      return { debit, credit, delta };
    };

    // Calculate period opening balance from prior transactions
    priorTx.sort((a, b) => a.tTime - b.tTime);
    priorTx.forEach(({ item }) => {
      const { delta } = getItemMetrics(item);
      periodOpeningBalance += delta;
    });

    let runningBal = periodOpeningBalance;

    // Process current month transactions
    currentMonthTx.sort((a, b) => a.tTime - b.tTime);
    const list = currentMonthTx.map(({ item }) => {
      const { debit, credit, delta } = getItemMetrics(item);
      totalDebit += debit;
      totalCredit += credit;
      runningBal += delta;

      const txDate = item.date;
      const dObj = txDate ? new Date(txDate) : null;
      const dateStr = dObj && !isNaN(dObj.getTime())
        ? `${String(dObj.getDate()).padStart(2, "0")}/${String(dObj.getMonth() + 1).padStart(2, "0")}/${dObj.getFullYear()}`
        : txDate || "—";

      const numStr = String(item.number || "").trim()
        ? (String(item.number).toLowerCase().startsWith("inv") || String(item.number).toLowerCase().startsWith("pay") || String(item.number).toLowerCase().startsWith("rec") ? String(item.number) : `#${item.number}`)
        : (item.originalId ? `#${item.originalId}` : "");

      const typeLabel = item.isInvoice
        ? (item.isPurchase ? "Purchase Invoice" : "Sales Invoice")
        : (item.isOut ? "Payment Out" : "Payment In");

      return {
        id: item.id,
        dateStr,
        numStr,
        typeLabel,
        description: item.description,
        paymentMode: item.paymentMode,
        debit,
        credit,
        runningBalance: runningBal,
      };
    });

    const fmtDate = (d: Date) =>
      `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

    const durationStr = `${fmtDate(startOfMonth)} - ${fmtDate(endOfMonth)}`;

    return {
      openingBalance: periodOpeningBalance,
      totalDebit,
      totalCredit,
      closingBalance: runningBal,
      durationStr,
      list,
    };
  }, [invoices, payments, ledger]);

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const formatYMD = (y: number, m: number, d: number) => {
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };

  const initialNow = new Date();
  const initialY = initialNow.getFullYear();
  const initialM1 = initialNow.getMonth() + 1;
  const initialLastDay = new Date(initialY, initialM1, 0).getDate();

  const [pdfPeriod, setPdfPeriod] = useState("this_month");
  const [pdfCustomStartDate, setPdfCustomStartDate] = useState(
    `${initialY}-${String(initialM1).padStart(2, "0")}-01`
  );
  const [pdfCustomEndDate, setPdfCustomEndDate] = useState(
    `${initialY}-${String(initialM1).padStart(2, "0")}-${String(initialLastDay).padStart(2, "0")}`
  );
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const getPeriodDates = (period: string, customStart: string, customEnd: string) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed (0 = Jan, 9 = Oct)

    let start_date = "";
    let end_date = "";

    if (period === "this_month") {
      const m1 = month + 1;
      const lastDay = new Date(year, m1, 0).getDate(); // Exact last day (28, 29, 30, 31)
      start_date = formatYMD(year, m1, 1);
      end_date = formatYMD(year, m1, lastDay);
    } else if (period === "last_month") {
      const prev = new Date(year, month - 1, 1);
      const py = prev.getFullYear();
      const pm1 = prev.getMonth() + 1;
      const lastDay = new Date(py, pm1, 0).getDate();
      start_date = formatYMD(py, pm1, 1);
      end_date = formatYMD(py, pm1, lastDay);
    } else if (period === "this_quarter") {
      const qStartMonth0 = Math.floor(month / 3) * 3;
      const qEndMonth0 = qStartMonth0 + 2;
      const qStartM1 = qStartMonth0 + 1;
      const qEndM1 = qEndMonth0 + 1;
      const lastDay = new Date(year, qEndM1, 0).getDate();
      start_date = formatYMD(year, qStartM1, 1);
      end_date = formatYMD(year, qEndM1, lastDay);
    } else if (period === "financial_year") {
      const fyStartYear = month >= 3 ? year : year - 1;
      start_date = formatYMD(fyStartYear, 4, 1); // April 1st
      end_date = formatYMD(fyStartYear + 1, 3, 31); // March 31st
    } else if (period === "custom") {
      start_date = customStart;
      end_date = customEnd;
    }
    return { start_date, end_date };
  };

  const handleSelectPeriodPreset = (presetId: string) => {
    setPdfPeriod(presetId);
    if (presetId !== "all_time" && presetId !== "custom") {
      const { start_date, end_date } = getPeriodDates(presetId, pdfCustomStartDate, pdfCustomEndDate);
      if (start_date) setPdfCustomStartDate(start_date);
      if (end_date) setPdfCustomEndDate(end_date);
    }
  };

  const handleDownloadPdf = async () => {
    if (!ledger?.id) return;
    setIsDownloadingPdf(true);
    try {
      const query: Record<string, any> = {
        ledger_id: ledger.id,
      };

      if (pdfPeriod !== "all_time") {
        if (pdfCustomStartDate) query.start_date = pdfCustomStartDate;
        if (pdfCustomEndDate) query.end_date = pdfCustomEndDate;
      }

      const filename = `${(ledger.name || "ledger").replace(/[^a-z0-9]/gi, "_")}_statement.pdf`;
      await reportsApi.downloadReportPdf("ledger-statement", query, filename);
      toast.success("Ledger PDF statement downloaded successfully!");
      setIsPdfModalOpen(false);
    } catch (err: any) {
      console.error("Failed to download ledger PDF statement via API:", err);
      toast.error(err?.message || "Failed to generate ledger PDF statement.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t === "bank") {
      return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-badge-info">Bank</span>;
    }
    if (t === "cash") {
      return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-badge-success">Cash</span>;
    }
    if (t === "company" || t === "capital") {
      return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-badge-info">Company</span>;
    }
    if (t === "expense") {
      return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-badge-warning">Expense</span>;
    }
    return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-surface-secondary border gi-border gi-text-secondary">{type || "Others"}</span>;
  };

  const getTxTypeBadge = (typeStr: string) => {
    const t = (typeStr || "").toLowerCase();
    if (t === "payment_in" || t === "credit" || t === "in") {
      return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-badge-success">Payment In</span>;
    }
    if (t === "payment_out" || t === "debit" || t === "out") {
      return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-badge-danger">Payment Out</span>;
    }
    if (t === "contra") {
      return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-badge-info">Contra</span>;
    }
    return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-badge-warning">{t || "Journal"}</span>;
  };

  if (isLoading) {
    return (
      <PermissionGuard module="Ledger">
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <SkeletonDetails />
        </div>
      </PermissionGuard>
    );
  }

  if (!ledger) {
    return (
      <PermissionGuard module="Ledger">
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center p-6">
          <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-2xl text-slate-400">
            <IoWalletOutline />
          </div>
          <div>
            <h2 className="text-lg font-bold gi-text-primary">Ledger Not Found</h2>
            <p className="text-xs gi-text-secondary mt-1 max-w-sm">
              The ledger account you are looking for does not exist or may have been deleted.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push(backUrl)}
            className="gi-back-btn"
          >
            <IoChevronBack />
            <span className="gi-back-label">Back</span>
          </button>
        </div>
      </PermissionGuard>
    );
  }

  const currentBal = Number(ledger.current_balance ?? ledger.closingBalance ?? ledger.opening_balance ?? ledger.openingBalance ?? 0);
  const openBal = Number(ledger.opening_balance ?? ledger.openingBalance ?? 0);

  return (
    <PermissionGuard module="Ledger">
      {/* Dedicated Print Statement (Visible ONLY during window.print()) */}
      <div className="hidden print:block text-slate-900 bg-white p-6 font-sans text-xs leading-normal">
        {/* Top Header Row */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-300">
          <div>
            <h1 className="text-base font-bold text-slate-900">
              {activeBusiness?.name || currentUser?.name || "Business Name"}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Phone no: {activeBusiness?.phone || currentUser?.phone || ledger?.contact_number || "-"}
            </p>
          </div>

          <div className="text-right">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
              Party Statement (Ledger)
            </h2>

            <table className="border border-slate-300 text-[11px] text-left ml-auto border-collapse">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-1 px-2.5 font-semibold text-slate-600 bg-slate-50 border-r border-slate-200">Duration</td>
                  <td className="py-1 px-2.5 text-right font-mono font-bold text-slate-900">{printStatementData.durationStr}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1 px-2.5 font-semibold text-slate-600 bg-slate-50 border-r border-slate-200">Ledger</td>
                  <td className="py-1 px-2.5 text-right font-bold text-slate-900">{ledger.name}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1 px-2.5 font-semibold text-slate-600 bg-slate-50 border-r border-slate-200">Opening Balance</td>
                  <td className="py-1 px-2.5 text-right font-mono font-bold text-slate-900">{printStatementData.openingBalance.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1 px-2.5 font-semibold text-slate-600 bg-slate-50 border-r border-slate-200">Total Debit</td>
                  <td className="py-1 px-2.5 text-right font-mono font-bold text-slate-900">{printStatementData.totalDebit.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1 px-2.5 font-semibold text-slate-600 bg-slate-50 border-r border-slate-200">Total Credit</td>
                  <td className="py-1 px-2.5 text-right font-mono font-bold text-slate-900">{printStatementData.totalCredit.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-1 px-2.5 font-semibold text-slate-600 bg-slate-50 border-r border-slate-200">Closing Balance</td>
                  <td className="py-1 px-2.5 text-right font-mono font-bold text-slate-900">{Math.abs(printStatementData.closingBalance).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Statement Transactions Table */}
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-y border-slate-300 text-slate-800">
              <th className="py-2 px-3 font-bold">Transactions</th>
              <th className="py-2 px-3 font-bold text-right w-24">Debit</th>
              <th className="py-2 px-3 font-bold text-right w-24">Credit</th>
              <th className="py-2 px-3 font-bold text-right w-28">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {/* Opening Balance Row */}
            <tr>
              <td className="py-2 px-3 font-semibold text-slate-800">Opening Balance</td>
              <td className="py-2 px-3 text-right"></td>
              <td className="py-2 px-3 text-right"></td>
              <td className="py-2 px-3 text-right font-mono font-semibold">{printStatementData.openingBalance.toFixed(2)}</td>
            </tr>

            {/* Transactions List */}
            {printStatementData.list.map((row) => (
              <tr key={row.id}>
                <td className="py-2.5 px-3">
                  <div className="font-semibold text-slate-900">
                    {row.dateStr} | {row.numStr}
                  </div>
                  <div className="font-bold text-slate-800 text-[11px]">{row.typeLabel}</div>
                  {row.description && <div className="text-slate-700 text-[11px]">{row.description}</div>}
                  {row.paymentMode && <div className="text-slate-600 text-[11px]">Payment Mode: {row.paymentMode}</div>}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                  {row.debit > 0 ? row.debit.toFixed(2) : "0.00"}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                  {row.credit > 0 ? row.credit.toFixed(2) : "0.00"}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  {row.runningBalance.toFixed(2)}
                </td>
              </tr>
            ))}

            {/* Closing Balance Footer Row */}
            <tr className="border-t-2 border-slate-400 font-bold">
              <td className="py-3 px-3 text-slate-900">Closing Balance</td>
              <td className="py-3 px-3"></td>
              <td className="py-3 px-3"></td>
              <td className="py-3 px-3 text-right font-mono text-slate-900">{Math.abs(printStatementData.closingBalance).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="space-y-3 sm:space-y-5 pb-20 select-none gi-page print:hidden">
        {/* Desktop Page Header & Details Summary (>= 768px) */}
        <div className="hidden md:block">
          <PageHeader
            title={ledger.name}
            badge={getTypeBadge(ledger.type)}
            backUrl={backUrl}
            actions={
              <>
                {hasPermission("Ledger", "Create") && (
                  <button
                    type="button"
                    onClick={() => router.push(`/addLedgerTransaction?ledger_id=${ledger.id}`)}
                    className="px-3.5 py-2 rounded-xl gi-btn-primary text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    <IoAdd className="text-base" />
                    <span>Add Ledger Transaction</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl border gi-border gi-surface-interactive gi-text-primary text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Download Ledger PDF Statement"
                >
                  <IoDownloadOutline className="text-base" />
                  <span>Download PDF</span>
                </button>
                {hasPermission("Ledger", "Edit") && (
                  <button
                    type="button"
                    onClick={() => {
                      const isParty = ["customer", "supplier"].includes(ledgerType);
                      router.push(isParty ? `/addParty?id=${ledger.id}&from=${pathname}` : `/addLedger?id=${ledger.id}&from=${pathname}`);
                    }}
                    className="px-3 py-2 rounded-xl border gi-border gi-surface-interactive gi-text-primary text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    title="Edit Ledger"
                  >
                    <IoPencilOutline className="text-base" />
                    <span>Edit</span>
                  </button>
                )}
                {hasPermission("Ledger", "Delete") && (
                  <button
                    type="button"
                    onClick={() => setIsDeleteLedgerOpen(true)}
                    className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    title="Delete Ledger"
                  >
                    <IoTrashOutline className="text-base" />
                    <span>Delete</span>
                  </button>
                )}
              </>
            }
          />

          {!isCashBankOrCompany ? (
            <div className="grid grid-cols-4 gap-4 p-4 rounded-2xl border gi-border gi-card text-xs mb-2">
              <div>
                <span className="text-[11px] gi-text-muted font-medium block mb-0.5">Phone Number</span>
                <span className="font-semibold gi-text-primary text-xs truncate block">{ledger.contact_number || "-"}</span>
              </div>
              <div>
                <span className="text-[11px] gi-text-muted font-medium block mb-0.5">GST Number</span>
                <span className="font-semibold gi-text-primary text-xs truncate block uppercase">{ledger.gstin || "-"}</span>
              </div>
              <div>
                <span className="text-[11px] gi-text-muted font-medium block mb-0.5">Billing Address</span>
                <span className="font-semibold gi-text-primary text-xs truncate block">{formatAddress(ledger.billing_address || ledger.address)}</span>
              </div>
              <div>
                <span className="text-[11px] gi-text-muted font-medium block mb-0.5">Shipping Address</span>
                <span className="font-semibold gi-text-primary text-xs truncate block">{formatAddress(ledger.shipping_address || ledger.address)}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4 p-4 rounded-2xl border gi-border gi-card text-xs mb-2">
              <div>
                <span className="text-[11px] gi-text-muted font-medium block mb-0.5">Opening Balance</span>
                <span className="font-semibold font-mono gi-text-primary text-xs truncate block">
                  ₹{printStatementData.openingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[11px] gi-text-muted font-medium block mb-0.5">Total Debit</span>
                <span className={`font-semibold font-mono text-xs truncate block ${isCompanyLedger ? "text-emerald-600 dark:text-emerald-400" : "gi-text-primary"}`}>
                  ₹{printStatementData.totalDebit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[11px] gi-text-muted font-medium block mb-0.5">Total Credit</span>
                <span className={`font-semibold font-mono text-xs truncate block ${isCompanyLedger ? "text-rose-600 dark:text-rose-400" : "gi-text-primary"}`}>
                  ₹{printStatementData.totalCredit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[11px] gi-text-muted font-medium block mb-0.5">Current Balance</span>
                <span className={`font-semibold font-mono text-xs truncate block ${isCompanyLedger ? (currentBal < 0 ? "text-emerald-600 dark:text-emerald-400" : currentBal > 0 ? "text-rose-600 dark:text-rose-400" : "gi-text-primary") : "gi-text-primary"}`}>
                  {isCompanyLedger ? (currentBal > 0 ? "+" : currentBal < 0 ? "-" : "") : ""}₹{Math.abs(currentBal).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currentBal < 0 ? "Dr" : currentBal > 0 ? "Cr" : ""}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Header Bar (< 768px) */}
        <div className="flex items-center justify-between py-1 md:hidden">
          <button
            type="button"
            onClick={() => router.push(backUrl)}
            className="gi-back-btn"
            aria-label="Back"
          >
            <IoChevronBack />
            <span className="gi-back-label">Back</span>
          </button>

          <div className="flex items-center gap-2">
            {hasPermission("Ledger", "Create") && (
              <button
                type="button"
                onClick={() => router.push(`/addLedgerTransaction?ledger_id=${ledger.id}`)}
                className="px-3 py-1.5 rounded-xl gi-btn-primary text-xs font-bold flex items-center justify-center gap-1 transition shadow-xs cursor-pointer whitespace-nowrap"
              >
                <IoAdd className="text-base" />
                <span>Add Ledger Transaction</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              className="p-2 rounded-full text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Download Ledger PDF Statement"
            >
              <IoDownloadOutline className="text-xl" />
            </button>
            {hasPermission("Ledger", "Edit") && (
              <button
                type="button"
                onClick={() => {
                  const isParty = ["customer", "supplier"].includes(ledgerType);
                  router.push(isParty ? `/addParty?id=${ledger.id}&from=${pathname}` : `/addLedger?id=${ledger.id}&from=${pathname}`);
                }}
                className="p-2 rounded-full text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="Edit Ledger"
              >
                <IoPencilOutline className="text-xl" />
              </button>
            )}
            {hasPermission("Ledger", "Delete") && (
              <button
                type="button"
                onClick={() => setIsDeleteLedgerOpen(true)}
                className="p-2 rounded-full text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="Delete Ledger"
              >
                <IoTrashOutline className="text-xl" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Profile & Balance Row (< 768px) - LOGO REMOVED */}
        <div className="flex items-center justify-between gap-3 pt-0 pb-1 md:hidden">
          <div className="min-w-0">
            <h2 className="text-base font-bold gi-text-primary truncate leading-snug">
              {ledger.name}
            </h2>
            <p className="text-xs gi-text-muted capitalize">
              {ledger.type || "Ledger"}
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className={`font-mono font-bold text-base ${isCompanyLedger ? (currentBal < 0 ? "text-emerald-600 dark:text-emerald-400" : currentBal > 0 ? "text-rose-600 dark:text-rose-400" : "gi-text-primary") : "gi-text-primary"}`}>
              {isCompanyLedger ? (currentBal > 0 ? "+" : currentBal < 0 ? "-" : "") : ""}₹{Math.abs(currentBal).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Mobile Spec Cards (< 768px) */}
        {!isCashBankOrCompany && (
          <div className="space-y-3 md:hidden">
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 p-3.5 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[11px] gi-text-muted font-medium block mb-0.5">Phone No.</span>
                <span className="font-semibold gi-text-primary text-xs truncate block">{ledger.contact_number || "-"}</span>
              </div>
              <div>
                <span className="text-[11px] gi-text-muted font-medium block mb-0.5">GST No.</span>
                <span className="font-semibold gi-text-primary text-xs truncate block uppercase">{ledger.gstin || "-"}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 p-3.5 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[11px] gi-text-muted font-medium block mb-0.5">Billing Address</span>
                <span className="font-semibold gi-text-primary text-xs truncate block">{formatAddress(ledger.billing_address || ledger.address)}</span>
              </div>
              <div>
                <span className="text-[11px] gi-text-muted font-medium block mb-0.5">Shipping Address</span>
                <span className="font-semibold gi-text-primary text-xs truncate block">{formatAddress(ledger.shipping_address || ledger.address)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Table for this Ledger */}
        <div className="space-y-3">
          {/* Single Filter Controls for both Mobile and Desktop */}
          {!isCashBankOrCompany ? (
            <FilterTabs
              options={[
                { id: "invoices", label: "Invoices" },
                { id: "payments", label: "Payments" },
              ]}
              activeId={activeFilter}
              onChange={(id) => {
                setActiveFilter(id);
                setActiveMobileTab(id as "invoices" | "payments");
              }}
              layoutId="ledgerDetailsFilterPill"
            />
          ) : (
            <div className="text-sm font-bold gi-text-primary px-1 pb-1">
              Transactions
            </div>
          )}

          {/* Mobile Content / Empty State (< 768px) */}
          <div className="block md:hidden space-y-3 pt-1">
            {sortedTransactions.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl shadow-2xs">
                  <IoReceiptOutline />
                </div>
                <p className="font-bold text-sm text-slate-700 dark:text-slate-200">
                  No data found
                </p>
              </div>
            ) : activeTab === "payments" ? (
              sortedTransactions.map((tx) => {
                const txDate = tx.transaction_date || tx.date || tx.created_at;
                const dObj = txDate ? new Date(txDate) : null;
                const dateStr = dObj && !isNaN(dObj.getTime())
                  ? `${String(dObj.getDate()).padStart(2, "0")}-${String(dObj.getMonth() + 1).padStart(2, "0")}-${dObj.getFullYear()}`
                  : txDate || "—";
                const amt = Number(tx.amount || 0);

                const payNum = String(tx.transaction_number || tx.number || "").trim();
                const displayPayNum = payNum
                  ? (/^[a-zA-Z#]/.test(payNum) ? payNum : `#${payNum}`)
                  : (tx.id ? `TXN-${String(tx.id).slice(0, 8).toUpperCase()}` : "");

                const targetId = tx.payment_id || tx.paymentId || tx.id;
                const dir = getTxDirection(tx);
                const isOut = dir === "out";
                const isIn = dir === "in";

                const titleStr = tx.remark || tx.notes || (isOut ? `Payment Out ${displayPayNum}` : isIn ? `Payment In ${displayPayNum}` : `Transaction ${displayPayNum}`);

                return (
                  <div
                    key={tx.id}
                    onClick={() => {
                      const targetId = tx.payment_id || tx.paymentId || tx.id;
                      if (targetId) {
                        router.push(`/paymentDetails/${targetId}?from=${encodeURIComponent(pathname)}`);
                      }
                    }}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs flex items-center justify-between gap-3 cursor-pointer hover:border-slate-400/50 active:scale-[0.99] transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isOut
                        ? "bg-rose-100/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                        : isIn
                          ? "bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                          : "bg-indigo-100/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                        }`}>
                        {isOut ? (
                          <IoArrowUpOutline className="text-lg rotate-[45deg]" />
                        ) : isIn ? (
                          <IoArrowDownOutline className="text-lg rotate-[45deg]" />
                        ) : (
                          <IoSwapVerticalOutline className="text-lg" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                          {titleStr}
                        </h3>
                        <p className="text-[11px] gi-text-muted mt-0.5">
                          {dateStr}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`font-mono font-bold text-xs ${isCompanyLedger
                        ? (isOut ? "text-emerald-600 dark:text-emerald-400" : isIn ? "text-rose-600 dark:text-rose-400" : "gi-text-primary")
                        : "gi-text-primary"
                        }`}>
                        {isIn ? "+" : isOut ? "-" : ""}₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              sortedTransactions.map((tx) => {
                const txDate = tx.transaction_date || tx.date || tx.created_at;
                const dObj = txDate ? new Date(txDate) : null;
                const dateStr = dObj && !isNaN(dObj.getTime())
                  ? `${String(dObj.getDate()).padStart(2, "0")}-${String(dObj.getMonth() + 1).padStart(2, "0")}-${dObj.getFullYear()}`
                  : txDate || "—";
                const amt = Number(tx.amount || 0);
                const statusStr = String(tx.status || "unpaid").toLowerCase();

                const invNum = String(tx.invoice_number || tx.number || "").trim();
                const displayInvNum = invNum
                  ? (invNum.toLowerCase().startsWith("inv") || invNum.toLowerCase().startsWith("pur") ? invNum : `Invoice #${invNum}`)
                  : (tx.id ? `Invoice #${tx.id}` : "Invoice");

                const targetId = tx.invoice_id || tx.invoiceId || tx.id;
                const txType = String(tx.type || tx.invoiceType || "").toLowerCase();
                const isPurchase = txType.includes("purchase");
                const invSign = isCompanyLedger ? (isPurchase ? "+" : "-") : "";
                const invColor = isCompanyLedger
                  ? (isPurchase ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")
                  : "gi-text-primary";

                return (
                  <div
                    key={tx.id}
                    onClick={() => router.push(`/invoiceDetails/${targetId}`)}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs flex items-center justify-between gap-3 cursor-pointer hover:border-slate-400/50 active:scale-[0.99] transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                        <IoDocumentTextOutline className="text-lg" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                          {displayInvNum}
                        </h3>
                        <p className="text-[11px] gi-text-muted mt-0.5">
                          {dateStr}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${statusStr === "paid"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                        }`}>
                        {statusStr === "paid" ? "Paid" : "Unpaid"}
                      </span>
                      <p className={`font-mono font-bold text-xs mt-1 ${invColor}`}>
                        {invSign}₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Data Table (>= 768px) */}
          <div className="hidden md:block gi-table-container shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs gi-table border-collapse">
                <thead>
                  {activeTab === "payments" ? (
                    <tr>
                      <th className="py-2 px-2.5">Transaction / Description</th>
                      <th className="py-2 px-2.5">Date</th>
                      <th className="py-2 px-2.5">Type</th>
                      <th className="py-2 px-2.5">Linked Invoice</th>
                      <th className="py-2 px-2.5 text-right">Amount (₹)</th>
                      <th className="py-2 px-2.5 text-center">Actions</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="py-2 px-2.5">Invoice Number</th>
                      <th className="py-2 px-2.5">Date</th>
                      <th className="py-2 px-2.5">Status</th>
                      <th className="py-2 px-2.5 text-right">Amount (₹)</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y gi-divider">
                  {sortedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center gi-text-muted text-xs">
                        No records found for this ledger yet.
                      </td>
                    </tr>
                  ) : activeTab === "payments" ? (
                    sortedTransactions.map((tx) => {
                      const txDate = tx.transaction_date || tx.date || tx.created_at;
                      const dObj = txDate ? new Date(txDate) : null;
                      const dateStr = dObj && !isNaN(dObj.getTime())
                        ? `${String(dObj.getDate()).padStart(2, "0")}-${String(dObj.getMonth() + 1).padStart(2, "0")}-${dObj.getFullYear()}`
                        : txDate || "—";
                      const amt = Number(tx.amount || 0);

                      const payNum = String(tx.transaction_number || tx.number || "").trim();
                      const displayPayNum = payNum
                        ? (/^[a-zA-Z#]/.test(payNum) ? payNum : `#${payNum}`)
                        : (tx.id ? `TXN-${String(tx.id).slice(0, 8).toUpperCase()}` : "");

                      const dir = getTxDirection(tx);
                      const isOut = dir === "out";
                      const isIn = dir === "in";
                      const linkedInv = getLinkedInvoice(tx);

                      const titleStr = tx.remark || tx.notes || (isOut ? `Payment Out ${displayPayNum}` : isIn ? `Payment In ${displayPayNum}` : `Transaction ${displayPayNum}`);

                      return (
                        <tr
                          key={tx.id}
                          onClick={() => {
                            const targetId = tx.payment_id || tx.paymentId || tx.id;
                            if (targetId) router.push(`/paymentDetails/${targetId}?from=${encodeURIComponent(pathname)}`);
                          }}
                          className="hover:bg-[var(--gi-hover)] transition cursor-pointer"
                        >
                          <td className="py-2 px-2.5 font-semibold gi-text-primary whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${isOut
                                ? "bg-rose-100/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                                : isIn
                                  ? "bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                                  : "bg-indigo-100/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                                }`}>
                                {isOut ? (
                                  <IoArrowUpOutline className="text-xs rotate-[45deg]" />
                                ) : isIn ? (
                                  <IoArrowDownOutline className="text-xs rotate-[45deg]" />
                                ) : (
                                  <IoSwapVerticalOutline className="text-xs" />
                                )}
                              </div>
                              <span>{titleStr}</span>
                            </div>
                          </td>
                          <td className="py-2 px-2.5 gi-text-secondary whitespace-nowrap">
                            {dateStr}
                          </td>
                          <td className="py-2 px-2.5">
                            {getTxTypeBadge(tx.type || tx.transactionType)}
                          </td>
                          <td className="py-2 px-2.5" onClick={(e) => e.stopPropagation()}>
                            {linkedInv ? (
                              linkedInv.id ? (
                                <Link
                                  href={`/invoiceDetails/${linkedInv.id}`}
                                  className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                                >
                                  <span>{linkedInv.number}</span>
                                </Link>
                              ) : (
                                <span className="font-mono text-xs font-medium gi-text-primary">{linkedInv.number}</span>
                              )
                            ) : (
                              <span className="gi-text-muted text-xs">—</span>
                            )}
                          </td>
                          <td className={`py-2 px-2.5 text-right font-mono font-bold text-xs ${isCompanyLedger
                            ? (isOut ? "text-emerald-600 dark:text-emerald-400" : isIn ? "text-rose-600 dark:text-rose-400" : "gi-text-primary")
                            : "gi-text-primary"
                            }`}>
                            {isIn ? "+" : isOut ? "-" : ""}₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">

                              {hasPermission("Ledger", "Edit") && (
                                <button
                                  type="button"
                                  onClick={() => setTxToEdit(tx)}
                                  className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                                  title="Edit Transaction"
                                >
                                  <IoPencilOutline className="text-sm" />
                                </button>
                              )}

                              {hasPermission("Ledger", "Delete") && (
                                <button
                                  type="button"
                                  onClick={() => setTxToDelete(tx)}
                                  className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                  title="Delete Transaction"
                                >
                                  <IoTrashOutline className="text-sm" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    sortedTransactions.map((tx) => {
                      const txDate = tx.transaction_date || tx.date || tx.created_at;
                      const dObj = txDate ? new Date(txDate) : null;
                      const dateStr = dObj && !isNaN(dObj.getTime())
                        ? `${String(dObj.getDate()).padStart(2, "0")}-${String(dObj.getMonth() + 1).padStart(2, "0")}-${dObj.getFullYear()}`
                        : txDate || "—";
                      const amt = Number(tx.amount || 0);
                      const statusStr = String(tx.status || "unpaid").toLowerCase();

                      const invNum = String(tx.invoice_number || tx.number || "").trim();
                      const displayInvNum = invNum
                        ? (invNum.toLowerCase().startsWith("inv") || invNum.toLowerCase().startsWith("pur") ? invNum : `Invoice #${invNum}`)
                        : (tx.id ? `Invoice #${tx.id}` : "Invoice");

                      const targetId = tx.invoice_id || tx.invoiceId || tx.id;
                      const txType = String(tx.type || tx.invoiceType || "").toLowerCase();
                      const isPurchase = txType.includes("purchase");
                      const invSign = isCompanyLedger ? (isPurchase ? "+" : "-") : "";
                      const invColor = isCompanyLedger
                        ? (isPurchase ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")
                        : "gi-text-primary";

                      return (
                        <tr
                          key={tx.id}
                          onClick={() => router.push(`/invoiceDetails/${targetId}`)}
                          className="hover:bg-[var(--gi-hover)] transition cursor-pointer"
                        >
                          <td className="py-2 px-2.5 font-semibold gi-text-primary whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                                <IoDocumentTextOutline className="text-xs" />
                              </div>
                              <span>{displayInvNum}</span>
                            </div>
                          </td>
                          <td className="py-2 px-2.5 gi-text-secondary whitespace-nowrap">
                            {dateStr}
                          </td>
                          <td className="py-2 px-2.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${statusStr === "paid"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                              }`}>
                              {statusStr === "paid" ? "Paid" : "Unpaid"}
                            </span>
                          </td>
                          <td className={`py-2 px-2.5 text-right font-mono font-bold text-xs ${invColor}`}>
                            {invSign}₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modals */}
        {/* Delete Ledger Modal */}

        {/* Delete Ledger Modal */}
        {isDeleteLedgerOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative max-w-md w-full gi-card p-6 rounded-2xl shadow-2xl border gi-divider space-y-4">
              <div className="flex items-center justify-between border-b pb-3 gi-divider">
                <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">Delete Ledger</h3>
                <button
                  type="button"
                  onClick={() => setIsDeleteLedgerOpen(false)}
                  className="p-1 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer"
                >
                  <IoClose className="text-base" />
                </button>
              </div>

              <p className="text-xs gi-text-secondary leading-relaxed">
                Are you sure you want to delete ledger <strong className="gi-text-primary">&quot;{ledger.name}&quot;</strong>? This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteLedgerOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border gi-surface-interactive gi-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteLedger}
                  disabled={isDeletingLedger}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isDeletingLedger ? "Deleting..." : "Delete Ledger"}
                </button>
              </div>
            </div>
          </div>
        )}



        {/* Edit Transaction Modal */}
        {txToEdit && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-[var(--gi-surface)] rounded-2xl shadow-2xl p-6 border gi-divider max-h-[90vh] overflow-y-auto">
              <AddLedgerTransactionForm
                txToEdit={txToEdit}
                onSuccess={() => {
                  setTxToEdit(null);
                  fetchLedgerAndTransactions();
                }}
                onCancel={() => setTxToEdit(null)}
              />
            </div>
          </div>
        )}

        {/* Delete Transaction Modal */}
        {txToDelete && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative max-w-md w-full gi-card p-6 rounded-2xl shadow-2xl border gi-divider space-y-4">
              <div className="flex items-center justify-between border-b pb-3 gi-divider">
                <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">Delete Entry</h3>
                <button
                  type="button"
                  onClick={() => setTxToDelete(null)}
                  className="p-1 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer"
                >
                  <IoClose className="text-base" />
                </button>
              </div>

              <p className="text-xs gi-text-secondary leading-relaxed">
                Are you sure you want to delete this transaction of <strong className="gi-text-primary">₹{Number(txToDelete.amount || 0).toLocaleString("en-IN")}</strong>?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTxToDelete(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border gi-surface-interactive gi-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTransaction}
                  disabled={isDeletingTx}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isDeletingTx ? "Deleting..." : "Delete Entry"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Proof Image View Modal */}
        {selectedProofImg && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative max-w-lg w-full gi-card p-4 rounded-xl shadow-2xl border gi-divider space-y-3">
              <div className="flex items-center justify-between border-b pb-2 gi-divider">
                <h3 className="text-sm font-bold gi-text-primary">Transaction Proof Image</h3>
                <button
                  type="button"
                  onClick={() => setSelectedProofImg(null)}
                  className="p-1 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer"
                >
                  <IoClose className="text-base" />
                </button>
              </div>

              <div className="flex justify-center bg-black/10 rounded-lg p-2 overflow-hidden max-h-[70vh]">
                <img
                  src={selectedProofImg}
                  alt="Proof Document"
                  className="max-h-[65vh] w-auto object-contain rounded"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProofImg(null)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold gi-btn-primary cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Period Selection Modal for PDF Download */}
        {isPdfModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative max-w-lg w-full gi-card p-6 rounded-2xl shadow-2xl border gi-divider space-y-5">
              <div className="flex items-center justify-between border-b pb-3 gi-divider">
                <div>
                  <h3 className="text-base font-bold gi-text-primary">Download Ledger PDF Statement</h3>
                  <p className="text-xs gi-text-secondary mt-0.5">Select time period & date range for {ledger?.name || "party ledger"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="p-1 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer"
                >
                  <IoClose className="text-base" />
                </button>
              </div>

              {/* Period Presets Grid */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold gi-text-primary">
                  Statement Period
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "this_month", label: "This Month" },
                    { id: "last_month", label: "Last Month" },
                    { id: "this_quarter", label: "This Quarter" },
                    { id: "financial_year", label: "Financial Year" },
                    { id: "all_time", label: "All Time" },
                    { id: "custom", label: "Custom Range" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPeriodPreset(p.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer text-center ${pdfPeriod === p.id
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                          : "border-slate-300 dark:border-zinc-700 gi-surface-interactive gi-text-primary"
                        }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendar Date Pickers (Mobiscroll Calendar like Reports section) */}
              {pdfPeriod !== "all_time" && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <MobiscrollDatePicker
                      label="Start Date"
                      value={pdfCustomStartDate}
                      onChange={(dateStr) => {
                        setPdfCustomStartDate(dateStr);
                        setPdfPeriod("custom");
                      }}
                    />
                  </div>
                  <div>
                    <MobiscrollDatePicker
                      label="End Date"
                      value={pdfCustomEndDate}
                      onChange={(dateStr) => {
                        setPdfCustomEndDate(dateStr);
                        setPdfPeriod("custom");
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t gi-divider">
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="px-4 py-2 rounded-xl border gi-surface-interactive gi-text-secondary text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDownloadingPdf}
                  onClick={handleDownloadPdf}
                  className="px-4 py-2 rounded-xl gi-btn-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <IoDownloadOutline className="text-base" />
                  <span>{isDownloadingPdf ? "Generating PDF..." : "Download PDF Statement"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
