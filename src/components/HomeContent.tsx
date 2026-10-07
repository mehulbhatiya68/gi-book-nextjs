"use client";

import { useState, useEffect, useRef, startTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IoAdd,
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
} from "react-icons/io5";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { dashboardApi } from "@/lib/api/dashboard";
import { transactionApi } from "@/lib/api/transaction";
import { getAuthToken } from "@/lib/api/client";

import { SkeletonStats, SkeletonTable, SkeletonGraph } from "@/components/Skeleton";

import { useMinimumLoading } from "@/lib/hooks/useMinimumLoading";
import SmoothTransition from "@/components/SmoothTransition";

const Graph = dynamic(() => import("./Graph"), {
  ssr: false,
  loading: () => <SkeletonGraph />,
});

export default function HomeContent({
  initialDashboardData = null,
  initialPayments = [],
}: {
  initialDashboardData?: any;
  initialPayments?: any[];
}) {
  const router = useRouter();
  const { currentUser, activeBusiness, hasPermission } = useAuth();

  const [payments, setPayments] = useState<any[]>(initialPayments || []);
  const { isLoading, startLoading, stopLoading } = useMinimumLoading(
    !(initialPayments?.length || initialDashboardData),
    400
  );
  const [dashboardApiResponse, setDashboardApiResponse] = useState<any>(initialDashboardData || null);
  const [isDashboardApiLoading, setIsDashboardApiLoading] = useState(false);

  const [graphPeriod, setGraphPeriod] = useState("monthly");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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

  useEffect(() => {
    const token = getAuthToken();
    if (token || activeBusiness?.id) {
      if (!payments.length && !dashboardApiResponse && !initialPayments?.length && !initialDashboardData) {
        startLoading();
        setIsDashboardApiLoading(true);
      }

      const p1 = transactionApi.getTransactions({ per_page: "all", silentError: true })
        .then((txRes: any) => {
          const txList = txRes?.body?.transactions || txRes?.body?.data || (Array.isArray(txRes?.body) ? txRes.body : txRes?.transactions || txRes?.data || []);
          setPayments(Array.isArray(txList) ? txList : []);
        })
        .catch(() => { });

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const compareMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;

      const p2 = dashboardApi.getDashboard({ month: currentMonth, compare_month: compareMonth }, { silentError: true })
        .then((dashRes: any) => {
          if (dashRes) setDashboardApiResponse(dashRes);
        })
        .catch((dashErr: any) => {
          if (!dashboardApiResponse) {
            setDashboardApiResponse({
              error: dashErr?.message || "Failed to fetch dashboard API",
              status: dashErr?.status,
              data: dashErr?.data,
            });
          }
        })
        .finally(() => setIsDashboardApiLoading(false));

      Promise.allSettled([p1, p2]).then(() => {
        stopLoading();
      });
    } else {
      setPayments([]);
      setDashboardApiResponse(null);
      setIsDashboardApiLoading(false);
      stopLoading();
    }
  }, [activeBusiness?.id]);

  const balancesApi = dashboardApiResponse?.body?.balances || dashboardApiResponse?.balances;

  const totalBalance = balancesApi?.total_balance !== undefined
    ? Number(balancesApi.total_balance)
    : (balancesApi?.cash_bank_balance !== undefined
      ? Number(balancesApi.cash_bank_balance)
      : 0);

  const toCollect = balancesApi?.to_collect !== undefined
    ? Number(balancesApi.to_collect)
    : 0;

  const toPay = balancesApi?.to_pay !== undefined
    ? Number(balancesApi.to_pay)
    : 0;

  const recentTransactions = payments
    .filter((pay: any) => {
      const typeStr = String(pay.type || pay.transaction_type || pay.normalizedType || pay.transactionType || "").toLowerCase().trim();

      // Exclude journal, contra, transfer, and company/internal transactions
      if (
        typeStr === "journal" ||
        typeStr === "contra" ||
        typeStr === "transfer" ||
        typeStr === "company" ||
        typeStr === "invoice_settlement" ||
        typeStr.includes("journal") ||
        typeStr.includes("contra") ||
        typeStr.includes("transfer") ||
        typeStr.includes("company")
      ) {
        return false;
      }

      // Exclude transactions where party/ledger type is company or internal
      const partyType = String(
        pay.party_ledger?.type ||
        pay.party_ledger?.ledger_type ||
        pay.ledger?.type ||
        pay.party?.type ||
        pay.party_type ||
        ""
      ).toLowerCase().trim();

      const fromType = String(pay.from_ledger?.type || pay.fromLedger?.type || "").toLowerCase().trim();
      const toType = String(pay.to_ledger?.type || pay.toLedger?.type || "").toLowerCase().trim();
      const partyNameStr = String(pay.party_ledger?.name || pay.party_ledger?.partyName || pay.party?.name || pay.partyName || pay.party_name || "").toLowerCase().trim();

      if (partyType === "company" || fromType === "company" || toType === "company" || partyNameStr.includes("company")) {
        return false;
      }

      return true;
    })
    .map((pay: any) => {
      const typeStr = String(pay.type || pay.transaction_type || pay.normalizedType || "").toLowerCase();
      const isCredit = typeStr === "payment_in" || typeStr === "credit" || typeStr.includes("in");
      const payDateStr = pay.transaction_date || pay.payment_date || pay.date || (pay.created_at ? String(pay.created_at).split("T")[0] : "");
      const timeVal = pay.created_at
        ? new Date(pay.created_at).getTime()
        : payDateStr
          ? new Date(payDateStr).getTime()
          : 0;

      const amount = Number(pay.amount || 0);

      return {
        id: pay.id,
        number: pay.transaction_number || pay.number || (pay.id ? `TXN-${String(pay.id).slice(0, 8).toUpperCase()}` : "—"),
        type: isCredit ? "Payment Received" : "Payment Out",
        partyName: pay.party_ledger?.name || pay.party_ledger?.partyName || pay.party?.name || pay.party?.partyName || pay.partyName || pay.party_name || pay.ledger?.name || "Party",
        amount,
        date: payDateStr || "N/A",
        status: pay.payment_ledger?.name || pay.mode || "Cash",
        timestamp: timeVal,
        isPositive: isCredit,
        rawPay: pay,
      };
    });

  const userName = currentUser?.name?.split(" ")[0] || "User";

  const quickNavItems = [
    { name: "Parties", href: "/parties", icon: IoPeopleOutline, module: "Ledger", bgClass: "bg-blue-600 dark:bg-blue-600", colorClass: "text-white" },
    { name: "Items", href: "/items", icon: IoCubeOutline, module: "Item Transaction", bgClass: "bg-emerald-600 dark:bg-emerald-600", colorClass: "text-white" },
    { name: "Invoices", href: "/invoice", icon: IoDocumentTextOutline, module: "Invoice", bgClass: "bg-indigo-600 dark:bg-indigo-600", colorClass: "text-white" },
    { name: "Payments", href: "/payments", icon: IoCardOutline, module: "Payment", bgClass: "bg-purple-600 dark:bg-purple-600", colorClass: "text-white" },
    { name: "Payment History", href: "/paymentHistory", icon: IoWalletOutline, module: "Payment", bgClass: "bg-amber-500 dark:bg-amber-500", colorClass: "text-white" },
    { name: "Ledgers", href: "/ledgers", icon: IoCashOutline, module: "Ledger", bgClass: "bg-teal-600 dark:bg-teal-600", colorClass: "text-white" },
    { name: "Ledger Transfers", href: "/ledgerTransactions", icon: IoSwapHorizontalOutline, module: "Ledger", bgClass: "bg-cyan-600 dark:bg-cyan-600", colorClass: "text-white" },
    { name: "Site / Projects", href: "/siteProject", icon: IoLocationOutline, module: "Site", bgClass: "bg-rose-600 dark:bg-rose-600", colorClass: "text-white" },
    { name: "Staff", href: "/staff", icon: IoPeopleCircleOutline, module: "Staff", bgClass: "bg-orange-500 dark:bg-orange-500", colorClass: "text-white" },
    { name: "Reports", href: "/reports", icon: IoStatsChartOutline, module: "Report", bgClass: "bg-violet-600 dark:bg-violet-600", colorClass: "text-white" },
  ];

  return (
    <div className="space-y-6 select-none gi-page">
      {/* Top Welcome & Quick Action Bar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b gi-divider">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold gi-text-primary tracking-tight truncate">
            Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasPermission("Invoice", "Create") && (
            <div className="relative shrink-0" ref={addMenuRef}>
              <button
                type="button"
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="px-3 py-1.5 rounded-lg gi-btn-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs whitespace-nowrap"
              >
                <IoAdd className="text-base" />
                <span>Create Invoice</span>
              </button>

              {showAddMenu && (
                <div className="absolute right-0 top-full mt-2 z-50 w-40 sm:w-40 rounded-xl gi-card shadow-2xl p-2 space-y-1 border gi-divider">
                  <Link href="/addInvoice/sales" onClick={() => setShowAddMenu(false)}>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--gi-hover)] text-xs font-semibold gi-text-primary cursor-pointer transition">
                      <div className="h-7 w-7 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <IoDocumentTextOutline className="text-base" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold">Sales</span>

                      </div>
                    </div>
                  </Link>
                  <Link href="/addInvoice/purchase" onClick={() => setShowAddMenu(false)}>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--gi-hover)] text-xs font-semibold gi-text-primary cursor-pointer transition">
                      <div className="h-7 w-7 rounded-md bg-purple-600 text-white flex items-center justify-center shrink-0">
                        <IoReceiptOutline className="text-base" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold">Purchase</span>

                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Top Navigation 3-Column Grid Menu (Mobile Only: md:hidden) */}
      <div className="block md:hidden">
        <div className="grid grid-cols-3 gap-2.5">
          {quickNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <div className="flex flex-col items-center justify-center text-center p-3 rounded-2xl gi-surface-secondary border gi-border hover:bg-[var(--gi-hover)] transition cursor-pointer space-y-2 shadow-2xs active:scale-[0.98]">
                  <div className={`h-10 w-10 rounded-xl ${item.bgClass} ${item.colorClass} flex items-center justify-center text-xl shadow-xs shrink-0`}>
                    <Icon />
                  </div>
                  <span className="text-xs font-bold gi-text-primary truncate w-full">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* TWO VERTICAL PARTS ON DESKTOP: Left Side (Calculations + Recent Transactions) & Right Side (Graph) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* RIGHT PART (Col Span 6): Graph (Placed 1st on mobile via order-1, 2nd on desktop via lg:order-2) */}
        <div className="order-1 lg:order-2 lg:col-span-6 w-full">
          {isLoading ? (
            <SkeletonGraph />
          ) : (
            <SmoothTransition>
              <Graph
                dashboardData={dashboardApiResponse?.body || dashboardApiResponse}
                onMonthChange={(newMonth, newCompareMonth) => {
                  setIsDashboardApiLoading(true);
                  dashboardApi.getDashboard({ month: newMonth, compare_month: newCompareMonth || undefined }, { silentError: true })
                    .then((res: any) => {
                      setDashboardApiResponse(res);
                    })
                    .catch(() => { })
                    .finally(() => setIsDashboardApiLoading(false));
                }}
              />
            </SmoothTransition>
          )}
        </div>

        {/* LEFT PART (Col Span 6): Calculation Card + Recent Transactions (Placed 2nd on mobile via order-2, 1st on desktop via lg:order-1) */}
        <div className="order-2 lg:order-1 lg:col-span-6 space-y-6">
          {/* Calculation Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#161B22] border gi-divider shadow-xs space-y-4 w-full">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold gi-text-secondary uppercase tracking-wider">
                  Total Balance
                </h2>
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight gi-text-primary mt-1 font-mono">
                  ₹{Number(totalBalance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl shrink-0">
                <IoWalletOutline />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-1">
              {/* Left Green Pill: To collect ↓ */}
              <div
                onClick={() => router.push("/payments?filter=to_collect")}
                className="p-3.5 sm:p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 transition-all duration-200 cursor-pointer hover:shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 group"
              >
                <div className="flex items-center justify-between gap-1">
                  <p className="text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
                    To Collect
                  </p>
                  <IoChevronForward className="text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm shrink-0 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="font-extrabold text-base sm:text-lg text-emerald-950 dark:text-emerald-200 font-mono truncate mt-1">
                  ₹{Number(toCollect || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Right Red Pill: To Pay ↑ */}
              <div
                onClick={() => router.push("/payments?filter=to_pay")}
                className="p-3.5 sm:p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/80 transition-all duration-200 cursor-pointer hover:shadow-xs hover:border-rose-300 dark:hover:border-rose-700 group"
              >
                <div className="flex items-center justify-between gap-1">
                  <p className="text-[11px] sm:text-xs text-rose-700 dark:text-rose-400 font-bold uppercase tracking-wider">
                    To Pay
                  </p>
                  <IoChevronForward className="text-rose-600 dark:text-rose-400 text-xs sm:text-sm shrink-0 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="font-extrabold text-base sm:text-lg text-rose-950 dark:text-rose-200 font-mono truncate mt-1">
                  ₹{Number(toPay || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Transactions (Below Calculation Card on Left Side) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#161B22] border gi-divider shadow-xs space-y-4 w-full">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-bold gi-text-primary">
                  Recent Transactions
                </h2>
                <p className="text-xs gi-text-secondary">
                  Latest payment and transfer entries
                </p>
              </div>
              <Link
                href="/paymentHistory"
                className="text-xs font-bold gi-text-selected-text hover:underline inline-flex items-center gap-1"
              >
                <span>View History</span>
                <IoChevronForward className="text-xs" />
              </Link>
            </div>

            {isLoading ? (
              <SkeletonTable rows={4} cols={4} />
            ) : recentTransactions.length === 0 ? (
              <SmoothTransition>
                <div className="py-12 text-center gi-text-muted text-xs border gi-border rounded-lg gi-surface-secondary">
                  No recent transactions recorded yet.
                </div>
              </SmoothTransition>
            ) : (
              <SmoothTransition>
              <>
                {/* Desktop Table View (Inner Scrollable - 4 items frame) */}
                <div className="hidden sm:block border gi-divider rounded-xl overflow-hidden shadow-2xs">
                  <div className="max-h-[230px] overflow-y-auto overflow-x-auto no-scrollbar scrollbar-none" style={{ overflowY: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}>
                    <table className="w-full text-left gi-table text-xs">
                      <thead className="sticky top-0 z-10 gi-surface-secondary shadow-2xs">
                        <tr>
                          <th className="p-3">Reference / Party</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Linked Invoice</th>
                          <th className="p-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y gi-divider">
                        {recentTransactions.map((tx) => {
                          const txColor = tx.isPositive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400";
                          const txSign = tx.isPositive ? "+" : "-";

                          const raw = tx.rawPay || {};
                          const targetInvId = raw.sales_invoice?.id || raw.purchase_invoice?.id || raw.invoice?.id || raw.sales_invoice_id || raw.purchase_invoice_id || raw.invoice_id;
                          const targetInvNum = raw.sales_invoice?.invoice_number || raw.purchase_invoice?.invoice_number || raw.invoice?.invoice_number || raw.sales_invoice_number || raw.purchase_invoice_number || raw.invoice_number;

                          return (
                            <tr
                              key={`pay-${tx.id}`}
                              onClick={() => {
                                if (tx.id) {
                                  router.push(`/paymentDetails/${tx.id}?from=/home`);
                                } else {
                                  router.push("/paymentHistory");
                                }
                              }}
                              className="hover:bg-[var(--gi-hover)] transition cursor-pointer"
                            >
                              <td className="p-3">
                                <p className="font-bold gi-text-primary">{tx.partyName}</p>
                                <p className="text-[11px] gi-text-muted font-mono">{tx.number}</p>
                              </td>
                              <td className="p-3 gi-text-secondary whitespace-nowrap">{tx.date}</td>
                              <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                {targetInvId ? (
                                  <Link
                                    href={`/invoiceDetails/${targetInvId}`}
                                    className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                                  >
                                    <span>{targetInvNum || `#${targetInvId}`}</span>
                                  </Link>
                                ) : targetInvNum ? (
                                  <span className="font-mono text-xs font-medium gi-text-primary">{targetInvNum}</span>
                                ) : (
                                  <span className="gi-text-muted text-xs">—</span>
                                )}
                              </td>
                              <td className="p-3 text-right font-mono font-bold">
                                <span className={txColor}>
                                  {txSign}₹{Math.abs(Number(tx.amount || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Touch Cards View (Inner Scrollable - 4 items frame) */}
                <div className="block sm:hidden max-h-[230px] overflow-y-auto space-y-2.5 pr-1 no-scrollbar scrollbar-none" style={{ overflowY: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  {recentTransactions.map((tx) => {
                    const txColor = tx.isPositive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400";
                    const txSign = tx.isPositive ? "+" : "-";

                    return (
                      <div
                        key={`pay-mobile-${tx.id}`}
                        onClick={() => {
                          if (tx.id) {
                            router.push(`/paymentDetails/${tx.id}?from=/home`);
                          } else {
                            router.push("/paymentHistory");
                          }
                        }}
                        className="p-3 rounded-xl gi-surface-secondary border gi-border flex items-center justify-between transition cursor-pointer hover:bg-[var(--gi-hover)]"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-bold text-xs gi-text-primary truncate">{tx.partyName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] gi-text-muted font-mono">{tx.number}</span>
                            <span className="text-[10px] gi-text-secondary">• {tx.date}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-mono font-bold text-xs ${txColor}`}>
                            {txSign}₹{Math.abs(Number(tx.amount || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
              </SmoothTransition>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
