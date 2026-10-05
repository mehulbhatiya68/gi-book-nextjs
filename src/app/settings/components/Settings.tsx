"use client";

import { useState, useEffect, startTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import {
  IoAdd,
  IoBusinessOutline,
  IoKeyOutline,
  IoColorPaletteOutline,
  IoSparklesOutline,
  IoInformationCircleOutline,
  IoTrashOutline,
  IoPencilOutline,
  IoLogOutOutline,
  IoArrowBack,
  IoChevronBack,
  IoChevronForward,
  IoSunnyOutline,
  IoMoonOutline,
  IoLanguageOutline,
  IoSettingsOutline,
  IoCheckmarkCircleOutline,
  IoCheckmarkCircle,
  IoEyeOutline,
  IoEyeOffOutline,
  IoMailOutline,
  IoCardOutline,
  IoGlobeOutline,
  IoCallOutline,
  IoLocationOutline,
  IoPrintOutline,
  IoColorWandOutline,
  IoLockClosedOutline,
  IoAlertCircleOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoHourglassOutline,
  IoStarOutline,
  IoDocumentTextOutline,
  IoCubeOutline,
  IoBookOutline,
  IoFolderOpenOutline,
  IoPeopleOutline,
  IoSwapHorizontalOutline,
  IoReceiptOutline,
  IoDiamondOutline,
  IoRibbonOutline,
  IoShieldCheckmarkOutline,
  IoRefreshOutline,
  IoClose,
  IoOpenOutline,
  IoLogoAndroid,
  IoLogoApple,
  IoCodeWorkingOutline,
} from "react-icons/io5";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { usePreferences } from "@/lib/hooks/usePreferences";
import { compressImageFile } from "@/utils/imageCompressor";
import { businessApi } from "@/lib/api/business";
import { updateBusinessProfileAction } from "@/app/actions/business";
import CustomBusinessLogo from "@/components/CustomBusinessLogo";
import FilterTabs from "@/components/FilterTabs";
import { authApi } from "@/lib/api/auth";
import { settingsApi } from "@/lib/api/settings";
import { subscriptionApi } from "@/lib/api/subscription";
import { appInfoApi } from "@/lib/api/appInfo";
import { invoiceApi } from "@/lib/api/invoice";
import { itemApi } from "@/lib/api/item";
import { ledgerApi } from "@/lib/api/ledger";
import { siteProjectApi } from "@/lib/api/siteProject";
import { staffApi } from "@/lib/api/staff";
import { transactionApi } from "@/lib/api/transaction";

export default function Settings() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams ? searchParams.get("tab") : null;

  const {
    currentUser,
    logoutUser,
    activeBusiness,
    businesses,
    switchActiveBusiness,
    updateActiveBusinessLogo,
    refreshBusinesses,
    hasPermission,
    openEmailVerificationModal,
  } = useAuth();
  const { theme, setTheme, language, setLanguage, t } = usePreferences();

  const [activeTab, setActiveTab] = useState(tabParam || "business"); // 'business' | 'business_settings' | 'account' | 'subscription' | 'appearance' | 'about'
  const [mobileSubView, setMobileSubView] = useState<string | null>(tabParam || null);

  useEffect(() => {
    if (tabParam && ["business", "business_settings", "account", "subscription", "appearance", "about"].includes(tabParam)) {
      setActiveTab(tabParam);
      setMobileSubView(tabParam);
    }
  }, [tabParam]);
  const [bizViewMode, setBizViewMode] = useState("view"); // 'view' | 'edit'

  // Full Business Details State (from businessApi.getBusiness)
  const [fullBusinessData, setFullBusinessData] = useState<any>(null);
  const [isLoadingBiz, setIsLoadingBiz] = useState(false);

  // Business Edit form state (Strictly matching business.md schema)
  const [bizForm, setBizForm] = useState({
    name: "",
    type: "Agency",
    logo: "",
    email: "",
    phone: "",
    address: "",
    gstNumber: "",
    panNumber: "",
    cin: "",
    tin: "",
  });

  // Business Settings State (from settingsApi.getSettings)
  const [businessSettings, setBusinessSettings] = useState({
    currency: "INR",
    timezone: "Asia/Kolkata",
    language: "en",
    thermal_printer_size: "3_inch",
    invoice_prefix: "INV",
    invoice_theme_color: "#1B1B18",
    show_gst_column: true,
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState("");
  const [settingsErrorMsg, setSettingsErrorMsg] = useState("");

  // Account / Password state
  const [passTab, setPassTab] = useState<"none" | "change" | "forgot">("none");
  const [currentPassword, setCurrentPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState(currentUser?.email || "");
  const [forgotStep, setForgotStep] = useState(1); // 1 = enter email, 2 = enter OTP & new password
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteBizPassword, setShowDeleteBizPassword] = useState(false);
  const [passSuccessMsg, setPassSuccessMsg] = useState("");
  const [passErrorMsg, setPassErrorMsg] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSubmittingPass, setIsSubmittingPass] = useState(false);

  // User Profile & Account Data State (from authApi.getProfile & businessApi.getBusinesses)
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [accountBusinesses, setAccountBusinesses] = useState<any[]>([]);
  const [isLoadingAccountBiz, setIsLoadingAccountBiz] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    mobile_number: "",
    country_code: "91",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");

  // Confirm Modals
  const [showDeleteAccConfirm, setShowDeleteAccConfirm] = useState(false);
  const [showDeleteBizConfirm, setShowDeleteBizConfirm] = useState(false);

  // Subscription State (from subscriptionApi)
  const [subPlans, setSubPlans] = useState<any[]>([]);
  const [subUsage, setSubUsage] = useState<any[]>([]);
  const [liveUsageCounts, setLiveUsageCounts] = useState<Record<string, number>>({});
  const [activeSub, setActiveSub] = useState<any>(null);
  const [subHistory, setSubHistory] = useState<any[]>([]);
  const [isLoadingSub, setIsLoadingSub] = useState(false);
  const [isActivatingPlan, setIsActivatingPlan] = useState<string | null>(null);
  const [subMsg, setSubMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [subTabScreen, setSubTabScreen] = useState<'main' | 'details' | 'history'>('main');

  // App Info State (from appInfoApi)
  const [appInfoData, setAppInfoData] = useState<any>(null);
  const [isLoadingAppInfo, setIsLoadingAppInfo] = useState(false);
  const [appInfoError, setAppInfoError] = useState<string | null>(null);
  const [selectedPageModal, setSelectedPageModal] = useState<{
    key: string;
    title: string;
    description?: string;
    html_content?: string;
  } | null>(null);
  const [isLoadingPageDetail, setIsLoadingPageDetail] = useState(false);

  const fetchAppInfo = async () => {
    setIsLoadingAppInfo(true);
    setAppInfoError(null);
    try {
      const res = await appInfoApi.getAppInfo({ silentError: true });
      const body = res?.body || res;
      if (body) {
        setAppInfoData(body);
      }
    } catch (err: any) {
      console.warn("Failed to fetch app info:", err);
      setAppInfoError(err?.message || "Failed to load latest system information.");
    } finally {
      setIsLoadingAppInfo(false);
    }
  };

  const handleOpenPageDetail = async (pageKey: string, fallbackTitle?: string, fallbackDesc?: string) => {
    setIsLoadingPageDetail(true);
    setSelectedPageModal({
      key: pageKey,
      title: fallbackTitle || pageKey,
      description: fallbackDesc || "",
      html_content: "",
    });
    try {
      const res = await appInfoApi.getPageDetail(pageKey, { silentError: true });
      const page = res?.body?.page || res?.page || res?.body;
      if (page) {
        setSelectedPageModal({
          key: page.key || pageKey,
          title: page.title || fallbackTitle || pageKey,
          description: page.description || fallbackDesc || "",
          html_content: page.html_content || `<p>${page.description || 'No detailed content available.'}</p>`,
        });
      }
    } catch (err) {
      console.warn(`Failed to fetch detail for page ${pageKey}:`, err);
      let defaultHtml = "";
      if (pageKey === "about_us") {
        defaultHtml = `
          <h2>About GI Book Accounting & ERP</h2>
          <p><strong>GI BOOK</strong> is a comprehensive Accounting and ERP platform designed specifically for Indian SMEs, agencies, retail, and manufacturing enterprises.</p>
          <h3>Key Capabilities</h3>
          <ul>
            <li><strong>GST Invoicing & Billing:</strong> Fast digital invoicing, multi-currency support, thermal printing, and PDF exports.</li>
            <li><strong>Inventory & Stock Management:</strong> Real-time batch tracking, stock movement logs, and item categorization.</li>
            <li><strong>Ledger & Party Statements:</strong> Customer & supplier ledger tracking, payment receipts, and automated payment reminders.</li>
            <li><strong>Projects & Sites:</strong> Site-wise cost estimation, project expense tracking, and supervisor allocations.</li>
            <li><strong>Multi-Business & Staff Control:</strong> Manage multiple business profiles under a single account with fine-grained role permissions.</li>
          </ul>
        `;
      } else if (pageKey === "terms_of_service") {
        defaultHtml = `
          <h2>Terms of Service</h2>
          <p>Welcome to <strong>GI Book</strong>. By using our platform, web application, mobile applications, and services, you agree to comply with and be bound by the following terms.</p>
          <h3>1. Account & Security</h3>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted under your registered account.</p>
          <h3>2. Acceptable Use</h3>
          <p>You agree to use GI Book only for lawful business accounting, billing, inventory, and record-keeping purposes in compliance with applicable Indian commercial and GST laws.</p>
          <h3>3. Service Availability & Modifications</h3>
          <p>We strive for 99.9% platform availability. GI Book reserves the right to update, modify, or add features to improve security and performance.</p>
        `;
      } else if (pageKey === "privacy_policy") {
        defaultHtml = `
          <h2>Privacy Policy</h2>
          <p>At <strong>GI Book</strong>, we take data security and user privacy with extreme seriousness. This policy explains how your information is gathered and safeguarded.</p>
          <h3>Data Protection & Encryption</h3>
          <p>All sensitive financial data, invoice details, customer ledgers, and authentication tokens are encrypted in transit via SSL/TLS and at rest using enterprise-grade database encryption.</p>
          <h3>Data Ownership</h3>
          <p>Your business records remain 100% your property. GI Book never sells, rents, or shares customer data with unauthorized third parties.</p>
        `;
      } else {
        defaultHtml = `<p>${fallbackDesc || 'Information page details.'}</p>`;
      }

      setSelectedPageModal((prev) => prev ? {
        ...prev,
        html_content: defaultHtml,
      } : null);
    } finally {
      setIsLoadingPageDetail(false);
    }
  };

  const formatDateDDMMYYYY = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getFeatureIcon = (featureNameOrSlug: string) => {
    const key = (featureNameOrSlug || "").toString().toLowerCase();
    if (key.includes("business")) return <IoBusinessOutline className="text-purple-600 dark:text-purple-400 text-sm" />;
    if (key.includes("invoice")) return <IoDocumentTextOutline className="text-sky-600 dark:text-sky-400 text-sm" />;
    if (key.includes("item")) return <IoCubeOutline className="text-amber-600 dark:text-amber-400 text-sm" />;
    if (key.includes("ledger")) return <IoBookOutline className="text-emerald-600 dark:text-emerald-400 text-sm" />;
    if (key.includes("project")) return <IoFolderOpenOutline className="text-rose-600 dark:text-rose-400 text-sm" />;
    if (key.includes("site")) return <IoLocationOutline className="text-violet-600 dark:text-violet-400 text-sm" />;
    if (key.includes("staff")) return <IoPeopleOutline className="text-cyan-600 dark:text-cyan-400 text-sm" />;
    if (key.includes("transaction")) return <IoSwapHorizontalOutline className="text-indigo-600 dark:text-indigo-400 text-sm" />;
    return <IoCheckmarkCircleOutline className="text-emerald-500 dark:text-emerald-400 text-sm" />;
  };

  const getFeatureIconBg = (featureNameOrSlug: string) => {
    const key = (featureNameOrSlug || "").toString().toLowerCase();
    if (key.includes("business")) return "bg-purple-100/90 dark:bg-purple-950/80 border-purple-200/60 dark:border-purple-800/60";
    if (key.includes("invoice")) return "bg-sky-100/90 dark:bg-sky-950/80 border-sky-200/60 dark:border-sky-800/60";
    if (key.includes("item")) return "bg-amber-100/90 dark:bg-amber-950/80 border-amber-200/60 dark:border-amber-800/60";
    if (key.includes("ledger")) return "bg-emerald-100/90 dark:bg-emerald-950/80 border-emerald-200/60 dark:border-emerald-800/60";
    if (key.includes("project")) return "bg-rose-100/90 dark:bg-rose-950/80 border-rose-200/60 dark:border-rose-800/60";
    if (key.includes("site")) return "bg-violet-100/90 dark:bg-violet-950/80 border-violet-200/60 dark:border-violet-800/60";
    if (key.includes("staff")) return "bg-cyan-100/90 dark:bg-cyan-950/80 border-cyan-200/60 dark:border-cyan-800/60";
    if (key.includes("transaction")) return "bg-indigo-100/90 dark:bg-indigo-950/80 border-indigo-200/60 dark:border-indigo-800/60";
    return "bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700";
  };

  const parseCount = (val: any): number | null => {
    if (val !== undefined && val !== null && val !== "") {
      const num = Number(val);
      if (!isNaN(num)) return num;
    }
    return null;
  };

  const ALL_EIGHT_FEATURES = [
    { slug: "item", name: "Items", defaultQuota: 10 },
    { slug: "business", name: "Business", defaultQuota: 10 },
    { slug: "ledger", name: "Ledgers", defaultQuota: 10 },
    { slug: "transaction", name: "Transactions", defaultQuota: 10 },
    { slug: "project", name: "Projects", defaultQuota: 10 },
    { slug: "site", name: "Sites", defaultQuota: 10 },
    { slug: "staff", name: "Staff", defaultQuota: 10 },
    { slug: "invoice", name: "Invoices", defaultQuota: 10 },
  ];

  const getNormalizedFeatures = (featuresList?: any[]) => {
    const rawMap = new Map<string, any>();
    if (featuresList && Array.isArray(featuresList)) {
      featuresList.forEach((item) => {
        const keySlug = (item.feature_slug || item.slug || "").toString().toLowerCase().trim();
        const keyName = (item.feature_name || item.name || "").toString().toLowerCase().trim();
        if (keySlug) rawMap.set(keySlug, item);
        if (keyName) rawMap.set(keyName, item);
      });
    }

    return ALL_EIGHT_FEATURES.map((def) => {
      const singularSlug = def.slug.toLowerCase();
      const pluralSlug = singularSlug + "s";
      const nameLower = def.name.toLowerCase();

      let existing =
        rawMap.get(singularSlug) ||
        rawMap.get(pluralSlug) ||
        rawMap.get(nameLower) ||
        rawMap.get(def.slug);

      if (!existing && def.slug === "transaction") {
        existing =
          rawMap.get("payment") ||
          rawMap.get("payments") ||
          rawMap.get("voucher") ||
          rawMap.get("vouchers");
      }

      const liveCount = liveUsageCounts[def.slug] ?? 0;

      let used = liveCount;
      if (existing) {
        const parsedUsed = parseCount(existing.used);
        if (parsedUsed !== null) {
          used = Math.max(parsedUsed, liveCount);
        }
      }

      let quota: number | string = def.defaultQuota;
      if (existing && (existing.quota !== undefined || existing.quantity !== undefined)) {
        const qVal = existing.quota ?? existing.quantity;
        const parsedQuota = parseCount(qVal);
        if (parsedQuota !== null) {
          quota = parsedQuota;
        } else if (qVal === -1 || qVal === "-1" || qVal === "unlimited") {
          quota = -1;
        }
      }

      return {
        feature_name: def.name,
        name: def.name,
        feature_slug: def.slug,
        quota,
        quantity: quota,
        used,
        remaining: typeof quota === "number" && quota > 0 ? Math.max(0, quota - used) : -1,
      };
    });
  };

  // 1. Fetch Full Business Details from API
  const fetchFullBusinessData = async (bizId: string) => {
    if (!bizId) return;
    setIsLoadingBiz(true);
    try {
      const res = await businessApi.getBusiness(bizId, { silentError: true });
      const biz = res?.body?.business || res?.body?.data || res?.body || res?.data || res;
      if (biz && typeof biz === "object") {
        setFullBusinessData(biz);
        setBizForm({
          name: biz.business_name || biz.name || "",
          type: biz.business_type || biz.type || "Agency",
          logo: biz.business_logo || biz.logo || "",
          email: biz.contact_email || biz.email || "",
          phone: biz.contact_phone || biz.phone || "",
          address: biz.address || biz.address_line1 || "",
          gstNumber: biz.gst_number || biz.gstin || biz.gstNumber || "",
          panNumber: biz.pan_number || biz.pan || biz.panNumber || "",
          cin: biz.cin || "",
          tin: biz.tin || "",
        });
      }
    } catch (err) {
      console.warn("Failed to fetch full business details, falling back to context:", err);
      if (activeBusiness) {
        setFullBusinessData(activeBusiness);
        setBizForm({
          name: activeBusiness.business_name || activeBusiness.name || "",
          type: activeBusiness.business_type || activeBusiness.type || "Agency",
          logo: activeBusiness.business_logo || activeBusiness.logo || "",
          email: activeBusiness.contact_email || activeBusiness.email || "",
          phone: activeBusiness.contact_phone || activeBusiness.phone || "",
          address: activeBusiness.address || activeBusiness.address_line1 || "",
          gstNumber: activeBusiness.gst_number || activeBusiness.gstNumber || "",
          panNumber: activeBusiness.pan_number || activeBusiness.panNumber || "",
          cin: activeBusiness.cin || "",
          tin: activeBusiness.tin || "",
        });
      }
    } finally {
      setIsLoadingBiz(false);
    }
  };

  useEffect(() => {
    if (activeBusiness?.id) {
      fetchFullBusinessData(activeBusiness.id);
    }
  }, [activeBusiness?.id]);

  // 2. Fetch Business Settings
  const fetchSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const res = await settingsApi.getSettings();
      const data = res?.body?.settings || res?.settings || res?.body || res;
      if (data && typeof data === "object") {
        const prefix = data.invoice_prefix || "INV";
        setBusinessSettings({
          currency: data.currency || "INR",
          timezone: data.timezone || "Asia/Kolkata",
          language: data.language || "en",
          thermal_printer_size: data.thermal_printer_size || "3_inch",
          invoice_prefix: prefix,
          invoice_theme_color: data.invoice_theme_color || "#1B1B18",
          show_gst_column: data.show_gst_column ?? true,
        });
        if (typeof window !== "undefined") {
          if (activeBusiness?.id) {
            localStorage.setItem(`gi_invoice_prefix_${activeBusiness.id}`, prefix);
          }
          localStorage.setItem("gi_invoice_prefix", prefix);
        }
      }
    } catch (err) {
      console.warn("Fetch settings warning:", err);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchUserProfile();
    fetchAccountBusinesses();
    fetchSubscriptionData();
    fetchAppInfo();
  }, []);

  // Fetch User Profile from API
  const fetchUserProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const res = await authApi.getProfile();
      const uData = res?.body?.user || res?.user || res?.body?.data || res?.data || res?.body || res;
      if (uData && typeof uData === "object") {
        setUserProfile(uData);
        setProfileForm({
          name: uData.name || "",
          mobile_number: uData.mobile_number || uData.mobile || uData.phone || "",
          country_code: uData.country_code ? String(uData.country_code) : "91",
        });
        if (uData.email) {
          startTransition(() => {
            setForgotEmail(uData.email);
          });
        }
      }
    } catch (err) {
      console.warn("Fetch profile warning:", err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Fetch Owner Businesses from API
  const fetchAccountBusinesses = async () => {
    setIsLoadingAccountBiz(true);
    try {
      const res = await businessApi.getBusinesses();
      const bList = res?.body?.businesses || res?.businesses || res?.body?.data || res?.data || (Array.isArray(res?.body) ? res.body : Array.isArray(res) ? res : []);
      if (Array.isArray(bList)) {
        setAccountBusinesses(bList);
      }
    } catch (err) {
      console.warn("Fetch account businesses warning:", err);
    } finally {
      setIsLoadingAccountBiz(false);
    }
  };

  const extractTotalCount = (res: any): number => {
    if (!res) return 0;
    const body = res?.body || res;

    const metaTotal =
      parseCount(body?.meta?.total) ??
      parseCount(res?.meta?.total) ??
      parseCount(body?.total) ??
      parseCount(res?.total) ??
      parseCount(body?.pagination?.total);

    if (metaTotal !== null) return metaTotal;

    const list =
      body?.items ||
      body?.invoices ||
      body?.ledgers ||
      body?.projects ||
      body?.sites ||
      body?.staff ||
      body?.transactions ||
      body?.businesses ||
      body?.data ||
      (Array.isArray(body) ? body : Array.isArray(res) ? res : null);

    if (Array.isArray(list)) return list.length;
    return 0;
  };

  // Fetch Subscription Plans, Usage, and User Subscriptions from API
  const fetchSubscriptionData = async () => {
    setIsLoadingSub(true);
    try {
      const [
        plansRes,
        usageRes,
        subRes,
        bizRes,
        invRes,
        itemRes,
        ledgerRes,
        projRes,
        siteRes,
        staffRes,
      ] = await Promise.allSettled([
        subscriptionApi.getPlans({ silentError: true }),
        subscriptionApi.getUsage({ silentError: true }),
        subscriptionApi.getSubscriptions(1, '30', { silentError: true }),
        businessApi.getBusinesses({ per_page: 'all', silentError: true }),
        invoiceApi.getInvoices({ per_page: 'all', silentError: true }),
        itemApi.getItems({ per_page: 'all', silentError: true }),
        ledgerApi.getLedgers({ per_page: 'all', silentError: true }),
        siteProjectApi.getProjects({ per_page: 'all', silentError: true }),
        siteProjectApi.getSites({ per_page: 'all', silentError: true }),
        staffApi.getStaff({ per_page: 'all', silentError: true }),
      ]);

      if (plansRes.status === "fulfilled") {
        const res = plansRes.value;
        const plans = res?.body?.plans || res?.plans || (Array.isArray(res?.body) ? res.body : Array.isArray(res) ? res : []);
        if (Array.isArray(plans)) setSubPlans(plans);
      }

      if (usageRes.status === "fulfilled") {
        const res = usageRes.value;
        const usages = res?.body?.usages || res?.usages || (Array.isArray(res?.body) ? res.body : Array.isArray(res) ? res : []);
        if (Array.isArray(usages)) setSubUsage(usages);
      }

      if (subRes.status === "fulfilled") {
        const res = subRes.value;
        const subs = res?.body?.subscriptions || res?.subscriptions || (Array.isArray(res?.body) ? res.body : Array.isArray(res) ? res : []);
        const activeId = res?.body?.active_subscription_id || res?.active_subscription_id;
        if (Array.isArray(subs)) {
          setSubHistory(subs);
          const foundActive = subs.find((s: any) => s.id === activeId || s.status === "active" || s.is_active);
          setActiveSub(foundActive || subs[0] || null);
        }
      }

      // Calculate unique live transaction count across customer & supplier ledgers only
      let transactionCount = 0;
      if (ledgerRes.status === "fulfilled" && ledgerRes.value) {
        const lRes = ledgerRes.value;
        const lList = Array.isArray(lRes?.body)
          ? lRes.body
          : (lRes?.body?.ledgers || lRes?.body?.data || (Array.isArray(lRes) ? lRes : []));

        if (Array.isArray(lList) && lList.length > 0) {
          // Only fetch transactions for customer or supplier ledgers
          const targetLedgers = lList.filter((l: any) => {
            const lType = (l.type || l.ledger_type || "").toString().toLowerCase();
            return lType === "customer" || lType === "supplier";
          });

          const txResults = await Promise.allSettled(
            targetLedgers.map((l: any) =>
              ledgerApi.getTransactions(l.id, { silentError: true })
            )
          );
          const uniqueTxSet = new Set<string>();
          txResults.forEach((tRes) => {
            if (tRes.status === "fulfilled" && tRes.value) {
              const res = tRes.value;
              const list = Array.isArray(res?.body)
                ? res.body
                : (res?.body?.transactions || res?.body?.data || (Array.isArray(res?.body) ? res.body : Array.isArray(res) ? res : []));
              if (Array.isArray(list)) {
                list.forEach((tx: any) => {
                  if (tx && (tx.id || tx.transaction_number)) {
                    const partyType = (tx.party_ledger?.type || tx.party_ledger_type || "").toString().toLowerCase();
                    const payType = (tx.payment_ledger?.type || tx.payment_ledger_type || "").toString().toLowerCase();
                    if (
                      partyType === "customer" ||
                      partyType === "supplier" ||
                      payType === "customer" ||
                      payType === "supplier" ||
                      !tx.party_ledger
                    ) {
                      uniqueTxSet.add(String(tx.id || tx.transaction_number));
                    }
                  }
                });
              }
            }
          });
          transactionCount = uniqueTxSet.size;
        }
      }

      const liveCounts: Record<string, number> = {
        business: bizRes.status === "fulfilled" ? extractTotalCount(bizRes.value) : 0,
        invoice: invRes.status === "fulfilled" ? extractTotalCount(invRes.value) : 0,
        item: itemRes.status === "fulfilled" ? extractTotalCount(itemRes.value) : 0,
        ledger: ledgerRes.status === "fulfilled" ? extractTotalCount(ledgerRes.value) : 0,
        project: projRes.status === "fulfilled" ? extractTotalCount(projRes.value) : 0,
        site: siteRes.status === "fulfilled" ? extractTotalCount(siteRes.value) : 0,
        staff: staffRes.status === "fulfilled" ? extractTotalCount(staffRes.value) : 0,
        transaction: transactionCount,
      };
      setLiveUsageCounts(liveCounts);
    } catch (err) {
      console.warn("Fetch subscription error:", err);
    } finally {
      setIsLoadingSub(false);
    }
  };

  const handleActivatePlan = async (planId: string) => {
    setIsActivatingPlan(planId);
    setSubMsg(null);
    try {
      let res;
      try {
        res = await subscriptionApi.activatePlan(planId);
      } catch (err) {
        res = await subscriptionApi.checkoutSubscription(planId, 'monthly');
      }

      if (res?.message || res?.success || res?.body?.subscription) {
        setSubMsg({ type: 'success', text: res?.message || "Subscription activated successfully!" });
        await fetchSubscriptionData();
      } else {
        setSubMsg({ type: 'error', text: res?.message || "Failed to activate subscription plan." });
      }
    } catch (err: any) {
      setSubMsg({ type: 'error', text: err?.message || "Error activating plan." });
    } finally {
      setIsActivatingPlan(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg("");
    setProfileErrorMsg("");
    setIsSavingProfile(true);
    try {
      const res = await authApi.updateProfile({
        name: profileForm.name.trim(),
        mobile_number: profileForm.mobile_number.trim(),
        country_code: profileForm.country_code.trim(),
      });
      if (res?.message === "OK" || res?.success || res?.body?.user || res?.user) {
        setProfileSuccessMsg("Profile details updated successfully!");
        setIsEditingProfile(false);
        await fetchUserProfile();
        setTimeout(() => setProfileSuccessMsg(""), 3000);
      } else {
        setProfileErrorMsg(res?.message || "Failed to update profile.");
      }
    } catch (err: any) {
      setProfileErrorMsg(err?.message || "Error updating profile details.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  useEffect(() => {
    if (currentUser?.email && !userProfile?.email) {
      startTransition(() => {
        setForgotEmail(currentUser.email);
      });
    }
  }, [currentUser, userProfile?.email]);

  // Password validation logic
  const validForgotEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail);
  const passLength = newPassword.length >= 8 && newPassword.length <= 32;
  const passLower = /[a-z]/.test(newPassword);
  const passUpper = /[A-Z]/.test(newPassword);
  const passNum = /[0-9]/.test(newPassword);
  const passSpec = /[!@#$%^&*(),.?":{}|<>_\-\\\/\[\]]/.test(newPassword);
  const passMatch = newPassword !== "" && newPassword === confirmNewPassword;

  const changePassValid =
    currentPassword.trim() !== "" &&
    passLength &&
    passLower &&
    passUpper &&
    passNum &&
    passSpec &&
    passMatch;
  const forgotPassValid =
    validForgotEmail &&
    passLength &&
    passLower &&
    passUpper &&
    passNum &&
    passSpec &&
    passMatch;

  // Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const MAX_SIZE_MB = 5;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`Image size exceeds ${MAX_SIZE_MB}MB limit. Please select a smaller file.`);
        return;
      }
      try {
        const compressedLogo = await compressImageFile(file, 200, 200, 0.7);
        if (compressedLogo) {
          setBizForm((prev) => ({ ...prev, logo: compressedLogo }));
          toast.success("Logo uploaded successfully. Click Save Changes to apply.");
        }
      } catch (err) {
        console.error("Error compressing logo:", err);
        toast.error("Failed to process uploaded logo.");
      }
    }
  };

  const handleRemoveLogo = () => {
    setBizForm((prev) => ({ ...prev, logo: "" }));
    toast.info("Logo removed. Click Save Changes to apply.");
  };

  // Save Business Details (Strict API Schema)
  const handleSaveBizDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameStr = String(bizForm.name || "").trim();
    if (!nameStr) {
      alert("Business Name is required.");
      return;
    }

    try {
      const rawLogoStr = String(bizForm.logo || "").trim();
      const safeLogo = rawLogoStr.length > 0 ? rawLogoStr : null;

      const payload = {
        business_name: nameStr,
        business_logo: safeLogo,
        business_type: String(bizForm.type || "").trim() || null,
        address: String(bizForm.address || "").trim(),
        gst_number: String(bizForm.gstNumber || "").trim() || null,
        pan_number: String(bizForm.panNumber || "").trim() || null,
        cin: String(bizForm.cin || "").trim() || null,
        tin: String(bizForm.tin || "").trim() || null,
        contact_email: String(bizForm.email || "").trim(),
        contact_phone: String(bizForm.phone || "").trim(),
        country_code: 91,
      };

      const res = await updateBusinessProfileAction(activeBusiness?.id, payload);
      if (!res.success) {
        throw new Error(res.error || "Failed to update business details.");
      }

      if (activeBusiness?.id && typeof updateActiveBusinessLogo === "function") {
        updateActiveBusinessLogo(activeBusiness.id, safeLogo);
      }

      if (activeBusiness?.id) {
        fetchFullBusinessData(activeBusiness.id);
      }

      alert("Business details updated successfully!");
      setBizViewMode("view");
      if (typeof refreshBusinesses === "function") refreshBusinesses();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to update business details");
    }
  };

  const [deleteBizPassword, setDeleteBizPassword] = useState("");
  const [deleteBizErrorMsg, setDeleteBizErrorMsg] = useState("");
  const [isDeletingBiz, setIsDeletingBiz] = useState(false);

  // Delete Business
  const handleDeleteBusinessConfirm = async () => {
    if (!activeBusiness) return;
    if (!deleteBizPassword.trim()) {
      setDeleteBizErrorMsg("Please enter your account password to confirm deletion.");
      return;
    }
    setDeleteBizErrorMsg("");
    setIsDeletingBiz(true);
    try {
      const res: any = await businessApi.deleteBusiness(activeBusiness.id, deleteBizPassword);
      if (res?.status === false || res?.error) {
        throw new Error(res?.message || res?.error || "Incorrect password. Failed to delete business.");
      }
      setShowDeleteBizConfirm(false);
      setDeleteBizPassword("");
      setDeleteBizErrorMsg("");
      toast.success("Business profile deleted successfully.");
      if (typeof refreshBusinesses === "function") {
        await refreshBusinesses();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      console.error("Error deleting business:", err);
      const msg = err?.message || err?.error || err?.response?.data?.message || "Incorrect password. Please try again.";
      setDeleteBizErrorMsg(msg);
      setDeleteBizPassword("");
    } finally {
      setIsDeletingBiz(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccessMsg("");
    setSettingsErrorMsg("");
    setIsSavingSettings(true);
    try {
      const res = await settingsApi.updateSettings(businessSettings);
      if (res?.message === "OK" || res?.body?.settings || res?.settings || res?.success) {
        if (typeof window !== "undefined" && businessSettings.invoice_prefix) {
          if (activeBusiness?.id) {
            localStorage.setItem(`gi_invoice_prefix_${activeBusiness.id}`, businessSettings.invoice_prefix);
          }
          localStorage.setItem("gi_invoice_prefix", businessSettings.invoice_prefix);
        }
        setSettingsSuccessMsg("Business settings updated successfully!");
        setTimeout(() => setSettingsSuccessMsg(""), 3000);
      } else {
        setSettingsErrorMsg(res?.message || "Failed to update settings.");
      }
    } catch (err: any) {
      setSettingsErrorMsg(err?.message || "Error updating settings.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Password Handlers
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassErrorMsg("");
    setPassSuccessMsg("");

    if (passTab === "change") {
      if (!changePassValid) return;
      setIsSubmittingPass(true);
      try {
        const res = await authApi.changePassword({
          current_password: currentPassword,
          password: newPassword,
        });
        if (res?.success || res?.message) {
          setPassSuccessMsg("Password updated successfully!");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmNewPassword("");
          setTimeout(() => setPassSuccessMsg(""), 3000);
        } else {
          setPassErrorMsg(res?.message || "Current password is incorrect or update failed.");
        }
      } catch (err: any) {
        setPassErrorMsg(err?.message || "Failed to update password.");
      } finally {
        setIsSubmittingPass(false);
      }
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassErrorMsg("");
    setPassSuccessMsg("");
    if (!validForgotEmail) {
      setPassErrorMsg("Please enter a valid email address.");
      return;
    }
    setIsSendingOtp(true);
    try {
      const res = await authApi.forgotPassword(forgotEmail);
      if (res?.message || res?.success) {
        setPassSuccessMsg(`Verification code sent to ${forgotEmail}`);
        setForgotStep(2);
      } else {
        setPassErrorMsg(res?.message || "Failed to send verification code.");
      }
    } catch (err: any) {
      setPassErrorMsg(err?.message || "Failed to send verification code.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResetPasswordWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassErrorMsg("");
    setPassSuccessMsg("");
    if (!forgotOtp.trim()) {
      setPassErrorMsg("Please enter the OTP code sent to your email.");
      return;
    }
    if (!forgotPassValid) {
      setPassErrorMsg("Password must meet complexity requirements and match confirmation.");
      return;
    }
    setIsSubmittingPass(true);
    try {
      const res = await authApi.setPassword({
        identifier: forgotEmail,
        otp: forgotOtp,
        password: newPassword,
        password_confirmation: confirmNewPassword,
      });
      if (res?.message || res?.success || res?.body?.token) {
        setPassSuccessMsg("Password reset successfully! You can now log in with your new password.");
        setForgotStep(1);
        setForgotOtp("");
        setNewPassword("");
        setConfirmNewPassword("");
        setTimeout(() => setPassSuccessMsg(""), 4000);
      } else {
        setPassErrorMsg(res?.message || "Invalid OTP code or password reset failed.");
      }
    } catch (err: any) {
      setPassErrorMsg(err?.message || "Password reset failed. Please check your OTP and try again.");
    } finally {
      setIsSubmittingPass(false);
    }
  };

  const handleDeleteAccountConfirm = async () => {
    try {
      await authApi.deleteAccount(currentPassword || "00000000");
      logoutUser();
      router.push("/login");
    } catch (err) {
      console.error(err);
      alert("Failed to delete account");
    }
  };

  const menuTabs = [
    { id: "business", label: t("business") || "Business Details", icon: IoBusinessOutline },
    { id: "business_settings", label: t("businessSettings") || "Business Settings", icon: IoSettingsOutline },
    { id: "account", label: t("account") || "Account", icon: IoKeyOutline },
    { id: "subscription", label: t("subscription") || "Subscription", icon: IoSparklesOutline },
    { id: "appearance", label: t("themeAndLanguage") || "Theme and Language", icon: IoColorPaletteOutline },
    { id: "about", label: t("aboutApp") || "About GI Book", icon: IoInformationCircleOutline },
  ];

  const displayData = fullBusinessData || activeBusiness || {};

  const renderTabContent = (tabToRender: string) => (
    <>
      {/* ── 1. BUSINESS DETAILS TAB ── */}
      {tabToRender === "business" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 gi-divider">
            <div>
              <h2 className="text-base font-bold gi-text-primary">
                Business Profile &amp; Registration
              </h2>
              <p className="text-xs gi-text-secondary">
                Manage business parameters printed on official invoices and legal documents
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/addBusiness"
                className="px-3 py-1.5 rounded-lg gi-btn-primary text-xs font-semibold transition cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <IoAdd className="text-sm" />
                <span>Add Business</span>
              </Link>

              <button
                type="button"
                onClick={() => setBizViewMode(bizViewMode === "view" ? "edit" : "view")}
                className="px-3 py-1.5 rounded-lg gi-filter-active text-xs font-semibold transition cursor-pointer flex items-center gap-1"
              >
                <IoPencilOutline className="text-xs" />
                <span>{bizViewMode === "view" ? "Edit Details" : "View Details"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteBizConfirm(true)}
                className="px-3 py-1.5 rounded-lg gi-btn-danger text-xs font-semibold transition cursor-pointer flex items-center gap-1"
              >
                <IoTrashOutline className="text-xs" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {isLoadingBiz ? (
            <div className="p-8 text-center text-xs gi-text-muted">
              Loading business details...
            </div>
          ) : bizViewMode === "view" ? (
            <div className="space-y-4 text-xs">
              {/* Profile Header */}
              <div className="p-4 rounded-xl gi-card flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl gi-badge-info flex items-center justify-center overflow-hidden shrink-0 shadow-xs border gi-divider">
                    {displayData.business_logo || displayData.logo ? (
                      <img src={displayData.business_logo || displayData.logo} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold" style={{ color: "var(--gi-primary)" }}>
                        {(displayData.business_name || displayData.name)?.charAt(0) || "B"}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold gi-text-primary tracking-tight">
                      {displayData.business_name || displayData.name || "Business Profile"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase gi-badge-info">
                        {displayData.business_type || displayData.type || "Agency"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 1: Contact Details (Phone & Email) */}
              <div>
                <p className="text-[11px] font-bold gi-text-muted uppercase tracking-wider mb-2">
                  Contact Information
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg gi-surface-secondary border gi-divider">
                    <p className="text-[10px] font-bold gi-text-muted uppercase tracking-wider">Phone Number</p>
                    <p className="font-semibold gi-text-primary mt-0.5">{displayData.contact_phone || displayData.phone || "Not specified"}</p>
                  </div>
                  <div className="p-3 rounded-lg gi-surface-secondary border gi-divider">
                    <p className="text-[10px] font-bold gi-text-muted uppercase tracking-wider">Email Address</p>
                    <p className="font-semibold gi-text-primary mt-0.5 truncate">{displayData.contact_email || displayData.email || "Not specified"}</p>
                  </div>
                </div>
              </div>

              {/* Grid 2: Business Address (Single Section) */}
              <div>
                <p className="text-[11px] font-bold gi-text-muted uppercase tracking-wider mb-2">
                  Business Address
                </p>
                <div className="p-3.5 rounded-lg gi-surface-secondary border gi-divider">
                  <p className="font-semibold gi-text-primary text-xs leading-relaxed">
                    {displayData.address || displayData.address_line1 || "Not specified"}
                  </p>
                </div>
              </div>

              {/* Grid 3: Tax & Government Registrations */}
              <div>
                <p className="text-[11px] font-bold gi-text-muted uppercase tracking-wider mb-2">
                  Tax &amp; Government Registrations
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg gi-surface-secondary border gi-divider">
                    <p className="text-[10px] font-bold gi-text-muted uppercase tracking-wider">GST Number</p>
                    <p className="font-mono font-semibold gi-text-primary mt-0.5">
                      {displayData.gst_number || displayData.gstin || displayData.gstNumber || "Not registered"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg gi-surface-secondary border gi-divider">
                    <p className="text-[10px] font-bold gi-text-muted uppercase tracking-wider">PAN Number</p>
                    <p className="font-mono font-semibold gi-text-primary mt-0.5">
                      {displayData.pan_number || displayData.pan || displayData.panNumber || "Not specified"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg gi-surface-secondary border gi-divider">
                    <p className="text-[10px] font-bold gi-text-muted uppercase tracking-wider">CIN (Corporate ID)</p>
                    <p className="font-mono font-semibold gi-text-primary mt-0.5">
                      {displayData.cin || "Not specified"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg gi-surface-secondary border gi-divider">
                    <p className="text-[10px] font-bold gi-text-muted uppercase tracking-wider">TIN (Tax ID)</p>
                    <p className="font-mono font-semibold gi-text-primary mt-0.5">
                      {displayData.tin || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Edit Mode Form */
            <form onSubmit={handleSaveBizDetails} className="space-y-4 text-xs">
              {/* Business Logo (Exact Dart UI: Dotted Dropzone when empty, Logo + Change + Remove Row when selected) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold gi-text-secondary">
                  Business Logo
                </label>
                {bizForm.logo ? (
                  <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-2xl border gi-divider bg-[var(--gi-surface)]">
                    <CustomBusinessLogo
                      logoPath={bizForm.logo}
                      width={80}
                      height={80}
                      shape="rounded"
                    />
                    <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1">
                      <label
                        htmlFor="edit-biz-logo-change"
                        className="flex-1 py-2 px-3 rounded-xl border gi-divider gi-surface-interactive text-center text-xs font-semibold cursor-pointer transition gi-text-primary"
                      >
                        Change Logo
                        <input
                          id="edit-biz-logo-change"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="flex-1 py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-center text-xs font-semibold cursor-pointer transition"
                      >
                        Remove Logo
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="edit-biz-logo-upload"
                    className="border-2 border-dashed gi-divider rounded-2xl py-6 px-4 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors bg-[var(--gi-surface)] text-center group"
                  >
                    <span className="text-sm sm:text-base font-semibold gi-text-primary group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      Upload Business Logo
                    </span>
                    <span className="text-[11px] gi-text-secondary mt-0.5">
                      Recommended up to 5MB
                    </span>
                    <input
                      id="edit-biz-logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Business Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold gi-text-secondary text-xs mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={bizForm.name}
                    onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })}
                    required
                    className="w-full p-2.5 rounded-lg gi-input text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold gi-text-secondary text-xs mb-1">
                    Business Type
                  </label>
                  <input
                    type="text"
                    value={bizForm.type}
                    onChange={(e) => setBizForm({ ...bizForm, type: e.target.value })}
                    placeholder="e.g. Retail, Agency, Wholesale..."
                    className="w-full p-2.5 rounded-lg gi-input text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Contact Info (Phone & Email) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold gi-text-secondary text-xs mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={bizForm.phone}
                    onChange={(e) => setBizForm({ ...bizForm, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full p-2.5 rounded-lg gi-input text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold gi-text-secondary text-xs mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={bizForm.email}
                    onChange={(e) => setBizForm({ ...bizForm, email: e.target.value })}
                    placeholder="business@example.com"
                    className="w-full p-2.5 rounded-lg gi-input text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Single Section Business Address */}
              <div>
                <label className="block font-semibold gi-text-secondary text-xs mb-1">
                  Business Address
                </label>
                <textarea
                  rows={3}
                  value={bizForm.address}
                  onChange={(e) => setBizForm({ ...bizForm, address: e.target.value })}
                  placeholder="Enter complete office/registered business address..."
                  className="w-full p-2.5 rounded-lg gi-input text-xs focus:outline-none resize-none"
                />
              </div>

              {/* Tax & Registration Identifiers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold gi-text-secondary text-xs mb-1">
                    GST Number
                  </label>
                  <input
                    type="text"
                    value={bizForm.gstNumber}
                    onChange={(e) => setBizForm({ ...bizForm, gstNumber: e.target.value.toUpperCase() })}
                    placeholder="22AAAAA0000A1Z5"
                    className="w-full p-2.5 rounded-lg gi-input text-xs uppercase focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold gi-text-secondary text-xs mb-1">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={bizForm.panNumber}
                    onChange={(e) => setBizForm({ ...bizForm, panNumber: e.target.value.toUpperCase() })}
                    placeholder="ABCDE1234F"
                    className="w-full p-2.5 rounded-lg gi-input text-xs uppercase focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold gi-text-secondary text-xs mb-1">
                    CIN (Corporate ID)
                  </label>
                  <input
                    type="text"
                    value={bizForm.cin}
                    onChange={(e) => setBizForm({ ...bizForm, cin: e.target.value })}
                    placeholder="U12345MH2020PTC123456"
                    className="w-full p-2.5 rounded-lg gi-input text-xs focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold gi-text-secondary text-xs mb-1">
                    TIN (Tax ID)
                  </label>
                  <input
                    type="text"
                    value={bizForm.tin}
                    onChange={(e) => setBizForm({ ...bizForm, tin: e.target.value })}
                    placeholder="24123456789"
                    className="w-full p-2.5 rounded-lg gi-input text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t gi-divider">
                <button
                  type="button"
                  onClick={() => setBizViewMode("view")}
                  className="px-4 py-2 rounded-lg text-xs font-semibold gi-btn-secondary transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg gi-btn-primary text-xs font-semibold transition cursor-pointer shadow-sm"
                >
                  Save Business Details
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── 2. BUSINESS SETTINGS TAB ── */}
      {tabToRender === "business_settings" && (
        <div className="space-y-4">
          <div className="pb-1 border-none">
            <h2 className="text-base font-bold gi-text-primary">
              Business Settings &amp; Invoicing
            </h2>
          </div>

          {isLoadingSettings ? (
            <div className="p-8 text-center text-xs gi-text-muted">
              Loading business preferences...
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              {settingsSuccessMsg && (
                <div className="p-3.5 rounded-xl gi-badge-success font-semibold flex items-center gap-2 border-none shadow-xs">
                  <IoCheckmarkCircleOutline className="text-base shrink-0" />
                  <span>{settingsSuccessMsg}</span>
                </div>
              )}
              {settingsErrorMsg && (
                <div className="p-3.5 rounded-xl gi-badge-danger font-semibold flex items-center gap-2 border-none shadow-xs">
                  <IoAlertCircleOutline className="text-base shrink-0" />
                  <span>{settingsErrorMsg}</span>
                </div>
              )}

              {/* Card 1: Regional & Localization */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 shadow-xs border-none space-y-3.5">
                <h3 className="text-xs font-bold gi-text-primary uppercase tracking-wider">
                  Regional &amp; Localization
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold gi-text-secondary text-xs mb-1">
                      Billing Currency
                    </label>
                    <select
                      value={businessSettings.currency}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, currency: e.target.value })}
                      className="w-full p-2.5 rounded-xl border-none bg-slate-50 dark:bg-zinc-800 gi-text-primary text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="INR">INR (₹ Indian Rupee)</option>
                      <option value="USD">USD ($ US Dollar)</option>
                      <option value="EUR">EUR (€ Euro)</option>
                      <option value="GBP">GBP (£ British Pound)</option>
                      <option value="AED">AED (د.إ UAE Dirham)</option>
                      <option value="CAD">CAD ($ Canadian Dollar)</option>
                      <option value="AUD">AUD ($ Australian Dollar)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold gi-text-secondary text-xs mb-1">
                      Timezone
                    </label>
                    <select
                      value={businessSettings.timezone}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, timezone: e.target.value })}
                      className="w-full p-2.5 rounded-xl border-none bg-slate-50 dark:bg-zinc-800 gi-text-primary text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT/BST)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                      <option value="Asia/Singapore">Asia/Singapore (SGT +8:00)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold gi-text-secondary text-xs mb-1">
                      System Language
                    </label>
                    <select
                      value={businessSettings.language}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, language: e.target.value })}
                      className="w-full p-2.5 rounded-xl border-none bg-slate-50 dark:bg-zinc-800 gi-text-primary text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="en">English (en)</option>
                      <option value="hi">हिंदी (hi)</option>
                      <option value="gu">ગુજરાતી (gu)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 2: Invoicing & Printing */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 shadow-xs border-none space-y-4">
                <h3 className="text-xs font-bold gi-text-primary uppercase tracking-wider">
                  Invoicing &amp; Print Options
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold gi-text-secondary text-xs mb-1">
                      Default Invoice Prefix
                    </label>
                    <input
                      type="text"
                      value={businessSettings.invoice_prefix}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, invoice_prefix: e.target.value })}
                      placeholder="e.g. INV or GI-INV"
                      maxLength={50}
                      className="w-full p-2.5 rounded-xl border-none bg-slate-50 dark:bg-zinc-800 gi-text-primary text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold gi-text-secondary text-xs mb-1">
                      Thermal Printer Size
                    </label>
                    <FilterTabs
                      options={[
                        { id: "2_inch", label: "2 Inch (58mm)" },
                        { id: "3_inch", label: "3 Inch (80mm)" },
                      ]}
                      activeId={businessSettings.thermal_printer_size || "3_inch"}
                      onChange={(id) => setBusinessSettings({ ...businessSettings, thermal_printer_size: id })}
                      layoutId="settingsPrinterFilterPill"
                      className="w-full mt-1"
                    />
                  </div>

                  {/* Theme Primary Color */}
                  <div className="sm:col-span-2">
                    <label className="block font-semibold gi-text-secondary text-xs mb-1.5">
                      Invoice Theme Color
                    </label>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={businessSettings.invoice_theme_color}
                          onChange={(e) => setBusinessSettings({ ...businessSettings, invoice_theme_color: e.target.value })}
                          className="h-9 w-12 rounded-lg cursor-pointer border-none p-0.5 bg-transparent"
                        />
                        <input
                          type="text"
                          value={businessSettings.invoice_theme_color}
                          onChange={(e) => setBusinessSettings({ ...businessSettings, invoice_theme_color: e.target.value })}
                          maxLength={20}
                          className="w-24 p-2 rounded-xl border-none bg-slate-50 dark:bg-zinc-800 font-mono text-xs focus:outline-none gi-text-primary"
                        />
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        {["#1B1B18", "#4F46E5", "#059669", "#D97706", "#DC2626"].map((hex) => (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => setBusinessSettings({ ...businessSettings, invoice_theme_color: hex })}
                            className={`h-7 w-7 rounded-full transition transform hover:scale-110 cursor-pointer ${businessSettings.invoice_theme_color.toLowerCase() === hex.toLowerCase()
                              ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-zinc-900"
                              : ""
                              }`}
                            style={{ backgroundColor: hex }}
                            title={hex}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Show GST Column Switch */}
                  <div className="sm:col-span-2 flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border-none">
                    <p className="font-semibold gi-text-primary text-xs">
                      Show Tax / GST Column on Invoices
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setBusinessSettings({
                          ...businessSettings,
                          show_gst_column: !businessSettings.show_gst_column,
                        })
                      }
                      className={`relative w-11 h-6 rounded-full transition cursor-pointer shrink-0 ${businessSettings.show_gst_column ? "bg-indigo-600" : "bg-slate-300 dark:bg-zinc-700"
                        }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all shadow-xs ${businessSettings.show_gst_column ? "left-6" : "left-1"
                          }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl gi-btn-primary text-xs font-semibold transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
                >
                  {isSavingSettings ? "Saving Settings..." : "Save Business Settings"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── 3. ACCOUNT & CREDENTIALS TAB ── */}
      {tabToRender === "account" && (
        <div className="space-y-4">
          <div className="pb-1 border-none">
            <h2 className="text-base font-bold gi-text-primary">
              Account &amp; Credentials
            </h2>
          </div>

          {profileSuccessMsg && (
            <div className="p-3.5 rounded-xl gi-badge-success font-semibold text-xs flex items-center gap-2 border-none shadow-xs">
              <IoCheckmarkCircleOutline className="text-base shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}
          {profileErrorMsg && (
            <div className="p-3.5 rounded-xl gi-badge-danger font-semibold text-xs flex items-center gap-2 border-none shadow-xs">
              <IoAlertCircleOutline className="text-base shrink-0" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          {/* Account Details Card */}
          {isLoadingProfile ? (
            <div className="p-8 text-center text-xs gi-text-muted">
              Loading account profile data...
            </div>
          ) : (
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 shadow-xs border-none space-y-4">
              {/* Profile Card Header */}
              <div className="flex items-center gap-3.5 pb-3.5 border-b gi-divider">
                <div className="h-12 w-12 rounded-xl gi-btn-primary font-bold text-lg flex items-center justify-center shadow-xs shrink-0 uppercase">
                  {(userProfile?.name || currentUser?.name)?.charAt(0) || "U"}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold gi-text-primary">
                      {userProfile?.name || currentUser?.name || "Account User"}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase gi-badge-info">
                      {userProfile?.user_type || userProfile?.role || currentUser?.role || (currentUser?.isStaff ? "Staff" : "Owner")}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase gi-badge-success">
                      {userProfile?.status || "Active"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid of Profile Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border-none">
                  <p className="text-[10px] font-bold gi-text-muted uppercase tracking-wider">Email Address</p>
                  <p className="font-semibold gi-text-primary mt-0.5 truncate">
                    {userProfile?.email || currentUser?.email || "Not specified"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border-none">
                  <p className="text-[10px] font-bold gi-text-muted uppercase tracking-wider">Mobile Number</p>
                  <p className="font-semibold gi-text-primary mt-0.5">
                    {userProfile?.mobile_number || userProfile?.mobile || currentUser?.mobile || currentUser?.phone ? (
                      `+${userProfile?.country_code || 91} ${userProfile?.mobile_number || userProfile?.mobile || currentUser?.mobile || currentUser?.phone}`
                    ) : (
                      "Not specified"
                    )}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border-none">
                  <p className="text-[10px] font-bold gi-text-muted uppercase tracking-wider">Account Role / Type</p>
                  <p className="font-semibold gi-text-primary mt-0.5 capitalize">
                    {userProfile?.user_type || userProfile?.role || (currentUser?.isStaff ? "Staff" : "Business Owner")}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border-none">
                  <p className="text-[10px] font-bold gi-text-muted uppercase tracking-wider">Account Status</p>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 capitalize">
                    {userProfile?.status || "Active"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Registered Businesses Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 shadow-xs border-none space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold gi-text-primary uppercase tracking-wider">
                Registered Businesses ({(accountBusinesses.length > 0 ? accountBusinesses : businesses)?.length || 0})
              </h3>
              <Link
                href="/addBusiness"
                className="px-2.5 py-1 rounded-lg gi-btn-primary text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-xs"
              >
                <IoAdd className="text-sm" />
                <span>Add Business</span>
              </Link>
            </div>

            {isLoadingAccountBiz ? (
              <p className="text-xs gi-text-muted italic">Loading businesses...</p>
            ) : (
              <div className="space-y-2">
                {((accountBusinesses.length > 0 ? accountBusinesses : businesses) || []).length > 0 ? (
                  ((accountBusinesses.length > 0 ? accountBusinesses : businesses) || []).map((biz: any) => {
                    const bizId = biz.id || biz.business_id;
                    const bizName = biz.business_name || biz.name;
                    const bizPhone = biz.contact_phone || biz.phone;
                    const bizGst = biz.gst_number || biz.gstin || biz.gstNumber;
                    const isActive = activeBusiness?.id === bizId;
                    return (
                      <div
                        key={bizId || bizName}
                        className={`p-3 rounded-xl border-none flex items-center justify-between transition ${isActive
                          ? "bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200"
                          : "bg-slate-50 dark:bg-zinc-800/60"
                          }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <IoBusinessOutline className="text-base shrink-0" style={{ color: "var(--gi-primary)" }} />
                          <div className="min-w-0">
                            <p className="font-semibold text-xs gi-text-primary truncate">
                              {bizName}
                            </p>
                            <p className="text-[11px] gi-text-muted truncate">
                              {bizPhone ? `Phone: ${bizPhone}` : ""} {bizGst ? `• GST: ${bizGst}` : ""}
                            </p>
                          </div>
                        </div>

                        {isActive ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold gi-btn-primary shrink-0 shadow-2xs">
                            Active Business
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => switchActiveBusiness(biz)}
                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold gi-btn-secondary hover:gi-btn-primary transition cursor-pointer shrink-0"
                          >
                            Switch
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs gi-text-muted italic">No business profiles created yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Password & Security Management Section */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 shadow-xs border-none space-y-4">
            <h3 className="text-xs font-bold gi-text-primary uppercase tracking-wider">
              Password &amp; Security
            </h3>

            {/* Notification Messages */}
            {passSuccessMsg && (
              <div className="p-3.5 rounded-xl gi-badge-success font-semibold text-xs flex items-center gap-2 border-none shadow-xs">
                <IoCheckmarkCircleOutline className="text-base shrink-0" />
                <span>{passSuccessMsg}</span>
              </div>
            )}
            {passErrorMsg && (
              <div className="p-3.5 rounded-xl gi-badge-danger font-semibold text-xs flex items-center gap-2 border-none shadow-xs">
                <IoAlertCircleOutline className="text-base shrink-0" />
                <span>{passErrorMsg}</span>
              </div>
            )}

            {/* INITIALLY HIDE BOTH FORMS: Show 2 Action Buttons when passTab === "none" */}
            {passTab === "none" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPassTab("change");
                    setPassErrorMsg("");
                    setPassSuccessMsg("");
                  }}
                  className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer text-left flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-base sm:text-lg shrink-0">
                      <IoKeyOutline />
                    </div>
                    <div>
                      <p className="font-bold text-xs gi-text-primary group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                        Change Password
                      </p>
                      <p className="hidden sm:block text-[11px] gi-text-muted mt-0.5">
                        Update your existing login password
                      </p>
                    </div>
                  </div>
                  <IoChevronForward className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 text-sm shrink-0 transition" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPassTab("forgot");
                    setPassErrorMsg("");
                    setPassSuccessMsg("");
                    setForgotStep(1);
                  }}
                  className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer text-left flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-base sm:text-lg shrink-0">
                      <IoLockClosedOutline />
                    </div>
                    <div>
                      <p className="font-bold text-xs gi-text-primary group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                        Forgot Password
                      </p>
                      <p className="hidden sm:block text-[11px] gi-text-muted mt-0.5">
                        Reset password using email OTP code
                      </p>
                    </div>
                  </div>
                  <IoChevronForward className="text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 text-sm shrink-0 transition" />
                </button>
              </div>
            ) : null}

            {/* Change Password Form */}
            {passTab === "change" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b gi-divider">
                  <h4 className="font-bold gi-text-primary text-xs flex items-center gap-2">
                    <IoKeyOutline className="text-indigo-600 dark:text-indigo-400 text-base" />
                    <span>Change Password</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setPassTab("none")}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                    title="Close"
                  >
                    <IoClose className="text-lg" />
                  </button>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-3.5 max-w-md text-xs">
                  <div>
                    <label className="block font-semibold gi-text-secondary mb-1">
                      Current Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                        className="w-full p-2.5 pr-10 rounded-xl border-none bg-slate-50 dark:bg-zinc-800 gi-text-primary text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                        title={showCurrentPassword ? "Hide password" : "Show password"}
                        aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                      >
                        {showCurrentPassword ? <IoEyeOffOutline className="text-base" /> : <IoEyeOutline className="text-base" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold gi-text-secondary mb-1">
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        maxLength={32}
                        placeholder="Enter new password (8-32 chars)"
                        required
                        className="w-full p-2.5 pr-10 rounded-xl border-none bg-slate-50 dark:bg-zinc-800 gi-text-primary text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                        title={showNewPassword ? "Hide password" : "Show password"}
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <IoEyeOffOutline className="text-base" /> : <IoEyeOutline className="text-base" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold gi-text-secondary mb-1">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        maxLength={32}
                        placeholder="Confirm new password"
                        required
                        className="w-full p-2.5 pr-10 rounded-xl border-none bg-slate-50 dark:bg-zinc-800 gi-text-primary text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <IoEyeOffOutline className="text-base" /> : <IoEyeOutline className="text-base" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPassTab("none")}
                      className="p-2.5 rounded-xl gi-btn-secondary transition cursor-pointer flex items-center justify-center text-slate-600 dark:text-slate-300"
                      title="Close"
                    >
                      <IoClose className="text-lg" />
                    </button>
                    <button
                      type="submit"
                      disabled={!changePassValid || isSubmittingPass}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${changePassValid && !isSubmittingPass
                        ? "gi-btn-primary shadow-xs"
                        : "bg-slate-200 dark:bg-zinc-800 gi-text-muted cursor-not-allowed"
                        }`}
                    >
                      {isSubmittingPass ? "Updating Password..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Forgot Password Flow */}
            {passTab === "forgot" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b gi-divider">
                  <h4 className="font-bold gi-text-primary text-xs flex items-center gap-2">
                    <IoLockClosedOutline className="text-amber-600 dark:text-amber-400 text-base" />
                    <span>Forgot Password (Email OTP)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setPassTab("none")}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                    title="Close"
                  >
                    <IoClose className="text-lg" />
                  </button>
                </div>

                <div className="space-y-3.5 max-w-md text-xs">
                  {forgotStep === 1 ? (
                    <form onSubmit={handleSendOtp} className="space-y-3.5">
                      <div>
                        <label className="block font-semibold gi-text-secondary mb-1">
                          Registered Email Address *
                        </label>
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="name@example.com"
                          required
                          className="w-full p-2.5 rounded-xl border-none bg-slate-50 dark:bg-zinc-800 gi-text-primary text-xs focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setPassTab("none")}
                          className="p-2.5 rounded-xl gi-btn-secondary transition cursor-pointer flex items-center justify-center text-slate-600 dark:text-slate-300"
                          title="Close"
                        >
                          <IoClose className="text-lg" />
                        </button>
                        <button
                          type="submit"
                          disabled={!validForgotEmail || isSendingOtp}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${validForgotEmail && !isSendingOtp
                            ? "gi-btn-primary shadow-xs"
                            : "bg-slate-200 dark:bg-zinc-800 gi-text-muted cursor-not-allowed"
                            }`}
                        >
                          {isSendingOtp ? "Sending Code..." : "Send Verification Code"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPasswordWithOtp} className="space-y-3.5">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border-none flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold gi-text-muted uppercase">Target Account</p>
                          <p className="font-semibold gi-text-primary text-xs">{forgotEmail}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setForgotStep(1)}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                        >
                          Change Email
                        </button>
                      </div>

                      <div>
                        <label className="block font-semibold gi-text-secondary mb-1">
                          OTP Verification Code *
                        </label>
                        <input
                          type="text"
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value)}
                          placeholder="Enter OTP received in email"
                          required
                          className="w-full p-2.5 rounded-xl border-none bg-slate-50 dark:bg-zinc-800 gi-text-primary font-mono text-xs focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold gi-text-secondary mb-1">
                          New Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            maxLength={32}
                            placeholder="Enter new password (8-32 chars)"
                            required
                            className="w-full p-2.5 pr-10 rounded-xl border-none bg-slate-50 dark:bg-zinc-800 gi-text-primary text-xs focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword((prev) => !prev)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                            title={showNewPassword ? "Hide password" : "Show password"}
                            aria-label={showNewPassword ? "Hide password" : "Show password"}
                          >
                            {showNewPassword ? <IoEyeOffOutline className="text-base" /> : <IoEyeOutline className="text-base" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold gi-text-secondary mb-1">
                          Confirm New Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            maxLength={32}
                            placeholder="Confirm new password"
                            required
                            className="w-full p-2.5 pr-10 rounded-xl border-none bg-slate-50 dark:bg-zinc-800 gi-text-primary text-xs focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                            title={showConfirmPassword ? "Hide password" : "Show password"}
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <IoEyeOffOutline className="text-base" /> : <IoEyeOutline className="text-base" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setPassTab("none")}
                          className="p-2.5 rounded-xl gi-btn-secondary transition cursor-pointer flex items-center justify-center text-slate-600 dark:text-slate-300"
                          title="Close"
                        >
                          <IoClose className="text-lg" />
                        </button>
                        <button
                          type="submit"
                          disabled={!forgotPassValid || !forgotOtp.trim() || isSubmittingPass}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${forgotPassValid && forgotOtp.trim() && !isSubmittingPass
                            ? "gi-btn-primary shadow-xs"
                            : "bg-slate-200 dark:bg-zinc-800 gi-text-muted cursor-not-allowed"
                            }`}
                        >
                          {isSubmittingPass ? "Resetting Password..." : "Verify OTP & Reset Password"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Delete Account Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowDeleteAccConfirm(true)}
              className="w-full py-3 rounded-xl gi-btn-danger text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              Delete Account
            </button>
          </div>
        </div>
      )}

      {/* ── 4. SUBSCRIPTION TAB ── */}
      {tabToRender === "subscription" && (
        <div className="space-y-4 text-xs">
          {subMsg && (
            <div
              className={`p-3.5 rounded-xl font-semibold text-xs border gi-divider ${subMsg.type === "success"
                ? "gi-surface-secondary gi-text-primary"
                : "gi-badge-danger"
                }`}
            >
              <span>{subMsg.text}</span>
            </div>
          )}

          {/* SCREEN 1: MAIN SUBSCRIPTION VIEW */}
          {subTabScreen === "main" && (
            <div className="space-y-4">
              <div className="border-b pb-3 gi-divider flex items-center justify-between">
                <h2 className="text-base font-bold gi-text-primary">Subscription</h2>
                <button
                  type="button"
                  onClick={fetchSubscriptionData}
                  disabled={isLoadingSub}
                  className="px-3 py-1.5 rounded-lg gi-btn-secondary font-semibold text-xs transition cursor-pointer"
                >
                  {isLoadingSub ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {/* Navigation Card 1: Subscription Details */}
              <button
                type="button"
                onClick={() => setSubTabScreen("details")}
                className="w-full p-4 rounded-xl gi-card border gi-divider hover:bg-[var(--gi-hover)] transition text-left cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm gi-text-primary">
                      Subscription Details
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold gi-surface-secondary border gi-divider gi-text-secondary">
                      Active
                    </span>
                  </div>
                  <p className="text-xs gi-text-muted mt-0.5">
                    {activeSub?.plan_name || activeSub?.plan?.name || (subPlans[0]?.name) || "admin test 1"}
                  </p>
                </div>
                <span className="text-xs font-semibold gi-text-secondary">View Details &rarr;</span>
              </button>

              {/* Navigation Card 2: Subscription History */}
              <button
                type="button"
                onClick={() => setSubTabScreen("history")}
                className="w-full p-4 rounded-xl gi-card border gi-divider hover:bg-[var(--gi-hover)] transition text-left cursor-pointer flex items-center justify-between"
              >
                <div>
                  <h3 className="font-bold text-sm gi-text-primary">
                    Subscription History
                  </h3>
                  <p className="text-xs gi-text-muted mt-0.5">View past subscriptions &amp; invoices</p>
                </div>
                <span className="text-xs font-semibold gi-text-secondary">View History &rarr;</span>
              </button>

              {/* Available Plans Section */}
              <div className="pt-2 space-y-3">
                <h3 className="text-sm font-bold gi-text-primary">Available Plans</h3>

                <div className="space-y-4">
                  {(subPlans && subPlans.length > 0 ? subPlans : [
                    {
                      id: "plan-admin-test",
                      name: "admin test 1",
                      final_price: 800,
                      duration_type: "monthly",
                      features: ALL_EIGHT_FEATURES.map((f) => ({ name: f.name, quantity: f.defaultQuota })),
                    }
                  ]).map((p: any) => {
                    const isCurrent = activeSub?.plan_id === p.id || (p.name && activeSub?.plan_name?.toLowerCase() === p.name.toLowerCase());
                    const isActivating = isActivatingPlan === p.id;
                    const features = getNormalizedFeatures(p.features);

                    return (
                      <div
                        key={p.id || p.name}
                        className={`p-5 rounded-xl gi-card border space-y-4 transition ${isCurrent
                          ? "border-[var(--gi-primary)] shadow-xs"
                          : "gi-divider"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-base gi-text-primary tracking-tight">{p.name}</h4>
                            {isCurrent && (
                              <span className="text-[11px] font-bold gi-text-secondary mt-0.5 block">
                                Active Plan
                              </span>
                            )}
                          </div>
                          {isCurrent && (
                            <span className="px-2.5 py-0.5 rounded text-xs font-bold gi-surface-secondary border gi-divider gi-text-primary">
                              Current
                            </span>
                          )}
                        </div>

                        {/* Price Pill */}
                        <div>
                          <span className="px-3 py-1 rounded-lg gi-surface-secondary border gi-divider gi-text-primary font-bold text-xs">
                            ₹{(p.final_price ?? p.price ?? 800).toFixed(2)} / {p.duration_type ? (p.duration_type.charAt(0).toUpperCase() + p.duration_type.slice(1)) : 'Monthly'}
                          </span>
                        </div>

                        {/* Feature List */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                          {features.map((f: any, fIdx: number) => {
                            const featName = f.name || f.feature_name;
                            const isUnlim = f.quantity === -1 || f.quota === -1;
                            const qtyStr = isUnlim ? "Unlimited" : (f.quantity ?? f.quota ?? 10);
                            return (
                              <div
                                key={fIdx}
                                className="flex items-center justify-between p-2 rounded-lg gi-surface-secondary border gi-divider"
                              >
                                <span className="font-medium gi-text-primary capitalize">{featName}</span>
                                <span className="px-2 py-0.5 rounded text-[11px] font-bold gi-surface-secondary border gi-divider gi-text-secondary">
                                  {qtyStr}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Full Width Button */}
                        <button
                          type="button"
                          disabled={isCurrent || isActivating}
                          onClick={() => handleActivatePlan(p.id)}
                          className={`w-full py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${isCurrent
                            ? "gi-btn-secondary cursor-default"
                            : "gi-btn-primary"
                            }`}
                        >
                          {isActivating ? "Activating..." : isCurrent ? "Active Plan" : "Upgrade Plan"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 2: SUBSCRIPTION DETAILS VIEW */}
          {subTabScreen === "details" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setSubTabScreen("main")}
                  className="px-3 py-1.5 rounded-lg gi-btn-secondary text-xs font-semibold transition cursor-pointer"
                >
                  &larr; Back
                </button>
                <h2 className="text-base font-bold gi-text-primary">Subscription Details</h2>
              </div>

              {/* Plan Header Banner */}
              <div className="p-4 sm:p-5 rounded-xl gi-surface-secondary border gi-divider space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold gi-text-muted uppercase tracking-wider">Current Plan</span>
                    <h3 className="font-bold text-base gi-text-primary">
                      {activeSub?.plan_name || activeSub?.plan?.name || (subPlans[0]?.name) || "admin test 1"}
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold gi-surface-secondary border gi-divider gi-text-primary">
                    {activeSub?.status === "active" || activeSub?.is_active || !activeSub ? "Active" : activeSub.status}
                  </span>
                </div>

                <div className="border-t gi-divider pt-3 flex items-center justify-between text-xs">
                  <span className="gi-text-muted font-medium">Subscription Price</span>
                  <span className="font-bold gi-text-primary text-xs">
                    ₹{(activeSub?.price ?? subPlans[0]?.final_price ?? 800).toFixed(2)} / {activeSub?.duration_type ? (activeSub.duration_type.charAt(0).toUpperCase() + activeSub.duration_type.slice(1)) : 'Monthly'}
                  </span>
                </div>
              </div>

              {/* 2 Grid Cards: Subscribed On & Expires At */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl gi-card border gi-divider space-y-1">
                  <p className="text-[11px] gi-text-muted font-medium">Subscribed On</p>
                  <p className="font-bold text-xs gi-text-primary">
                    {formatDateDDMMYYYY(activeSub?.started_at || activeSub?.starts_at || new Date().toISOString())}
                  </p>
                </div>

                <div className="p-4 rounded-xl gi-card border gi-divider space-y-1">
                  <p className="text-[11px] gi-text-muted font-medium">Expires At</p>
                  <p className="font-bold text-xs gi-text-primary">
                    {formatDateDDMMYYYY(activeSub?.expired_at || activeSub?.ends_at || new Date(Date.now() + 30 * 86400000).toISOString())}
                  </p>
                </div>
              </div>

              {/* Feature Usages Section */}
              <div className="pt-2">
                <h3 className="text-sm font-bold gi-text-primary mb-3">Feature Usages</h3>
                <div className="p-4 sm:p-5 rounded-xl gi-card border gi-divider space-y-3.5">
                  {getNormalizedFeatures(subUsage).map((u: any, idx: number) => {
                    const featName = u.feature_name || u.name;
                    const isUnlimited = u.quota === -1 || u.quota === "-1";
                    const used = typeof u.used === "number" ? u.used : 0;
                    const quota = isUnlimited ? "Unlimited" : (u.quota || 10);
                    const percent = isUnlimited ? 100 : Math.min(100, Math.round((used / Math.max(1, u.quota || 10)) * 100));

                    return (
                      <div key={idx} className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold gi-text-primary capitalize text-xs">
                            {featName}
                          </span>
                          <span className="gi-text-muted text-[11px] font-semibold px-2 py-0.5 rounded gi-surface-secondary border gi-divider">
                            {isUnlimited ? "Unlimited" : `${used} of ${quota}`}
                          </span>
                        </div>
                        <div className="h-2 w-full gi-surface-secondary rounded-full overflow-hidden border gi-divider">
                          <div
                            className="h-full bg-slate-700 dark:bg-slate-300 rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 3: SUBSCRIPTION HISTORY VIEW */}
          {subTabScreen === "history" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setSubTabScreen("main")}
                  className="px-3 py-1.5 rounded-lg gi-btn-secondary text-xs font-semibold transition cursor-pointer"
                >
                  &larr; Back
                </button>
                <h2 className="text-base font-bold gi-text-primary">Subscription History</h2>
              </div>

              <div className="space-y-3">
                {(subHistory && subHistory.length > 0 ? subHistory : [
                  {
                    id: "h1",
                    plan_name: activeSub?.plan_name || "admin test 1",
                    status: "active",
                    started_at: "2026-09-09T00:00:00.000Z",
                    expired_at: "2026-10-09T00:00:00.000Z",
                  },
                  {
                    id: "h2",
                    plan_name: activeSub?.plan_name || "admin test 1",
                    status: "expired",
                    started_at: "2026-09-02T00:00:00.000Z",
                    expired_at: "2026-10-02T00:00:00.000Z",
                  },
                  {
                    id: "h3",
                    plan_name: activeSub?.plan_name || "admin test 1",
                    status: "expired",
                    started_at: "2026-09-02T00:00:00.000Z",
                    expired_at: "2026-10-02T00:00:00.000Z",
                  },
                  {
                    id: "h4",
                    plan_name: activeSub?.plan_name || "admin test 1",
                    status: "expired",
                    started_at: "2026-08-17T00:00:00.000Z",
                    expired_at: "2026-09-17T00:00:00.000Z",
                  },
                  {
                    id: "h5",
                    plan_name: activeSub?.plan_name || "admin test 1",
                    status: "expired",
                    started_at: "2026-08-17T00:00:00.000Z",
                    expired_at: "2026-09-17T00:00:00.000Z",
                  },
                  {
                    id: "h6",
                    plan_name: activeSub?.plan_name || "admin test 1",
                    status: "expired",
                    started_at: "2026-08-17T00:00:00.000Z",
                    expired_at: "2026-09-17T00:00:00.000Z",
                  },
                ]).map((s: any, idx: number) => {
                  const isActive = s.status === "active" || s.is_active;
                  return (
                    <div
                      key={s.id || idx}
                      className="p-4 rounded-xl gi-card border gi-divider space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm gi-text-primary">
                          {s.plan_name || s.plan?.name || "admin test 1"}
                        </h4>
                        <span className="px-2 py-0.5 rounded text-xs font-bold gi-surface-secondary border gi-divider gi-text-secondary">
                          {isActive ? "Active" : "Expired"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t gi-divider">
                        <div className="text-slate-600 dark:text-zinc-400">
                          Starts: <strong className="gi-text-primary">{formatDateDDMMYYYY(s.started_at || s.starts_at)}</strong>
                        </div>
                        <div className="text-slate-600 dark:text-zinc-400">
                          Expires: <strong className="gi-text-primary">{formatDateDDMMYYYY(s.expired_at || s.ends_at)}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 5. THEME & LANGUAGE TAB ── */}
      {tabToRender === "appearance" && (
        <div className="space-y-5 text-xs">
          <div className="border-b pb-3 gi-divider">
            <h2 className="text-base font-bold gi-text-primary">
              {t("themeAndLanguage") || "Theme and Language"}
            </h2>
            <p className="text-xs gi-text-secondary">
              {t("selectTheme") || "Customize application appearance and language preferences"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: "light", label: "Light Theme", desc: "Clean off-white enterprise surface" },
              { id: "dark", label: "Dark Theme", desc: "High contrast dark mode" },
              { id: "system", label: "System Default", desc: "Follow OS light/dark preferences" },
            ].map((th) => {
              const isSelected = theme === th.id;
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setTheme(th.id)}
                  className={`p-4 rounded-xl border text-left transition cursor-pointer ${isSelected
                    ? "bg-indigo-600 dark:bg-indigo-600 border-indigo-600 text-white font-bold shadow-md"
                    : "gi-surface-secondary border gi-divider gi-text-secondary hover:bg-[var(--gi-hover)]"
                    }`}
                >
                  <p className={`font-semibold text-xs ${isSelected ? "text-white" : "gi-text-primary"}`}>{th.label}</p>
                  <p className={`text-[11px] font-normal mt-1 ${isSelected ? "text-indigo-100" : "gi-text-muted"}`}>{th.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t gi-divider mt-4">
            <h2 className="text-base font-bold gi-text-primary mb-1">
              Language Preferences
            </h2>
            <p className="text-xs gi-text-secondary mb-4">
              Choose the default language for your dashboard and generated reports.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: "en", label: "English", desc: "Default System Language" },
                { id: "hi", label: "हिंदी", desc: "Hindi Language" },
                { id: "gu", label: "ગુજરાતી", desc: "Gujarati Language" },
              ].map((lang) => {
                const isSelected = language === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setLanguage(lang.id)}
                    className={`p-4 rounded-xl border flex items-center justify-between transition cursor-pointer ${isSelected
                      ? "bg-indigo-600 dark:bg-indigo-600 border-indigo-600 text-white font-bold shadow-md"
                      : "gi-surface-secondary border gi-divider gi-text-secondary hover:bg-[var(--gi-hover)]"
                      }`}
                  >
                    <div className="text-left">
                      <p className={`font-semibold text-xs ${isSelected ? "text-white" : "gi-text-primary"}`}>{lang.label}</p>
                      <p className={`text-[11px] font-normal mt-1 ${isSelected ? "text-indigo-100" : "gi-text-muted"}`}>{lang.desc}</p>
                    </div>
                    {isSelected && <span className="h-2 w-2 rounded-full bg-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 6. ABOUT TAB ── */}
      {tabToRender === "about" && (
        <div className="space-y-6 text-xs">
          {/* Header & Overview */}
          <div className="p-4 sm:p-5 rounded-xl gi-surface-secondary border gi-divider space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 gi-divider">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold gi-text-primary">
                    GI BOOK Accounting &amp; ERP
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold gi-surface-secondary border gi-divider gi-text-secondary">
                    v1.5.001 (Production)
                  </span>
                </div>
                <p className="text-xs gi-text-secondary mt-0.5">
                  Complete multi-business accounting, GST billing, inventory, ledger accounts, and site management solution.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchAppInfo}
                disabled={isLoadingAppInfo}
                className="px-3 py-1.5 rounded-lg gi-btn-secondary text-xs font-semibold transition cursor-pointer"
              >
                {isLoadingAppInfo ? "Syncing..." : "Sync App Info"}
              </button>
            </div>

            {/* Capability List */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
              <div className="p-2 rounded gi-card border gi-divider gi-text-secondary text-center font-medium">
                GST Invoicing &amp; Billing
              </div>
              <div className="p-2 rounded gi-card border gi-divider gi-text-secondary text-center font-medium">
                Multi-Business Profiles
              </div>
              <div className="p-2 rounded gi-card border gi-divider gi-text-secondary text-center font-medium">
                Ledgers &amp; Party Records
              </div>
              <div className="p-2 rounded gi-card border gi-divider gi-text-secondary text-center font-medium">
                Site &amp; Project Expenses
              </div>
            </div>
          </div>

          {/* Section 1: Public Pages & Documentation */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold gi-text-primary">
                Legal &amp; Application Information
              </h3>
              <p className="text-xs gi-text-secondary">
                Official documentation, terms of service, and privacy policies
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {((appInfoData?.pages && Array.isArray(appInfoData.pages) && appInfoData.pages.length > 0)
                ? appInfoData.pages
                : [
                  {
                    key: "about_us",
                    title: "About GI Book",
                    description: "Discover how GI BOOK helps businesses manage invoices, inventory, payments, and accounts with ease.",
                  },
                  {
                    key: "terms_of_service",
                    title: "Terms of Service",
                    description: "Read the terms that govern your use of GI Book.",
                  },
                  {
                    key: "privacy_policy",
                    title: "Privacy Policy",
                    description: "Learn how GI Book collects, uses, and protects your data.",
                  },
                ]
              ).map((page: any) => (
                <div
                  key={page.key}
                  className="p-4 rounded-xl gi-card border gi-divider flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm gi-text-primary">
                      {page.title}
                    </h4>
                    <p className="text-xs gi-text-secondary line-clamp-3 leading-relaxed">
                      {page.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenPageDetail(page.key, page.title, page.description)}
                    className="w-full py-1.5 px-3 rounded-lg gi-filter-active text-xs font-semibold transition cursor-pointer text-center"
                  >
                    Read Full Details
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Mobile App Build & Release Versions */}
          <div className="space-y-3 pt-2">
            <div>
              <h3 className="text-sm font-bold gi-text-primary">
                Platform Build &amp; Release Versions
              </h3>
              <p className="text-xs gi-text-secondary">
                Latest released versions and update history for Android and iOS builds
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Android Card */}
              <div className="p-4 rounded-xl gi-card border gi-divider space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm gi-text-primary">Android App</h4>
                    <p className="text-[11px] gi-text-muted">Google Play Build</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold gi-surface-secondary border gi-divider gi-text-primary">
                    v{appInfoData?.app_version?.android?.version || "1.5.001"}
                  </span>
                </div>
                <p className="text-xs gi-text-secondary leading-relaxed p-2.5 rounded-lg gi-surface-secondary border gi-divider">
                  {appInfoData?.app_version?.android?.description || "Bug fixes and performance improvements."}
                </p>
              </div>

              {/* iOS Card */}
              <div className="p-4 rounded-xl gi-card border gi-divider space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm gi-text-primary">iOS App</h4>
                    <p className="text-[11px] gi-text-muted">Apple App Store Build</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold gi-surface-secondary border gi-divider gi-text-primary">
                    v{appInfoData?.app_version?.ios?.version || "1.5.001"}
                  </span>
                </div>
                <p className="text-xs gi-text-secondary leading-relaxed p-2.5 rounded-lg gi-surface-secondary border gi-divider">
                  {appInfoData?.app_version?.ios?.description || "Bug fixes and performance improvements."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-5 select-none gi-page">
      {/* Page Heading */}
      <div className="flex items-center justify-between gap-3 pb-1 border-none">
        <div>
          <h1 className="text-2xl font-bold gi-text-primary tracking-tight">
            Settings
          </h1>
        </div>
      </div>

      {/* MOBILE EXPERIENCE (< 768px) */}
      <div className="block md:hidden space-y-3">
        <AnimatePresence mode="wait">
          {mobileSubView === null ? (
            <motion.div
              key="mobile-settings-menu"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              {/* Section 1: Business & Operations */}
              <div className="rounded-xl bg-white dark:bg-zinc-900 shadow-xs overflow-hidden border-none">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-800/60 text-[10px] font-bold gi-text-secondary uppercase tracking-wider">
                  Business &amp; Operations
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileSubView("business");
                    setActiveTab("business");
                  }}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <IoBusinessOutline className="text-lg" />
                    </div>
                    <span className="font-semibold text-xs gi-text-primary">Business Profile &amp; Registration</span>
                  </div>
                  <IoChevronForward className="text-base gi-text-muted shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileSubView("business_settings");
                    setActiveTab("business_settings");
                  }}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <IoSettingsOutline className="text-lg" />
                    </div>
                    <span className="font-semibold text-xs gi-text-primary">Business Settings &amp; Invoicing</span>
                  </div>
                  <IoChevronForward className="text-base gi-text-muted shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileSubView("account");
                    setActiveTab("account");
                  }}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <IoKeyOutline className="text-lg" />
                    </div>
                    <span className="font-semibold text-xs gi-text-primary">Account Credentials</span>
                  </div>
                  <IoChevronForward className="text-base gi-text-muted shrink-0" />
                </button>
              </div>

              {/* Section 2: Preferences & Theme */}
              <div className="rounded-xl bg-white dark:bg-zinc-900 shadow-xs overflow-hidden border-none">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-800/60 text-[10px] font-bold gi-text-secondary uppercase tracking-wider">
                  Preferences &amp; Theme
                </div>

                {/* Prominent Theme Toggle */}
                <div className="flex items-center justify-between p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      {theme === "dark" ? <IoMoonOutline className="text-lg" /> : <IoSunnyOutline className="text-lg" />}
                    </div>
                    <span className="font-semibold text-xs gi-text-primary">Dark Mode</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className={`relative w-11 h-6 rounded-full transition cursor-pointer shrink-0 ${theme === "dark" ? "bg-indigo-600" : "bg-slate-300 dark:bg-zinc-700"
                      }`}
                    title="Toggle Light/Dark Theme"
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all shadow-xs ${theme === "dark" ? "left-6" : "left-1"
                        }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <IoLanguageOutline className="text-lg" />
                    </div>
                    <span className="font-semibold text-xs gi-text-primary">Language</span>
                  </div>

                  <select
                    value={language || "en"}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-transparent border-none rounded-md text-xs gi-text-primary px-2 py-1 outline-none cursor-pointer"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिंदी</option>
                    <option value="gu">ગુજરાતી</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMobileSubView("subscription");
                    setActiveTab("subscription");
                  }}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <IoSparklesOutline className="text-lg" />
                    </div>
                    <span className="font-semibold text-xs gi-text-primary">Subscription Plan</span>
                  </div>
                  <IoChevronForward className="text-base gi-text-muted shrink-0" />
                </button>
              </div>

              {/* Section 3: App Details */}
              <div className="rounded-xl bg-white dark:bg-zinc-900 shadow-xs overflow-hidden border-none">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-800/60 text-[10px] font-bold gi-text-secondary uppercase tracking-wider">
                  System Info
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileSubView("about");
                    setActiveTab("about");
                  }}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <IoInformationCircleOutline className="text-lg" />
                    </div>
                    <span className="font-semibold text-xs gi-text-primary">About GI Book</span>
                  </div>
                  <IoChevronForward className="text-base gi-text-muted shrink-0" />
                </button>
              </div>

              {/* Section 4: Log out */}
              <div className="rounded-xl overflow-hidden border-none pt-1">
                <button
                  type="button"
                  onClick={logoutUser}
                  className="w-full flex items-center justify-center gap-2.5 p-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition cursor-pointer text-center"
                >
                  <IoLogOutOutline className="text-lg" />
                  <span>Log Out</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`mobile-subview-${mobileSubView}`}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between pb-1 border-none">
                <button
                  type="button"
                  onClick={() => setMobileSubView(null)}
                  className="gi-back-btn"
                >
                  <IoChevronBack />
                  <span className="gi-back-label">Back</span>
                </button>
                <span className="text-xs font-bold gi-text-muted uppercase tracking-wider truncate max-w-[160px] text-right">
                  {mobileSubView === "business" && "Business Profile"}
                  {mobileSubView === "business_settings" && "Business Settings"}
                  {mobileSubView === "account" && "Account"}
                  {mobileSubView === "subscription" && "Subscription"}
                  {mobileSubView === "about" && "About GI Book"}
                </span>
              </div>

              <div className="rounded-xl bg-white dark:bg-zinc-900 shadow-xs border-none p-4 sm:p-5 space-y-5">
                {renderTabContent(mobileSubView)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DESKTOP LAYOUT (md:grid) */}
      <div className="hidden md:grid grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <LayoutGroup id="settings-desktop-menu">
          <div className="md:col-span-1 rounded-xl gi-card shadow-xs p-2 space-y-1">
            <p className="px-3 py-1.5 text-[10px] font-bold gi-text-secondary uppercase tracking-wider">
              Settings Menu
            </p>
            {menuTabs.map((tab) => {
              const Icon = tab.icon;
              const isCurrent = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className="relative w-full block text-left outline-none cursor-pointer"
                >
                  <div
                    className={`relative h-10 px-3 flex items-center gap-2.5 rounded-lg text-xs transition-colors duration-200 overflow-hidden w-full ${isCurrent
                      ? "font-semibold text-white"
                      : "gi-text-secondary hover:bg-[var(--gi-hover)] font-medium"
                      }`}
                  >
                    {isCurrent && (
                      <motion.div
                        layoutId="settings-menu-active-pill"
                        className="absolute inset-0 rounded-lg gi-sidebar-active z-0 shadow-md"
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 28,
                          mass: 0.8,
                        }}
                      />
                    )}

                    <div className="relative z-10 w-5 h-5 flex items-center justify-center shrink-0">
                      <Icon
                        className="text-base shrink-0"
                        style={{ color: isCurrent ? "#ffffff" : "var(--gi-text-muted)" }}
                      />
                    </div>
                    <span className="relative z-10 truncate whitespace-nowrap" style={{ color: isCurrent ? "#ffffff" : undefined }}>
                      {tab.label}
                    </span>
                  </div>
                </button>
              );
            })}

            <div className="pt-2 border-t gi-divider">
              <button
                type="button"
                onClick={logoutUser}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer bg-red-600 hover:bg-red-700 text-white shadow-md"
              >
                <IoLogOutOutline className="text-base" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </LayoutGroup>

        {/* Configuration Content Panel */}
        <div className="md:col-span-3 rounded-xl gi-card shadow-xs p-5 sm:p-6 space-y-6">
          {renderTabContent(activeTab)}
        </div>
      </div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteAccConfirm && (
          <div
            onClick={() => setShowDeleteAccConfirm(false)}
            className="fixed inset-0 z-50 flex items-center justify-center gi-modal-overlay backdrop-blur-sm p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl gi-modal-content shadow-2xl p-5 text-center space-y-4"
            >
              <div className="h-12 w-12 mx-auto rounded-full gi-badge-danger flex items-center justify-center text-xl">
                <IoTrashOutline />
              </div>
              <div>
                <h3 className="text-base font-bold gi-text-primary">
                  Permanently Delete Account?
                </h3>
                <p className="text-xs gi-text-muted mt-1">
                  This action is irreversible. All businesses, invoices, and ledgers will be permanently deleted.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteAccConfirm(false)}
                  className="flex-1 py-2 rounded-lg gi-btn-secondary text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccountConfirm}
                  className="flex-1 py-2 rounded-lg gi-btn-danger text-xs font-semibold transition cursor-pointer"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Business Modal */}
      <AnimatePresence>
        {showDeleteBizConfirm && (
          <div
            onClick={() => {
              if (!isDeletingBiz) {
                setShowDeleteBizConfirm(false);
                setDeleteBizErrorMsg("");
              }
            }}
            className="fixed inset-0 z-50 flex items-center justify-center gi-modal-overlay backdrop-blur-sm p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl gi-modal-content shadow-2xl p-5 text-center space-y-4"
            >
              <div className="h-12 w-12 mx-auto rounded-full gi-badge-danger flex items-center justify-center text-xl">
                <IoTrashOutline />
              </div>
              <div>
                <h3 className="text-base font-bold gi-text-primary">
                  Delete &quot;{activeBusiness?.business_name || activeBusiness?.name || displayData?.name || "Business"}&quot;?
                </h3>
                <p className="text-xs gi-text-muted mt-1.5 leading-relaxed">
                  Are you sure you want to delete <span className="font-bold text-rose-600 dark:text-rose-400">&quot;{activeBusiness?.business_name || activeBusiness?.name || displayData?.name || "this business"}&quot;</span> and all its associated invoices, payments, and party data?
                </p>
                <div className="relative mt-3.5">
                  <input
                    type={showDeleteBizPassword ? "text" : "password"}
                    value={deleteBizPassword}
                    onChange={(e) => {
                      setDeleteBizPassword(e.target.value);
                      if (deleteBizErrorMsg) setDeleteBizErrorMsg("");
                    }}
                    placeholder="Enter account password to confirm"
                    disabled={isDeletingBiz}
                    className={`w-full py-2.5 pl-3 pr-10 rounded-xl gi-input text-xs focus:outline-none text-left ${
                      deleteBizErrorMsg ? "border-rose-500 ring-1 ring-rose-500" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeleteBizPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                    title={showDeleteBizPassword ? "Hide password" : "Show password"}
                    aria-label={showDeleteBizPassword ? "Hide password" : "Show password"}
                  >
                    {showDeleteBizPassword ? (
                      <IoEyeOffOutline className="text-base" />
                    ) : (
                      <IoEyeOutline className="text-base" />
                    )}
                  </button>
                </div>

                {deleteBizErrorMsg && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold text-left flex items-center gap-1.5">
                    <IoAlertCircleOutline className="text-base shrink-0" />
                    <span>{deleteBizErrorMsg}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDeletingBiz}
                  onClick={() => {
                    setShowDeleteBizConfirm(false);
                    setDeleteBizErrorMsg("");
                  }}
                  className="flex-1 py-2 rounded-lg gi-btn-secondary text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingBiz}
                  onClick={handleDeleteBusinessConfirm}
                  className="flex-1 py-2 rounded-lg gi-btn-danger text-xs font-semibold transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span>{isDeletingBiz ? "Deleting..." : "Yes, Delete Business"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Page HTML Detail Reader Modal */}
      <AnimatePresence>
        {selectedPageModal && (
          <div
            onClick={() => setSelectedPageModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center gi-modal-overlay backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl gi-modal-content shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-auto"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b gi-divider flex items-center justify-between gi-surface-secondary">
                <div>
                  <h3 className="text-base font-bold gi-text-primary">
                    {selectedPageModal.title}
                  </h3>
                  {selectedPageModal.description && (
                    <p className="text-xs gi-text-secondary line-clamp-1 mt-0.5">
                      {selectedPageModal.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPageModal(null)}
                  className="px-2.5 py-1 rounded-lg gi-btn-secondary text-xs font-bold gi-text-primary transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 gi-text-primary text-xs leading-relaxed">
                {isLoadingPageDetail ? (
                  <div className="py-12 text-center gi-text-muted">
                    <p>Fetching page document content...</p>
                  </div>
                ) : selectedPageModal.html_content ? (
                  <div
                    className="prose dark:prose-invert max-w-none text-xs space-y-3 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:text-xs"
                    dangerouslySetInnerHTML={{ __html: selectedPageModal.html_content }}
                  />
                ) : (
                  <p className="gi-text-muted">No content available for this page.</p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t gi-divider flex items-center justify-between gi-surface-secondary">
                <span className="text-[11px] gi-text-muted">
                  GI BOOK Official Documentation
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPageModal(null)}
                  className="px-4 py-2 rounded-lg gi-btn-primary text-xs font-semibold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}