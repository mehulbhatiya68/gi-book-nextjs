"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import PermissionGuard from "./PermissionGuard";
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
import { useApp } from "@/context/AppContext";

// Safe helper to format invoice number (handles string, number, or object with prefix/suffix)
export const getFormattedInvoiceNumber = (inv) => {
  if (!inv) return "N/A";
  if (typeof inv === "string" || typeof inv === "number") return String(inv);

  let target = inv.invoiceNumber !== undefined ? inv.invoiceNumber : (inv.number !== undefined ? inv.number : inv.id);

  if (typeof target === "string" || typeof target === "number") {
    return String(target);
  }

  if (typeof target === "object" && target !== null) {
    const p = target.prefixEnabled && target.prefix ? target.prefix + " " : "";
    const n = target.number !== undefined ? target.number : (target.invNumber || target.id || "");
    const s = target.suffixEnabled && target.suffix ? " " + target.suffix : "";
    const full = `${p}${n}${s}`.trim();
    if (full) return full;
  }

  return String(inv.id || "INV-0001");
};

// Safe helper to format party name
export const getPartyName = (party) => {
  if (!party) return "General Party";
  if (typeof party === "string") return party;
  if (typeof party === "object" && party !== null) {
    return party.partyName || party.name || party.customerName || party.supplierName || "General Party";
  }
  return String(party);
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
  return String(val);
};

// Safe helper to extract normalized invoice type ("purchase" or "sales")
export const getInvType = (inv) => {
  if (!inv) return "sales";
  const rawType = String(inv.invoiceType || inv.type || "").toLowerCase();
  if (rawType.includes("purchase") || rawType.includes("pur")) {
    return "purchase";
  }
  return "sales";
};

export default function ReportsView() {
  const router = useRouter();
  const {
    parties: contextParties = [],
    items: contextItems = [],
    invoices: contextInvoices = [],
    payments: contextPayments = [],
    activeBusiness = {},
  } = useApp();

  const [selectedReport, setSelectedReport] = useState(null);
  const [dateRange, setDateRange] = useState("All Time");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedParty, setSelectedParty] = useState("");
  const [reportResult, setReportResult] = useState(null);
  const [tableSearch, setTableSearch] = useState("");

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
  const parties = contextParties.length > 0 ? contextParties : sampleParties;
  const items = contextItems.length > 0 ? contextItems : sampleItems;
  const payments = contextPayments.length > 0 ? contextPayments : samplePayments;

  const reports = [
    {
      id: 1,
      title: "Sales Overview",
      description: "View total sales, growth trends and top performing products over time.",
      detail: "Get a complete overview of your sales performance, including total sales, revenue breakdown, and sales transactions.",
      icon: <MdOutlinePointOfSale className="text-2xl" />,
      color: { bg: "#F0FDF4", border: "#BBF7D0", text: "#16A34A", hover: "#15803D" },
    },
    {
      id: 2,
      title: "Purchase / Expense Report",
      description: "Track business expenses and purchases to understand where your money goes.",
      detail: "Analyze purchases and business expenses to understand your spending patterns and major expense areas.",
      icon: <MdOutlineShoppingCart className="text-2xl" />,
      color: { bg: "#FFFBEB", border: "#FDE68A", text: "#D97706", hover: "#B45309" },
    },
    {
      id: 3,
      title: "Invoice Summary",
      description: "Analyze paid, unpaid and overdue invoices in one place.",
      detail: "View a summary of invoices based on their payment status, including paid, unpaid and overdue invoices.",
      icon: <MdOutlineReceiptLong className="text-2xl" />,
      color: { bg: "#EFF6FF", border: "#BFDBFE", text: "#2563EB", hover: "#1D4ED8" },
    },
    {
      id: 4,
      title: "Payment Activity",
      description: "Monitor incoming and outgoing payments with date-wise insights.",
      detail: "Review all incoming and outgoing payment transactions with date-wise payment activity.",
      icon: <MdOutlinePayments className="text-2xl" />,
      color: { bg: "#F0FDFA", border: "#99F6E4", text: "#0D9488", hover: "#0F766E" },
    },
    {
      id: 5,
      title: "Ledger Statement",
      description: "View detailed account-wise transactions summaries and balances.",
      detail: "Generate a detailed ledger statement for a selected party, including transactions, debits, credits and running balance.",
      icon: <MdOutlineAccountBalanceWallet className="text-2xl" />,
      color: { bg: "#FAF5FF", border: "#E9D5FF", text: "#7C3AED", hover: "#6D28D9" },
      partySelector: true,
    },
    {
      id: 6,
      title: "Profit & Loss",
      description: "Understand your net profit by comparing income against expenses.",
      detail: "Compare your business income and expenses to understand profitability during the selected period.",
      icon: <MdOutlineTrendingUp className="text-2xl" />,
      color: { bg: "#ECFDF5", border: "#A7F3D0", text: "#059669", hover: "#047857" },
    },
    {
      id: 7,
      title: "Inventory Status",
      description: "Check stock levels, fast-moving items and low stock alerts.",
      detail: "View your current inventory status, available stock, low stock items and total stock valuation.",
      icon: <MdOutlineInventory2 className="text-2xl" />,
      color: { bg: "#FFF7ED", border: "#FED7AA", text: "#EA580C", hover: "#C2410C" },
      noDateRange: true,
    },
    {
      id: 8,
      title: "Stock Movement",
      description: "Track how inventory moves in and out over a selected period.",
      detail: "Track stock coming into and going out of your business during the selected date range.",
      icon: <MdOutlineSwapVert className="text-2xl" />,
      color: { bg: "#ECFEFF", border: "#A5F3FC", text: "#0891B2", hover: "#0E7490" },
    },
    {
      id: 9,
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
    return Number(inv.grandTotal || inv.totalAmount || inv.total || inv.amount || 0);
  };

  // Helper to extract invoice paid amount
  const getInvoicePaid = (inv) => {
    if (!inv) return 0;
    if (inv.status === "PAID") return getInvoiceTotal(inv);
    return Number(inv.paidAmount || 0);
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
          d = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          d = new Date(parts[2], parts[1] - 1, parts[0]);
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

  const openReport = (report) => {
    setSelectedReport(report);
    setDateRange("All Time");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedParty(parties[0]?.id ? String(parties[0].id) : "");
    setReportResult(null);
    setTableSearch("");
  };

  const closeReport = () => {
    setSelectedReport(null);
    setReportResult(null);
    setTableSearch("");
  };

  // Build Report Data
  const generateReportData = () => {
    if (!selectedReport) return null;
    const title = selectedReport.title;

    if (title === "Sales Overview") {
      const salesInvoices = invoices.filter((inv) => {
        return getInvType(inv) === "sales" && isDateInRange(getRecordDate(inv));
      });

      const totalSales = salesInvoices.reduce((sum, i) => sum + getInvoiceTotal(i), 0);
      const totalPaid = salesInvoices.reduce((sum, i) => sum + getInvoicePaid(i), 0);
      const totalDue = totalSales - totalPaid;

      const rows = salesInvoices.map((inv) => {
        const tot = getInvoiceTotal(inv);
        const pd = getInvoicePaid(inv);
        return {
          date: getRecordDate(inv) || "N/A",
          number: getFormattedInvoiceNumber(inv),
          party: getPartyName(inv.partyName || inv.customerName || inv.party),
          itemsCount: (inv.items || []).length || 1,
          total: tot,
          paid: pd,
          status: inv.status || (pd >= tot ? "PAID" : pd > 0 ? "PARTIALLY PAID" : "UNPAID"),
        };
      });

      return {
        kpis: [
          { label: "Total Sales Revenue", value: `₹ ${totalSales.toLocaleString("en-IN")}` },
          { label: "Amount Received", value: `₹ ${totalPaid.toLocaleString("en-IN")}` },
          { label: "Outstanding Dues", value: `₹ ${totalDue.toLocaleString("en-IN")}` },
          { label: "Total Sales Invoices", value: salesInvoices.length },
        ],
        columns: ["Date", "Invoice No", "Customer Name", "Items", "Total Sales (₹)", "Received (₹)", "Status"],
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
      const paidInvoices = filteredInvoices.filter((i) => i.status === "PAID" || getInvoicePaid(i) >= getInvoiceTotal(i));
      const unpaidInvoices = filteredInvoices.filter((i) => i.status !== "PAID" && getInvoicePaid(i) < getInvoiceTotal(i));

      const rows = filteredInvoices.map((inv) => {
        const tot = getInvoiceTotal(inv);
        const pd = getInvoicePaid(inv);
        return {
          date: getRecordDate(inv) || "N/A",
          number: getFormattedInvoiceNumber(inv),
          type: getInvType(inv) === "purchase" ? "Purchase" : "Sales",
          party: getPartyName(inv.partyName || inv.party),
          total: tot,
          paid: pd,
          due: tot - pd,
          status: inv.status || (pd >= tot ? "PAID" : pd > 0 ? "PARTIALLY PAID" : "UNPAID"),
        };
      });

      return {
        kpis: [
          { label: "Total Invoices", value: filteredInvoices.length },
          { label: "Total Invoiced Value", value: `₹ ${totalAmount.toLocaleString("en-IN")}` },
          { label: "Paid Invoices", value: paidInvoices.length },
          { label: "Unpaid / Partial", value: unpaidInvoices.length },
        ],
        columns: ["Date", "Invoice / Bill No", "Type", "Party Name", "Total Amount (₹)", "Paid (₹)", "Balance (₹)", "Status"],
        rows: rows.map((r) => [
          r.date,
          r.number,
          r.type,
          r.party,
          `₹ ${r.total.toLocaleString("en-IN")}`,
          `₹ ${r.paid.toLocaleString("en-IN")}`,
          `₹ ${r.due.toLocaleString("en-IN")}`,
          r.status,
        ]),
        rawRows: rows,
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
      ].sort((a, b) => new Date(a.date) - new Date(b.date));

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
      const customers = parties.filter((p) => (p.partyType || "").toLowerCase() === "customer" || !p.partyType);
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

  const handleGenerateReport = () => {
    if (!selectedReport) return;

    if (selectedReport?.partySelector && !selectedParty && parties.length > 0) {
      setSelectedParty(String(parties[0].id));
    }

    const data = generateReportData();
    if (!data) return;

    setReportResult({
      title: selectedReport.title,
      generatedAt: new Date().toLocaleString("en-IN"),
      dateRange: selectedReport?.noDateRange ? "All Time Snapshot" : dateRange,
      data: data,
    });
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
    const bizName = activeBusiness?.name || "GI BOOK";
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
            <span>Generated via GI BOOK Smart Accounting</span>
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
          <div className="flex items-center justify-between gap-3 border-b pb-4 gi-divider">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={closeReport}
                className="p-2 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer shrink-0"
                title="Back to Reports"
              >
                <IoArrowBack className="text-lg" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
                  {selectedReport.title}
                </h1>
                <p className="text-xs sm:text-sm gi-text-secondary mt-0.5">
                  {selectedReport.description}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeReport}
              className="h-9 px-4 rounded-lg font-semibold text-xs sm:text-sm transition cursor-pointer gi-btn-secondary w-fit"
            >
              Back to Reports List
            </button>
          </div>

          {/* Report Content Body */}
          <div className="rounded-xl p-4 sm:p-6 space-y-6" style={{ background: "var(--gi-surface)", border: "1px solid var(--gi-border)" }}>
            {/* Report Detail Box */}
            <div className="rounded-lg p-3.5" style={{ background: "var(--gi-surface-secondary)", border: "1px solid var(--gi-border)" }}>
              <p className="text-[11px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--gi-text-muted)" }}>Statement Details</p>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "var(--gi-text-secondary)" }}>{selectedReport.detail}</p>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gi-text-secondary)" }}>Start Date</label>
                    <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="w-full h-9 rounded-lg px-3 text-xs sm:text-sm gi-input focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gi-text-secondary)" }}>End Date</label>
                    <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="w-full h-9 rounded-lg px-3 text-xs sm:text-sm gi-input focus:outline-none" />
                  </div>
                </>
              )}
            </div>

            {/* Generate Button */}
            <button type="button" onClick={handleGenerateReport} className="w-full h-9 rounded-lg font-semibold text-xs sm:text-sm transition cursor-pointer shadow-sm flex items-center justify-center gap-2 gi-btn-primary">
              <IoCalendarOutline className="text-base" />
              <span>Generate Statement</span>
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
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={exportToCSV} className="h-8 px-3 rounded-lg text-white text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-sm" style={{ background: "#16A34A" }} title="Download CSV / Excel File">
                      <IoDownloadOutline className="text-base" />
                      <span>Excel (CSV)</span>
                    </button>
                    <button type="button" onClick={exportToPDFPrint} className="h-8 px-3 rounded-lg text-white text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-sm" style={{ background: "#334155" }} title="Download PDF or Print Statement">
                      <IoPrintOutline className="text-base" />
                      <span>Print / PDF</span>
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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
              Reports &amp; Analytics
            </h1>
            <p className="text-xs gi-text-secondary mt-0.5">
              Generate financial summaries, GST reports, and ledger statements
            </p>
          </div>
        </div>

        {/* Reports Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {reports.map((report) => (
            <button key={report.id} type="button" onClick={() => openReport(report)} className="text-left w-full rounded-xl p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[110px] sm:min-h-[140px] group" style={{ background: "var(--gi-surface)", border: "1px solid var(--gi-border)" }}>
              <div className="flex items-start gap-2.5 sm:gap-3.5 w-full">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors" style={{ background: report.color.bg, border: `1px solid ${report.color.border}`, color: report.color.text }}>
                  <span className="text-lg sm:text-2xl">{report.icon}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-xs sm:text-base line-clamp-1" style={{ color: "var(--gi-text)" }}>{report.title}</p>
                  <p className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-2 leading-relaxed" style={{ color: "var(--gi-text-secondary)" }}>{report.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 sm:pt-3 mt-2 sm:mt-3 border-t text-[10px] sm:text-xs font-medium transition-colors" style={{ borderColor: "var(--gi-divider)", color: report.color.text }}>
                <span className="line-clamp-1">Generate</span>
                <IoChevronDown className="-rotate-90 text-sm shrink-0" />
              </div>
            </button>
          ))}
        </section>
      </div>
    </PermissionGuard>
  );
}