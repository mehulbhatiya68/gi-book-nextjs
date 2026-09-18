"use client";

import { useState, useEffect, useRef, startTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IoAdd,
  IoTrendingUpOutline,
  IoArrowDownOutline,
  IoArrowUpOutline,
  IoWalletOutline,
  IoDocumentTextOutline,
  IoPeopleOutline,
  IoCubeOutline,
  IoChevronForward,
  IoReceiptOutline,
  IoCardOutline,
  IoSwapHorizontalOutline,
  IoLocationOutline,
  IoPeopleCircleOutline,
  IoStatsChartOutline,
  IoCashOutline,
  IoGridOutline,
} from "react-icons/io5";
import dynamic from "next/dynamic";
import InvoiceDetailsModal from "./InvoiceDetailsModal";
import { useApp } from "@/context/AppContext";

const Graph = dynamic(() => import("./Graph"), {
  ssr: false,
  loading: () => (
    <div className="w-full space-y-3 sm:space-y-4" suppressHydrationWarning>
      <div className="w-full h-[240px] sm:h-[280px] min-h-[240px] gi-graph-container rounded-xl bg-slate-100/50 dark:bg-zinc-800/50 animate-pulse flex items-center justify-center text-xs gi-text-muted border gi-border">
        <span>Loading analytics overview...</span>
      </div>
    </div>
  ),
});

export default function HomeContent() {
  const router = useRouter();
  const {
    currentUser,
    activeBusiness,
    invoices = [],
    parties = [],
    payments = [],
    items = [],
    hasPermission,
  } = useApp();

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [graphPeriod, setGraphPeriod] = useState("monthly");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load saved graph period from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gi_graph_period");
      if (saved) {
        startTransition(() => {
          setGraphPeriod(saved);
        });
      }
    }
  }, []);

  const handleGraphPeriodChange = (newPeriod) => {
    setGraphPeriod(newPeriod);
    if (typeof window !== "undefined") {
      localStorage.setItem("gi_graph_period", newPeriod);
    }
  };

  // Dynamic Sales & Purchase Calculation
  const totalSales = invoices
    .filter((inv) => inv.invoiceType === "sales" || inv.type === "sales")
    .reduce((acc, curr) => acc + (Number(curr.totalAmount || curr.total) || 0), 0);

  const totalPurchases = invoices
    .filter((inv) => inv.invoiceType === "purchase" || inv.type === "purchase")
    .reduce((acc, curr) => acc + (Number(curr.totalAmount || curr.total) || 0), 0);

  // Dynamic Party Balances
  const toCollect = parties
    .filter((p) => Number(p.closingBalance || 0) > 0)
    .reduce((acc, p) => acc + Number(p.closingBalance || 0), 0);

  const toPay = parties
    .filter((p) => Number(p.closingBalance || 0) < 0)
    .reduce((acc, p) => acc + Math.abs(Number(p.closingBalance || 0)), 0);

  // Low stock items threshold
  const lowStockItems = items.filter((item) => Number(item.stockQuantity || 0) <= Number(item.minStock || 5));

  // Combine Recent Transactions
  const recentInvoices = invoices.map((inv) => {
    const timeVal = inv.createdAt
      ? new Date(inv.createdAt).getTime()
      : inv.invoiceDate
        ? new Date(inv.invoiceDate).getTime()
        : 0;
    const isSales = (inv.invoiceType === "sales" || inv.type === "sales");
    return {
      id: inv.id,
      number: typeof inv.invoiceNumber === "object"
        ? `${inv.invoiceNumber?.prefix || ""} ${inv.invoiceNumber?.number || ""}`
        : inv.invoiceNumberStr || inv.invoiceNumber || `#INV-${inv.id}`,
      type: isSales ? "Sales Invoice" : "Purchase Invoice",
      partyName: inv.partyName || inv.party?.partyName || inv.supplier?.partyName || "Party",
      amount: Number(inv.totalAmount || 0),
      date: inv.invoiceDate || inv.date || new Date().toISOString().split("T")[0],
      status: inv.status || "unpaid",
      timestamp: timeVal,
      isPositive: isSales,
      isInvoice: true,
      rawInvoice: inv,
    };
  });

  const recentPaymentsList = payments.map((pay) => {
    const timeVal = pay.createdAt
      ? new Date(pay.createdAt).getTime()
      : pay.date
        ? new Date(pay.date).getTime()
        : 0;
    const isCredit = pay.type === "credit";
    return {
      id: pay.id,
      number: pay.number ? `RECEIPT #${pay.number}` : `PAY-${pay.id}`,
      type: isCredit ? "Payment Received" : "Payment Out",
      partyName: pay.party?.partyName || pay.partyName || "Party",
      amount: Number(pay.amount || 0),
      date: pay.date || new Date().toISOString().split("T")[0],
      status: pay.mode || "Cash",
      timestamp: timeVal,
      isPositive: isCredit,
      isInvoice: false,
    };
  });

  const allTransactions = [...recentInvoices, ...recentPaymentsList]
    .sort((a, b) => (b.timestamp || new Date(b.date).getTime()) - (a.timestamp || new Date(a.date).getTime()))
    .slice(0, 7);

  const userName = currentUser?.name?.split(" ")[0] || "User";

  const quickNavItems = [
    { name: "Parties", href: "/parties", icon: IoPeopleOutline, module: "Ledger", bgClass: "bg-blue-500/10", colorClass: "text-blue-600 dark:text-blue-400" },
    { name: "Items", href: "/items", icon: IoCubeOutline, module: "Item Transaction", bgClass: "bg-emerald-500/10", colorClass: "text-emerald-600 dark:text-emerald-400" },
    { name: "Invoices", href: "/invoice", icon: IoDocumentTextOutline, module: "Invoice", bgClass: "bg-indigo-500/10", colorClass: "text-indigo-600 dark:text-indigo-400" },
    { name: "Payments", href: "/payments", icon: IoCardOutline, module: "Payment", bgClass: "bg-purple-500/10", colorClass: "text-purple-600 dark:text-purple-400" },
    { name: "Payment History", href: "/paymentHistory", icon: IoWalletOutline, module: "Payment", bgClass: "bg-amber-500/10", colorClass: "text-amber-600 dark:text-amber-400" },
    { name: "Ledgers", href: "/ledgers", icon: IoCashOutline, module: "Ledger", bgClass: "bg-teal-500/10", colorClass: "text-teal-600 dark:text-teal-400" },
    { name: "Ledger Transfers", href: "/ledgerTransactions", icon: IoSwapHorizontalOutline, module: "Ledger", bgClass: "bg-cyan-500/10", colorClass: "text-cyan-600 dark:text-cyan-400" },
    { name: "Site / Projects", href: "/siteProject", icon: IoLocationOutline, module: "Site", bgClass: "bg-rose-500/10", colorClass: "text-rose-600 dark:text-rose-400" },
    { name: "Staff", href: "/staff", icon: IoPeopleCircleOutline, module: "Staff", bgClass: "bg-orange-500/10", colorClass: "text-orange-600 dark:text-orange-400" },
    { name: "Reports", href: "/reports", icon: IoStatsChartOutline, module: "Report", bgClass: "bg-violet-500/10", colorClass: "text-violet-600 dark:text-violet-400" },
  ];

  return (
    <div className="space-y-6 select-none gi-page">
      {/* Top Welcome & Quick Action Bar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b gi-divider">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight truncate">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm gi-text-secondary mt-0.5 truncate hidden sm:block">
            Welcome back, <span className="font-semibold gi-text-primary">{userName}</span>. Here is the operational overview for <span className="font-semibold gi-text-primary">{activeBusiness?.name || "your enterprise"}</span> today.
          </p>
          <p className="text-xs gi-text-secondary mt-0.5 truncate sm:hidden">
            Welcome, <span className="font-semibold gi-text-primary">{userName}</span>
          </p>
        </div>

        {hasPermission("Invoice", "Create") && (
          <div className="relative shrink-0" ref={addMenuRef}>
            <button
              type="button"
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="px-3 sm:px-4 py-2 rounded-lg gi-btn-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs whitespace-nowrap"
            >
              <IoAdd className="text-base" />
              <span>Create Invoice</span>
            </button>

            {showAddMenu && (
              <div className="absolute right-0 top-full mt-2 z-50 w-56 sm:w-60 rounded-xl gi-card shadow-2xl p-2 space-y-1 border gi-divider">
                <Link href="/addInvoice/sales" onClick={() => setShowAddMenu(false)}>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--gi-hover)] text-xs font-semibold gi-text-primary cursor-pointer transition">
                    <div className="h-7 w-7 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <IoDocumentTextOutline className="text-base" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold">Sales Invoice</span>
                      <span className="text-[10px] gi-text-muted font-normal truncate">Customer bill &amp; sales receipt</span>
                    </div>
                  </div>
                </Link>
                <Link href="/addInvoice/purchase" onClick={() => setShowAddMenu(false)}>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--gi-hover)] text-xs font-semibold gi-text-primary cursor-pointer transition">
                    <div className="h-7 w-7 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <IoReceiptOutline className="text-base" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold">Purchase Invoice</span>
                      <span className="text-[10px] gi-text-muted font-normal truncate">Vendor bill &amp; stock entry</span>
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Portrait Quick Access Box Grid */}
      <div className="block md:hidden p-4 rounded-2xl gi-card shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b gi-divider">
          <h2 className="text-sm font-bold gi-text-primary flex items-center gap-2">
            <IoGridOutline className="text-indigo-500 text-base" />
            <span>Modules &amp; Navigation</span>
          </h2>
          <span className="text-[11px] font-semibold gi-text-muted">All Pages</span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {quickNavItems
            .filter((item) => hasPermission(item.module, "View"))
            .map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <div className="p-2 sm:p-3 rounded-xl border gi-divider gi-surface-interactive flex flex-col items-center justify-center text-center space-y-1.5 transition active:scale-95 cursor-pointer h-20 sm:h-22">
                    <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl ${item.bgClass} flex items-center justify-center text-base sm:text-lg shrink-0 shadow-2xs`}>
                      <Icon className={item.colorClass} />
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold gi-text-primary truncate w-full">
                      {item.name}
                    </span>
                  </div>
                </Link>
              );
            })}
        </div>
      </div>

      {/* KPI Cards Row (4 Primary ERP Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Sales */}
        <div
          onClick={() => router.push("/invoice?filter=sales")}
          className="p-4 rounded-xl gi-card shadow-xs space-y-2 block cursor-pointer transition hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold gi-text-secondary">
              Total Sales
            </span>
            <span className="p-1.5 rounded-lg gi-badge-info">
              <IoTrendingUpOutline className="text-base" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold gi-text-primary font-mono">
              ₹{Number(totalSales).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-between">
            <span>Overall B2B/B2C Sales</span>
            <span className="text-[10px] font-bold underline">View Invoices &rarr;</span>
          </p>
        </div>

        {/* 2. Total Purchases */}
        <div
          onClick={() => router.push("/invoice?filter=purchase")}
          className="p-4 rounded-xl gi-card shadow-xs space-y-2 block cursor-pointer transition hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold gi-text-secondary">
              Total Purchases
            </span>
            <span className="p-1.5 rounded-lg gi-badge-warning">
              <IoReceiptOutline className="text-base" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold gi-text-primary font-mono">
              ₹{Number(totalPurchases).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] gi-text-muted font-medium flex items-center justify-between">
            <span>Vendor Procurement</span>
            <span className="text-[10px] font-bold gi-text-selected-text underline">View Invoices &rarr;</span>
          </p>
        </div>

        {/* 3. Total Receivable */}
        <div
          onClick={() => router.push("/invoice?filter=unpaid")}
          className="p-4 rounded-xl gi-card shadow-xs space-y-2 block cursor-pointer transition hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold gi-text-secondary">
              Total Receivable (To Collect)
            </span>
            <span className="p-1.5 rounded-lg gi-badge-success">
              <IoArrowDownOutline className="text-base" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              ₹{Number(toCollect).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-between">
            <span>Customer ledger balances</span>
            <span className="text-[10px] font-bold underline">View Unpaid &rarr;</span>
          </p>
        </div>

        {/* 4. Total Payable */}
        <div
          onClick={() => router.push("/invoice?filter=unpaid")}
          className="p-4 rounded-xl gi-card shadow-xs space-y-2 block cursor-pointer transition hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold gi-text-secondary">
              Total Payable (To Pay)
            </span>
            <span className="p-1.5 rounded-lg gi-badge-danger">
              <IoArrowUpOutline className="text-base" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
              ₹{Number(toPay).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center justify-between">
            <span>Vendor dues pending</span>
            <span className="text-[10px] font-bold underline">View Due Invoices &rarr;</span>
          </p>
        </div>
      </div>

      {/* Sales & Revenue Overview Graph */}
      <div className="p-5 rounded-xl gi-card shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold gi-text-primary flex items-center gap-2">
              <span>Sales &amp; Revenue Overview</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {graphPeriod}
              </span>
            </h2>
            <p className="text-xs gi-text-secondary mt-0.5">
              Invoicing &amp; procurement trends (Daywise, Weekly, Monthly, Quarterly, Yearly)
            </p>
          </div>
          <Link
            href="/reports"
            className="text-xs font-semibold gi-text-selected-text hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Full Analytics</span>
            <IoChevronForward className="text-xs" />
          </Link>
        </div>

        <div className="w-full pt-1">
          <Graph invoices={invoices} period={graphPeriod} onPeriodChange={handleGraphPeriodChange} />
        </div>
      </div>

      {/* Second Row: Recent Transactions Table & Payments Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Transactions Table (Spans 2 columns) */}
        <div className="lg:col-span-2 p-5 rounded-xl gi-card shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold gi-text-primary">
                Recent Invoices & Transactions
              </h2>
              <p className="text-xs gi-text-secondary">
                Latest sales, purchases, and party entries
              </p>
            </div>
            <Link
              href="/paymentHistory"
              className="text-xs font-semibold gi-text-selected-text hover:underline"
            >
              View Full History
            </Link>
          </div>

          {allTransactions.length === 0 ? (
            <div className="py-12 text-center gi-text-muted text-xs border gi-border rounded-lg gi-surface-secondary">
              No recent transactions recorded yet.
            </div>
          ) : (
            <div className="gi-table-container overflow-x-auto">
              <table className="w-full text-left gi-table text-xs">
                <thead>
                  <tr>
                    <th className="p-3">Reference / Party</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y gi-divider">
                  {allTransactions.map((tx) => (
                    <tr
                      key={`${tx.isInvoice ? "inv" : "pay"}-${tx.id}`}
                      className="hover:bg-[var(--gi-hover)] transition cursor-pointer"
                      onClick={() => {
                        if (tx.rawInvoice) {
                          setSelectedInvoice(tx.rawInvoice);
                        } else {
                          router.push("/paymentHistory");
                        }
                      }}
                    >
                      <td className="p-3">
                        <p className="font-bold gi-text-primary">{tx.partyName}</p>
                        <p className="text-[11px] gi-text-muted">{tx.number}</p>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${tx.isPositive
                              ? "gi-badge-success"
                              : "gi-badge-danger"
                            }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-3 gi-text-secondary whitespace-nowrap">{tx.date}</td>
                      <td className="p-3 text-right font-mono font-bold">
                        <span className={tx.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                          {tx.isPositive ? "+" : "-"}₹{Number(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-xs font-semibold gi-text-selected-text hover:underline">Details</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Low Stock Items Alert / Quick Links */}
        <div className="p-5 rounded-xl gi-card shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-bold gi-text-primary">
                  Inventory Warnings
                </h2>
                <p className="text-xs gi-text-secondary">
                  Items requiring reorder attention
                </p>
              </div>
              <Link href="/items" className="text-xs font-semibold gi-text-selected-text hover:underline">
                All Items
              </Link>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="py-8 text-center gi-text-muted text-xs border gi-border rounded-lg gi-surface-secondary">
                All inventory stock levels are healthy.
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="p-2.5 rounded-lg gi-surface-secondary border gi-border flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs gi-text-primary">{item.itemName || item.name}</p>
                      <p className="text-[11px] gi-text-muted">Min Threshold: {item.minStock || 5} {item.unit || ""}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                      {item.stockQuantity || 0} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t gi-divider">
            <Link href="/invoice">
              <button
                type="button"
                className="w-full py-2 rounded-lg gi-btn-secondary text-xs font-semibold transition cursor-pointer"
              >
                Go to Invoices Register
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onRecordPayment={(inv) => {
            const isSales = (inv.invoiceType || inv.type) === "sales";
            const targetPartyId = inv.party?.id || inv.supplier?.id || "";
            router.push(
              `/payment/receivedPayment?type=${isSales ? "credit" : "debit"}&invoiceId=${inv.id}&partyId=${targetPartyId}`
            );
          }}
        />
      )}
    </div>
  );
}
