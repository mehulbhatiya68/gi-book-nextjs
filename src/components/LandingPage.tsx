"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IoDocumentTextOutline,
  IoCubeOutline,
  IoWalletOutline,
  IoLocationOutline,
  IoPeopleOutline,
  IoStatsChartOutline,
  IoShieldCheckmarkOutline,
  IoFlashOutline,
  IoCheckmarkCircle,
  IoChevronDown,
  IoSunnyOutline,
  IoMoonOutline,
  IoMenu,
  IoClose,
  IoArrowForward,
  IoReceiptOutline,
  IoSparklesOutline,
  IoBusinessOutline,
  IoBarcodeOutline,
  IoTrendingUpOutline,
  IoLockClosedOutline,
  IoPrintOutline,
  IoShareSocialOutline,
  IoCheckmark,
  IoChevronForward,
  IoCloudDoneOutline,
  IoSwapHorizontalOutline,
  IoLayersOutline,
} from "react-icons/io5";
import { usePreferences } from "@/lib/hooks/usePreferences";
import { useAuth } from "@/context/AuthContext";
import { subscriptionApi } from "@/lib/api/subscription";

export default function LandingPage() {
  const router = useRouter();
  const { theme, setTheme } = usePreferences();
  const { isLoggedIn } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeatureTab, setActiveFeatureTab] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [previewPeriod, setPreviewPeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly");

  // Backend Subscription Plans State
  const [backendPlans, setBackendPlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  // The 8 Core ERP Features matching the backend quota system
  const ALL_EIGHT_FEATURES = [
    { slug: "invoice", name: "Invoices", defaultQuota: 10 },
    { slug: "ledger", name: "Ledgers", defaultQuota: 10 },
    { slug: "transaction", name: "Transactions", defaultQuota: 10 },
    { slug: "item", name: "Items & Inventory", defaultQuota: 10 },
    { slug: "business", name: "Business Profiles", defaultQuota: 10 },
    { slug: "project", name: "Projects", defaultQuota: 10 },
    { slug: "site", name: "Sites", defaultQuota: 10 },
    { slug: "staff", name: "Staff Members", defaultQuota: 10 },
  ];

  useEffect(() => {
    let isMounted = true;
    async function fetchPlans() {
      try {
        const res = await subscriptionApi.getPlans({ silentError: true });
        if (isMounted) {
          const plans =
            res?.body?.plans ||
            res?.plans ||
            (Array.isArray(res?.body) ? res.body : Array.isArray(res) ? res : []);
          if (Array.isArray(plans) && plans.length > 0) {
            setBackendPlans(plans);
          } else {
            // Default backend schema fallback
            setBackendPlans([
              {
                id: "plan-business-standard",
                name: "Standard Business Plan",
                final_price: 800,
                price: 800,
                duration_type: "monthly",
                features: ALL_EIGHT_FEATURES.map((f) => ({
                  name: f.name,
                  quantity: f.defaultQuota,
                })),
              },
            ]);
          }
        }
      } catch (_) {
        if (isMounted) {
          setBackendPlans([
            {
              id: "plan-business-standard",
              name: "Standard Business Plan",
              final_price: 800,
              price: 800,
              duration_type: "monthly",
              features: ALL_EIGHT_FEATURES.map((f) => ({
                name: f.name,
                quantity: f.defaultQuota,
              })),
            },
          ]);
        }
      } finally {
        if (isMounted) setIsLoadingPlans(false);
      }
    }

    fetchPlans();
    return () => {
      isMounted = false;
    };
  }, []);

  // Realistic sample stats for interactive product walkthrough
  const periodStats = {
    monthly: {
      sales: "₹2,48,500",
      receivables: "₹42,000",
      receivableInvoices: "3 pending bills",
      payables: "₹18,500",
      payableBills: "2 due soon",
      cashBank: "₹1,86,500",
      chartHeights: [45, 62, 58, 75, 82, 95, 88, 92, 105, 115, 128, 140],
    },
    quarterly: {
      sales: "₹7,24,000",
      receivables: "₹58,000",
      receivableInvoices: "5 pending bills",
      payables: "₹31,000",
      payableBills: "4 due soon",
      cashBank: "₹3,42,000",
      chartHeights: [70, 85, 95, 110, 115, 130, 125, 140, 135, 150, 160, 175],
    },
    yearly: {
      sales: "₹28,45,000",
      receivables: "₹74,500",
      receivableInvoices: "8 pending bills",
      payables: "₹52,000",
      payableBills: "6 due soon",
      cashBank: "₹7,28,000",
      chartHeights: [85, 95, 110, 125, 135, 145, 155, 165, 175, 185, 195, 210],
    },
  };

  const currentStats = periodStats[previewPeriod];

  // Feature Tabs Data with realistic UI showcases
  const features = [
    {
      id: "invoicing",
      title: "GST Invoicing & Billing",
      badge: "GST Compliant",
      icon: IoDocumentTextOutline,
      color: "from-purple-500 to-indigo-600",
      headline: "Create Professional GST Invoices with Automated Tax Calculation",
      description:
        "Generate fully compliant Tax Invoices, Quotations, Proforma Bills, and Credit/Debit Notes with automated CGST, SGST, and IGST rate calculations, HSN/SAC lookups, and instant PDF downloads.",
      highlights: [
        "Automated Tax Splits (CGST + SGST or IGST) based on supplier and customer state",
        "HSN / SAC Code library with instant search and auto-fill",
        "Customized logo, signature, payment UPI QR code, and bank details on bill",
        "Share directly via WhatsApp or download print-ready PDF",
      ],
      previewType: "invoice",
    },
    {
      id: "inventory",
      title: "Inventory & Barcode Scanner",
      badge: "Real-Time Stock",
      icon: IoCubeOutline,
      color: "from-amber-500 to-orange-600",
      headline: "End-to-End Stock Tracking & Instant Barcode Lookups",
      description:
        "Keep accurate track of goods across warehouses. Get alerted before stocks run dry, scan barcodes with your smartphone camera or USB scanner, and track batch numbers and unit conversions seamlessly.",
      highlights: [
        "Real-time stock valuation based on purchase rates and selling price",
        "Low-stock alert triggers to prevent stockouts and lost sales",
        "Barcode & QR generator with instant camera scanner integration",
        "Multi-unit support (kg, bags, meters, pieces, boxes, bundles)",
      ],
      previewType: "inventory",
    },
    {
      id: "ledgers",
      title: "Customer & Vendor Ledgers",
      badge: "Double-Entry",
      icon: IoWalletOutline,
      color: "from-emerald-500 to-teal-600",
      headline: "Account Statements & Running Balance Tracking",
      description:
        "Complete double-entry accounting made effortless. Maintain clear party records, track outstanding dues, send payment reminders on WhatsApp, and view chronological debit/credit histories.",
      highlights: [
        "Real-time Party Outstanding (To Collect vs To Pay) balance cards",
        "One-click statement export in PDF and Excel formats",
        "Automated WhatsApp payment reminders with invoice attachment",
        "Credit limit control with automatic billing restriction warnings",
      ],
      previewType: "ledger",
    },
    {
      id: "sites",
      title: "Site & Project Management",
      badge: "Cost Centers",
      icon: IoLocationOutline,
      color: "from-blue-500 to-cyan-600",
      headline: "Track Multi-Site Projects, Expenses & Profitability",
      description:
        "Purpose-built for construction contractors, infrastructure firms, and project-based enterprises. Track material inwards, site labor expenses, subcontractor payments, and profit margins per site.",
      highlights: [
        "Dedicated cost-center allocation for each project and construction site",
        "Site-wise material consumption and supplier ledger segregation",
        "Project budget vs actual spend variance monitoring",
        "Instant profitability statements per site with milestone tracking",
      ],
      previewType: "project",
    },
    {
      id: "payments",
      title: "Payments & Cash Flow",
      badge: "Cash & Bank",
      icon: IoReceiptOutline,
      color: "from-rose-500 to-pink-600",
      headline: "Seamless Cash In, Cash Out & Bank Reconciliation",
      description:
        "Record payments made or received via UPI, NEFT, RTGS, Cheque, or Cash. Issue instant numbered receipts, link payments directly to invoices, and maintain an audit-proof cash book.",
      highlights: [
        "Multi-mode payment recording (UPI, Bank, Cash, Cheque)",
        "Instant digital payment receipts with unique voucher numbering",
        "Real-time cash and bank ledger balance reconciliation",
        "Direct link between payment receipts and invoice settlement",
      ],
      previewType: "payment",
    },
    {
      id: "multi-business",
      title: "Multi-Business & Staff Roles",
      badge: "Enterprise Ready",
      icon: IoPeopleOutline,
      color: "from-violet-500 to-purple-600",
      headline: "Manage Multiple Companies & Granular Staff Access",
      description:
        "Control several business entities or branches from a single login. Empower staff with role-based permissions (Admin, Accountant, Billing Clerk, Viewer) to protect confidential profit margins.",
      highlights: [
        "1-Click company switching without logging out or multiple tabs",
        "Granular permission matrix (view/create/edit/delete per module)",
        "Hide purchase costs and financial reports from sales staff",
        "Complete activity audit log tracking who created or edited bills",
      ],
      previewType: "roles",
    },
  ];

  // FAQ Items
  const faqs = [
    {
      q: "Is GI Book compliant with Indian GST laws and e-invoicing?",
      a: "Yes, 100%. GI Book is built to comply with Indian GST rules. It automatically computes CGST, SGST, and IGST based on the supplier and customer state, includes HSN/SAC codes, and provides GSTR-1, GSTR-3B, and Daybook ready reports.",
    },
    {
      q: "Can I manage multiple businesses or firms with one login?",
      a: "Yes. GI Book includes built-in Multi-Business management. You can add distinct business entities (each with its own GSTIN, logo, and address) and switch between them in one click from the top bar.",
    },
    {
      q: "How does staff permission management work?",
      a: "You can invite employees, accountants, and sales staff with custom role privileges. For instance, you can allow a billing clerk to only generate sales bills while hiding purchase costs, vendor balances, and financial profit & loss reports.",
    },
    {
      q: "Can I use GI Book on mobile phones and tablets?",
      a: "Yes. GI Book is fully responsive and optimized for mobile devices, tablets, and desktop screens. You can scan barcodes with your smartphone camera, generate invoices on site, and check party ledgers on the go.",
    },
    {
      q: "How safe is my financial and business data?",
      a: "Your data is secured with enterprise-grade 256-bit SSL encryption. We perform automated cloud backups and follow strict privacy standards so your accounting data is always private, secure, and available 24/7.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D1117] text-slate-900 dark:text-zinc-100 selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* ── Sticky Top Navigation ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 dark:bg-[#0D1117]/85 border-b border-slate-200/80 dark:border-zinc-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="relative flex items-center justify-center">
              <img
                src="/logo.png"
                alt="GI Book"
                className="h-8 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <IoSparklesOutline className="text-xs" /> ERP
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-sm font-medium text-slate-600 dark:text-zinc-300">
            <a
              href="#features"
              className="px-3 py-2 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition"
            >
              Features
            </a>
            <a
              href="#demo"
              className="px-3 py-2 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition"
            >
              Live Demo
            </a>
            <a
              href="#why-us"
              className="px-3 py-2 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition"
            >
              Why GI Book
            </a>
            <a
              href="#pricing"
              className="px-3 py-2 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition"
            >
              Subscription
            </a>
            <a
              href="#faq"
              className="px-3 py-2 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition"
            >
              FAQ
            </a>
          </nav>

          {/* Action Buttons (Login, Sign-up, Theme) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <IoSunnyOutline className="text-lg text-amber-400" />
              ) : (
                <IoMoonOutline className="text-lg text-indigo-600" />
              )}
            </button>

            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5"
              >
                <span>Go to Dashboard</span>
                <IoArrowForward className="text-sm" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                >
                  Sign In
                </Link>

                <Link
                  href="/sign-up"
                  className="px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:opacity-95 shadow-md shadow-indigo-500/25 transition flex items-center gap-1.5"
                >
                  <span>Get Started</span>
                  <IoArrowForward className="text-sm hidden sm:inline-block" />
                </Link>
              </>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 md:hidden text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              aria-label="Open Mobile Menu"
            >
              {mobileMenuOpen ? <IoClose className="text-xl" /> : <IoMenu className="text-xl" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-[#0D1117]/95 backdrop-blur-xl px-4 py-4 space-y-2">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              Features & Capabilities
            </a>
            <a
              href="#demo"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              Live Interactive Demo
            </a>
            <a
              href="#why-us"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              Why Choose GI Book
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              Backend Subscription
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              FAQ
            </a>

            <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full text-center py-2.5 rounded-xl text-sm font-semibold border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Sign In to Account
              </Link>
              <Link
                href="/sign-up"
                className="w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md"
              >
                Create Account
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[400px] sm:h-[600px] bg-gradient-to-tr from-indigo-500/15 via-purple-500/15 to-pink-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Announcement Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs mb-6 sm:mb-8">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
            <span>Smart Accounting, Billing & Inventory for Modern Businesses</span>
            <IoChevronForward className="text-xs opacity-70" />
          </div>

          {/* Hero Main Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.15] sm:leading-[1.12]">
            Complete Business ERP, GST Invoicing &{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Ledger Management
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 sm:mt-6 text-sm sm:text-lg lg:text-xl text-slate-600 dark:text-zinc-400 max-w-2xl sm:max-w-3xl mx-auto font-normal leading-relaxed">
            Eliminate messy spreadsheets and outdated accounting software. Manage sales invoices,
            track customer & vendor ledgers, monitor stock with barcode scanning, oversee multi-site
            construction projects, and control cash flow with real-time clarity.
          </p>

          {/* Dual CTAs */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-md mx-auto">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Get Started Now</span>
              <IoArrowForward className="text-base" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm sm:text-base border border-slate-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <IoLockClosedOutline className="text-base text-indigo-500" />
              <span>Sign In to Portal</span>
            </Link>
          </div>

          {/* Core Feature Capability Badges */}
          <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-medium">
            <div className="flex items-center gap-1.5">
              <IoCheckmarkCircle className="text-emerald-500 text-base" />
              <span>GST & E-Way Ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <IoCheckmarkCircle className="text-emerald-500 text-base" />
              <span>Multi-Business Profiles</span>
            </div>
            <div className="flex items-center gap-1.5">
              <IoCheckmarkCircle className="text-emerald-500 text-base" />
              <span>Real-Time Cloud Sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <IoCheckmarkCircle className="text-emerald-500 text-base" />
              <span>Bank-Grade 256-Bit SSL</span>
            </div>
          </div>
        </div>

        {/* ── Interactive Live Preview Mockup (The Hero Visual Showcase) ── */}
        <div id="demo" className="mt-12 sm:mt-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl sm:rounded-3xl p-2 sm:p-4 bg-gradient-to-b from-indigo-500/20 via-purple-500/10 to-transparent border border-slate-200 dark:border-zinc-800 shadow-2xl shadow-indigo-500/10 backdrop-blur-md">
            {/* Mockup Window Chrome Header */}
            <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-inner">
              <div className="px-4 py-3 bg-slate-100/80 dark:bg-zinc-900/80 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  <span className="ml-2 text-xs font-mono text-slate-500 dark:text-zinc-400 font-medium hidden sm:inline">
                    Interactive Preview — Live Sample Data
                  </span>
                </div>

                {/* Period Selector Tabs */}
                <div className="flex items-center p-0.5 rounded-lg bg-slate-200/80 dark:bg-zinc-800 text-[11px] font-semibold text-slate-600 dark:text-zinc-300">
                  <button
                    type="button"
                    onClick={() => setPreviewPeriod("monthly")}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      previewPeriod === "monthly"
                        ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-white shadow-xs"
                        : "hover:text-indigo-600"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewPeriod("quarterly")}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      previewPeriod === "quarterly"
                        ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-white shadow-xs"
                        : "hover:text-indigo-600"
                    }`}
                  >
                    Quarterly
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewPeriod("yearly")}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      previewPeriod === "yearly"
                        ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-white shadow-xs"
                        : "hover:text-indigo-600"
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>

              {/* Mockup Dashboard Content Body */}
              <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50/60 dark:bg-[#0D1117]/60">
                {/* 4 Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Card 1: Sales */}
                  <div className="p-4 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 text-xs font-medium">
                      <span>Total Sales</span>
                      <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        <IoTrendingUpOutline className="text-sm" />
                      </span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                      {currentStats.sales}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                      Verified GST billing
                    </p>
                  </div>

                  {/* Card 2: Receivables */}
                  <div className="p-4 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 text-xs font-medium">
                      <span>To Collect (Receivable)</span>
                      <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                        <IoWalletOutline className="text-sm" />
                      </span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                      {currentStats.receivables}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                      {currentStats.receivableInvoices}
                    </p>
                  </div>

                  {/* Card 3: Payables */}
                  <div className="p-4 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 text-xs font-medium">
                      <span>To Pay (Payable)</span>
                      <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                        <IoReceiptOutline className="text-sm" />
                      </span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
                      {currentStats.payables}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                      {currentStats.payableBills}
                    </p>
                  </div>

                  {/* Card 4: Cash & Bank */}
                  <div className="p-4 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 text-xs font-medium">
                      <span>Cash & Bank Balance</span>
                      <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                        <IoStatsChartOutline className="text-sm" />
                      </span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                      {currentStats.cashBank}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                      Live ledger balances
                    </p>
                  </div>
                </div>

                {/* Visual Chart & Activity Feed Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Left: Interactive Revenue Bar Chart Visual */}
                  <div className="lg:col-span-2 p-4 sm:p-5 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200">
                          Sales Inflow & Trend Analysis
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                          Automated GST Sales & Payment ledger sync
                        </p>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-md">
                        Interactive View
                      </span>
                    </div>

                    {/* Bar chart mockup */}
                    <div className="h-44 sm:h-52 flex items-end justify-between gap-1 sm:gap-2 pt-6 pb-2 px-1 border-b border-slate-200 dark:border-zinc-800">
                      {[
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec",
                        "Jan",
                        "Feb",
                        "Mar",
                      ].map((m, idx) => {
                        const h = currentStats.chartHeights[idx] || 60;
                        return (
                          <div key={m} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                            <div
                              style={{ height: `${h}px` }}
                              className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-indigo-600 to-purple-500 opacity-80 group-hover:opacity-100 transition-all duration-300"
                            />
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                              {m}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Activity Stream Mockup */}
                  <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200">
                        Recent Transactions
                      </h4>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        Live Feed
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-zinc-200">
                            Rajesh Steel & Hardware
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">INV-2026-089</span>
                        </div>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          +₹64,500
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-zinc-200">
                            Ambica Electricals
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">PUR-442</span>
                        </div>
                        <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                          -₹38,200
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-zinc-200">
                            Patel Infrastructure
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">PRJ-SITE-012</span>
                        </div>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          +₹1,20,000
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Core Capabilities Highlight Row ── */}
      <section className="border-y border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#161B22] py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto text-xl">
                <IoDocumentTextOutline />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">GST Invoicing</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">CGST, SGST & IGST Compliant</p>
            </div>
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-xl">
                <IoWalletOutline />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">Party Ledgers</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Double-Entry Statements</p>
            </div>
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-xl">
                <IoCubeOutline />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">Smart Inventory</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Barcode & Low-Stock Alerts</p>
            </div>
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto text-xl">
                <IoBusinessOutline />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">Multi-Business</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Manage Multiple Companies</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Core Features Interactive Showcase ── */}
      <section id="features" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            Interactive Feature Explorer
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-4 tracking-tight">
            Everything Your Business Needs to Run Smoothly
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 mt-3">
            Click on each module below to explore real examples of how GI Book simplifies your daily
            accounting, billing, and operational workflows.
          </p>
        </div>

        {/* Feature Tab Selector Pills */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-8">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            const isActive = activeFeatureTab === index;
            return (
              <button
                key={feat.id}
                type="button"
                onClick={() => setActiveFeatureTab(index)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                    : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                }`}
              >
                <Icon className={`text-base ${isActive ? "text-white" : "text-indigo-500"}`} />
                <span>{feat.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Feature Showcase Card */}
        {(() => {
          const activeFeat = features[activeFeatureTab];
          return (
            <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800 p-6 sm:p-10 lg:p-12 shadow-xl shadow-slate-200/50 dark:shadow-none grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Feature Details */}
              <div className="lg:col-span-5 space-y-5">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {activeFeat.badge}
                </span>
                <h3 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-snug">
                  {activeFeat.headline}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 leading-relaxed">
                  {activeFeat.description}
                </p>

                <ul className="space-y-3 pt-2">
                  {activeFeat.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-zinc-300">
                      <span className="p-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                        <IoCheckmark className="text-sm" />
                      </span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4 flex items-center gap-4">
                  <Link
                    href="/sign-up"
                    className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-md shadow-indigo-500/20"
                  >
                    Get Started
                  </Link>
                  <Link
                    href="/login"
                    className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>Sign In to Access</span>
                    <IoArrowForward className="text-xs" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Realistic Live Example Mockup */}
              <div className="lg:col-span-7">
                {activeFeat.previewType === "invoice" && (
                  <div className="rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 p-4 sm:p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                          TAX INVOICE SAMPLE
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          #INV-2026-104
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        PAID & CLEARED
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400 text-[10px]">Billed To:</p>
                        <p className="font-bold text-slate-800 dark:text-zinc-200">Krishna Enterprises</p>
                        <p className="text-slate-500 text-[11px]">GSTIN: 24AAACK1234D1Z8</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[10px]">Invoice Date:</p>
                        <p className="font-semibold text-slate-800 dark:text-zinc-200">14 Oct, 2026</p>
                        <p className="text-slate-500 text-[11px]">Due: On Receipt</p>
                      </div>
                    </div>

                    {/* Invoice Item Table */}
                    <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-[#161B22] text-xs">
                      <div className="grid grid-cols-12 bg-slate-100 dark:bg-zinc-800 p-2 font-semibold text-slate-700 dark:text-zinc-300">
                        <span className="col-span-5">Item Description</span>
                        <span className="col-span-2 text-center">HSN</span>
                        <span className="col-span-2 text-right">Qty</span>
                        <span className="col-span-3 text-right">Amount (₹)</span>
                      </div>
                      <div className="grid grid-cols-12 p-2 border-t border-slate-100 dark:border-zinc-800">
                        <span className="col-span-5 font-medium">TMT Steel Bar 16mm (Fe 550)</span>
                        <span className="col-span-2 text-center text-slate-400 font-mono">7214</span>
                        <span className="col-span-2 text-right font-mono">2.5 MT</span>
                        <span className="col-span-3 text-right font-mono font-semibold">1,25,000.00</span>
                      </div>
                      <div className="grid grid-cols-12 p-2 border-t border-slate-100 dark:border-zinc-800">
                        <span className="col-span-5 font-medium">Ultratech Super Cement Grade 53</span>
                        <span className="col-span-2 text-center text-slate-400 font-mono">2523</span>
                        <span className="col-span-2 text-right font-mono">150 Bags</span>
                        <span className="col-span-3 text-right font-mono font-semibold">57,000.00</span>
                      </div>
                    </div>

                    {/* Tax Breakdown */}
                    <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-xs font-mono">
                      <div className="space-y-0.5 text-slate-600 dark:text-zinc-400 text-[11px]">
                        <p>Taxable Subtotal: ₹1,82,000.00</p>
                        <p>CGST (9%) + SGST (9%): ₹32,760.00</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block font-sans font-bold">
                          Grand Total
                        </span>
                        <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                          ₹2,14,760.00
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeFeat.previewType === "inventory" && (
                  <div className="rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 p-4 sm:p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                          LIVE INVENTORY SNAPSHOT
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          Central Godown Stock Status
                        </h4>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                        <IoBarcodeOutline className="text-lg text-indigo-500" />
                        <span>Barcode Enabled</span>
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="p-3 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                            TMT Steel Rods (Fe 500D)
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">SKU: BAR-TMT-12MM</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            IN STOCK (450 MT)
                          </span>
                          <p className="text-xs font-mono font-semibold text-slate-600 dark:text-zinc-400 mt-0.5">
                            ₹52,000 / MT
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                            Ultratech Weather Plus Cement
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">SKU: CEM-UT-WP</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 animate-pulse">
                            LOW STOCK (12 Bags)
                          </span>
                          <p className="text-xs font-mono font-semibold text-slate-600 dark:text-zinc-400 mt-0.5">
                            ₹390 / Bag
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                            Electrical Conduit Pipes 25mm
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">SKU: ELEC-PIPE-25</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            IN STOCK (850 Pcs)
                          </span>
                          <p className="text-xs font-mono font-semibold text-slate-600 dark:text-zinc-400 mt-0.5">
                            ₹85 / Pc
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeFeat.previewType === "ledger" && (
                  <div className="rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 p-4 sm:p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                          PARTY LEDGER STATEMENT
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          Mahadev Hardware & Building Materials
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Closing Balance</span>
                        <span className="text-xs sm:text-sm font-bold font-mono text-emerald-600">
                          ₹1,45,000 (To Receive)
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400">10 Oct, 2026</span>
                          <p className="font-semibold text-slate-800 dark:text-zinc-200">
                            Sales Invoice #INV-2026-095
                          </p>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-rose-600 font-bold block">+₹85,000.00 (Dr)</span>
                          <span className="text-[10px] text-slate-400">Bal: ₹2,45,000</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400">12 Oct, 2026</span>
                          <p className="font-semibold text-slate-800 dark:text-zinc-200">
                            Payment Received (UPI / HDFC Bank)
                          </p>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-emerald-600 font-bold block">-₹1,00,000.00 (Cr)</span>
                          <span className="text-[10px] text-slate-400">Bal: ₹1,45,000</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5"
                      >
                        <IoPrintOutline />
                        <span>Print Statement</span>
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                      >
                        <IoShareSocialOutline />
                        <span>Send WhatsApp Reminder</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeFeat.previewType === "project" && (
                  <div className="rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 p-4 sm:p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                          SITE / PROJECT MONITOR
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          Crystal Heights Commercial Tower
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        ON SCHEDULE
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span className="text-slate-500">Project Budget Consumed</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                            ₹28,40,000 / ₹45,00,000 (63%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full w-[63%]" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                        <div className="p-3 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800">
                          <p className="text-[11px] text-slate-400">Materials Inward</p>
                          <p className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                            ₹18,60,000
                          </p>
                          <span className="text-[10px] text-slate-500">Cement, Steel, Bricks</span>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800">
                          <p className="text-[11px] text-slate-400">Site Labor & Subcontract</p>
                          <p className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                            ₹9,80,000
                          </p>
                          <span className="text-[10px] text-slate-500">Civil & Electrical works</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeFeat.previewType === "payment" && (
                  <div className="rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 p-4 sm:p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                          PAYMENT RECEIPT VOUCHER
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          #RCP-2026-0812
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        VERIFIED
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800 space-y-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Received From:</span>
                        <span className="font-bold text-slate-800 dark:text-zinc-200">
                          Shree Ganesh Traders
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Payment Mode:</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          UPI / HDFC Current A/C
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Settled Against:</span>
                        <span className="font-mono text-slate-700 dark:text-zinc-300">
                          #INV-2026-078 & #INV-2026-081
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                        <span className="font-bold text-slate-700 dark:text-zinc-300">Amount Received:</span>
                        <span className="text-base sm:text-lg font-bold font-mono text-emerald-600">
                          ₹95,000.00
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeFeat.previewType === "roles" && (
                  <div className="rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 p-4 sm:p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                          MULTI-ROLE ACCESS CONTROL
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          Staff Permission Management
                        </h4>
                      </div>
                      <span className="text-xs font-semibold text-indigo-600">Active Roles</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-zinc-200">Accountant</p>
                          <span className="text-[10px] text-slate-400">Ledgers, Bank Reconciliation & Bills</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          Reports Allowed
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-zinc-200">Billing Clerk</p>
                          <span className="text-[10px] text-slate-400">Counter Sales & Instant Invoices</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          Purchase Price Hidden
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-zinc-200">Site Supervisor</p>
                          <span className="text-[10px] text-slate-400">Material Inwards & Site Expenses</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          Site Expenses Only
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </section>

      {/* ── Why Choose GI Book Section ── */}
      <section id="why-us" className="py-16 sm:py-24 bg-slate-100/60 dark:bg-[#161B22]/60 border-y border-slate-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Built for Modern Enterprises
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-4 tracking-tight">
              Why Businesses Rely on GI Book
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 mt-3">
              We engineered GI Book to be clean and intuitive, yet powerful enough to run full-scale
              business operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800 hover:border-indigo-500/50 transition group shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                <IoFlashOutline />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Ultra-Fast Performance
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Zero lag or sluggish page reloads. Optimized with Next.js 16 to execute lookups,
                invoice printing, and ledger searches instantly.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800 hover:border-indigo-500/50 transition group shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                <IoBusinessOutline />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Multi-Business Ready
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Run wholesale, retail, services, or construction companies from a single dashboard.
                Switch between GSTIN profiles without logging out.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800 hover:border-indigo-500/50 transition group shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                <IoShieldCheckmarkOutline />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Bank-Grade Security
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-2 leading-relaxed">
                256-bit SSL encryption and automated cloud backups keep your business balance sheet
                safe from device theft, crashes, or data loss.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800 hover:border-indigo-500/50 transition group shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                <IoDocumentTextOutline />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Effortless GST Filing
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-2 leading-relaxed">
                GSTR-1 and GSTR-3B summary reports. Export clean data ready for your Chartered
                Accountant (CA) without manual cross-checks.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800 hover:border-indigo-500/50 transition group shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                <IoBarcodeOutline />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Mobile Barcode Scanner
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Scan product barcodes right from your phone camera. Rapidly add items into invoices
                during rush hours and keep inventory synced.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800 hover:border-indigo-500/50 transition group shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                <IoPeopleOutline />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Granular Staff Roles
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Keep sensitive financial margins confidential. Restrict staff to their job role with
                flexible permission toggles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Backend API Subscription Plans Section ── */}
      <section id="pricing" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            Cloud ERP Subscription
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-4 tracking-tight">
            Backend API Subscription Plans
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 mt-3">
            Official subscription tiers directly connected to our cloud database and accounting quotas.
          </p>
        </div>

        {/* Dynamic Backend Plans Grid */}
        <div className="max-w-3xl mx-auto">
          {isLoadingPlans ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                Loading official backend subscription plans...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {backendPlans.map((plan: any) => {
                const planName = plan.name || "Standard Business Plan";
                const price = Number(plan.final_price ?? plan.price ?? 800);
                const duration = (plan.duration_type || "monthly").toUpperCase();

                // Normalize features according to the backend 8-feature schema
                const rawFeatures = plan.features || [];
                const featureList = ALL_EIGHT_FEATURES.map((def) => {
                  const match = Array.isArray(rawFeatures)
                    ? rawFeatures.find((f: any) => {
                        const s = (f.slug || f.feature_slug || "").toLowerCase();
                        const n = (f.name || f.feature_name || "").toLowerCase();
                        return (
                          s.includes(def.slug) ||
                          n.includes(def.slug) ||
                          n.includes(def.name.toLowerCase())
                        );
                      })
                    : null;

                  const isUnlim = match?.quantity === -1 || match?.quota === -1;
                  const qty = isUnlim
                    ? "Unlimited"
                    : match?.quantity ?? match?.quota ?? def.defaultQuota;

                  return {
                    name: def.name,
                    quantity: qty,
                  };
                });

                return (
                  <div
                    key={plan.id || planName}
                    className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#161B22] border-2 border-indigo-600 shadow-xl shadow-indigo-500/10 space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-6">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                          OFFICIAL API PLAN
                        </span>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 capitalize">
                          {planName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                          Full access to all 8 core modules and accounting tools
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
                            ₹{price.toFixed(2)}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">/ {duration}</span>
                        </div>
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          Active API Tier
                        </span>
                      </div>
                    </div>

                    {/* Features Grid Matching Backend Usages */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3">
                        Included Module Quotas
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {featureList.map((f, fIdx) => (
                          <div
                            key={fIdx}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <IoCheckmarkCircle className="text-emerald-500 text-base" />
                              <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                {f.name}
                              </span>
                            </div>
                            <span className="px-2.5 py-0.5 rounded font-mono font-bold text-xs bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                              {f.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      <Link
                        href={isLoggedIn ? "/settings?tab=subscription" : "/sign-up"}
                        className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 transition"
                      >
                        <span>{isLoggedIn ? "Manage in Settings" : "Subscribe to Plan"}</span>
                        <IoArrowForward className="text-base" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ Accordion Section ── */}
      <section id="faq" className="py-16 sm:py-24 bg-slate-100/60 dark:bg-[#161B22]/60 border-t border-slate-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-4 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-zinc-800 overflow-hidden transition shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 dark:text-white cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <IoChevronDown
                      className={`text-lg text-indigo-600 transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 sm:pb-6 text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed border-t border-slate-100 dark:border-zinc-800 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── High-Impact Bottom Call to Action ── */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 text-white p-8 sm:p-14 lg:p-20 text-center shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)] pointer-events-none" />

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto leading-tight">
            Ready to Take Control of Your Business Finances?
          </h2>
          <p className="mt-4 sm:mt-6 text-sm sm:text-base text-indigo-100 max-w-xl mx-auto">
            Empower your business with smart GST invoicing, payment follow-ups, inventory
            reconciliation, and multi-branch management.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-md mx-auto">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base text-indigo-900 bg-white hover:bg-slate-100 shadow-xl transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              Get Started Now
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm sm:text-base text-white border border-white/30 hover:bg-white/10 transition cursor-pointer"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </section>

      {/* ── Clean Modern Footer ── */}
      <footer className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0D1117] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="GI Book" className="h-7 w-auto object-contain" />
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              © {new Date().getFullYear()} GI Book Inc. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-zinc-400">
            <Link href="/login" className="hover:text-indigo-600 transition">
              Sign In
            </Link>
            <Link href="/sign-up" className="hover:text-indigo-600 transition">
              Create Account
            </Link>
            <a href="#features" className="hover:text-indigo-600 transition">
              Features
            </a>
            <a href="#pricing" className="hover:text-indigo-600 transition">
              Subscription
            </a>
            <a href="#faq" className="hover:text-indigo-600 transition">
              FAQ
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
