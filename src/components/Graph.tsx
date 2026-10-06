"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  IoTrendingUp,
  IoChevronDown,
  IoClose,
  IoCalendarOutline,
  IoChevronBack,
  IoChevronForward,
  IoCheckmark,
  IoBagHandleOutline,
  IoRefreshOutline,
} from "react-icons/io5";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_SHORT = [
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

function formatFullMonthName(monthIdx: number) {
  return MONTH_NAMES[monthIdx] || "";
}

// Robust Invoice Date Parser that avoids Timezone Offsets (e.g. YYYY-MM-DD string parsing)
function parseInvoiceDate(inv: any): { year: number; monthIdx: number; day: number } | null {
  if (!inv) return null;
  const raw =
    inv.invoice_date ||
    inv.invoiceDate ||
    inv.date ||
    inv.created_at ||
    inv.createdAt ||
    inv.due_date ||
    inv.dueDate;

  if (!raw) return null;

  const str = String(raw).trim();
  // Match YYYY-MM-DD or YYYY/MM/DD directly to avoid UTC timezone shifts
  const match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const monthIdx = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    if (!isNaN(year) && !isNaN(monthIdx) && !isNaN(day) && monthIdx >= 0 && monthIdx <= 11) {
      return { year, monthIdx, day };
    }
  }

  // Fallback parsing for timestamps or standard Date strings
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;

  const year = d.getFullYear();
  const monthIdx = d.getMonth();
  const day = d.getDate();
  return { year, monthIdx, day };
}

// Helper to parse daily items from API response (supports arrays, objects, and various field names)
function parseDailyItems(data: any): Record<number, number> {
  const result: Record<number, number> = {};
  if (!data) return result;

  if (Array.isArray(data)) {
    data.forEach((item: any) => {
      if (!item) return;
      let dayNum = 0;
      if (item.day !== undefined) {
        dayNum = Number(item.day);
      } else if (item.date) {
        const parts = String(item.date).split("-");
        if (parts.length >= 3) {
          dayNum = parseInt(parts[2], 10);
        }
      }
      const val = Number(
        item.amount ?? item.total ?? item.sales ?? item.purchases ?? item.value ?? item.val ?? 0
      );
      if (dayNum >= 1 && dayNum <= 31) {
        result[dayNum] = (result[dayNum] || 0) + val;
      }
    });
  } else if (typeof data === "object") {
    Object.entries(data).forEach(([key, val]) => {
      let dayNum = 0;
      if (key.includes("-")) {
        const parts = key.split("-");
        dayNum = parseInt(parts[parts.length - 1], 10);
      } else {
        dayNum = parseInt(key, 10);
      }
      const numVal =
        typeof val === "number"
          ? val
          : Number((val as any)?.amount ?? (val as any)?.total ?? val ?? 0);
      if (dayNum >= 1 && dayNum <= 31) {
        result[dayNum] = (result[dayNum] || 0) + numVal;
      }
    });
  }

  return result;
}

// Hook to dynamically detect light vs dark mode changes
function useIsDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      const isDarkMode =
        document.documentElement.classList.contains("dark") ||
        document.documentElement.getAttribute("data-theme") === "dark";
      setIsDark(isDarkMode);
    };

    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

// Theme-Adaptive Tooltip Component
const CustomTooltip = ({ active, payload, label, primaryLabel, compareLabel }: any) => {
  if (active && payload && payload.length) {
    const primaryVal = Number(payload.find((p: any) => p.dataKey === "primarySales")?.value || 0);
    const compareVal = Number(payload.find((p: any) => p.dataKey === "compareSales")?.value || 0);
    const diff = primaryVal - compareVal;

    return (
      <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#1C2333] border border-slate-100 dark:border-[#30363D] shadow-2xl text-xs space-y-2 pointer-events-none min-w-[200px] z-50">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#30363D] pb-1.5 font-bold text-slate-800 dark:text-slate-100">
          <span>Day {label}</span>
          {diff !== 0 && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                diff > 0
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border dark:border-emerald-800/60"
                  : "bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-300 dark:border dark:border-rose-800/60"
              }`}
            >
              {diff > 0 ? `+₹${diff.toLocaleString("en-IN")}` : `-₹${Math.abs(diff).toLocaleString("en-IN")}`}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 font-semibold text-purple-600 dark:text-purple-300">
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="h-2 w-2 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0" />
              <span>{primaryLabel}:</span>
            </span>
            <span className="font-mono text-xs font-bold">
              ₹{primaryVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {compareLabel && (
            <div className="flex items-center justify-between gap-3 font-semibold text-amber-600 dark:text-amber-400">
              <span className="flex items-center gap-1.5 text-[11px]">
                <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                <span>{compareLabel}:</span>
              </span>
              <span className="font-mono text-xs font-bold">
                ₹{compareVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function Graph({
  invoices = [],
  dashboardData = null,
  isApiLoading = false,
  onMonthChange,
}: {
  invoices?: any[];
  dashboardData?: any;
  isApiLoading?: boolean;
  onMonthChange?: (primaryMonth: string, compareMonth: string | null) => void;
}) {
  const isDark = useIsDarkMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth(); // 0..11

  // Default Primary Month: Current Month
  const [primaryYear, setPrimaryYear] = useState(currentYear);
  const [primaryMonthIdx, setPrimaryMonthIdx] = useState(currentMonthIdx);

  // Default Compare Month: Previous Month
  const initialPrevMonthDate = new Date(currentYear, currentMonthIdx - 1, 1);
  const [compareYear, setCompareYear] = useState<number | null>(initialPrevMonthDate.getFullYear());
  const [compareMonthIdx, setCompareMonthIdx] = useState<number | null>(initialPrevMonthDate.getMonth());

  // Modal State for selecting primary vs compare month
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<"primary" | "compare">("primary");
  const [modalYear, setModalYear] = useState(currentYear);
  const [graphType, setGraphType] = useState<"sales" | "purchases">("sales");

  useEffect(() => {
    const measureWidth = () => {
      if (containerRef.current) {
        const w = Math.floor(containerRef.current.getBoundingClientRect().width);
        if (w > 0) setChartWidth(w);
      }
    };
    measureWidth();
    const t = setTimeout(measureWidth, 100);
    window.addEventListener("resize", measureWidth);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measureWidth);
    };
  }, []);

  const primaryKey = `${primaryYear}-${String(primaryMonthIdx + 1).padStart(2, "0")}`;
  const compareKey =
    compareYear !== null && compareMonthIdx !== null
      ? `${compareYear}-${String(compareMonthIdx + 1).padStart(2, "0")}`
      : null;

  // Process Sales / Purchase data from API or fallback to invoices
  const { chartData, primaryTotal, compareTotal, apiGrowthPercentage } = useMemo(() => {
    const daysInPrimary = new Date(primaryYear, primaryMonthIdx + 1, 0).getDate();
    const daysInCompare =
      compareYear !== null && compareMonthIdx !== null
        ? new Date(compareYear, compareMonthIdx + 1, 0).getDate()
        : 31;
    const maxDays = Math.max(daysInPrimary, daysInCompare, 30);

    const dailyMap: Record<number, { day: number; dayFormatted: string; primarySales: number; compareSales: number }> = {};
    for (let d = 1; d <= maxDays; d++) {
      dailyMap[d] = {
        day: d,
        dayFormatted: String(d).padStart(2, "0"),
        primarySales: 0,
        compareSales: 0,
      };
    }

    const rawData = dashboardData?.body || dashboardData?.data || dashboardData;
    const activeApi = graphType === "sales" ? (rawData?.sales || rawData?.sales_data) : (rawData?.purchases || rawData?.purchases_data);

    const isUsingApi = activeApi && (
      activeApi.current_month === primaryKey ||
      activeApi.currentMonth === primaryKey ||
      activeApi.month === primaryKey ||
      activeApi.current_by_day ||
      activeApi.currentByDay
    );

    if (isUsingApi) {
      const primaryDaily = parseDailyItems(activeApi.current_by_day || activeApi.currentByDay || activeApi.current_days);
      const compareDaily = parseDailyItems(activeApi.compare_by_day || activeApi.compareByDay || activeApi.compare_days);

      Object.entries(primaryDaily).forEach(([dStr, val]) => {
        const d = Number(dStr);
        if (dailyMap[d]) dailyMap[d].primarySales = val;
      });

      if (compareKey) {
        Object.entries(compareDaily).forEach(([dStr, val]) => {
          const d = Number(dStr);
          if (dailyMap[d]) dailyMap[d].compareSales = val;
        });
      }

      const pTotal = Number(
        activeApi.current_total ?? activeApi.currentTotal ?? activeApi.total_sales ?? activeApi.total_purchases ?? activeApi.total ?? 0
      );
      const cTotal = Number(activeApi.compare_total ?? activeApi.compareTotal ?? 0);
      const growth = activeApi.growth_percentage ?? activeApi.growthPercentage ?? null;

      return {
        chartData: Object.values(dailyMap).sort((a, b) => a.day - b.day),
        primaryTotal: pTotal,
        compareTotal: cTotal,
        apiGrowthPercentage: growth !== null ? Number(growth) : null,
      };
    }

    // Fallback: Process locally from invoices array if provided
    const targetInvoices = invoices.filter((inv) => {
      const typeStr = String(inv?.type || inv?.invoice_type || inv?.invoiceType || "").toLowerCase();
      const isPur = typeStr === "purchase" || typeStr === "purchase_invoice" || inv?.is_purchase === true;
      return graphType === "purchases" ? isPur : !isPur;
    });

    let pSum = 0;
    let cSum = 0;

    targetInvoices.forEach((inv) => {
      const parsed = parseInvoiceDate(inv);
      if (!parsed) return;

      const yearMonthKey = `${parsed.year}-${String(parsed.monthIdx + 1).padStart(2, "0")}`;
      const dayNum = parsed.day;
      const amt = Number(inv.total_amount ?? inv.totalAmount ?? inv.grand_total ?? inv.grandTotal ?? inv.amount ?? inv.total ?? 0);

      if (yearMonthKey === primaryKey && dailyMap[dayNum]) {
        dailyMap[dayNum].primarySales += amt;
        pSum += amt;
      }
      if (compareKey && yearMonthKey === compareKey && dailyMap[dayNum]) {
        dailyMap[dayNum].compareSales += amt;
        cSum += amt;
      }
    });

    return {
      chartData: Object.values(dailyMap).sort((a, b) => a.day - b.day),
      primaryTotal: pSum,
      compareTotal: cSum,
      apiGrowthPercentage: null,
    };
  }, [invoices, primaryKey, compareKey, primaryYear, primaryMonthIdx, compareYear, compareMonthIdx, graphType, dashboardData]);

  // Percentage Growth Calculation
  const percentageGrowth =
    apiGrowthPercentage !== null
      ? apiGrowthPercentage
      : compareKey && compareTotal > 0
      ? ((primaryTotal - compareTotal) / compareTotal) * 100
      : primaryTotal > 0
      ? 100
      : 0;

  const handleSelectMonth = (mIdx: number) => {
    if (modalTarget === "primary") {
      setPrimaryYear(modalYear);
      setPrimaryMonthIdx(mIdx);
      setIsModalOpen(false);

      const newPrimaryKey = `${modalYear}-${String(mIdx + 1).padStart(2, "0")}`;

      // Automatically set comparison month to the preceding month if enabled
      let newCompareKey = compareKey;
      if (compareMonthIdx !== null && compareYear !== null) {
        const prevMIdx = mIdx === 0 ? 11 : mIdx - 1;
        const prevY = mIdx === 0 ? modalYear - 1 : modalYear;
        setCompareYear(prevY);
        setCompareMonthIdx(prevMIdx);
        newCompareKey = `${prevY}-${String(prevMIdx + 1).padStart(2, "0")}`;
      }

      onMonthChange?.(newPrimaryKey, newCompareKey);
    } else {
      setCompareYear(modalYear);
      setCompareMonthIdx(mIdx);
      setIsModalOpen(false);

      const newCompareKey = `${modalYear}-${String(mIdx + 1).padStart(2, "0")}`;
      onMonthChange?.(primaryKey, newCompareKey);
    }
  };

  const handleResetToCurrentMonth = () => {
    setPrimaryYear(currentYear);
    setPrimaryMonthIdx(currentMonthIdx);

    const prevDate = new Date(currentYear, currentMonthIdx - 1, 1);
    setCompareYear(prevDate.getFullYear());
    setCompareMonthIdx(prevDate.getMonth());
    setIsModalOpen(false);

    const curKey = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, "0")}`;
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    onMonthChange?.(curKey, prevKey);
  };

  const handleClearComparison = () => {
    setCompareYear(null);
    setCompareMonthIdx(null);
    setIsModalOpen(false);
    onMonthChange?.(primaryKey, null);
  };

  // Adaptive palette colors based on theme and graphType
  const chartColors = {
    grid: isDark ? "#21262D" : "#F1F5F9",
    axisText: isDark ? "#8B949E" : "#64748B",
    primaryStroke: graphType === "sales" ? (isDark ? "#A78BFA" : "#7C3AED") : (isDark ? "#FBBF24" : "#D97706"),
    compareStroke: isDark ? "#FBBF24" : "#F97316",
  };

  const isCurrentMonthPrimary = primaryYear === currentYear && primaryMonthIdx === currentMonthIdx;

  return (
    <div className="w-full bg-white dark:bg-[#161B22] border gi-divider rounded-2xl p-5 sm:p-6 shadow-xs space-y-6 select-none transition-colors duration-200" suppressHydrationWarning>
      {/* Top Header Card */}
      <div className="space-y-3">
        {/* Title, Mode Toggle, Total Amount & Growth Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
            <div className={`flex items-center gap-1.5 font-bold text-sm sm:text-base ${graphType === "sales" ? "text-purple-600 dark:text-purple-400" : "text-amber-600 dark:text-amber-400"}`}>
              {graphType === "sales" ? <IoTrendingUp className="text-base sm:text-lg" /> : <IoBagHandleOutline className="text-base sm:text-lg" />}
              <span>{graphType === "sales" ? "Sales Overview" : "Purchases Overview"}</span>
            </div>

            {/* Sales / Purchases Mode Toggle */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-[#21262D] border border-slate-200 dark:border-[#30363D]">
              <button
                type="button"
                onClick={() => setGraphType("sales")}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  graphType === "sales"
                    ? "bg-white dark:bg-[#161B22] text-purple-600 dark:text-purple-400 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                Sales
              </button>
              <button
                type="button"
                onClick={() => setGraphType("purchases")}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  graphType === "purchases"
                    ? "bg-white dark:bg-[#161B22] text-amber-600 dark:text-amber-400 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                Purchases
              </button>
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
              ₹{primaryTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>

            {compareKey && (
              <span className={`px-2 py-0.5 rounded-lg font-bold text-xs flex items-center gap-0.5 ${percentageGrowth >= 0 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-300" : "bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-300"}`}>
                <span>{percentageGrowth >= 0 ? "↗" : "↘"}</span>
                <span>{percentageGrowth >= 0 ? `+${percentageGrowth.toFixed(1)}%` : `${percentageGrowth.toFixed(1)}%`}</span>
              </span>
            )}
          </div>
        </div>

        {/* Side-by-Side Current & Compare Month Selectors on Mobile */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex-nowrap overflow-x-auto no-scrollbar">
          {/* Current / Primary Month Trigger */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setModalTarget("primary");
                setModalYear(primaryYear);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-bold text-[11px] sm:text-xs hover:bg-purple-100 dark:hover:bg-purple-900/60 transition cursor-pointer"
            >
              <IoCalendarOutline className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 shrink-0" />
              <span>{formatFullMonthName(primaryMonthIdx)} {primaryYear}</span>
              <IoChevronDown className="text-[10px] sm:text-xs shrink-0" />
            </button>

            {!isCurrentMonthPrimary && (
              <button
                type="button"
                onClick={handleResetToCurrentMonth}
                title="Reset to current month"
                className="inline-flex items-center gap-1 p-1 sm:px-2 sm:py-1 rounded-lg bg-slate-100 dark:bg-[#21262D] text-slate-600 dark:text-slate-300 text-[10px] sm:text-[11px] font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer shrink-0"
              >
                <IoRefreshOutline className="text-xs" />
                <span className="hidden sm:inline">Current</span>
              </button>
            )}
          </div>

          {/* Comparison Month Trigger */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setModalTarget("compare");
                setModalYear(compareYear || primaryYear);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-bold text-[11px] sm:text-xs hover:bg-amber-100 dark:hover:bg-amber-900/60 transition cursor-pointer"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>
                {compareMonthIdx !== null
                  ? `${formatFullMonthName(compareMonthIdx)} ${compareYear}`
                  : "Compare Month"}
              </span>
              <IoChevronDown className="text-[10px] sm:text-xs shrink-0" />
            </button>

            {compareKey && (
              <span className="text-[11px] sm:text-xs font-mono font-bold text-[#F97316] dark:text-orange-400 shrink-0">
                ₹{compareTotal.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div ref={containerRef} className="w-full h-[240px] sm:h-[260px] min-h-[240px]" suppressHydrationWarning>
        <ResponsiveContainer
          key={chartWidth || "initial"}
          width="100%"
          height="100%"
          minWidth={100}
          initialDimension={{ width: 320, height: 240 }}
          debounce={50}
        >
          <AreaChart data={chartData} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />

            <XAxis
              dataKey="dayFormatted"
              tickLine={false}
              axisLine={false}
              tick={{ fill: chartColors.axisText, fontSize: 11 }}
              padding={{ left: 12, right: 12 }}
              interval="preserveStartEnd"
              minTickGap={20}
              dy={8}
            />

            <YAxis
              orientation="right"
              tickLine={false}
              axisLine={false}
              tick={{ fill: chartColors.axisText, fontSize: 11 }}
              width={36}
              dx={4}
              tickFormatter={(val) =>
                val >= 1000
                  ? `${(val / 1000).toFixed(0)}K`
                  : `${val}`
              }
            />

            <Tooltip
              content={(props: any) => (
                <CustomTooltip
                  {...props}
                  primaryLabel={formatFullMonthName(primaryMonthIdx)}
                  compareLabel={compareMonthIdx !== null ? formatFullMonthName(compareMonthIdx) : null}
                />
              )}
            />

            {/* Primary Month Area */}
            <Area
              type="monotone"
              dataKey="primarySales"
              stroke={chartColors.primaryStroke}
              strokeWidth={3}
              activeDot={{ r: 5, strokeWidth: 2, fill: isDark ? "#161B22" : "#ffffff" }}
              fillOpacity={0}
              fill="none"
            />

            {/* Comparison Month Line */}
            {compareKey && (
              <Area
                type="monotone"
                dataKey="compareSales"
                stroke={chartColors.compareStroke}
                strokeWidth={2.5}
                strokeDasharray="4 4"
                activeDot={{ r: 4, strokeWidth: 2, fill: isDark ? "#161B22" : "#ffffff" }}
                fillOpacity={0}
                fill="none"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Month Selector Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-white dark:bg-[#161B22] rounded-[32px] shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 border gi-divider">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-[#111827] dark:text-white tracking-tight">
                  {modalTarget === "primary" ? "Select Data Month" : "Compare with"}
                </h3>
                <p className="text-xs text-[#9CA3AF] dark:text-slate-400 mt-1">
                  {modalTarget === "primary"
                    ? "Choose primary month to display graph data"
                    : "Select a month to compare sales/purchase data"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#9CA3AF] hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <IoClose className="text-2xl" />
              </button>
            </div>

            {/* Target Selector Switch inside Modal */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#21262D] border border-slate-200 dark:border-[#30363D]">
              <button
                type="button"
                onClick={() => {
                  setModalTarget("primary");
                  setModalYear(primaryYear);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                  modalTarget === "primary"
                    ? "bg-white dark:bg-[#161B22] text-purple-600 dark:text-purple-400 shadow-xs"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Primary Month
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalTarget("compare");
                  setModalYear(compareYear || primaryYear);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                  modalTarget === "compare"
                    ? "bg-white dark:bg-[#161B22] text-amber-600 dark:text-amber-400 shadow-xs"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Compare Month
              </button>
            </div>

            {/* Year Navigation Bar */}
            <div className="bg-[#F4F5FF] dark:bg-[#1C2333] p-2.5 rounded-2xl flex items-center justify-between">
              <button
                type="button"
                onClick={() => setModalYear(modalYear - 1)}
                className="h-8 w-8 rounded-full bg-white dark:bg-[#0D1117] text-slate-800 dark:text-slate-200 shadow-xs flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <IoChevronBack className="text-sm" />
              </button>

              <div className="flex items-center gap-2 font-extrabold text-[#111827] dark:text-slate-100 text-base">
                <IoCalendarOutline className="text-[#7C3AED] dark:text-purple-400 text-lg" />
                <span>{modalYear}</span>
              </div>

              <button
                type="button"
                onClick={() => setModalYear(modalYear + 1)}
                className="h-8 w-8 rounded-full bg-white dark:bg-[#0D1117] text-slate-800 dark:text-slate-200 shadow-xs flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <IoChevronForward className="text-sm" />
              </button>
            </div>

            {/* 12 Months Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {MONTH_SHORT.map((mShort, idx) => {
                const isCurrentMonth = modalYear === currentYear && idx === currentMonthIdx;
                const isSelectedPrimary = primaryYear === modalYear && primaryMonthIdx === idx;
                const isSelectedCompare = compareYear === modalYear && compareMonthIdx === idx;
                const isFutureMonth = modalYear > currentYear || (modalYear === currentYear && idx > currentMonthIdx);

                let cardStyle = "bg-[#F5F6F8] dark:bg-[#1C2333] text-[#111827] dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-[#252D3F] font-bold";

                if (modalTarget === "primary" && isSelectedPrimary) {
                  cardStyle = "border-2 border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold";
                } else if (modalTarget === "compare" && isSelectedCompare) {
                  cardStyle = "border-2 border-[#F97316] bg-[#FFF6F0] dark:bg-amber-950/40 text-[#F97316] dark:text-orange-400 font-bold";
                } else if (isSelectedPrimary) {
                  cardStyle = "border border-purple-400 bg-purple-50/60 dark:bg-purple-950/20 text-purple-600 dark:text-purple-300 font-bold";
                } else if (isSelectedCompare) {
                  cardStyle = "border border-amber-400 bg-amber-50/60 dark:bg-amber-950/20 text-amber-600 dark:text-amber-300 font-bold";
                } else if (isFutureMonth) {
                  cardStyle = "bg-[#F9FAFB] dark:bg-[#0D1117] text-[#D1D5DB] dark:text-slate-600 cursor-not-allowed font-medium";
                }

                return (
                  <button
                    key={mShort}
                    type="button"
                    disabled={isFutureMonth}
                    onClick={() => handleSelectMonth(idx)}
                    className={`py-3.5 sm:py-4 rounded-2xl text-xs sm:text-sm flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${cardStyle}`}
                  >
                    <div className="flex items-center gap-1">
                      <span>{mShort}</span>
                      {((modalTarget === "primary" && isSelectedPrimary) || (modalTarget === "compare" && isSelectedCompare)) && (
                        <IoCheckmark className="text-sm stroke-[2]" />
                      )}
                    </div>
                    {isCurrentMonth && (
                      <span className="text-[10px] font-semibold text-[#7C3AED] dark:text-purple-400">
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleResetToCurrentMonth}
                className="flex-1 py-3 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center gap-1 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition cursor-pointer"
              >
                <IoRefreshOutline className="text-sm" />
                <span>Reset Current Month</span>
              </button>

              {modalTarget === "compare" && (
                <button
                  type="button"
                  onClick={handleClearComparison}
                  className="py-3 px-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-1 hover:bg-rose-100 transition cursor-pointer"
                >
                  <IoClose className="text-sm" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
