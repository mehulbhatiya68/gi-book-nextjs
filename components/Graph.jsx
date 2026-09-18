"use client";

import { useState, useEffect, useMemo, useRef, startTransition } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useApp } from "@/context/AppContext";

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const periodOptions = [
  { id: "daily", label: "Daywise" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "yearly", label: "Yearly" },
];

function getWeekKeyAndLabel(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const weekNum = Math.ceil(monday.getDate() / 7);
  const key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-W${weekNum}`;
  const label = `${monday.getDate()} ${monthNames[monday.getMonth()]}`;
  return { key, label, sortKey: `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}` };
}

// Custom mobile-friendly Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const salesVal = payload.find((p) => p.dataKey === "sales")?.value || 0;
    const purchaseVal = payload.find((p) => p.dataKey === "purchases")?.value || 0;

    return (
      <div className="p-2.5 sm:p-3 rounded-xl gi-card border gi-border shadow-xl text-xs space-y-1.5 pointer-events-none min-w-[160px] sm:min-w-[180px] backdrop-blur-md z-50">
        <p className="font-bold gi-text-primary border-b gi-divider pb-1 text-[10px] sm:text-[11px] uppercase tracking-wider">
          {label}
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-indigo-600 dark:text-indigo-400 font-semibold">
            <span className="flex items-center gap-1 text-[10px] sm:text-[11px]">
              <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0" />
              Sales:
            </span>
            <span className="font-mono text-[11px] sm:text-xs font-bold">
              ₹{Number(salesVal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-amber-600 dark:text-amber-400 font-semibold">
            <span className="flex items-center gap-1 text-[10px] sm:text-[11px]">
              <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
              Purchases:
            </span>
            <span className="font-mono text-[11px] sm:text-xs font-bold">
              ₹{Number(purchaseVal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function Graph({ invoices: propInvoices, period: externalPeriod, onPeriodChange }) {
  const { invoices: contextInvoices = [] } = useApp() || {};
  const invoices = useMemo(() => propInvoices || contextInvoices || [], [propInvoices, contextInvoices]);

  const containerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [internalPeriod, setInternalPeriod] = useState("monthly");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gi_graph_period");
      if (saved) {
        startTransition(() => {
          setInternalPeriod(saved);
        });
      }
    }
  }, []);

  useEffect(() => {
    const measureWidth = () => {
      if (containerRef.current) {
        const w = Math.floor(containerRef.current.getBoundingClientRect().width);
        if (w > 0) {
          setChartWidth(w);
        }
      }
    };

    measureWidth();
    const t1 = setTimeout(measureWidth, 50);
    const t2 = setTimeout(measureWidth, 200);

    let ro;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      ro = new ResizeObserver(() => measureWidth());
      ro.observe(containerRef.current);
    }

    window.addEventListener("resize", measureWidth);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (ro) ro.disconnect();
      window.removeEventListener("resize", measureWidth);
    };
  }, []);

  const period = externalPeriod || internalPeriod;

  const handlePeriodChange = (newPeriod) => {
    setInternalPeriod(newPeriod);
    if (typeof window !== "undefined") {
      localStorage.setItem("gi_graph_period", newPeriod);
    }
    if (onPeriodChange) {
      onPeriodChange(newPeriod);
    }
  };

  const chartData = useMemo(() => {
    const bucketsMap = {};
    const now = new Date();

    if (period === "daily") {
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const year = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const key = `${year}-${m}-${day}`;
        const label = `${d.getDate()} ${monthNames[d.getMonth()]}`;
        bucketsMap[key] = { label, sales: 0, purchases: 0, key, sortKey: key };
      }
    } else if (period === "weekly") {
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7);
        const { key, label, sortKey } = getWeekKeyAndLabel(d);
        bucketsMap[key] = { label: `W: ${label}`, sales: 0, purchases: 0, key, sortKey };
      }
    } else if (period === "monthly") {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = d.getFullYear();
        const monthIdx = d.getMonth();
        const key = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
        const label = `${monthNames[monthIdx]} '${String(year).slice(-2)}`;
        bucketsMap[key] = { label, sales: 0, purchases: 0, key, sortKey: key };
      }
    } else if (period === "quarterly") {
      for (let i = 3; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i * 3, 1);
        const year = d.getFullYear();
        const qNum = Math.floor(d.getMonth() / 3) + 1;
        const key = `${year}-Q${qNum}`;
        const label = `Q${qNum} ${year}`;
        bucketsMap[key] = { label, sales: 0, purchases: 0, key, sortKey: key };
      }
    } else if (period === "yearly") {
      for (let i = 2; i >= 0; i--) {
        const year = now.getFullYear() - i;
        const key = `${year}`;
        const label = `${year}`;
        bucketsMap[key] = { label, sales: 0, purchases: 0, key, sortKey: key };
      }
    }

    invoices.forEach((inv) => {
      const rawDate = inv.invoiceDate || inv.date || inv.createdAt;
      if (!rawDate) return;
      const invDate = new Date(rawDate);
      if (isNaN(invDate.getTime())) return;

      let key = "";
      let label = "";
      let sortKey = "";

      if (period === "daily") {
        const year = invDate.getFullYear();
        const m = String(invDate.getMonth() + 1).padStart(2, "0");
        const day = String(invDate.getDate()).padStart(2, "0");
        key = `${year}-${m}-${day}`;
        label = `${invDate.getDate()} ${monthNames[invDate.getMonth()]}`;
        sortKey = key;
      } else if (period === "weekly") {
        const weekInfo = getWeekKeyAndLabel(invDate);
        key = weekInfo.key;
        label = `W: ${weekInfo.label}`;
        sortKey = weekInfo.sortKey;
      } else if (period === "monthly") {
        const year = invDate.getFullYear();
        const monthIdx = invDate.getMonth();
        key = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
        label = `${monthNames[monthIdx]} '${String(year).slice(-2)}`;
        sortKey = key;
      } else if (period === "quarterly") {
        const year = invDate.getFullYear();
        const qNum = Math.floor(invDate.getMonth() / 3) + 1;
        key = `${year}-Q${qNum}`;
        label = `Q${qNum} ${year}`;
        sortKey = key;
      } else if (period === "yearly") {
        const year = invDate.getFullYear();
        key = `${year}`;
        label = `${year}`;
        sortKey = key;
      }

      if (!bucketsMap[key]) {
        bucketsMap[key] = { label, sales: 0, purchases: 0, key, sortKey };
      }

      const isSales = (inv.invoiceType || inv.type) === "sales";
      const amount = Number(inv.totalAmount || inv.total || 0) || 0;

      if (isSales) {
        bucketsMap[key].sales += amount;
      } else {
        bucketsMap[key].purchases += amount;
      }
    });

    return Object.values(bucketsMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [invoices, period]);

  return (
    <div className="w-full space-y-3 sm:space-y-4" suppressHydrationWarning>
      {/* Prominent Mobile-Optimized Period Selection & Legend Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b gi-divider">
        {/* Scrollable Period Options */}
        <div className="w-full sm:w-auto overflow-x-auto overflow-y-hidden touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 p-1 rounded-xl border border-indigo-200 dark:border-indigo-800/80 shadow-xs min-w-max">
            <span className="text-[10px] sm:text-[11px] font-bold text-indigo-700 dark:text-indigo-300 px-2 shrink-0">
              Period:
            </span>
            {periodOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handlePeriodChange(opt.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  period === opt.id
                    ? "bg-indigo-600 text-white shadow-sm scale-105"
                    : "gi-text-secondary hover:gi-text-primary hover:bg-white/60 dark:hover:bg-slate-800/60"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs font-semibold gi-text-secondary shrink-0 self-end sm:self-center">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 shadow-2xs" />
            <span>Sales Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-2xs" />
            <span>Vendor Purchases</span>
          </div>
        </div>
      </div>

      {/* Area Chart Container - Guaranteed Mobile Height & Margins */}
      <div ref={containerRef} className="w-full min-w-0 h-[240px] sm:h-[280px] min-h-[240px] gi-graph-container" suppressHydrationWarning>
        <ResponsiveContainer
          key={chartWidth || "initial"}
          width="100%"
          height={240}
          minWidth={100}
          initialDimension={{ width: 320, height: 240 }}
          debounce={50}
        >
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="purchaseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--gi-border, #EEF0F2)"
            />

            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "var(--gi-border, #EEF0F2)" }}
              tick={{ fill: "var(--gi-text-secondary, #6B7280)", fontSize: 10 }}
              interval="preserveStartEnd"
              minTickGap={10}
              dy={3}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--gi-text-secondary, #6B7280)", fontSize: 10 }}
              width={42}
              dx={-2}
              tickFormatter={(val) =>
                val >= 100000
                  ? `₹${(val / 100000).toFixed(1)}L`
                  : val >= 1000
                  ? `₹${(val / 1000).toFixed(0)}k`
                  : `₹${val}`
              }
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="sales"
              name="sales"
              stroke="#4F46E5"
              strokeWidth={2}
              activeDot={{ r: 5, strokeWidth: 2, fill: "#ffffff" }}
              fillOpacity={1}
              fill="url(#salesGradient)"
            />
            <Area
              type="monotone"
              dataKey="purchases"
              name="purchases"
              stroke="#F59E0B"
              strokeWidth={2}
              activeDot={{ r: 5, strokeWidth: 2, fill: "#ffffff" }}
              fillOpacity={1}
              fill="url(#purchaseGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}