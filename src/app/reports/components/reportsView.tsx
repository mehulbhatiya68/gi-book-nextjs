"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import PermissionGuard from "@/components/PermissionGuard";
import PageHeader from "@/components/PageHeader";
import MobiscrollDatePicker from "@/components/MobiscrollDatePicker";
import {
  IoClose,
  IoChevronDown,
  IoDownloadOutline,
  IoPrintOutline,
  IoSearchOutline,
  IoCalendarOutline,
  IoCheckmarkCircle,
  IoArrowBack,
} from "react-icons/io5";
import {
  MdOutlinePointOfSale,
  MdOutlineShoppingCart,
  MdOutlineReceiptLong,
  MdOutlinePayments,
  MdOutlineAccountBalanceWallet,
  MdOutlineTrendingUp,
  MdOutlineInventory2,
  MdOutlineSwapVert,
  MdOutlinePeopleAlt,
} from "react-icons/md";
import { partyApi } from "@/lib/api/party";
import { ledgerApi } from "@/lib/api/ledger";
import { itemApi } from "@/lib/api/item";
import { invoiceApi } from "@/lib/api/invoice";
import { paymentApi } from "@/lib/api/payment";
import { reportsApi } from "@/lib/api/reports";
import { useAuth } from "@/context/AuthContext";
import { usePreferences } from "@/lib/hooks/usePreferences";

// Helper to format Date object into YYYY-MM-DD
const formatDateString = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Helper to convert UI date range label into API start_date & end_date
const getDateFilterParams = (range: string, customStart: string, customEnd: string) => {
  if (!range || range === "All Time") return {};
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (range === "Today") {
    const s = formatDateString(todayStart);
    return { start_date: s, end_date: s };
  }
  if (range === "Yesterday") {
    const yest = new Date(todayStart);
    yest.setDate(yest.getDate() - 1);
    const s = formatDateString(yest);
    return { start_date: s, end_date: s };
  }
  if (range === "This Week") {
    const firstDay = new Date(todayStart);
    firstDay.setDate(firstDay.getDate() - firstDay.getDay());
    return { start_date: formatDateString(firstDay), end_date: formatDateString(now) };
  }
  if (range === "This Month") {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start_date: formatDateString(monthStart), end_date: formatDateString(now) };
  }
  if (range === "Last Month") {
    const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start_date: formatDateString(lmStart), end_date: formatDateString(lmEnd) };
  }
  if (range === "This Quarter") {
    const qMonth = Math.floor(now.getMonth() / 3) * 3;
    const qStart = new Date(now.getFullYear(), qMonth, 1);
    return { start_date: formatDateString(qStart), end_date: formatDateString(now) };
  }
  if (range === "This Year") {
    const yStart = new Date(now.getFullYear(), 0, 1);
    return { start_date: formatDateString(yStart), end_date: formatDateString(now) };
  }
  if (range === "Custom Range") {
    const params: { start_date?: string; end_date?: string } = {};
    if (customStart) params.start_date = customStart;
    if (customEnd) params.end_date = customEnd;
    return params;
  }
  return {};
};

// Safe helper to format invoice number (handles string, number, or object with prefix/suffix)
export const getFormattedInvoiceNumber = (inv) => {
  if (!inv) return "N/A";
  if (typeof inv === "string" || typeof inv === "number") return String(inv);

  let target =
    inv.invoice_number ||
    inv.invoiceNumber ||
    inv.invoice_no ||
    inv.bill_number ||
    inv.bill_no ||
    inv.voucher_number ||
    inv.voucher_no ||
    inv.reference_number ||
    inv.referenceNo ||
    inv.number ||
    inv.id;

  if (typeof target === "string" || typeof target === "number") {
    return String(target);
  }

  if (typeof target === "object" && target !== null) {
    const p = target.prefixEnabled && target.prefix ? target.prefix + " " : (target.prefix || "");
    const n = target.number !== undefined ? target.number : (target.invNumber || target.invoice_number || target.id || "");
    const s = target.suffixEnabled && target.suffix ? " " + target.suffix : (target.suffix || "");
    const full = `${p}${n}${s}`.trim();
    if (full) return full;
  }

  return "N/A";
};

// Safe helper to format party name with ID lookup fallback
export const getPartyName = (party: any, partiesList: any[] = []) => {
  if (!party) return "General Party";

  if (typeof party === "string") {
    const trimmed = party.trim();
    if (!trimmed) return "General Party";

    // If it's an ID or string key, lookup in partiesList
    if (partiesList && partiesList.length > 0) {
      const match = partiesList.find(
        (p: any) => String(p.id) === String(trimmed) || String(p.ledger_id) === String(trimmed) || String(p.uuid) === String(trimmed)
      );
      if (match) {
        const foundName = match.partyName || match.name || match.customerName || match.supplierName || match.party_name;
        if (foundName && typeof foundName === "string" && foundName.trim()) {
          return foundName.trim();
        }
      }
    }
    return trimmed;
  }

  if (typeof party === "object" && party !== null) {
    const directName =
      party.partyName ||
      party.name ||
      party.party_name ||
      party.customerName ||
      party.customer_name ||
      party.supplierName ||
      party.supplier_name ||
      party.ledger_name ||
      party.ledgerName ||
      party.billing_name ||
      party.party_ledger_name;

    if (directName && typeof directName === "string" && directName.trim()) {
      return directName.trim();
    }

    if (party.party && typeof party.party === "object") {
      const pName = party.party.partyName || party.party.name || party.party.party_name || party.party.customerName || party.party.supplierName;
      if (pName && typeof pName === "string" && pName.trim()) return pName.trim();
    }

    if (party.ledger && typeof party.ledger === "object") {
      const lName = party.ledger.name || party.ledger.party_name || party.ledger.ledger_name;
      if (lName && typeof lName === "string" && lName.trim()) return lName.trim();
    }

    if (party.customer && typeof party.customer === "object") {
      const cName = party.customer.name || party.customer.partyName || party.customer.customerName;
      if (cName && typeof cName === "string" && cName.trim()) return cName.trim();
    }

    if (party.supplier && typeof party.supplier === "object") {
      const sName = party.supplier.name || party.supplier.partyName || party.supplier.supplierName;
      if (sName && typeof sName === "string" && sName.trim()) return sName.trim();
    }

    const pId = party.id || party.party_id || party.partyId || party.ledger_id || party.ledgerId || party.party_ledger_id;
    if (pId && partiesList && partiesList.length > 0) {
      const match = partiesList.find(
        (p: any) => String(p.id) === String(pId) || String(p.ledger_id) === String(pId)
      );
      if (match) {
        const foundName = match.partyName || match.name || match.customerName || match.supplierName || match.party_name;
        if (foundName && typeof foundName === "string" && foundName.trim()) {
          return foundName.trim();
        }
      }
    }
  }

  return "General Party";
};

// Safe helper to format item name
export const getItemName = (item) => {
  if (!item) return "Item";
  if (typeof item === "string") return item;
  if (typeof item === "object" && item !== null) {
    return item.name || item.itemName || item.title || "Item";
  }
  return String(item);
};

// Safe helper to format any cell value into a string (prevents React rendering object crash)
export const formatCell = (val) => {
  if (val === null || val === undefined) return "";
  if (typeof val === "object") {
    if (val.prefix !== undefined || val.number !== undefined || val.prefixEnabled !== undefined) {
      return getFormattedInvoiceNumber({ invoiceNumber: val });
    }
    return getPartyName(val);
  }
  const str = String(val);
  if (str.includes("T") && (str.endsWith("Z") || str.includes("+") || str.includes("-"))) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return formatDDMMYYYY(str);
    }
  }
  return str;
};

import { isPurchaseInvoice } from "@/lib/utils/invoiceUtils";

// Safe helper to extract normalized invoice type ("purchase" or "sales")
export const getInvType = (inv: any) => {
  if (!inv) return "sales";
  return isPurchaseInvoice(inv) ? "purchase" : "sales";
};

// Helper to format any date into DD/MM/YYYY string (NO TIME!)
export const formatDDMMYYYY = (dateInput: any): string => {
  if (!dateInput) return "N/A";
  let s = String(dateInput).trim();
  if (s.includes("T")) {
    s = s.split("T")[0];
  } else if (s.includes(" ")) {
    const parts = s.split(" ");
    if (parts[0].includes("-") || parts[0].includes("/")) {
      s = parts[0];
    }
  }

  if (s.includes("/")) {
    const parts = s.split("/");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[2].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[0]}`;
      }
      return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[2]}`;
    }
  }

  if (s.includes("-")) {
    const parts = s.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[0]}`;
    }
  }

  let d = new Date(s);
  if (isNaN(d.getTime())) {
    return s;
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Helper to format date range duration string e.g. 01/09/2026 - 26/09/2026
export const getDurationDisplay = (dateFilters: any, invList: any[] = []): string => {
  if (dateFilters?.start_date && dateFilters?.end_date) {
    return `${formatDDMMYYYY(dateFilters.start_date)} - ${formatDDMMYYYY(dateFilters.end_date)}`;
  }
  if (dateFilters?.start_date) {
    return `From ${formatDDMMYYYY(dateFilters.start_date)}`;
  }
  if (invList && invList.length > 0) {
    const dates = invList
      .map((i) => i.invoice_date || i.invoiceDate || i.date || i.created_at)
      .filter(Boolean)
      .map((d) => new Date(d))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    if (dates.length > 0) {
      return `${formatDDMMYYYY(dates[0])} - ${formatDDMMYYYY(dates[dates.length - 1])}`;
    }
  }
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return `${formatDDMMYYYY(firstOfMonth)} - ${formatDDMMYYYY(now)}`;
};

// Helper to aggregate top products from invoices
export const computeTopProductsFromInvoices = (invList: any[]) => {
  const map: Record<string, { item_name: string; quantity_sold: number; revenue: number }> = {};
  invList.forEach((inv) => {
    const items = inv.items || inv.invoiceItems || inv.invoice_items || inv.line_items || [];
    if (Array.isArray(items) && items.length > 0) {
      items.forEach((item: any) => {
        const name = String(item.item_name || item.itemName || item.name || item.description || "Product").trim();
        const qty = Number(item.quantity || item.qty || item.quantity_sold || item.itemsCount || 1) || 0;
        const rev = Number(item.total || item.amount || item.revenue || item.subtotal || (Number(item.rate || item.price || 0) * qty)) || 0;
        if (!map[name]) {
          map[name] = { item_name: name, quantity_sold: 0, revenue: 0 };
        }
        map[name].quantity_sold += qty;
        map[name].revenue += rev;
      });
    } else {
      const tot = Number(inv.grand_total ?? inv.grandTotal ?? inv.total_amount ?? inv.totalAmount ?? inv.total ?? inv.amount ?? 0) || 0;
      const name = "General Sales";
      if (!map[name]) {
        map[name] = { item_name: name, quantity_sold: 0, revenue: 0 };
      }
      map[name].quantity_sold += 1;
      map[name].revenue += tot;
    }
  });
  return Object.values(map).sort((a, b) => b.revenue - a.revenue);
};

// Helper to aggregate sales by day from invoices
export const computeSalesByDayFromInvoices = (invList: any[]) => {
  const map: Record<string, { date: string; invoice_count: number; amount: number; rawDate: Date }> = {};
  invList.forEach((inv) => {
    const rawD = inv.invoice_date || inv.invoiceDate || inv.date || inv.created_at || "";
    let dateKey = rawD || "N/A";
    let displayDate = formatDDMMYYYY(rawD);
    let d = new Date(rawD);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      dateKey = `${year}-${month}-${day}`;
      displayDate = `${day}/${month}/${year}`;
    }
    const tot = Number(inv.grand_total ?? inv.grandTotal ?? inv.total_amount ?? inv.totalAmount ?? inv.total ?? inv.amount ?? 0) || 0;
    if (!map[dateKey]) {
      map[dateKey] = {
        date: displayDate,
        invoice_count: 0,
        amount: 0,
        rawDate: isNaN(d.getTime()) ? new Date(0) : d,
      };
    }
    map[dateKey].invoice_count += 1;
    map[dateKey].amount += tot;
  });
  return Object.values(map)
    .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime())
    .map((item) => ({ date: item.date, invoice_count: item.invoice_count, amount: item.amount }));
};

export default function ReportsView() {
  const router = useRouter();
  const {
    parties: contextParties = [],
    items: contextItems = [],
    invoices: contextInvoices = [],
    payments: contextPayments = [],
    activeBusiness = {},
  } = useAuth();

  const [selectedReport, setSelectedReport] = useState(null);
  const [dateRange, setDateRange] = useState("All Time");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedParty, setSelectedParty] = useState("");
  const [reportResult, setReportResult] = useState(null);
  const [tableSearch, setTableSearch] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);
  const [apiParties, setApiParties] = useState<any[]>([]);

  useEffect(() => {
    const fetchAllLedgersAndParties = async () => {
      try {
        const [ledgersRes, partiesRes] = await Promise.all([
          ledgerApi.getLedgers({ silentError: true }),
          partyApi.getParties(),
        ]);

        const extractArray = (res: any) => {
          if (!res) return [];
          if (Array.isArray(res)) return res;
          if (res.body) {
            if (Array.isArray(res.body)) return res.body;
            if (Array.isArray(res.body.ledgers)) return res.body.ledgers;
            if (Array.isArray(res.body.parties)) return res.body.parties;
            if (Array.isArray(res.body.data)) return res.body.data;
          }
          if (res.data) {
            if (Array.isArray(res.data)) return res.data;
            if (Array.isArray(res.data.ledgers)) return res.data.ledgers;
            if (Array.isArray(res.data.parties)) return res.data.parties;
          }
          if (Array.isArray(res.parties)) return res.parties;
          if (Array.isArray(res.ledgers)) return res.ledgers;
          return [];
        };

        const lList = extractArray(ledgersRes);
        const pList = extractArray(partiesRes);

        const combinedMap = new Map();
        [...pList, ...lList].forEach((item: any) => {
          if (item) {
            const id = String(item.id || item.ledger_id || item.uuid || "");
            if (id && !combinedMap.has(id)) {
              combinedMap.set(id, {
                ...item,
                id: id,
                name: getPartyName(item),
                partyName: getPartyName(item),
                partyType: item.partyType || item.type || "Ledger",
              });
            }
          }
        });

        const combinedList = Array.from(combinedMap.values());
        if (combinedList.length > 0) {
          setApiParties(combinedList);
          setSelectedParty((prev) => prev || String(combinedList[0].id));
        }
      } catch (err) {
        console.warn("Party/Ledger fetch failed:", err);
      }
    };

    fetchAllLedgersAndParties();
  }, []);

  // Sample fallback data if user context is currently empty
  const sampleInvoices = [
    {
      id: "INV-0001",
      invoiceNumber: "INV-0001",
      invoiceDate: new Date().toISOString().split("T")[0],
      date: new Date().toISOString().split("T")[0],
      type: "sales",
      partyName: "Apex Retail Pvt Ltd",
      grandTotal: 15400,
      paidAmount: 15400,
      status: "PAID",
      items: [{ name: "Industrial Widget A", quantity: 2 }],
    },
    {
      id: "INV-0002",
      invoiceNumber: "INV-0002",
      invoiceDate: new Date().toISOString().split("T")[0],
      date: new Date().toISOString().split("T")[0],
      type: "sales",
      partyName: "Global Tech Solutions",
      grandTotal: 28500,
      paidAmount: 10000,
      status: "PARTIALLY PAID",
      items: [{ name: "Commercial Sensor B", quantity: 5 }],
    },
    {
      id: "PUR-0001",
      invoiceNumber: "PUR-0001",
      invoiceDate: new Date().toISOString().split("T")[0],
      date: new Date().toISOString().split("T")[0],
      type: "purchase",
      partyName: "Shree Ram Supplies",
      grandTotal: 12000,
      paidAmount: 12000,
      status: "PAID",
      items: [{ name: "Raw Material Component C", quantity: 10 }],
    },
    {
      id: "PUR-0002",
      invoiceNumber: "PUR-0002",
      invoiceDate: new Date().toISOString().split("T")[0],
      date: new Date().toISOString().split("T")[0],
      type: "purchase",
      partyName: "National Logistics Hub",
      grandTotal: 8400,
      paidAmount: 0,
      status: "UNPAID",
      items: [{ name: "Packaging Box Type X", quantity: 50 }],
    },
  ];

  const sampleParties = [
    { id: "P1", partyName: "Apex Retail Pvt Ltd", partyType: "customer", mobile: "9876543210", openingBalance: 5000, balanceType: "to_collect" },
    { id: "P2", partyName: "Global Tech Solutions", partyType: "customer", mobile: "9812345678", openingBalance: 12000, balanceType: "to_collect" },
    { id: "P3", partyName: "Shree Ram Supplies", partyType: "supplier", mobile: "9711223344", openingBalance: 4000, balanceType: "to_pay" },
  ];

  const sampleItems = [
    { id: "I1", name: "Industrial Widget A", type: "Product", salesPrice: 7700, purchasePrice: 5000, stockQuantity: 25, stockValue: 125000, minStock: 5, stockHistory: [{ date: new Date().toISOString().split("T")[0], note: "Stock Inward", type: "add", quantity: 30, afterQuantity: 25 }] },
    { id: "I2", name: "Commercial Sensor B", type: "Product", salesPrice: 5700, purchasePrice: 4000, stockQuantity: 4, stockValue: 16000, minStock: 10, stockHistory: [{ date: new Date().toISOString().split("T")[0], note: "Stock Dispatched", type: "reduce", quantity: 5, afterQuantity: 4 }] },
  ];

  const samplePayments = [
    { id: "PAY-1", referenceNo: "PAY-001", date: new Date().toISOString().split("T")[0], partyName: "Apex Retail Pvt Ltd", type: "credit", paymentType: "credit", amount: 15400, paymentMode: "UPI / Bank Transfer" },
    { id: "PAY-2", referenceNo: "PAY-002", date: new Date().toISOString().split("T")[0], partyName: "Shree Ram Supplies", type: "debit", paymentType: "debit", amount: 12000, paymentMode: "Cash" },
  ];

  const invoices = contextInvoices.length > 0 ? contextInvoices : sampleInvoices;
  const parties = contextParties.length > 0 ? contextParties : (apiParties.length > 0 ? apiParties : sampleParties);
  const items = contextItems.length > 0 ? contextItems : sampleItems;
  const payments = contextPayments.length > 0 ? contextPayments : samplePayments;

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [openingServerView, setOpeningServerView] = useState(false);

  const reports = [
    {
      id: 1,
      slug: "sales-overview",
      title: "Sales Overview",
      description: "View total sales, growth trends and top performing products over time.",
      detail: "Get a complete overview of your sales performance, including total sales, revenue breakdown, and sales transactions.",
      icon: <MdOutlinePointOfSale className="text-2xl" />,
      color: { bg: "#F0FDF4", border: "#BBF7D0", text: "#16A34A", hover: "#15803D" },
    },
    {
      id: 2,
      slug: "purchase-expense",
      title: "Purchase / Expense Report",
      description: "Track business expenses and purchases to understand where your money goes.",
      detail: "Analyze purchases and business expenses to understand your spending patterns and major expense areas.",
      icon: <MdOutlineShoppingCart className="text-2xl" />,
      color: { bg: "#FFFBEB", border: "#FDE68A", text: "#D97706", hover: "#B45309" },
    },
    {
      id: 3,
      slug: "invoice-summary",
      title: "Invoice Summary",
      description: "Analyze paid, unpaid and overdue invoices in one place.",
      detail: "View a summary of invoices based on their payment status, including paid, unpaid and overdue invoices.",
      icon: <MdOutlineReceiptLong className="text-2xl" />,
      color: { bg: "#EFF6FF", border: "#BFDBFE", text: "#2563EB", hover: "#1D4ED8" },
    },
    {
      id: 4,
      slug: "payment-activity",
      title: "Payment Activity",
      description: "Monitor incoming and outgoing payments with date-wise insights.",
      detail: "Review all incoming and outgoing payment transactions with date-wise payment activity.",
      icon: <MdOutlinePayments className="text-2xl" />,
      color: { bg: "#F0FDFA", border: "#99F6E4", text: "#0D9488", hover: "#0F766E" },
    },
    {
      id: 5,
      slug: "ledger-statement",
      title: "Ledger Statement",
      description: "View detailed account-wise transactions summaries and balances.",
      detail: "Generate a detailed ledger statement for a selected party, including transactions, debits, credits and running balance.",
      icon: <MdOutlineAccountBalanceWallet className="text-2xl" />,
      color: { bg: "#FAF5FF", border: "#E9D5FF", text: "#7C3AED", hover: "#6D28D9" },
      partySelector: true,
    },
    {
      id: 6,
      slug: "profit-loss",
      title: "Profit & Loss",
      description: "Understand your net profit by comparing income against expenses.",
      detail: "Compare your business income and expenses to understand profitability during the selected period.",
      icon: <MdOutlineTrendingUp className="text-2xl" />,
      color: { bg: "#ECFDF5", border: "#A7F3D0", text: "#059669", hover: "#047857" },
    },
    {
      id: 7,
      slug: "inventory-status",
      title: "Inventory Status",
      description: "Check stock levels, fast-moving items and low stock alerts.",
      detail: "View your current inventory status, available stock, low stock items and total stock valuation.",
      icon: <MdOutlineInventory2 className="text-2xl" />,
      color: { bg: "#FFF7ED", border: "#FED7AA", text: "#EA580C", hover: "#C2410C" },
      noDateRange: true,
    },
    {
      id: 8,
      slug: "stock-movement",
      title: "Stock Movement",
      description: "Track how inventory moves in and out over a selected period.",
      detail: "Track stock coming into and going out of your business during the selected date range.",
      icon: <MdOutlineSwapVert className="text-2xl" />,
      color: { bg: "#ECFEFF", border: "#A5F3FC", text: "#0891B2", hover: "#0E7490" },
    },
    {
      id: 9,
      slug: "customer-insights",
      title: "Customer Insights",
      description: "See top customers, outstanding dues and payment history.",
      detail: "Analyze customer activity, outstanding amounts, payment history and your top customers.",
      icon: <MdOutlinePeopleAlt className="text-2xl" />,
      color: { bg: "#FFF1F2", border: "#FECDD3", text: "#E11D48", hover: "#BE123C" },
    },
  ];

  const dateOptions = [
    "All Time",
    "Today",
    "Yesterday",
    "This Week",
    "This Month",
    "Last Month",
    "This Quarter",
    "This Year",
    "Custom Range",
  ];

  // Helper to extract date from record
  const getRecordDate = (rec) => {
    if (!rec) return "";
    return rec.invoiceDate || rec.date || rec.createdAt || "";
  };

  // Helper to extract invoice grand total
  const getInvoiceTotal = (inv) => {
    if (!inv) return 0;
    const val =
      inv.grand_total ??
      inv.grandTotal ??
      inv.total_amount ??
      inv.totalAmount ??
      inv.total ??
      inv.amount ??
      inv.final_total ??
      0;
    return Number(val) || 0;
  };

  // Helper to extract invoice paid amount
  const getInvoicePaid = (inv) => {
    if (!inv) return 0;
    const tot = getInvoiceTotal(inv);
    const status = String(inv.payment_status || inv.status || "").toLowerCase();

    if (status === "paid") {
      return tot;
    }

    const paidVal =
      inv.paid_amount ??
      inv.paidAmount ??
      inv.received_amount ??
      inv.amount_paid ??
      inv.paid ??
      0;

    let paid = Number(paidVal) || 0;

    if (paid === 0 && status === "paid") {
      return tot;
    }

    const dueVal = inv.due_amount ?? inv.balance ?? inv.due;
    if (dueVal !== undefined && dueVal !== null && paid === 0 && tot > 0) {
      const due = Number(dueVal) || 0;
      if (due >= 0 && due <= tot) {
        paid = tot - due;
      }
    }

    return Math.min(tot, Math.max(0, paid));
  };

  // Helper to extract invoice due/balance amount
  const getInvoiceDue = (inv) => {
    if (!inv) return 0;
    const tot = getInvoiceTotal(inv);
    const paid = getInvoicePaid(inv);
    const dueVal = inv.due_amount ?? inv.balance ?? inv.due;
    if (dueVal !== undefined && dueVal !== null) {
      return Number(dueVal) || 0;
    }
    return Math.max(0, tot - paid);
  };

  // Helper to extract normalized status
  const getInvoiceStatus = (inv) => {
    if (!inv) return "UNPAID";
    const statusRaw = String(inv.payment_status || inv.status || "").toUpperCase();
    if (statusRaw === "PAID" || statusRaw === "UNPAID" || statusRaw === "PARTIALLY PAID" || statusRaw === "PARTIAL") {
      return statusRaw === "PARTIAL" ? "PARTIALLY PAID" : statusRaw;
    }
    const tot = getInvoiceTotal(inv);
    const pd = getInvoicePaid(inv);
    if (tot > 0 && pd >= tot) return "PAID";
    if (pd > 0 && pd < tot) return "PARTIALLY PAID";
    return "UNPAID";
  };

  // Helper to check if a date falls in range
  const isDateInRange = (dateStr) => {
    if (!dateRange || dateRange === "All Time") return true;
    if (!dateStr) return true;

    let d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      const parts = String(dateStr).split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        } else {
          d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        }
      }
    }
    if (isNaN(d.getTime())) return true;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateRange === "Today") {
      return d >= todayStart;
    }
    if (dateRange === "Yesterday") {
      const yestStart = new Date(todayStart);
      yestStart.setDate(yestStart.getDate() - 1);
      return d >= yestStart && d < todayStart;
    }
    if (dateRange === "This Week") {
      const firstDay = new Date(todayStart);
      firstDay.setDate(firstDay.getDate() - firstDay.getDay());
      return d >= firstDay;
    }
    if (dateRange === "This Month") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return d >= monthStart;
    }
    if (dateRange === "Last Month") {
      const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return d >= lmStart && d <= lmEnd;
    }
    if (dateRange === "This Quarter") {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      const qStart = new Date(now.getFullYear(), qMonth, 1);
      return d >= qStart;
    }
    if (dateRange === "This Year") {
      const yStart = new Date(now.getFullYear(), 0, 1);
      return d >= yStart;
    }
    if (dateRange === "Custom Range") {
      if (customStartDate && d < new Date(customStartDate)) return false;
      if (customEndDate && d > new Date(customEndDate + "T23:59:59")) return false;
      return true;
    }
    return true;
  };

  const openReport = (report: any) => {
    setSelectedReport(report);
    setDateRange("All Time");
    setCustomStartDate("");
    setCustomEndDate("");
    if (parties.length > 0) {
      setSelectedParty(String(parties[0].id || parties[0].ledger_id));
    }
    setReportResult(null);
    setTableSearch("");
  };

  const closeReport = () => {
    setSelectedReport(null);
    setReportResult(null);
    setTableSearch("");
  };

  // Build Report Data (Local fallback when API is completely offline/unreachable)
  const generateReportData = () => {
    if (!selectedReport) return null;
    const title = selectedReport.title;

    if (title === "Sales Overview") {
      const salesInvoices = invoices.filter((inv) => {
        return getInvType(inv) === "sales" && isDateInRange(getRecordDate(inv));
      });

      const totalSales = salesInvoices.reduce((sum, i) => sum + getInvoiceTotal(i), 0);
      const invoiceCount = salesInvoices.length;
      const averageInvoice = invoiceCount > 0 ? totalSales / invoiceCount : 0;
      const growthPercentage = 100;
      const durationStr = getDurationDisplay({}, salesInvoices);

      const topProducts = computeTopProductsFromInvoices(salesInvoices);
      const salesByDay = computeSalesByDayFromInvoices(salesInvoices);

      return {
        summary: {
          duration: durationStr,
          total_sales: totalSales,
          invoice_count: invoiceCount,
          average_invoice: averageInvoice,
          growth_percentage: growthPercentage,
        },
        kpis: [
          { label: "Total Sales Revenue", value: `₹ ${totalSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
          { label: "Invoice Count", value: invoiceCount },
          { label: "Avg Invoice", value: `₹ ${averageInvoice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
          { label: "Growth %", value: `${growthPercentage}%` },
        ],
        topProducts,
        salesByDay,
        columns: ["Date", "Invoice Count", "Amount (₹)"],
        rows: salesByDay.map((sd) => [
          sd.date,
          sd.invoice_count,
          `₹ ${sd.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        ]),
      };
    }

    if (title === "Purchase / Expense Report") {
      const purchaseInvoices = invoices.filter((inv) => {
        return getInvType(inv) === "purchase" && isDateInRange(getRecordDate(inv));
      });

      const totalPurchases = purchaseInvoices.reduce((sum, i) => sum + getInvoiceTotal(i), 0);
      const totalPaid = purchaseInvoices.reduce((sum, i) => sum + getInvoicePaid(i), 0);
      const totalDue = totalPurchases - totalPaid;

      const rows = purchaseInvoices.map((inv) => {
        const tot = getInvoiceTotal(inv);
        const pd = getInvoicePaid(inv);
        return {
          date: getRecordDate(inv) || "N/A",
          number: getFormattedInvoiceNumber(inv),
          party: getPartyName(inv.partyName || inv.supplierName || inv.party),
          itemsCount: (inv.items || []).length || 1,
          total: tot,
          paid: pd,
          status: inv.status || (pd >= tot ? "PAID" : pd > 0 ? "PARTIALLY PAID" : "UNPAID"),
        };
      });

      return {
        kpis: [
          { label: "Total Purchases", value: `₹ ${totalPurchases.toLocaleString("en-IN")}` },
          { label: "Amount Paid", value: `₹ ${totalPaid.toLocaleString("en-IN")}` },
          { label: "Pending Payables", value: `₹ ${totalDue.toLocaleString("en-IN")}` },
          { label: "Purchase Bills", value: purchaseInvoices.length },
        ],
        columns: ["Date", "Bill No", "Supplier Name", "Items", "Grand Total (₹)", "Paid Amount (₹)", "Status"],
        rows: rows.map((r) => [
          r.date,
          r.number,
          r.party,
          r.itemsCount,
          `₹ ${r.total.toLocaleString("en-IN")}`,
          `₹ ${r.paid.toLocaleString("en-IN")}`,
          r.status,
        ]),
        rawRows: rows,
      };
    }

    if (title === "Invoice Summary") {
      const filteredInvoices = invoices.filter((inv) => isDateInRange(getRecordDate(inv)));
      const totalAmount = filteredInvoices.reduce((sum, i) => sum + getInvoiceTotal(i), 0);

      const paidInvoices = filteredInvoices.filter((i) => getInvoiceStatus(i) === "PAID");
      const unpaidInvoices = filteredInvoices.filter((i) => getInvoiceStatus(i) === "UNPAID");
      const partialInvoices = filteredInvoices.filter((i) => getInvoiceStatus(i) === "PARTIALLY PAID");
      
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const overdueInvoices = filteredInvoices.filter((i) => {
        if (getInvoiceStatus(i) === "PAID") return false;
        const dStr = i.due_date || i.dueDate || getRecordDate(i);
        if (!dStr) return false;
        const d = new Date(dStr);
        return !isNaN(d.getTime()) && d < todayStart;
      });

      const paidAmount = paidInvoices.reduce((sum, i) => sum + getInvoiceTotal(i), 0);
      const unpaidAmount = unpaidInvoices.reduce((sum, i) => sum + getInvoiceDue(i), 0);
      const partialAmount = partialInvoices.reduce((sum, i) => sum + getInvoiceDue(i), 0);
      const overdueAmount = overdueInvoices.reduce((sum, i) => sum + getInvoiceDue(i), 0);

      const durationStr = getDurationDisplay({}, filteredInvoices);

      const rowsData = filteredInvoices.map((inv) => {
        const rawDate = getRecordDate(inv);
        const rawDueDate = inv.due_date || inv.dueDate || rawDate;
        const tot = getInvoiceTotal(inv);
        const pd = getInvoicePaid(inv);
        const due = getInvoiceDue(inv);
        const statusStr = getInvoiceStatus(inv).toLowerCase();

        return {
          date: formatDDMMYYYY(rawDate),
          invNo: getFormattedInvoiceNumber(inv),
          partyName: getPartyName(inv.party_name || inv.partyName || inv.party || inv.ledger_name || inv.customer_name || inv.supplier_name || inv, parties),
          invoiceVal: tot,
          paid: pd,
          balance: due,
          status: statusStr,
          dueDate: formatDDMMYYYY(rawDueDate),
        };
      });

      return {
        summary: {
          duration: durationStr,
          total_invoices: filteredInvoices.length,
          total_amount: totalAmount,
          paid_count: paidInvoices.length,
          paid_amount: paidAmount,
          unpaid_count: unpaidInvoices.length,
          unpaid_amount: unpaidAmount,
          partially_paid_count: partialInvoices.length,
          partially_paid_amount: partialAmount,
          overdue_count: overdueInvoices.length,
          overdue_amount: overdueAmount,
        },
        kpis: [
          { label: "Total Invoices", value: filteredInvoices.length },
          { label: "Total Invoiced Value", value: `₹ ${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
          { label: "Paid Invoices", value: `${paidInvoices.length} (₹ ${paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })})` },
          { label: "Unpaid", value: `${unpaidInvoices.length} (₹ ${unpaidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })})` },
        ],
        invoiceSummaryRows: rowsData,
        columns: ["Date", "Inv No.", "Party Name", "Invoice Val. (₹)", "Paid (₹)", "Balance (₹)", "Status", "Due Date"],
        rows: rowsData.map((r) => [
          r.date,
          r.invNo,
          r.partyName,
          `₹ ${r.invoiceVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
          `₹ ${r.paid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
          `₹ ${r.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
          r.status,
          r.dueDate,
        ]),
      };
    }

    if (title === "Payment Activity") {
      const isPaymentIn = (p) => {
        const t = String(p.type || p.paymentType || p.transactionType || "").toLowerCase();
        return t === "credit" || t === "in" || t === "payment in" || t === "payment_in" || t.includes("received") || t.includes("collect");
      };

      const filteredPayments = payments.filter((p) => isDateInRange(getRecordDate(p)));
      const totalReceived = filteredPayments
        .filter((p) => isPaymentIn(p))
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const totalPaidOut = filteredPayments
        .filter((p) => !isPaymentIn(p))
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      const rows = filteredPayments.map((p) => {
        const inPayment = isPaymentIn(p);
        const refNo = p.referenceNumber || p.referenceNo || p.number || p.paymentNumber || p.id || "PAY-1";
        const formattedRef = getFormattedInvoiceNumber({ invoiceNumber: refNo });
        const mode = p.mode || p.paymentMode || p.method || "Cash";

        return {
          date: getRecordDate(p) || "N/A",
          refNo: formattedRef,
          party: getPartyName(p.partyName || p.party),
          type: inPayment ? "Payment Received" : "Payment Out",
          mode: String(mode),
          amount: Number(p.amount) || 0,
        };
      });

      return {
        kpis: [
          { label: "Total Payment Records", value: filteredPayments.length },
          { label: "Total Received (In)", value: `₹ ${totalReceived.toLocaleString("en-IN")}` },
          { label: "Total Paid (Out)", value: `₹ ${totalPaidOut.toLocaleString("en-IN")}` },
          { label: "Net Cashflow", value: `₹ ${(totalReceived - totalPaidOut).toLocaleString("en-IN")}` },
        ],
        columns: ["Date", "Ref / Voucher No", "Party Name", "Transaction Type", "Payment Mode", "Amount (₹)"],
        rows: rows.map((r) => [
          r.date,
          r.refNo,
          r.party,
          r.type,
          r.mode,
          `₹ ${r.amount.toLocaleString("en-IN")}`,
        ]),
        rawRows: rows,
      };
    }

    if (title === "Ledger Statement") {
      const targetParty = parties.find((p) => String(p.id) === String(selectedParty)) || parties[0];
      const targetName = getPartyName(targetParty);
      const partyInvoices = invoices.filter(
        (i) => String(i.partyId) === String(targetParty?.id) || getPartyName(i.partyName) === targetName
      );
      const partyPayments = payments.filter(
        (p) => String(p.partyId) === String(targetParty?.id) || getPartyName(p.partyName) === targetName
      );

      let runningBal = Number(targetParty?.openingBalance) || 0;
      if (targetParty?.balanceType === "to_pay") runningBal = -runningBal;

      const combined = [
        ...partyInvoices.map((inv) => {
          const isPurch = getInvType(inv) === "purchase";
          const tot = getInvoiceTotal(inv);
          return {
            date: getRecordDate(inv) || "N/A",
            ref: getFormattedInvoiceNumber(inv),
            desc: isPurch ? "Purchase Invoice" : "Sales Invoice",
            debit: isPurch ? 0 : tot,
            credit: isPurch ? tot : 0,
          };
        }),
        ...partyPayments.map((pay) => {
          const isCredit = pay.type === "credit" || pay.paymentType === "credit";
          const amt = Number(pay.amount) || 0;
          return {
            date: getRecordDate(pay) || "N/A",
            ref: getFormattedInvoiceNumber({ invoiceNumber: pay.referenceNo || pay.id }),
            desc: isCredit ? "Payment Received" : "Payment Out",
            debit: isCredit ? 0 : amt,
            credit: isCredit ? amt : 0,
          };
        }),
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const rows = combined.map((entry) => {
        runningBal += entry.debit - entry.credit;
        return {
          ...entry,
          balance: runningBal,
        };
      });

      const totalDebit = combined.reduce((s, e) => s + e.debit, 0);
      const totalCredit = combined.reduce((s, e) => s + e.credit, 0);

      return {
        kpis: [
          { label: "Selected Party", value: targetName },
          { label: "Total Sales/Debits", value: `₹ ${totalDebit.toLocaleString("en-IN")}` },
          { label: "Total Recd/Credits", value: `₹ ${totalCredit.toLocaleString("en-IN")}` },
          { label: "Closing Balance", value: `₹ ${Math.abs(runningBal).toLocaleString("en-IN")} ${runningBal >= 0 ? "(Dr)" : "(Cr)"}` },
        ],
        columns: ["Date", "Voucher No", "Description", "Debit (₹)", "Credit (₹)", "Running Balance (₹)"],
        rows: rows.map((r) => [
          r.date,
          r.ref,
          r.desc,
          `₹ ${r.debit.toLocaleString("en-IN")}`,
          `₹ ${r.credit.toLocaleString("en-IN")}`,
          `₹ ${Math.abs(r.balance).toLocaleString("en-IN")} ${r.balance >= 0 ? "Dr" : "Cr"}`,
        ]),
        rawRows: rows,
      };
    }

    if (title === "Profit & Loss") {
      const salesInvoices = invoices.filter((inv) => {
        return getInvType(inv) === "sales" && isDateInRange(getRecordDate(inv));
      });
      const sales = salesInvoices.reduce((s, i) => s + getInvoiceTotal(i), 0);

      const purchaseInvoices = invoices.filter((inv) => {
        return getInvType(inv) === "purchase" && isDateInRange(getRecordDate(inv));
      });
      const purchases = purchaseInvoices.reduce((s, i) => s + getInvoiceTotal(i), 0);

      const grossProfit = sales - purchases;
      const profitMargin = sales > 0 ? ((grossProfit / sales) * 100).toFixed(1) : "0.0";

      const rows = [
        { category: "Sales Revenue (Income)", amount: sales, type: "Income" },
        { category: "Cost of Goods Purchased (Expenses)", amount: purchases, type: "Expense" },
        { category: "Net Operating Profit / Loss", amount: grossProfit, type: grossProfit >= 0 ? "Profit" : "Loss" },
      ];

      return {
        kpis: [
          { label: "Total Sales Revenue", value: `₹ ${sales.toLocaleString("en-IN")}` },
          { label: "Total Purchase Cost", value: `₹ ${purchases.toLocaleString("en-IN")}` },
          { label: "Net Profit / Loss", value: `₹ ${grossProfit.toLocaleString("en-IN")}` },
          { label: "Profit Margin", value: `${profitMargin}%` },
        ],
        columns: ["Category", "Type", "Amount (₹)"],
        rows: rows.map((r) => [r.category, r.type, `₹ ${r.amount.toLocaleString("en-IN")}`]),
        rawRows: rows,
      };
    }

    if (title === "Inventory Status") {
      const totalValuation = items.reduce((sum, item) => {
        const qty = Number(item.stockQuantity || item.stock || 0);
        const val = Number(item.stockValue || qty * (Number(item.purchasePrice || item.costPrice) || Number(item.salesPrice || item.salePrice) || 0));
        return sum + val;
      }, 0);

      const totalStockQty = items.reduce((sum, item) => sum + (Number(item.stockQuantity || item.stock) || 0), 0);
      const lowStockCount = items.filter((item) => (Number(item.stockQuantity || item.stock) || 0) <= (Number(item.minStock) || 5)).length;

      const rows = items.map((itm) => {
        const qty = Number(itm.stockQuantity || itm.stock) || 0;
        const val = Number(itm.stockValue || qty * (Number(itm.purchasePrice || itm.costPrice) || Number(itm.salesPrice || itm.salePrice) || 0));
        const name = getItemName(itm);
        return {
          name: name,
          type: String(itm.type || "Product"),
          salesPrice: Number(itm.salesPrice || itm.salePrice) || 0,
          purchasePrice: Number(itm.purchasePrice || itm.costPrice) || 0,
          stockQty: qty,
          totalValuation: val,
          status: qty <= 0 ? "Out of Stock" : qty <= (Number(itm.minStock) || 5) ? "Low Stock" : "In Stock",
        };
      });

      return {
        kpis: [
          { label: "Total Valuation", value: `₹ ${totalValuation.toLocaleString("en-IN")}` },
          { label: "Total Physical Qty", value: totalStockQty },
          { label: "Total Products", value: items.length },
          { label: "Low Stock Alerts", value: lowStockCount },
        ],
        columns: ["Item Name", "Type", "Sale Price (₹)", "Purchase Price (₹)", "In Stock Qty", "Stock Value (₹)", "Status"],
        rows: rows.map((r) => [
          r.name,
          r.type,
          `₹ ${r.salesPrice.toLocaleString("en-IN")}`,
          `₹ ${r.purchasePrice.toLocaleString("en-IN")}`,
          r.stockQty,
          `₹ ${r.totalValuation.toLocaleString("en-IN")}`,
          r.status,
        ]),
        rawRows: rows,
      };
    }

    if (title === "Stock Movement") {
      const logs = [];
      items.forEach((itm) => {
        const name = getItemName(itm);
        const currentQty = Number(itm.stockQuantity || itm.stock || 0);

        if (itm.stockHistory && Array.isArray(itm.stockHistory) && itm.stockHistory.length > 0) {
          itm.stockHistory.forEach((h) => {
            if (isDateInRange(h.date)) {
              const qty = Number(h.quantity || 1);
              const isAdd = h.type === "add" || h.type === "in" || (h.note || "").toLowerCase().includes("inward") || (h.note || "").toLowerCase().includes("purchase") || (h.note || "").toLowerCase().includes("added");

              let remaining = 0;
              if (h.stockAfter !== undefined && h.stockAfter !== null) {
                remaining = Number(h.stockAfter);
              } else if (h.afterQuantity !== undefined && h.afterQuantity !== null) {
                remaining = Number(h.afterQuantity);
              } else if (h.stockBefore !== undefined && h.stockBefore !== null) {
                remaining = isAdd ? Number(h.stockBefore) + qty : Number(h.stockBefore) - qty;
              } else {
                remaining = currentQty;
              }

              logs.push({
                date: h.date || "N/A",
                itemName: name,
                action: h.note || (isAdd ? "Stock Inward" : "Stock Outward"),
                changeQty: `${isAdd ? "+" : "-"}${qty}`,
                remainingStock: remaining,
              });
            }
          });
        } else {
          // Check invoices for movements if stock history array is empty
          const itemInvoices = invoices.filter((inv) => {
            const hasItem = (inv.items || []).some(
              (line) => String(line.id) === String(itm.id) || String(line.itemId) === String(itm.id) || line.name === name
            );
            return hasItem && isDateInRange(getRecordDate(inv));
          });

          if (itemInvoices.length > 0) {
            itemInvoices.forEach((inv) => {
              const line = (inv.items || []).find(
                (l) => String(l.id) === String(itm.id) || String(l.itemId) === String(itm.id) || l.name === name
              );
              const qty = Number(line?.quantity || 1);
              const isPurch = getInvType(inv) === "purchase";
              const date = getRecordDate(inv) || "N/A";
              const invNum = getFormattedInvoiceNumber(inv);

              logs.push({
                date,
                itemName: name,
                action: `${isPurch ? "Purchase" : "Sales"} Invoice #${invNum}`,
                changeQty: `${isPurch ? "+" : "-"}${qty}`,
                remainingStock: currentQty,
              });
            });
          } else {
            logs.push({
              date: new Date().toISOString().split("T")[0],
              itemName: name,
              action: "Current Balance",
              changeQty: `${currentQty}`,
              remainingStock: currentQty,
            });
          }
        }
      });

      return {
        kpis: [
          { label: "Movement Logs", value: logs.length },
          { label: "Total Monitored Items", value: items.length },
          { label: "Date Range", value: dateRange },
        ],
        columns: ["Date", "Item Name", "Movement Action", "Quantity Change", "Remaining Stock Qty"],
        rows: logs.map((r) => [r.date, r.itemName, r.action, r.changeQty, r.remainingStock]),
        rawRows: logs,
      };
    }

    if (title === "Customer Insights") {
      const customers = parties.filter((p) => (p.partyType || p.type || "").toLowerCase() === "customer" || !p.partyType);
      const targetPartiesList = customers.length > 0 ? customers : parties;

      const rows = targetPartiesList.map((c) => {
        const name = getPartyName(c);
        const cInvoices = invoices.filter((i) => String(i.partyId) === String(c.id) || getPartyName(i.partyName) === name);
        const totalPurchased = cInvoices.reduce((sum, i) => sum + getInvoiceTotal(i), 0);
        const totalPaid = cInvoices.reduce((sum, i) => sum + getInvoicePaid(i), 0);
        const due = totalPurchased - totalPaid;

        return {
          name: name,
          phone: c.mobile || c.phone || "N/A",
          ordersCount: cInvoices.length,
          totalSales: totalPurchased,
          totalPaid: totalPaid,
          balanceDue: due,
        };
      });

      const totalCustomerSales = rows.reduce((sum, r) => sum + r.totalSales, 0);
      const totalReceivables = rows.reduce((sum, r) => sum + r.balanceDue, 0);

      return {
        kpis: [
          { label: "Total Customers", value: targetPartiesList.length },
          { label: "Total Customer Sales", value: `₹ ${totalCustomerSales.toLocaleString("en-IN")}` },
          { label: "Total Dues To Collect", value: `₹ ${totalReceivables.toLocaleString("en-IN")}` },
        ],
        columns: ["Customer Name", "Phone", "Total Orders", "Total Sales (₹)", "Paid (₹)", "Balance Due (₹)"],
        rows: rows.map((r) => [
          r.name,
          r.phone,
          r.ordersCount,
          `₹ ${r.totalSales.toLocaleString("en-IN")}`,
          `₹ ${r.totalPaid.toLocaleString("en-IN")}`,
          `₹ ${r.balanceDue.toLocaleString("en-IN")}`,
        ]),
        rawRows: rows,
      };
    }

    return null;
  };

  const handleGenerateReport = async () => {
    if (!selectedReport) return;

    const currentPartyId = selectedParty || (parties[0]?.id ? String(parties[0].id) : "");
    if (selectedReport?.partySelector && !selectedParty && parties.length > 0) {
      setSelectedParty(currentPartyId);
    }

    setLoadingReport(true);
    const dateFilters = getDateFilterParams(dateRange, customStartDate, customEndDate);
    let apiResultData: any = null;

    try {
      const reportId = selectedReport.id;
      if (reportId === 1) {
        const [repRes, invRes]: any = await Promise.all([
          reportsApi.getSalesOverview(dateFilters).catch(() => null),
          invoiceApi.getInvoices({ ...dateFilters, type: 'sales', per_page: "all", silentError: true }).catch(() => null),
        ]);

        const b = repRes?.body || repRes?.data?.body || repRes?.data || repRes;
        const summary = b?.summary || {};
        let topProds = b?.top_products || [];
        let salesDay = b?.sales_by_day || [];

        const extractArray = (res: any) => {
          if (!res) return [];
          if (Array.isArray(res)) return res;
          if (res.body) {
            if (Array.isArray(res.body)) return res.body;
            if (Array.isArray(res.body.invoices)) return res.body.invoices;
            if (Array.isArray(res.body.data)) return res.body.data;
          }
          if (res.data) {
            if (Array.isArray(res.data)) return res.data;
            if (Array.isArray(res.data.invoices)) return res.data.invoices;
          }
          if (Array.isArray(res.invoices)) return res.invoices;
          return [];
        };

        const salesInvoices = extractArray(invRes).filter((i: any) => getInvType(i) === "sales");

        if (!topProds || topProds.length === 0) {
          topProds = computeTopProductsFromInvoices(salesInvoices);
        } else {
          topProds = topProds.map((tp: any) => ({
            item_name: tp.item_name || tp.name || "Product",
            quantity_sold: Number(tp.quantity_sold || tp.quantity || 0),
            revenue: Number(tp.revenue || tp.amount || 0),
          }));
        }

        if (!salesDay || salesDay.length === 0) {
          salesDay = computeSalesByDayFromInvoices(salesInvoices);
        } else {
          salesDay = salesDay.map((sd: any) => ({
            date: formatDDMMYYYY(sd.date || sd.formatted_date || sd.day),
            invoice_count: Number(sd.invoice_count || sd.count || 0),
            amount: Number(sd.amount || sd.total || 0),
          }));
        }

        const calcTotalSales = salesInvoices.reduce((s: number, i: any) => s + getInvoiceTotal(i), 0);
        const totalSalesVal = summary.total_sales ?? calcTotalSales;
        const invCountVal = summary.invoice_count ?? (salesInvoices.length || salesDay.reduce((s: number, d: any) => s + d.invoice_count, 0));
        const avgInvVal = summary.average_invoice ?? (invCountVal > 0 ? totalSalesVal / invCountVal : 0);
        const growthVal = summary.growth_percentage ?? 100;
        const durationVal = summary.duration || getDurationDisplay(dateFilters, salesInvoices);

        apiResultData = {
          summary: {
            duration: durationVal,
            total_sales: totalSalesVal,
            invoice_count: invCountVal,
            average_invoice: avgInvVal,
            growth_percentage: growthVal,
          },
          kpis: [
            { label: "Total Sales Revenue", value: `₹ ${Number(totalSalesVal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
            { label: "Invoice Count", value: invCountVal },
            { label: "Avg Invoice", value: `₹ ${Number(avgInvVal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
            { label: "Growth %", value: `${growthVal}%` },
          ],
          topProducts: topProds,
          salesByDay: salesDay,
          columns: ["Date", "Invoice Count", "Amount (₹)"],
          rows: salesDay.map((sd: any) => [
            sd.date || "N/A",
            sd.invoice_count || 0,
            `₹ ${Number(sd.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
          ]),
        };
      } else if (reportId === 2) {
        const [repRes, invRes]: any = await Promise.all([
          reportsApi.getPurchaseExpense(dateFilters).catch(() => null),
          invoiceApi.getInvoices({ ...dateFilters, type: 'purchase', per_page: "all", silentError: true }).catch(() => null),
        ]);

        const b = repRes?.body || repRes?.data?.body || repRes?.data || repRes;
        const summary = b?.summary || {};
        const partiesList = b?.by_party || [];
        const byDay = b?.by_day || [];

        const extractArray = (res: any) => {
          if (!res) return [];
          if (Array.isArray(res)) return res;
          if (res.body) {
            if (Array.isArray(res.body)) return res.body;
            if (Array.isArray(res.body.invoices)) return res.body.invoices;
            if (Array.isArray(res.body.data)) return res.body.data;
          }
          if (res.data) {
            if (Array.isArray(res.data)) return res.data;
            if (Array.isArray(res.data.invoices)) return res.data.invoices;
          }
          if (Array.isArray(res.invoices)) return res.invoices;
          return [];
        };
        const purchaseInvoices = extractArray(invRes).filter((i: any) => getInvType(i) === "purchase");

        let columns = ["Date", "Bill No", "Supplier Name", "Grand Total (₹)", "Paid Amount (₹)", "Status"];
        let rows = [];

        if (partiesList.length > 0) {
          columns = ["Party Name", "Type", "Amount (₹)"];
          rows = partiesList.map((p: any) => [getPartyName(p.name || p, parties), p.type || "Supplier", `₹ ${Number(p.amount || 0).toLocaleString("en-IN")}`]);
        } else if (byDay.length > 0) {
          columns = ["Date", "Purchases (₹)", "Expenses (₹)", "Total (₹)"];
          rows = byDay.map((d: any) => [d.date || "N/A", `₹ ${Number(d.purchases || 0).toLocaleString("en-IN")}`, `₹ ${Number(d.expenses || 0).toLocaleString("en-IN")}`, `₹ ${Number(d.total || 0).toLocaleString("en-IN")}`]);
        } else if (purchaseInvoices.length > 0) {
          columns = ["Date", "Bill No", "Supplier Name", "Grand Total (₹)", "Paid Amount (₹)", "Status"];
          rows = purchaseInvoices.map((inv: any) => {
            const tot = getInvoiceTotal(inv);
            const pd = getInvoicePaid(inv);
            return [
              inv.invoice_date || inv.invoiceDate || inv.date || "N/A",
              getFormattedInvoiceNumber(inv),
              getPartyName(inv.party_name || inv.partyName || inv.party || inv.supplier_name || inv, parties),
              `₹ ${tot.toLocaleString("en-IN")}`,
              `₹ ${pd.toLocaleString("en-IN")}`,
              String(inv.status || (pd >= tot ? "PAID" : pd > 0 ? "PARTIALLY PAID" : "UNPAID")).toUpperCase(),
            ];
          });
        }

        const calcPurchases = purchaseInvoices.reduce((s: number, i: any) => s + getInvoiceTotal(i), 0);
        const totalPurchasesVal = summary.total_purchases ?? calcPurchases;

        apiResultData = {
          kpis: [
            { label: "Total Purchases", value: `₹ ${Number(totalPurchasesVal || 0).toLocaleString("en-IN")}` },
            { label: "Total Expenses", value: `₹ ${Number(summary.total_expenses || 0).toLocaleString("en-IN")}` },
            { label: "Grand Total Out", value: `₹ ${Number(summary.total || totalPurchasesVal).toLocaleString("en-IN")}` },
          ],
          columns: columns,
          rows: rows,
        };
      } else if (reportId === 3) {
        const [repRes, invRes]: any = await Promise.all([
          reportsApi.getInvoiceSummary({ ...dateFilters, per_page: "all" }).catch(() => null),
          invoiceApi.getInvoices({ ...dateFilters, per_page: "all", silentError: true }).catch(() => null),
        ]);

        const b = repRes?.body || repRes?.data?.body || repRes?.data || repRes;
        const summary = b?.summary || {};

        const extractArray = (res: any) => {
          if (!res) return [];
          if (Array.isArray(res)) return res;
          if (res.body) {
            if (Array.isArray(res.body)) return res.body;
            if (Array.isArray(res.body.invoices)) return res.body.invoices;
            if (Array.isArray(res.body.data)) return res.body.data;
          }
          if (res.data) {
            if (Array.isArray(res.data)) return res.data;
            if (Array.isArray(res.data.invoices)) return res.data.invoices;
          }
          if (Array.isArray(res.invoices)) return res.invoices;
          return [];
        };

        const invoicesFromApi = extractArray(invRes);
        const overdueFromRep = b?.overdue_invoices || b?.invoices || [];
        const actualInvoices = invoicesFromApi.length > 0 ? invoicesFromApi : overdueFromRep;

        const totalInvoicesCount = actualInvoices.length > 0 ? actualInvoices.length : Number(summary.total_invoices || 0);
        const totalAmountVal = actualInvoices.length > 0
          ? actualInvoices.reduce((sum: number, i: any) => sum + getInvoiceTotal(i), 0)
          : Number(summary.total_amount || 0);

        const paidInvoices = actualInvoices.filter((i: any) => getInvoiceStatus(i) === "PAID");
        const unpaidInvoices = actualInvoices.filter((i: any) => getInvoiceStatus(i) === "UNPAID");
        const partialInvoices = actualInvoices.filter((i: any) => getInvoiceStatus(i) === "PARTIALLY PAID");
        
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const overdueInvoices = actualInvoices.filter((i: any) => {
          if (getInvoiceStatus(i) === "PAID") return false;
          const dStr = i.due_date || i.dueDate || i.invoice_date || i.date;
          if (!dStr) return false;
          const d = new Date(dStr);
          return !isNaN(d.getTime()) && d < todayStart;
        });

        const paidCountVal = summary.paid?.count ?? paidInvoices.length;
        const paidAmountVal = summary.paid?.amount ?? paidInvoices.reduce((s: number, i: any) => s + getInvoicePaid(i), 0);

        const unpaidCountVal = summary.unpaid?.count ?? unpaidInvoices.length;
        const unpaidAmountVal = summary.unpaid?.amount ?? unpaidInvoices.reduce((s: number, i: any) => s + getInvoiceDue(i), 0);

        const partialCountVal = summary.partially_paid?.count ?? partialInvoices.length;
        const partialAmountVal = summary.partially_paid?.amount ?? partialInvoices.reduce((s: number, i: any) => s + getInvoiceDue(i), 0);

        const overdueCountVal = summary.overdue?.count ?? overdueInvoices.length;
        const overdueAmountVal = summary.overdue?.amount ?? overdueInvoices.reduce((s: number, i: any) => s + getInvoiceDue(i), 0);

        const durationVal = summary.duration || getDurationDisplay(dateFilters, actualInvoices);

        const rowsData = actualInvoices.map((inv: any) => {
          const rawDate = inv.invoice_date || inv.invoiceDate || inv.date || inv.created_at;
          const rawDueDate = inv.due_date || inv.dueDate || rawDate;
          const tot = getInvoiceTotal(inv);
          const pd = getInvoicePaid(inv);
          const due = getInvoiceDue(inv);
          const statusStr = getInvoiceStatus(inv).toLowerCase();

          return {
            date: formatDDMMYYYY(rawDate),
            invNo: getFormattedInvoiceNumber(inv),
            partyName: getPartyName(inv.party_name || inv.partyName || inv.party || inv.ledger_name || inv.customer_name || inv.supplier_name || inv, parties),
            invoiceVal: tot,
            paid: pd,
            balance: due,
            status: statusStr,
            dueDate: formatDDMMYYYY(rawDueDate),
          };
        });

        apiResultData = {
          summary: {
            duration: durationVal,
            total_invoices: totalInvoicesCount,
            total_amount: totalAmountVal,
            paid_count: paidCountVal,
            paid_amount: paidAmountVal,
            unpaid_count: unpaidCountVal,
            unpaid_amount: unpaidAmountVal,
            partially_paid_count: partialCountVal,
            partially_paid_amount: partialAmountVal,
            overdue_count: overdueCountVal,
            overdue_amount: overdueAmountVal,
          },
          kpis: [
            { label: "Total Invoices", value: totalInvoicesCount },
            { label: "Total Invoiced Value", value: `₹ ${Number(totalAmountVal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
            { label: "Paid Invoices", value: `${paidCountVal} (₹ ${Number(paidAmountVal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })})` },
            { label: "Unpaid", value: `${unpaidCountVal} (₹ ${Number(unpaidAmountVal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })})` },
          ],
          invoiceSummaryRows: rowsData,
          columns: ["Date", "Inv No.", "Party Name", "Invoice Val. (₹)", "Paid (₹)", "Balance (₹)", "Status", "Due Date"],
          rows: rowsData.map((r: any) => [
            r.date,
            r.invNo,
            r.partyName,
            `₹ ${r.invoiceVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            `₹ ${r.paid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            `₹ ${r.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            r.status,
            r.dueDate,
          ]),
        };
      } else if (reportId === 4) {
        const res: any = await reportsApi.getPaymentActivity({ ...dateFilters, per_page: "all" });
        const b = res?.body || res?.data?.body || res?.data || res;
        if (b && typeof b === "object") {
          const summary = b.summary || {};
          const paymentsList = b.payments || b.data || [];
          apiResultData = {
            kpis: [
              { label: "Total In", value: `₹ ${Number(summary.total_in || 0).toLocaleString("en-IN")}` },
              { label: "Total Out", value: `₹ ${Number(summary.total_out || 0).toLocaleString("en-IN")}` },
              { label: "Net Cashflow", value: `₹ ${Number(summary.net || 0).toLocaleString("en-IN")}` },
            ],
            columns: ["Date", "Transaction No", "Type", "Party", "Account", "Amount (₹)", "Remark"],
            rows: paymentsList.map((p: any) => [
              p.transaction_date || p.date || "N/A",
              p.transaction_number || p.reference_number || "N/A",
              p.type === "payment_in" ? "Payment In" : "Payment Out",
              getPartyName(p.party_ledger_name || p.party_name || p.party || p.party_ledger_id, parties),
              p.payment_ledger_name || p.payment_mode || "Cash/Bank",
              `₹ ${Number(p.amount || 0).toLocaleString("en-IN")}`,
              p.remark || "-",
            ]),
          };
        }
      } else if (reportId === 5) {
        if (currentPartyId) {
          const res: any = await reportsApi.getLedgerStatement({ ledger_id: currentPartyId, ...dateFilters, per_page: "all" });
          const b = res?.body || res?.data?.body || res?.data || res;
          if (b && typeof b === "object") {
            const ledger = b.ledger || {};
            const entries = b.entries || b.data || [];
            const targetPartyObj = parties.find((p) => String(p.id) === String(currentPartyId) || String(p.ledger_id) === String(currentPartyId));
            apiResultData = {
              kpis: [
                { label: "Party / Ledger Name", value: ledger.name || (targetPartyObj ? getPartyName(targetPartyObj, parties) : "Ledger") },
                { label: "Opening Balance", value: `₹ ${Number(b.opening_balance ?? ledger.opening_balance ?? 0).toLocaleString("en-IN")}` },
                { label: "Total Debit / Credit", value: `Dr: ₹${Number(b.total_debit || 0).toLocaleString("en-IN")} / Cr: ₹${Number(b.total_credit || 0).toLocaleString("en-IN")}` },
                { label: "Closing Balance", value: `₹ ${Number(b.closing_balance ?? ledger.current_balance ?? 0).toLocaleString("en-IN")}` },
              ],
              columns: ["Date", "Voucher / Txn No", "Type", "Contra Account", "Debit (₹)", "Credit (₹)", "Balance (₹)"],
              rows: entries.map((e: any) => [
                e.transaction_date || e.date || "N/A",
                e.transaction_number || e.voucher_no || e.reference_number || "N/A",
                e.type || e.remark || "Txn",
                e.contra_ledger_name || e.contra || "-",
                `₹ ${Number(e.debit || 0).toLocaleString("en-IN")}`,
                `₹ ${Number(e.credit || 0).toLocaleString("en-IN")}`,
                `₹ ${Number(e.balance || 0).toLocaleString("en-IN")}`,
              ]),
            };
          }
        }
      } else if (reportId === 6) {
        const res: any = await reportsApi.getProfitLoss(dateFilters);
        const b = res?.body || res?.data?.body || res?.data || res;
        if (b && typeof b === "object") {
          const pl = b.profit_loss || b;
          apiResultData = {
            kpis: [
              { label: "Revenue", value: `₹ ${Number(pl.revenue || 0).toLocaleString("en-IN")}` },
              { label: "Cost of Goods Sold", value: `₹ ${Number(pl.cost_of_goods_sold || 0).toLocaleString("en-IN")}` },
              { label: "Gross Profit", value: `₹ ${Number(pl.gross_profit || 0).toLocaleString("en-IN")}` },
              { label: "Net Profit", value: `₹ ${Number(pl.net_profit || 0).toLocaleString("en-IN")}` },
            ],
            columns: ["Category", "Amount (₹)"],
            rows: [
              ["Sales Revenue (Income)", `₹ ${Number(pl.revenue || 0).toLocaleString("en-IN")}`],
              ["Cost of Goods Sold (COGS)", `₹ ${Number(pl.cost_of_goods_sold || 0).toLocaleString("en-IN")}`],
              ["Gross Operating Profit", `₹ ${Number(pl.gross_profit || 0).toLocaleString("en-IN")}`],
              ["Expenses", `₹ ${Number(pl.expenses || 0).toLocaleString("en-IN")}`],
              ["Net Operating Profit / Loss", `₹ ${Number(pl.net_profit || 0).toLocaleString("en-IN")}`],
            ],
          };
        }
      } else if (reportId === 7) {
        const res: any = await reportsApi.getInventoryStatus({ low_stock_threshold: 10, per_page: "all" });
        const b = res?.body || res?.data?.body || res?.data || res;
        if (b && typeof b === "object") {
          const summary = b.summary || {};
          const itemsList = b.items || b.data || [];
          apiResultData = {
            kpis: [
              { label: "Total Products", value: summary.total_products || 0 },
              { label: "In Stock", value: summary.in_stock || 0 },
              { label: "Low / Out Stock", value: `${summary.low_stock || 0} / ${summary.out_of_stock || 0}` },
              { label: "Stock Valuation", value: `₹ ${Number(summary.stock_value || 0).toLocaleString("en-IN")}` },
            ],
            columns: ["Item Code", "Item Name", "Unit", "Current Stock", "Sales Price (₹)", "Stock Value (₹)", "Status"],
            rows: itemsList.map((itm: any) => [
              itm.item_code || "N/A",
              itm.item_name || itm.name || "Item",
              itm.unit || "PCS",
              itm.current_stock ?? itm.stock_quantity ?? 0,
              `₹ ${Number(itm.sales_price || itm.sale_price || 0).toLocaleString("en-IN")}`,
              `₹ ${Number(itm.stock_value || 0).toLocaleString("en-IN")}`,
              String(itm.stock_status || "in_stock").replace("_", " ").toUpperCase(),
            ]),
          };
        }
      } else if (reportId === 8) {
        const res: any = await reportsApi.getStockMovement({ ...dateFilters, per_page: "all" });
        const b = res?.body || res?.data?.body || res?.data || res;
        if (b && typeof b === "object") {
          const summary = b.summary || {};
          const movements = b.movements || b.data || [];
          apiResultData = {
            kpis: [
              { label: "Total Inward", value: summary.total_in || 0 },
              { label: "Total Outward", value: summary.total_out || 0 },
              { label: "Net Movement", value: summary.net || 0 },
            ],
            columns: ["Date", "Item Name", "Movement Type", "Direction", "Qty", "Reference", "Reason"],
            rows: movements.map((m: any) => [
              m.date || "N/A",
              m.item_name || "Item",
              m.movement_type || "-",
              String(m.direction || "in").toUpperCase(),
              m.quantity || 0,
              m.reference || "-",
              m.reason || "-",
            ]),
          };
        }
      } else if (reportId === 9) {
        const res: any = await reportsApi.getCustomerInsights({ ...dateFilters, per_page: "all" });
        const b = res?.body || res?.data?.body || res?.data || res;
        if (b && typeof b === "object") {
          const summary = b.summary || {};
          const customersList = b.customers || b.data || [];
          apiResultData = {
            kpis: [
              { label: "Total Customers", value: summary.total_customers || 0 },
              { label: "With Dues", value: summary.customers_with_dues || 0 },
              { label: "Total Receivables", value: `₹ ${Number(summary.total_receivables || 0).toLocaleString("en-IN")}` },
              { label: "Total Collected", value: `₹ ${Number(summary.total_collected || 0).toLocaleString("en-IN")}` },
            ],
            columns: ["Customer Name", "Contact", "Total Sales (₹)", "Total Paid (₹)", "Outstanding (₹)", "Last Payment Date"],
            rows: customersList.map((c: any) => [
              getPartyName(c.name || c.party_name || c.partyName || c, parties),
              c.contact_number || c.phone || c.mobile || "N/A",
              `₹ ${Number(c.total_sales || 0).toLocaleString("en-IN")}`,
              `₹ ${Number(c.total_paid || 0).toLocaleString("en-IN")}`,
              `₹ ${Number(c.outstanding || c.current_balance || 0).toLocaleString("en-IN")}`,
              c.last_payment_date || "N/A",
            ]),
          };
        }
      }
    } catch (err) {
      // Ignore API errors, fallback to local compute
    }

    const data = apiResultData !== null ? apiResultData : generateReportData();
    setLoadingReport(false);

    if (!data) return;

    setReportResult({
      title: selectedReport.title,
      generatedAt: new Date().toLocaleString("en-IN"),
      dateRange: selectedReport?.noDateRange ? "All Time Snapshot" : dateRange,
      data: data,
    });
  };

  const getActiveReportSlug = () => {
    if (!selectedReport) return "sales-overview";
    return selectedReport.slug || "sales-overview";
  };

  const getActiveQueryParams = () => {
    const dateFilters = getDateFilterParams(dateRange, customStartDate, customEndDate);
    const query: Record<string, any> = { ...dateFilters };
    if (selectedReport?.partySelector && selectedParty) {
      query.ledger_id = selectedParty;
    }
    return query;
  };

  const handleDownloadPdf = async () => {
    const slug = getActiveReportSlug();
    const query = getActiveQueryParams();
    setDownloadingPdf(true);
    try {
      await reportsApi.downloadReportPdf(slug, query);
    } catch (err) {
      console.warn("API PDF download error, triggering fallback print view:", err);
      exportToPDFPrint();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadCsv = async () => {
    const slug = getActiveReportSlug();
    const query = getActiveQueryParams();
    setDownloadingCsv(true);
    try {
      await reportsApi.downloadReportCsv(slug, query);
    } catch (err) {
      console.warn("API CSV download error, executing CSV export:", err);
      exportToCSV();
    } finally {
      setDownloadingCsv(false);
    }
  };

  const handleOpenServerView = async () => {
    const slug = getActiveReportSlug();
    const query = getActiveQueryParams();
    setOpeningServerView(true);
    try {
      await reportsApi.openServerView(slug, query);
    } catch (err) {
      console.warn("API HTML View error:", err);
      alert("Unable to load server-side HTML view for this report.");
    } finally {
      setOpeningServerView(false);
    }
  };

  // Download Excel / CSV File
  const exportToCSV = () => {
    if (!reportResult || !reportResult.data) return;

    const { title, generatedAt, dateRange: range, data } = reportResult;
    const bizName = activeBusiness?.name || "GI BOOK";

    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += `"${bizName} - ${title}"\n`;
    csvContent += `"Date Range: ${range} | Generated At: ${generatedAt}"\n\n`;

    // KPI Summary
    csvContent += `"SUMMARY STATS"\n`;
    data.kpis.forEach((kpi) => {
      csvContent += `"${kpi.label}","${formatCell(kpi.value)}"\n`;
    });
    csvContent += `\n`;

    // Columns
    csvContent += data.columns.map((c) => `"${formatCell(c)}"`).join(",") + "\n";

    // Rows
    data.rows.forEach((row) => {
      csvContent += row.map((val) => `"${formatCell(val).replace(/"/g, '""')}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `${title.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Printable PDF
  const exportToPDFPrint = () => {
    if (!reportResult || !reportResult.data) return;

    const { title, generatedAt, dateRange: range, data } = reportResult;
    const bizName = activeBusiness?.name || "Business Name";
    const bizAddress =
      typeof activeBusiness?.address === "object" && activeBusiness?.address !== null
        ? [activeBusiness.address.address, activeBusiness.address.city, activeBusiness.address.state, activeBusiness.address.pinCode].filter(Boolean).join(", ")
        : (activeBusiness?.address || "");
    const bizPhone = activeBusiness?.phone || "";
    const bizEmail = activeBusiness?.email || "";
    const bizGst = activeBusiness?.gstNumber || "";

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Pop-up blocker prevented printing. Please allow pop-ups for this site.");
      return;
    }

    if ((title === "Sales Overview" || data.salesByDay) && data.salesByDay && data.topProducts) {
      const summary = data.summary || {};
      const durationStr = summary.duration || range || "01/09/2026 - 26/09/2026";
      const totalSalesStr = Number(summary.total_sales || 0).toFixed(2);
      const invoiceCountStr = String(summary.invoice_count || 0);
      const averageInvoiceStr = Number(summary.average_invoice || 0).toFixed(2);
      const growthPercentStr = String(summary.growth_percentage || 100);

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Sales Overview Report - ${bizName}</title>
            <style>
              @page { size: A4 portrait; margin: 15mm; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                color: #000000;
                background: #ffffff;
                margin: 0;
                padding: 24px;
                font-size: 13px;
                line-height: 1.4;
              }
              .header-container {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 8px;
              }
              .biz-name {
                font-size: 18px;
                font-weight: 700;
                color: #000000;
                margin: 0;
              }
              .biz-phone {
                font-size: 13px;
                color: #111827;
                margin-top: 4px;
              }
              .report-title {
                font-size: 18px;
                font-weight: 700;
                color: #000000;
                margin: 0;
                text-align: right;
                text-decoration: underline;
              }
              .header-divider {
                border-bottom: 1px solid #e5e7eb;
                margin-bottom: 24px;
              }
              .summary-section {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 24px;
              }
              .summary-table {
                border-collapse: collapse;
                width: 320px;
                border: 1px solid #d1d5db;
              }
              .summary-table td {
                padding: 6px 12px;
                font-size: 13px;
                border-bottom: 1px solid #e5e7eb;
              }
              .summary-table tr:last-child td {
                border-bottom: none;
              }
              .summary-label {
                color: #111827;
                font-weight: 400;
                text-align: left;
              }
              .summary-val {
                color: #000000;
                font-weight: 700;
                text-align: right;
              }
              .section-heading {
                font-size: 15px;
                font-weight: 700;
                color: #000000;
                margin-top: 24px;
                margin-bottom: 10px;
              }
              .report-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 24px;
              }
              .report-table th {
                background-color: #f3f4f6;
                color: #000000;
                font-weight: 700;
                padding: 8px 12px;
                border-top: 1px solid #e5e7eb;
                border-bottom: 1px solid #d1d5db;
                font-size: 13px;
              }
              .report-table td {
                padding: 8px 12px;
                border-bottom: 1px solid #e5e7eb;
                color: #111827;
                font-size: 13px;
              }
              .text-left { text-align: left; }
              .text-right { text-align: right; }
            </style>
          </head>
          <body>
            <div class="header-container">
              <div>
                <h1 class="biz-name">${bizName}</h1>
                <div class="biz-phone">${bizPhone ? "Phone no: " + bizPhone : ""}</div>
              </div>
              <div>
                <h1 class="report-title">Sales Overview Report</h1>
              </div>
            </div>
            <div class="header-divider"></div>

            <div class="summary-section">
              <table class="summary-table">
                <tbody>
                  <tr>
                    <td class="summary-label">Duration</td>
                    <td class="summary-val">${durationStr}</td>
                  </tr>
                  <tr>
                    <td class="summary-label">Total Sales</td>
                    <td class="summary-val">${totalSalesStr}</td>
                  </tr>
                  <tr>
                    <td class="summary-label">Invoice Count</td>
                    <td class="summary-val">${invoiceCountStr}</td>
                  </tr>
                  <tr>
                    <td class="summary-label">Average Invoice</td>
                    <td class="summary-val">${averageInvoiceStr}</td>
                  </tr>
                  <tr>
                    <td class="summary-label">Growth %</td>
                    <td class="summary-val">${growthPercentStr}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Top Products -->
            <h2 class="section-heading">Top Products</h2>
            <table class="report-table">
              <thead>
                <tr>
                  <th class="text-left">Item Name</th>
                  <th class="text-right">Quantity Sold</th>
                  <th class="text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${data.topProducts.map((p: any) => `
                  <tr>
                    <td class="text-left">${p.item_name}</td>
                    <td class="text-right">${Number(p.quantity_sold || 0).toFixed(2)}</td>
                    <td class="text-right">${Number(p.revenue || 0).toFixed(2)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <!-- Sales by Day -->
            <h2 class="section-heading">Sales by Day</h2>
            <table class="report-table">
              <thead>
                <tr>
                  <th class="text-left">Date</th>
                  <th class="text-right">Invoice Count</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${data.salesByDay.map((d: any) => `
                  <tr>
                    <td class="text-left">${d.date}</td>
                    <td class="text-right">${d.invoice_count}</td>
                    <td class="text-right">${Number(d.amount || 0).toFixed(2)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      return;
    }

    if ((title === "Invoice Summary" || data.invoiceSummaryRows) && data.invoiceSummaryRows) {
      const summary = data.summary || {};
      const durationStr = summary.duration || range || "01/09/2026 - 26/09/2026";
      const totalInvoices = summary.total_invoices || data.invoiceSummaryRows.length || 0;
      const totalAmountStr = Number(summary.total_amount || 0).toFixed(2);
      const paidStr = `${summary.paid_count || 0} / ${Number(summary.paid_amount || 0).toFixed(2)}`;
      const unpaidStr = `${summary.unpaid_count || 0} / ${Number(summary.unpaid_amount || 0).toFixed(2)}`;
      const partialStr = `${summary.partially_paid_count || 0} / ${Number(summary.partially_paid_amount || 0).toFixed(2)}`;
      const overdueStr = `${summary.overdue_count || 0} / ${Number(summary.overdue_amount || 0).toFixed(2)}`;

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice Summary Report - ${bizName}</title>
            <style>
              @page { size: A4 portrait; margin: 15mm; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                color: #000000;
                background: #ffffff;
                margin: 0;
                padding: 24px;
                font-size: 13px;
                line-height: 1.4;
              }
              .header-container {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 8px;
              }
              .biz-name {
                font-size: 18px;
                font-weight: 700;
                color: #000000;
                margin: 0;
              }
              .biz-phone {
                font-size: 13px;
                color: #111827;
                margin-top: 4px;
              }
              .report-title {
                font-size: 18px;
                font-weight: 700;
                color: #000000;
                margin: 0;
                text-align: right;
                text-decoration: underline;
              }
              .header-divider {
                border-bottom: 1px solid #e5e7eb;
                margin-bottom: 24px;
              }
              .summary-section {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 24px;
              }
              .summary-table {
                border-collapse: collapse;
                width: 320px;
                border: 1px solid #d1d5db;
              }
              .summary-table td {
                padding: 6px 12px;
                font-size: 13px;
                border-bottom: 1px solid #e5e7eb;
              }
              .summary-table tr:last-child td {
                border-bottom: none;
              }
              .summary-label {
                color: #111827;
                font-weight: 400;
                text-align: left;
              }
              .summary-val {
                color: #000000;
                font-weight: 700;
                text-align: right;
              }
              .report-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 24px;
              }
              .report-table th {
                background-color: #f3f4f6;
                color: #000000;
                font-weight: 700;
                padding: 8px 12px;
                border-top: 1px solid #e5e7eb;
                border-bottom: 1px solid #d1d5db;
                font-size: 13px;
              }
              .report-table td {
                padding: 8px 12px;
                border-bottom: 1px solid #e5e7eb;
                color: #111827;
                font-size: 13px;
              }
              .text-left { text-align: left; }
              .text-right { text-align: right; }
            </style>
          </head>
          <body>
            <div class="header-container">
              <div>
                <h1 class="biz-name">${bizName}</h1>
                <div class="biz-phone">${bizPhone ? "Phone no: " + bizPhone : ""}</div>
              </div>
              <div>
                <h1 class="report-title">Invoice Summary Report</h1>
              </div>
            </div>
            <div class="header-divider"></div>

            <div class="summary-section">
              <table class="summary-table">
                <tbody>
                  <tr>
                    <td class="summary-label">Duration</td>
                    <td class="summary-val">${durationStr}</td>
                  </tr>
                  <tr>
                    <td class="summary-label">Total Invoices</td>
                    <td class="summary-val">${totalInvoices}</td>
                  </tr>
                  <tr>
                    <td class="summary-label">Total Amount</td>
                    <td class="summary-val">${totalAmountStr}</td>
                  </tr>
                  <tr>
                    <td class="summary-label">Paid</td>
                    <td class="summary-val">${paidStr}</td>
                  </tr>
                  <tr>
                    <td class="summary-label">Unpaid</td>
                    <td class="summary-val">${unpaidStr}</td>
                  </tr>
                  <tr>
                    <td class="summary-label">Partially Paid</td>
                    <td class="summary-val">${partialStr}</td>
                  </tr>
                  <tr>
                    <td class="summary-label">Overdue</td>
                    <td class="summary-val">${overdueStr}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Invoices Table -->
            <table class="report-table">
              <thead>
                <tr>
                  <th class="text-left">Date</th>
                  <th class="text-left">Inv No.</th>
                  <th class="text-left">Party Name</th>
                  <th class="text-right">Invoice Val.</th>
                  <th class="text-right">Paid</th>
                  <th class="text-right">Balance</th>
                  <th class="text-left">Status</th>
                  <th class="text-left">Due Date</th>
                </tr>
              </thead>
              <tbody>
                ${data.invoiceSummaryRows.map((r: any) => `
                  <tr>
                    <td class="text-left">${r.date}</td>
                    <td class="text-left">${r.invNo}</td>
                    <td class="text-left">${r.partyName}</td>
                    <td class="text-right">${Number(r.invoiceVal || 0).toFixed(2)}</td>
                    <td class="text-right">${Number(r.paid || 0).toFixed(2)}</td>
                    <td class="text-right">${Number(r.balance || 0).toFixed(2)}</td>
                    <td class="text-left">${r.status}</td>
                    <td class="text-left">${r.dueDate}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${bizName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; background: #ffffff; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
            .biz-title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
            .biz-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
            .report-badge { background: #0f172a; color: #ffffff; padding: 6px 14px; border-radius: 8px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
            .meta { font-size: 12px; color: #475569; margin-bottom: 20px; }
            .kpi-grid { display: flex; gap: 15px; margin-bottom: 25px; }
            .kpi-box { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; }
            .kpi-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; }
            .kpi-val { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
            th { background: #f1f5f9; text-align: left; padding: 10px 12px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f172a; }
            td { padding: 9px 12px; border: 1px solid #e2e8f0; color: #334155; }
            tr:nth-child(even) { background: #f8fafc; }
            .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; pt-15px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="biz-title">${bizName}</h1>
              <p class="biz-sub">${bizAddress} ${bizPhone ? "• Ph: " + bizPhone : ""} ${bizEmail ? "• Email: " + bizEmail : ""} ${bizGst ? "• GSTIN: " + bizGst : ""}</p>
            </div>
            <div class="report-badge">${title}</div>
          </div>

          <div class="meta">
            <strong>Date Range:</strong> ${range} | <strong>Generated On:</strong> ${generatedAt}
          </div>

          <div class="kpi-grid">
            ${data.kpis.map((kpi) => `<div class="kpi-box"><div class="kpi-label">${formatCell(kpi.label)}</div><div class="kpi-val">${formatCell(kpi.value)}</div></div>`).join("")}
          </div>

          <table>
            <thead>
              <tr>
                ${data.columns.map((col) => `<th>${formatCell(col)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${data.rows.map((row) => `<tr>${row.map((cell) => `<td>${formatCell(cell)}</td>`).join("")}</tr>`).join("")}
            </tbody>
          </table>

          <div class="footer" style="margin-top: 50px; display: flex; justify-content: space-between;">
            <span>Official Report Statement</span>
            <span>Authorized Signature _____________________</span>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Filtered rows for rendered table search
  const filteredReportRows = useMemo(() => {
    if (!reportResult || !reportResult.data) return [];
    if (!tableSearch.trim()) return reportResult.data.rows;

    const term = tableSearch.toLowerCase();
    return reportResult.data.rows.filter((row) =>
      row.some((cell) => formatCell(cell).toLowerCase().includes(term))
    );
  }, [reportResult, tableSearch]);

  if (selectedReport) {
    return (
      <PermissionGuard module="Report">
        <div className="space-y-6 pb-12">
          {/* Header */}
          <PageHeader
            title={selectedReport.title}
            subtitle={selectedReport.description}
            onBack={closeReport}
          />

          {/* Report Content Body */}
          <div className="rounded-xl p-4 sm:p-6 space-y-6" style={{ background: "var(--gi-surface)", border: "1px solid var(--gi-border)" }}>
            {/* Report Detail Box */}
            <div className="rounded-lg p-3.5" style={{ background: "var(--gi-surface-secondary)", border: "1px solid var(--gi-border)" }}>
              <p className="text-[11px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--gi-text-muted)" }}>Statement Details</p>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "var(--gi-text-secondary)" }}>{selectedReport.detail}</p>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end relative z-30">
              {selectedReport.partySelector && (
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gi-text-secondary)" }}>Select Party / Ledger *</label>
                  <div className="relative">
                    <select value={selectedParty} onChange={(e) => setSelectedParty(e.target.value)} className="w-full h-9 appearance-none rounded-lg px-3 pr-10 outline-none cursor-pointer text-xs sm:text-sm font-medium gi-input">
                      {parties.map((party) => (
                        <option key={party.id} value={party.id}>{getPartyName(party)} ({party.partyType || "Customer/Supplier"})</option>
                      ))}
                    </select>
                    <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-base" style={{ color: "var(--gi-text-muted)" }} />
                  </div>
                </div>
              )}

              {!selectedReport.noDateRange && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gi-text-secondary)" }}>Date Period</label>
                  <div className="relative">
                    <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="w-full h-9 appearance-none rounded-lg px-3 pr-10 outline-none cursor-pointer text-xs sm:text-sm font-medium gi-input">
                      {dateOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-base" style={{ color: "var(--gi-text-muted)" }} />
                  </div>
                </div>
              )}

              {dateRange === "Custom Range" && !selectedReport.noDateRange && (
                <>
                  <div className="relative z-30">
                    <MobiscrollDatePicker
                      label="Start Date"
                      value={customStartDate}
                      onChange={(d) => setCustomStartDate(d)}
                    />
                  </div>
                  <div className="relative z-20">
                    <MobiscrollDatePicker
                      label="End Date"
                      value={customEndDate}
                      onChange={(d) => setCustomEndDate(d)}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Generate Button */}
            <button type="button" onClick={handleGenerateReport} disabled={loadingReport} className="w-full h-9 rounded-lg font-semibold text-xs sm:text-sm transition cursor-pointer shadow-sm flex items-center justify-center gap-2 gi-btn-primary disabled:opacity-60">
              <IoCalendarOutline className={`text-base ${loadingReport ? "animate-spin" : ""}`} />
              <span>{loadingReport ? "Generating Statement..." : "Generate Statement"}</span>
            </button>

            {/* ================= GENERATED REPORT RESULTS ================= */}
            {reportResult && reportResult.data && (
              <div className="pt-5 border-t space-y-4" style={{ borderColor: "var(--gi-border)" }}>

                {/* Success bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                  <div className="flex items-center gap-2.5" style={{ color: "#166534" }}>
                    <IoCheckmarkCircle className="text-xl shrink-0" style={{ color: "#16A34A" }} />
                    <div>
                      <p className="font-semibold text-xs sm:text-sm">{reportResult.title} Statement Ready</p>
                      <p className="text-[11px]" style={{ color: "#15803D" }}>Period: {reportResult.dateRange} • Generated: {reportResult.generatedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={handleOpenServerView}
                      disabled={openingServerView}
                      className="h-8 px-3 rounded-lg border gi-border bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-60"
                      title="View HTML Report"
                    >
                      <span>{openingServerView ? "Loading..." : "View"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadCsv}
                      disabled={downloadingCsv}
                      className="h-8 px-3 rounded-lg text-white text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
                      title="Download CSV Report (.csv)"
                    >
                      <IoDownloadOutline className="text-base" />
                      <span>{downloadingCsv ? "CSV..." : "CSV (.csv)"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      disabled={downloadingPdf}
                      className="h-8 px-3 rounded-lg text-white text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-sm bg-slate-800 hover:bg-slate-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 disabled:opacity-60"
                      title="Download API PDF Report"
                    >
                      <IoPrintOutline className="text-base" />
                      <span>{downloadingPdf ? "PDF..." : "PDF Report"}</span>
                    </button>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {reportResult.data.kpis.map((kpi, idx) => (
                    <div key={idx} className="p-3 rounded-lg text-center" style={{ background: "var(--gi-surface-secondary)", border: "1px solid var(--gi-border)" }}>
                      <p className="text-[10px] uppercase font-semibold truncate" style={{ color: "var(--gi-text-muted)" }}>{formatCell(kpi.label)}</p>
                      <p className="text-xs sm:text-sm font-bold mt-1 truncate" style={{ color: "var(--gi-text)" }}>{formatCell(kpi.value)}</p>
                    </div>
                  ))}
                </div>

                {/* Table or Dual Sections for Sales Overview */}
                {reportResult.data.topProducts && reportResult.data.salesByDay ? (
                  <div className="space-y-6 pt-2">
                    {/* Section 1: Top Products */}
                    <div className="space-y-2">
                      <h3 className="text-xs sm:text-sm font-bold gi-text-primary tracking-wide">Top Products</h3>
                      <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid var(--gi-border)" }}>
                        <table className="w-full text-left text-xs">
                          <thead style={{ background: "var(--gi-surface-secondary)" }}>
                            <tr>
                              <th className="px-3.5 py-2.5 text-[10px] uppercase tracking-wider font-semibold border-b" style={{ color: "var(--gi-text-secondary)", borderColor: "var(--gi-border)" }}>Item Name</th>
                              <th className="px-3.5 py-2.5 text-[10px] uppercase tracking-wider font-semibold border-b text-right" style={{ color: "var(--gi-text-secondary)", borderColor: "var(--gi-border)" }}>Quantity Sold</th>
                              <th className="px-3.5 py-2.5 text-[10px] uppercase tracking-wider font-semibold border-b text-right" style={{ color: "var(--gi-text-secondary)", borderColor: "var(--gi-border)" }}>Revenue</th>
                            </tr>
                          </thead>
                          <tbody style={{ background: "var(--gi-surface)" }}>
                            {reportResult.data.topProducts.length > 0 ? (
                              reportResult.data.topProducts.map((p: any, idx: number) => (
                                <tr key={idx} className="transition-colors" style={{ borderBottom: `1px solid var(--gi-divider)` }}>
                                  <td className="px-3.5 py-2.5 font-medium" style={{ color: "var(--gi-text)" }}>{p.item_name}</td>
                                  <td className="px-3.5 py-2.5 font-medium text-right" style={{ color: "var(--gi-text)" }}>{Number(p.quantity_sold || 0).toFixed(2)}</td>
                                  <td className="px-3.5 py-2.5 font-semibold text-right" style={{ color: "var(--gi-text)" }}>₹ {Number(p.revenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3} className="px-4 py-6 text-center" style={{ color: "var(--gi-text-muted)" }}>No product sales records found.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Section 2: Sales by Day */}
                    <div className="space-y-2">
                      <h3 className="text-xs sm:text-sm font-bold gi-text-primary tracking-wide">Sales by Day</h3>
                      <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid var(--gi-border)" }}>
                        <table className="w-full text-left text-xs">
                          <thead style={{ background: "var(--gi-surface-secondary)" }}>
                            <tr>
                              <th className="px-3.5 py-2.5 text-[10px] uppercase tracking-wider font-semibold border-b" style={{ color: "var(--gi-text-secondary)", borderColor: "var(--gi-border)" }}>Date</th>
                              <th className="px-3.5 py-2.5 text-[10px] uppercase tracking-wider font-semibold border-b text-right" style={{ color: "var(--gi-text-secondary)", borderColor: "var(--gi-border)" }}>Invoice Count</th>
                              <th className="px-3.5 py-2.5 text-[10px] uppercase tracking-wider font-semibold border-b text-right" style={{ color: "var(--gi-text-secondary)", borderColor: "var(--gi-border)" }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody style={{ background: "var(--gi-surface)" }}>
                            {reportResult.data.salesByDay.length > 0 ? (
                              reportResult.data.salesByDay.map((d: any, idx: number) => (
                                <tr key={idx} className="transition-colors" style={{ borderBottom: `1px solid var(--gi-divider)` }}>
                                  <td className="px-3.5 py-2.5 font-medium" style={{ color: "var(--gi-text)" }}>{d.date}</td>
                                  <td className="px-3.5 py-2.5 font-medium text-right" style={{ color: "var(--gi-text)" }}>{d.invoice_count}</td>
                                  <td className="px-3.5 py-2.5 font-semibold text-right" style={{ color: "var(--gi-text)" }}>₹ {Number(d.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3} className="px-4 py-6 text-center" style={{ color: "var(--gi-text-muted)" }}>No daily sales records found.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Table Search */}
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <div className="relative flex-1 max-w-xs">
                        <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--gi-text-muted)" }} />
                        <input type="text" placeholder="Search statement entries..." value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} className="w-full h-8 pl-8 pr-3 rounded-lg text-xs gi-input focus:outline-none" />
                      </div>
                      <span className="text-xs font-medium shrink-0" style={{ color: "var(--gi-text-muted)" }}>{filteredReportRows.length} entries</span>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid var(--gi-border)" }}>
                      <table className="w-full text-left text-xs">
                        <thead style={{ background: "var(--gi-surface-secondary)" }}>
                          <tr>
                            {reportResult.data.columns.map((col, idx) => (
                              <th key={idx} className="px-3.5 py-2.5 text-[10px] uppercase tracking-wider font-semibold border-b" style={{ color: "var(--gi-text-secondary)", borderColor: "var(--gi-border)" }}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody style={{ background: "var(--gi-surface)" }}>
                          {filteredReportRows.length > 0 ? (
                            filteredReportRows.map((row, rIdx) => (
                              <tr key={rIdx} className="transition-colors" style={{ borderBottom: `1px solid var(--gi-divider)` }}>
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className="px-3.5 py-2.5 font-medium" style={{ color: "var(--gi-text)" }}>{formatCell(cell)}</td>
                                ))}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={reportResult.data.columns.length} className="px-4 py-8 text-center" style={{ color: "var(--gi-text-muted)" }}>No records match the active search query.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard module="Report">
      <div className="space-y-6 pb-12">
        {/* Page Heading */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b gi-divider">
          <div>
            <h1 className="text-2xl font-bold gi-text-primary tracking-tight">
              Reports &amp; Analytics
            </h1>
          </div>
        </div>

        {/* Reports Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reports.map((report) => (
            <button key={report.id} type="button" onClick={() => openReport(report)} className="text-left w-full rounded-xl p-3 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[90px] sm:min-h-[110px] group" style={{ background: "var(--gi-surface)", border: "1px solid var(--gi-border)" }}>
              <div className="flex items-start gap-2.5 sm:gap-3 w-full">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors text-base sm:text-xl" style={{ background: report.color.bg, border: `1px solid ${report.color.border}`, color: report.color.text }}>
                  {report.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-xs sm:text-sm line-clamp-1" style={{ color: "var(--gi-text)" }}>{report.title}</p>
                  <p className="text-[10px] sm:text-xs mt-0.5 line-clamp-1 sm:line-clamp-2 leading-tight" style={{ color: "var(--gi-text-secondary)" }}>{report.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 mt-2 border-t text-[10px] sm:text-xs font-medium transition-colors" style={{ borderColor: "var(--gi-divider)", color: report.color.text }}>
                <span className="line-clamp-1">Generate</span>
                <IoChevronDown className="-rotate-90 text-xs shrink-0" />
              </div>
            </button>
          ))}
        </section>
      </div>
    </PermissionGuard>
  );
}