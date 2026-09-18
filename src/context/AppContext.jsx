"use client";

import React, { createContext, useContext, useState, useEffect, startTransition } from "react";
import { authApi } from "@/lib/api/auth";

const AppContext = createContext();

export const translations = {
  en: {
    appName: "GI Book",
    tagline: "Smart Accounting. Simple Business.",
    home: "Home",
    parties: "Parties",
    items: "Items",
    settings: "Settings",
    invoices: "Invoices",
    payments: "Payments",
    staff: "Staff",
    reports: "Reports",
    siteProject: "Site / Project",
    logout: "Log Out",
    welcomeBack: "Welcome Back",
    loginSubtitle: "Login to your account",
    email: "Email",
    password: "Password",
    login: "Login",
    createAccount: "Create Account",
    signUp: "Sign Up",
    fullName: "Full Name",
    confirmPassword: "Confirm Password",
    noAccount: "Don't have an account?",
    alreadyAccount: "Already have an account?",
    theme: "Theme",
    language: "Language",
    business: "Business",
    businessSettings: "Business Settings",
    account: "Account",
    subscription: "Subscription",
    aboutUs: "About Us",
    totalSales: "Total Sales",
    totalBalance: "Total Balance",
    toCollect: "To Collect",
    toPay: "To Pay",
    recentTransactions: "Recent Transactions",
    noTransactions: "No Recent Transactions",
    addBusiness: "Add Business",
    changeBusiness: "Change Business",
    selectLanguage: "Select Preferred Language",
    selectTheme: "Select Application Appearance",
    accountDetails: "Account Details",
    subscriptionDetails: "Subscription Details",
    aboutApp: "About GI Book",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    apply: "Apply",
    search: "Search...",
  },
  hi: {
    appName: "जीआई बुक",
    tagline: "स्मार्ट अकाउंटिंग, सरल व्यापार।",
    home: "होम",
    parties: "पार्टियां",
    items: "सामग्री / वस्तुएं",
    settings: "सेटिंग्स",
    invoices: "इनवॉइस",
    payments: "भुगतान (पेमेंट्स)",
    staff: "स्टाफ",
    reports: "रिपोर्ट्स",
    siteProject: "साइट / प्रोजेक्ट",
    logout: "लॉग आउट",
    welcomeBack: "पुनः आपका स्वागत है",
    loginSubtitle: "अपने खाते में लॉगिन करें",
    email: "ईमेल",
    password: "पासवर्ड",
    login: "लॉगिन करें",
    createAccount: "खाता बनाएं",
    signUp: "साइन अप करें",
    fullName: "पूरा नाम",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    noAccount: "क्या खाता नहीं है?",
    alreadyAccount: "क्या पहले से खाता है?",
    theme: "थीम (दिखावट)",
    language: "भाषा",
    business: "व्यवसाय",
    businessSettings: "व्यवसाय सेटिंग्स",
    account: "खाता प्रोफाइल",
    subscription: "सब्सक्रिप्शन",
    aboutUs: "हमारे बारे में",
    totalSales: "कुल बिक्री",
    totalBalance: "कुल बैलेंस",
    toCollect: "प्राप्त करना है",
    toPay: "भुगतान करना है",
    recentTransactions: "हाल के लेन-देन",
    noTransactions: "कोई हाल का लेन-देन नहीं",
    addBusiness: "नया व्यवसाय जोड़ें",
    changeBusiness: "व्यवसाय बदलें",
    selectLanguage: "अपनी पसंदीदा भाषा चुनें",
    selectTheme: "एप की दिखावट चुनें",
    accountDetails: "खाता विवरण",
    subscriptionDetails: "सब्सक्रिप्शन विवरण",
    aboutApp: "जीआई बुक के बारे में",
    save: "सहेजें",
    cancel: "रद्द करें",
    close: "बंद करें",
    apply: "लागू करें",
    search: "खोजें...",
  },
  gu: {
    appName: "જીઆઈ બુક",
    tagline: "સ્માર્ટ એકાઉન્ટિંગ, સરળ બિઝનેસ.",
    home: "હોમ",
    parties: "પાર્ટીઓ",
    items: "આઇટમ્સ / વસ્તુઓ",
    settings: "સેટિંગ્સ",
    invoices: "ઇનવોઇસ",
    payments: "ચુકવણી (પેમેન્ટ્સ)",
    staff: "સ્ટાફ",
    reports: "રિપોર્ટ્સ",
    siteProject: "સાઇટ / પ્રોજેક્ટ",
    logout: "લોગ આઉટ",
    welcomeBack: "આપનું સ્વાગત છે",
    loginSubtitle: "તમારા એકાઉન્ટમાં લોગિન કરો",
    email: "ઇમેઇલ",
    password: "પાસવર્ડ",
    login: "લોગિન કરો",
    createAccount: "એકાઉન્ટ બનાવો",
    signUp: "સાઇન અપ કરો",
    fullName: "પૂરું નામ",
    confirmPassword: "પાસવર્ડ કન્ફર્મ કરો",
    noAccount: "એકાઉન્ટ નથી?",
    alreadyAccount: "પહેલેથી એકાઉન્ટ છે?",
    theme: "થીમ",
    language: "ભાષા",
    business: "બિઝનેસ",
    businessSettings: "બિઝનેસ સેટિંગ્સ",
    account: "એકાઉન્ટ પ્રોફાઇલ",
    subscription: "સબસ્ક્રિપ્શન",
    aboutUs: "અમારા વિશે",
    totalSales: "કુલ વેચાણ",
    totalBalance: "કુલ બેલેન્સ",
    toCollect: "લેવાના બાકી",
    toPay: "આપવાના બાકી",
    recentTransactions: "તાજેતરના વ્યવહારો",
    noTransactions: "કોઈ તાજેતરના વ્યવહારો નથી",
    addBusiness: "નવો બિઝનેસ ઉમેરો",
    changeBusiness: "બિઝનેસ બદલો",
    selectLanguage: "તમારી પસંદગીની ભાષા પસંદ કરો",
    selectTheme: "એપનું થીમ પસંદ કરો",
    accountDetails: "એકાઉન્ટ વિગતો",
    subscriptionDetails: "સબસ્ક્રિપ્શન વિગતો",
    aboutApp: "જીઆઈ બુક વિશે",
    save: "સાચવો",
    cancel: "રદ કરો",
    close: "બંધ કરો",
    apply: "લાગુ કરો",
    search: "શોધો...",
  }
};

export const getUserStorageKey = (user) => {
  if (!user) return "guest";
  if (user.isStaff && user.ownerKey) return user.ownerKey;
  if (!user.email && !user.mobile && !user.name) return "guest";
  return (user.email || user.mobile || user.name || "guest").toLowerCase().replace(/[^a-z0-9]/g, "_");
};

export const getBizStorageKey = (business) => {
  if (!business || !business.id) return "default_biz";
  return String(business.id).replace(/[^a-z0-9]/gi, "_");
};

export function AppProvider({ children }) {
  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [users, setUsers] = useState([]);

  // Business state
  const [businesses, setBusinesses] = useState([]);
  const [activeBusiness, setActiveBusiness] = useState(null);

  // Entities state
  const [parties, setPartiesState] = useState([]);
  const [items, setItemsState] = useState([]);
  const [invoices, setInvoicesState] = useState([]);
  const [payments, setPaymentsState] = useState([]);
  const [siteProjects, setSiteProjectsState] = useState([]);
  const [staffList, setStaffListState] = useState([]);
  const [ledgers, setLedgersState] = useState([]);
  const [ledgerTransactions, setLedgerTransactionsState] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Preference state
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("giBookTheme") ||
        localStorage.getItem("app_theme") ||
        "system"
      );
    }
    return "system";
  });
  const [language, setLanguage] = useState("en");

  // Helper to load data for a specific user and business
  const loadUserAndBizData = (user, targetBiz = null) => {
    const userKey = getUserStorageKey(user);
    try {
      const bizList = JSON.parse(localStorage.getItem(`gi_book_${userKey}_businesses`)) || [];
      let actBiz = targetBiz || user?.assignedBusiness || JSON.parse(localStorage.getItem(`gi_book_${userKey}_active_business`)) || (bizList[0] || null);

      if (!actBiz && bizList.length > 0) {
        actBiz = bizList[0];
      }

      if (!actBiz && user?.isStaff) {
        actBiz = { id: user.businessId || user.bizKey || "b-1001", name: user.businessName || "GI Enterprises" };
      }

      const bizKey = user?.isStaff && user?.bizKey ? user.bizKey : getBizStorageKey(actBiz);

      const prt = JSON.parse(localStorage.getItem(`gi_book_${userKey}_${bizKey}_parties`)) || [];
      const itm = JSON.parse(localStorage.getItem(`gi_book_${userKey}_${bizKey}_items`)) || [];
      const inv = JSON.parse(localStorage.getItem(`gi_book_${userKey}_${bizKey}_invoices`)) || [];
      const pay = JSON.parse(localStorage.getItem(`gi_book_${userKey}_${bizKey}_payments`)) || [];
      const site = JSON.parse(localStorage.getItem(`gi_book_${userKey}_${bizKey}_siteProjects`)) || [];
      const stf = JSON.parse(localStorage.getItem(`gi_book_${userKey}_${bizKey}_staffList`)) || [];
      const ldg = JSON.parse(localStorage.getItem(`gi_book_${userKey}_${bizKey}_ledgers`)) || [];
      const ldgTx = JSON.parse(localStorage.getItem(`gi_book_${userKey}_${bizKey}_ledgerTransactions`)) || [];

      setBusinesses(user?.isStaff && actBiz ? [actBiz] : bizList);
      setActiveBusiness(actBiz);
      setPartiesState(prt);
      setItemsState(itm);
      setInvoicesState(inv);
      setPaymentsState(pay);
      setSiteProjectsState(site);
      setStaffListState(stf);
      setLedgersState(ldg);
      setLedgerTransactionsState(ldgTx);
    } catch (err) {
      console.error("Error loading user and biz data:", err);
    }
  };

  // Helper to save entities for active user & active business
  const saveUserData = (user, entityName, data, currentBiz = activeBusiness) => {
    const userKey = getUserStorageKey(user);
    const targetBiz = currentBiz || (user?.isStaff ? user?.assignedBusiness : activeBusiness);
    const bizKey = user?.isStaff && user?.bizKey ? user.bizKey : getBizStorageKey(targetBiz);
    try {
      localStorage.setItem(`gi_book_${userKey}_${bizKey}_${entityName}`, JSON.stringify(data));
    } catch (err) {
      console.error(`Error saving ${entityName}:`, err);
    }
  };

  // Load initial state & data on mount
  useEffect(() => {
    try {
      const savedTheme =
        localStorage.getItem("giBookTheme") ||
        localStorage.getItem("app_theme") ||
        "system";
      const savedLang = localStorage.getItem("app_language") || "en";
      startTransition(() => {
        setTheme(savedTheme);
        setLanguage(savedLang);
      });

      // Auth & Initial Seed
      let savedUsers = JSON.parse(localStorage.getItem("app_users"));
      if (!savedUsers || savedUsers.length === 0) {
        const demoOwner = {
          id: 1001,
          name: "Business Owner",
          email: "admin@gibook.com",
          password: "admin123",
          role: "Owner",
          isStaff: false,
        };
        savedUsers = [demoOwner];
        localStorage.setItem("app_users", JSON.stringify(savedUsers));

        const ownerUserKey = "admin_gibook_com";
        const demoBiz = {
          id: "b-1001",
          name: "GI Enterprises",
          email: "admin@gibook.com",
          phone: "9876543210",
          address: "123 Business Hub, MG Road, Mumbai",
          type: "agency",
          gstNumber: "27AAAAA0000A1Z5",
        };
        const demoBizKey = "b_1001";

        const demoStaff = {
          id: "staff-1001",
          name: "Rahul Sharma",
          email: "staff@gibook.com",
          mobile: "9876543210",
          password: "123456",
          allowAccess: true,
          businessId: "b-1001",
          businessName: "GI Enterprises",
          ownerKey: ownerUserKey,
          bizKey: demoBizKey,
          assignedBusiness: demoBiz,
          permissions: {
            "Business": ["View"],
            "Staff": ["View"],
            "Subscription": ["View"],
            "Payment": ["View", "Create"],
            "Setting": ["View"],
            "Ledger": ["View", "Create", "Update", "Delete"],
            "Item Transaction": ["View", "Create", "Update", "Delete"],
            "Invoice": ["View", "Create", "Update", "Delete"],
            "Project": ["View", "Create", "Update", "Delete"],
            "Site": ["View", "Create", "Update", "Delete"],
            "Report": ["View"],
            "Notification": ["View"],
          },
          createdAt: new Date().toISOString(),
        };

        const sampleParties = [
          {
            id: 1,
            partyName: "ABC Traders",
            partyType: "Customer",
            phone: "9876500001",
            gstNumber: "27ABCDE1234F1Z5",
            closingBalance: 15400,
            balanceType: "To Receive",
            billingAddress: "Mumbai, Maharashtra",
            createdBy: "Business Owner",
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            partyName: "Apex Suppliers",
            partyType: "Supplier",
            phone: "9876500002",
            gstNumber: "27XYZAB5678C1Z2",
            closingBalance: -8500,
            balanceType: "To Pay",
            billingAddress: "Pune, Maharashtra",
            createdBy: "Business Owner",
            createdAt: new Date().toISOString(),
          },
        ];

        const sampleItems = [
          {
            id: 1,
            itemName: "Premium Cotton Fabric",
            itemType: "Product",
            unit: "MTR",
            salesPrice: 450,
            purchasePrice: 320,
            stockQuantity: 120,
            stockValue: 38400,
            createdBy: "Business Owner",
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            itemName: "Tailoring & Stitching",
            itemType: "Service",
            unit: "NA",
            salesPrice: 800,
            purchasePrice: 0,
            stockQuantity: 0,
            stockValue: 0,
            createdBy: "Business Owner",
            createdAt: new Date().toISOString(),
          },
        ];

        const sampleInvoices = [
          {
            id: "inv-101",
            invoiceType: "sales",
            type: "sales",
            invoiceNumberStr: "INV-001",
            invoiceNumber: "INV-001",
            invoiceDate: new Date().toISOString().split("T")[0],
            partyName: "ABC Traders",
            party: { id: 1, partyName: "ABC Traders" },
            totalAmount: 15400,
            status: "partially_paid",
            paidAmount: 5000,
            createdBy: "Business Owner",
            createdByRole: "Owner",
            createdAt: new Date().toISOString(),
          },
        ];

        const samplePayments = [
          {
            id: "pay-101",
            type: "credit",
            partyName: "ABC Traders",
            party: { id: 1, partyName: "ABC Traders" },
            amount: 5000,
            mode: "Online / UPI",
            date: new Date().toISOString().split("T")[0],
            status: "completed",
            createdBy: "Business Owner",
            createdByRole: "Owner",
            createdAt: new Date().toISOString(),
          },
        ];

        const sampleSiteProjects = [
          {
            id: 1,
            name: "Metro Tower Project",
            type: "Project",
            status: "Ongoing",
            description: "Commercial complex development",
            createdBy: "Business Owner",
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            name: "Site A - Ground Floor",
            type: "Site",
            status: "Active",
            projectId: 1,
            projectName: "Metro Tower Project",
            address: "Sector 18, Navi Mumbai",
            createdBy: "Business Owner",
            createdAt: new Date().toISOString(),
          },
        ];

        localStorage.setItem(`gi_book_${ownerUserKey}_businesses`, JSON.stringify([demoBiz]));
        localStorage.setItem(`gi_book_${ownerUserKey}_active_business`, JSON.stringify(demoBiz));
        localStorage.setItem(`gi_book_${ownerUserKey}_${demoBizKey}_staffList`, JSON.stringify([demoStaff]));
        localStorage.setItem(`gi_book_${ownerUserKey}_${demoBizKey}_parties`, JSON.stringify(sampleParties));
        localStorage.setItem(`gi_book_${ownerUserKey}_${demoBizKey}_items`, JSON.stringify(sampleItems));
        localStorage.setItem(`gi_book_${ownerUserKey}_${demoBizKey}_invoices`, JSON.stringify(sampleInvoices));
        localStorage.setItem(`gi_book_${ownerUserKey}_${demoBizKey}_payments`, JSON.stringify(samplePayments));
        localStorage.setItem(`gi_book_${ownerUserKey}_${demoBizKey}_siteProjects`, JSON.stringify(sampleSiteProjects));
      }

      const loggedUser = JSON.parse(localStorage.getItem("currentUser"));
      const isLogged = localStorage.getItem("isLoggedIn") === "true";
      startTransition(() => {
        setUsers(savedUsers);

        if (loggedUser && isLogged) {
          setCurrentUser(loggedUser);
          setIsLoggedIn(true);
          loadUserAndBizData(loggedUser);
        } else {
          loadUserAndBizData(null);
        }
      });
    } catch (err) {
      console.error("Error loading initial data:", err);
    }
  }, []);

  // Update root DOM element when theme or language changes & listen for OS changes
  useEffect(() => {
    document.documentElement.lang = language;

    const applyTheme = () => {
      let isDark = false;
      if (theme === "dark") {
        isDark = true;
      } else if (theme === "light") {
        isDark = false;
      } else {
        // System preference
        isDark =
          typeof window !== "undefined" &&
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;
      }

      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    };

    applyTheme();

    if (theme === "system" && typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleMediaChange = () => applyTheme();
      mediaQuery.addEventListener("change", handleMediaChange);
      return () => mediaQuery.removeEventListener("change", handleMediaChange);
    }
  }, [theme, language]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem("giBookTheme", newTheme);
      localStorage.setItem("app_theme", newTheme);
    } catch (e) { }
  };

  // Wrapped Setters for entity updates
  const setParties = (updater) => {
    setPartiesState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveUserData(currentUser, "parties", next);
      return next;
    });
  };

  const setItems = (updater) => {
    setItemsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveUserData(currentUser, "items", next);
      return next;
    });
  };

  const setSiteProjects = (updater) => {
    setSiteProjectsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveUserData(currentUser, "siteProjects", next);
      return next;
    });
  };

  const setStaffList = (updater) => {
    setStaffListState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveUserData(currentUser, "staffList", next);
      return next;
    });
  };

  const MODULE_ALIASES = {
    "parties": "Ledger",
    "ledger": "Ledger",
    "items": "Item Transaction",
    "item": "Item Transaction",
    "item transaction": "Item Transaction",
    "inventory": "Item Transaction",
    "invoices": "Invoice",
    "invoice": "Invoice",
    "payments": "Payment",
    "payment": "Payment",
    "staff": "Staff",
    "site": "Site",
    "project": "Project",
    "reports": "Report",
    "report": "Report",
    "settings": "Setting",
    "setting": "Setting",
    "business": "Business",
    "subscription": "Subscription",
    "notification": "Notification",
    "notifications": "Notification",
  };

  const hasPermission = (moduleName, action = null) => {
    if (!currentUser || !currentUser.isStaff || currentUser.role === "Owner") {
      return true;
    }

    const key = (moduleName || "").trim().toLowerCase();
    const targetModule = MODULE_ALIASES[key] || moduleName;
    const userPerms = currentUser.permissions || {};
    const moduleActions = userPerms[targetModule] || [];

    if (!action) {
      return Array.isArray(moduleActions) && moduleActions.length > 0;
    }

    const actionStr = String(action).toLowerCase();
    return (
      Array.isArray(moduleActions) &&
      moduleActions.some((act) => String(act).toLowerCase() === actionStr)
    );
  };

  // Auth Methods
  const loginUser = async (emailOrPhone, password, loginType = "owner") => {
    const input = (emailOrPhone || "").trim();
    try {
      const res = await authApi.login({
        email: input,
        password,
      });

      const userObj = res?.body?.user || res?.user;
      if (!userObj) {
        return { success: false, error: res?.message || "Invalid credentials." };
      }

      let splashData = null;
      try {
        splashData = await authApi.getSplash();
      } catch (err) {
        console.warn("Splash fetch failed:", err);
      }

      const activeBiz = splashData?.body?.selected_business_profile || null;
      const bizList = splashData?.body?.business_profiles || [];

      const appUser = {
        id: userObj.id,
        name: userObj.name,
        email: userObj.email,
        mobile: userObj.mobile_number,
        countryCode: userObj.country_code,
        userType: userObj.user_type,
        status: userObj.status,
        role: userObj.user_type === "user" ? "Owner" : "Staff",
        isStaff: userObj.user_type === "user_staff",
        permissions: splashData?.body?.permissions || {},
        activeBusiness: activeBiz,
      };

      setCurrentUser(appUser);
      setIsLoggedIn(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("currentUser", JSON.stringify(appUser));
        localStorage.setItem("isLoggedIn", "true");
      }

      if (activeBiz) setActiveBusiness(activeBiz);
      if (bizList.length > 0) setBusinesses(bizList);

      return { success: true, user: appUser };
    } catch (err) {
      let errorMsg = err.message || "Invalid credentials.";
      if (err?.data?.code === "account_inactive" || err.message?.includes("inactive")) {
        errorMsg = "Your account is inactive.";
      }
      return { success: false, error: errorMsg };
    }
  };

  const registerUser = async (formData) => {
    try {
      let payload = {};
      if (typeof formData === "object" && formData !== null) {
        payload = formData;
      } else {
        payload = {
          name: arguments[0],
          email: arguments[1],
          password: arguments[2],
          mobile_number: arguments[3] || "1234567890",
          country_code: arguments[4] || 91,
          user_type: "user",
        };
      }

      const res = await authApi.register({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        mobile_number: payload.mobile_number || payload.mobile || "1234567890",
        country_code: payload.country_code ? parseInt(payload.country_code, 10) : 91,
        user_type: payload.user_type || "user",
      });

      const userObj = res?.body?.user || res?.user;
      if (!userObj) {
        return { success: false, error: res?.message || "Registration failed." };
      }

      const appUser = {
        id: userObj.id,
        name: userObj.name,
        email: userObj.email,
        mobile: userObj.mobile_number,
        countryCode: userObj.country_code,
        userType: userObj.user_type,
        status: userObj.status,
        role: "Owner",
        isStaff: false,
      };

      setCurrentUser(appUser);
      setIsLoggedIn(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("currentUser", JSON.stringify(appUser));
        localStorage.setItem("isLoggedIn", "true");
      }

      return { success: true, user: appUser };
    } catch (err) {
      return { success: false, error: err.message || "Registration failed." };
    }
  };

  const requestForgotPassword = async (identifier) => {
    try {
      const res = await authApi.forgotPassword(identifier);
      return {
        success: true,
        message: res?.message || "OTP sent successfully.",
        resendAvailableInSeconds: res?.body?.resend_available_in_seconds || 60,
      };
    } catch (err) {
      return { success: false, error: err.message || "Failed to request OTP." };
    }
  };

  const resetPasswordWithOtp = async ({ identifier, otp, password, password_confirmation }) => {
    try {
      const res = await authApi.setPassword({
        identifier,
        otp,
        password,
        password_confirmation,
      });

      const userObj = res?.body?.user || res?.user;
      if (userObj) {
        const appUser = {
          id: userObj.id,
          name: userObj.name,
          email: userObj.email,
          mobile: userObj.mobile_number,
          countryCode: userObj.country_code,
          userType: userObj.user_type,
          status: userObj.status,
          role: userObj.user_type === "user" ? "Owner" : "Staff",
        };
        setCurrentUser(appUser);
        setIsLoggedIn(true);
      }

      return { success: true, message: res?.message || "Password set successfully." };
    } catch (err) {
      return { success: false, error: err.message || "Failed to set new password." };
    }
  };

  const resetForgotPassword = (targetEmail, newPassword, otp) => {
    if (otp) {
      return resetPasswordWithOtp({
        identifier: targetEmail,
        otp,
        password: newPassword,
        password_confirmation: newPassword,
      });
    }
    return requestForgotPassword(targetEmail);
  };

  const changeUserPassword = async (currentPassword, newPassword) => {
    try {
      const res = await authApi.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPassword,
      });
      return { success: true, message: res?.message || "Password changed successfully." };
    } catch (err) {
      return { success: false, error: err.message || "Failed to change password." };
    }
  };

  const deleteAccount = async (password) => {
    if (!currentUser) return;
    try {
      await authApi.deleteAccount(password);
    } catch (e) {
      console.error("Account deletion failed:", e);
    }
    confirmLogout();
  };

  const deleteBusiness = (targetBizId) => {
    const userKey = getUserStorageKey(currentUser);
    const bizToDelete = businesses.find((b) => String(b.id) === String(targetBizId));
    if (!bizToDelete) return;

    const remainingBiz = businesses.filter((b) => String(b.id) !== String(targetBizId));
    setBusinesses(remainingBiz);

    if (activeBusiness && String(activeBusiness.id) === String(targetBizId)) {
      const nextBiz = remainingBiz.length > 0 ? remainingBiz[0] : null;
      setActiveBusiness(nextBiz);
    }
  };

  const logoutUser = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    try {
      await authApi.logout();
    } catch (e) {
      console.warn("Logout API call error:", e);
    } finally {
      setCurrentUser(null);
      setIsLoggedIn(false);
      setBusinesses([]);
      setActiveBusiness(null);
      setPartiesState([]);
      setItemsState([]);
      setInvoicesState([]);
      setPaymentsState([]);
      setSiteProjectsState([]);
      setStaffListState([]);

      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("currentUser");
        localStorage.setItem("isLoggedIn", "false");
        window.location.replace("/login");
      }
    }
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Preference Handlers
  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem("app_language", newLang);
  };

  const t = (key) => {
    const langDict = translations[language] || translations.en;
    return langDict[key] || translations.en[key] || key;
  };

  // Business Handlers
  const safeStorageSet = (key, value) => {
    try {
      localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    } catch (e) {
      console.warn(`localStorage quota error setting "${key}":`, e);
    }
  };

  const saveBusiness = (newBusinessData) => {
    const userKey = getUserStorageKey(currentUser);
    const newBiz = { id: `b-${Date.now()}`, createdAt: new Date().toISOString(), ...newBusinessData };
    const updated = [...businesses, newBiz];

    setBusinesses(updated);
    setActiveBusiness(newBiz);
    safeStorageSet(`gi_book_${userKey}_businesses`, updated);
    safeStorageSet(`gi_book_${userKey}_active_business`, newBiz);

    // Reset current state to empty for brand new business
    setPartiesState([]);
    setItemsState([]);
    setInvoicesState([]);
    setPaymentsState([]);
    setSiteProjectsState([]);
    setStaffListState([]);

    const bizKey = getBizStorageKey(newBiz);
    safeStorageSet(`gi_book_${userKey}_${bizKey}_parties`, []);
    safeStorageSet(`gi_book_${userKey}_${bizKey}_items`, []);
    safeStorageSet(`gi_book_${userKey}_${bizKey}_invoices`, []);
    safeStorageSet(`gi_book_${userKey}_${bizKey}_payments`, []);
    safeStorageSet(`gi_book_${userKey}_${bizKey}_siteProjects`, []);
    safeStorageSet(`gi_book_${userKey}_${bizKey}_staffList`, []);

    return newBiz;
  };

  const updateBusiness = (updatedBusinessData) => {
    const userKey = getUserStorageKey(currentUser);
    const targetId = updatedBusinessData.id || activeBusiness?.id || `b-${Date.now()}`;
    const fullUpdatedBiz = { ...activeBusiness, id: targetId, ...updatedBusinessData };

    const exists = businesses.some((b) => String(b.id) === String(targetId));
    let updatedList;
    if (exists) {
      updatedList = businesses.map((b) =>
        String(b.id) === String(targetId) ? { ...b, ...updatedBusinessData } : b
      );
    } else {
      updatedList = [...businesses, fullUpdatedBiz];
    }

    setBusinesses(updatedList);
    setActiveBusiness(fullUpdatedBiz);
    safeStorageSet(`gi_book_${userKey}_businesses`, updatedList);
    safeStorageSet(`gi_book_${userKey}_active_business`, fullUpdatedBiz);
  };

  const switchActiveBusiness = (bizOrId) => {
    if (!bizOrId) return;
    const targetBiz = typeof bizOrId === "object"
      ? bizOrId
      : (businesses.find((b) => String(b.id) === String(bizOrId)) || { id: bizOrId, name: String(bizOrId) });

    const userKey = getUserStorageKey(currentUser);
    setActiveBusiness(targetBiz);
    safeStorageSet(`gi_book_${userKey}_active_business`, targetBiz);
    loadUserAndBizData(currentUser, targetBiz);
  };

  const getAuthorInfo = () => {
    const isStaff = currentUser?.isStaff || currentUser?.role === "Staff";
    const authorName = isStaff
      ? (currentUser?.staffName || currentUser?.name || currentUser?.mobile || "Staff Member")
      : (currentUser?.name || "Business Owner");
    const authorRole = isStaff ? "Staff" : "Owner";
    return { authorName, authorRole };
  };

  // Invoice Handlers
  const addInvoice = (invoiceData) => {
    const { authorName, authorRole } = getAuthorInfo();
    const invType = String(invoiceData.invoiceType || invoiceData.type || "sales").toLowerCase();
    const newInv = {
      id: `inv-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: authorName,
      createdByRole: authorRole,
      type: invType,
      invoiceType: invType,
      ...invoiceData,
    };

    const updatedInvoices = [newInv, ...invoices];
    setInvoicesState(updatedInvoices);
    saveUserData(currentUser, "invoices", updatedInvoices);

    // Update Party Balance
    const targetPartyId = invoiceData.party?.id || invoiceData.supplier?.id;
    if (targetPartyId) {
      const updatedParties = parties.map((p) => {
        if (String(p.id) === String(targetPartyId)) {
          const currentBal = Number(p.closingBalance || 0);
          const amount = Number(invoiceData.totalAmount || 0);

          let newBal = currentBal;
          if (invType === "sales") {
            newBal += amount;
          } else {
            newBal -= amount;
          }

          return {
            ...p,
            closingBalance: newBal,
            balanceType: newBal >= 0 ? "To Receive" : "To Pay",
            updatedBy: authorName,
            updatedByRole: authorRole,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });

      setPartiesState(updatedParties);
      saveUserData(currentUser, "parties", updatedParties);
    }

    // Update Item Stock and Sales
    if (invoiceData.items && invoiceData.items.length > 0) {
      const invNumStr =
        invoiceData.invoiceNumberStr ||
        (typeof invoiceData.invoiceNumber === "object"
          ? invoiceData.invoiceNumber?.number
          : invoiceData.invoiceNumber) ||
        "";

      const updatedItems = items.map((item) => {
        const matchedLine = invoiceData.items.find(
          (line) =>
            String(line.id) === String(item.id) ||
            String(line.itemId) === String(item.id)
        );

        if (matchedLine) {
          const qty = Number(matchedLine.quantity) || 1;
          const currentStock = Number(item.stockQuantity) || 0;
          const isSales = invType === "sales";
          const isService = item.itemType === "Service";
          const purchasePrice = Number(item.purchasePrice || 0);
          const salesPrice = Number(item.salesPrice || 0);

          if (isSales) {
            const prevSoldQty = Number(item.totalSoldQuantity || 0);
            const newSoldQty = prevSoldQty + qty;
            const prevSalesAmt = Number(item.totalSalesAmount || 0);
            const lineAmt = Number(matchedLine.lineTotal || (salesPrice * qty)) || 0;
            const newSalesAmt = prevSalesAmt + lineAmt;

            // If purchase price is 0 or it is a service, do NOT deduct from stock; record quantity in sales
            if (isService || purchasePrice === 0) {
              const historyEntry = {
                id: Date.now() + Math.random(),
                type: "sale_direct",
                quantity: qty,
                unit: item.unit || "PCS",
                date: invoiceData.invoiceDate || new Date().toISOString().split("T")[0],
                time: new Date().toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                note: isService
                  ? `Sales Invoice #${invNumStr} (Service sale)`
                  : `Sales Invoice #${invNumStr} (Zero purchase price - added to sales)`,
                stockBefore: currentStock,
                stockAfter: currentStock,
                adjustedBy: authorName,
                adjustedByRole: authorRole,
              };

              return {
                ...item,
                totalSoldQuantity: newSoldQty,
                totalSalesAmount: newSalesAmt,
                stockHistory: [...(item.stockHistory || []), historyEntry],
                updatedBy: authorName,
                updatedByRole: authorRole,
                updatedAt: new Date().toISOString(),
              };
            } else {
              // Purchase price > 0: Deduct quantity from inventory
              const newStock = Math.max(0, currentStock - qty);
              const historyEntry = {
                id: Date.now() + Math.random(),
                type: "reduce",
                quantity: qty,
                unit: item.unit || "PCS",
                date: invoiceData.invoiceDate || new Date().toISOString().split("T")[0],
                time: new Date().toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                note: `Sales Invoice #${invNumStr}`,
                stockBefore: currentStock,
                stockAfter: newStock,
                stockValue: newStock * purchasePrice,
                adjustedBy: authorName,
                adjustedByRole: authorRole,
              };

              return {
                ...item,
                stockQuantity: newStock,
                totalSoldQuantity: newSoldQty,
                totalSalesAmount: newSalesAmt,
                stockValue: newStock * purchasePrice,
                stockHistory: [...(item.stockHistory || []), historyEntry],
                updatedBy: authorName,
                updatedByRole: authorRole,
                updatedAt: new Date().toISOString(),
              };
            }
          } else {
            // Purchase Invoice: Add stock if not a service
            const prevPurchasedQty = Number(item.totalPurchasedQuantity || 0);
            const newPurchasedQty = prevPurchasedQty + qty;
            const newStock = isService ? currentStock : currentStock + qty;
            const unitPrice = purchasePrice || salesPrice || 0;

            const historyEntry = {
              id: Date.now() + Math.random(),
              type: "add",
              quantity: qty,
              unit: item.unit || "PCS",
              date: invoiceData.invoiceDate || new Date().toISOString().split("T")[0],
              time: new Date().toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              note: `Purchase Invoice #${invNumStr}`,
              stockBefore: currentStock,
              stockAfter: newStock,
              stockValue: newStock * unitPrice,
              adjustedBy: authorName,
              adjustedByRole: authorRole,
            };

            return {
              ...item,
              stockQuantity: newStock,
              totalPurchasedQuantity: newPurchasedQty,
              stockValue: newStock * unitPrice,
              stockHistory: isService ? (item.stockHistory || []) : [...(item.stockHistory || []), historyEntry],
              updatedBy: authorName,
              updatedByRole: authorRole,
              updatedAt: new Date().toISOString(),
            };
          }
        }
        return item;
      });

      setItemsState(updatedItems);
      saveUserData(currentUser, "items", updatedItems);
    }

    return newInv;
  };

  // Payment Handlers
  const addPayment = (paymentData) => {
    const { authorName, authorRole } = getAuthorInfo();
    const now = new Date();
    const timeStr = paymentData.time || now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

    let uniqueNum = String(paymentData.number || "").trim();
    if (!uniqueNum || payments.some((p) => String(p.number || p.id).toLowerCase() === uniqueNum.toLowerCase())) {
      const existingNums = payments.map((p) => parseInt(String(p.number || "0").replace(/\D/g, ""), 10)).filter((n) => !isNaN(n));
      const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
      uniqueNum = String(maxNum + 1).padStart(4, "0");
    }

    const newPayment = {
      id: `pay-${Date.now()}`,
      createdAt: now.toISOString(),
      time: timeStr,
      number: uniqueNum,
      createdBy: authorName,
      createdByRole: authorRole,
      ...paymentData,
      time: timeStr,
      number: uniqueNum,
    };

    // Update Party Balance
    if (paymentData.party?.id) {
      const updatedParties = parties.map((p) => {
        if (String(p.id) === String(paymentData.party.id)) {
          const currentBal = Number(p.closingBalance || 0);
          const amount = Number(paymentData.amount || 0);

          let newBal = currentBal;
          if (paymentData.type === "credit") {
            newBal -= amount;
          } else {
            newBal += amount;
          }

          return {
            ...p,
            closingBalance: newBal,
            balanceType: newBal >= 0 ? "To Receive" : "To Pay",
            updatedBy: authorName,
            updatedByRole: authorRole,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });

      setPartiesState(updatedParties);
      saveUserData(currentUser, "parties", updatedParties);
    }

    // Automatically Update Matching Invoices and Allocate Payment (with priority & cascading overflow)
    let remainingPayment = Number(paymentData.amount || 0);
    const targetType = paymentData.type === "credit" ? "sales" : "purchase";
    const targetPartyId = paymentData.party?.id;
    const targetPartyName = paymentData.partyName || paymentData.party?.partyName;
    const linkedInvId = paymentData.linkedInvoiceId || paymentData.invoiceId;

    if (remainingPayment > 0 && (targetPartyId || targetPartyName)) {
      // Find all invoices for this party and type
      const partyInvoices = invoices.filter((inv) => {
        const invType = inv.invoiceType || inv.type || "sales";
        const invPartyId = inv.party?.id || inv.supplier?.id;
        const invPartyName = inv.partyName || inv.party?.partyName || inv.supplier?.partyName;

        const isTypeMatch = invType === targetType;
        const isPartyMatch =
          (targetPartyId && invPartyId && String(targetPartyId) === String(invPartyId)) ||
          (targetPartyName && invPartyName && targetPartyName.toLowerCase() === targetPartyName.toLowerCase());

        return isTypeMatch && isPartyMatch;
      });

      // Sort invoices:
      // If linkedInvId is specified, that invoice goes FIRST.
      // All other invoices are sorted chronologically by date ascending (FIFO: first due bill first).
      const sortedQueue = [...partyInvoices].sort((a, b) => {
        if (linkedInvId) {
          if (String(a.id) === String(linkedInvId)) return -1;
          if (String(b.id) === String(linkedInvId)) return 1;
        }
        const timeA = new Date(a.invoiceDate || a.date || a.createdAt || 0).getTime();
        const timeB = new Date(b.invoiceDate || b.date || b.createdAt || 0).getTime();
        return timeA - timeB;
      });

      const allocMap = {};

      for (const inv of sortedQueue) {
        if (remainingPayment <= 0) break;

        const totalAmt = Number(inv.totalAmount || 0);
        const currentPaid = Number(inv.paidAmount || 0);
        const due = Math.max(0, totalAmt - currentPaid);

        if (due <= 0) continue;

        const alloc = Math.min(remainingPayment, due);
        const newPaid = currentPaid + alloc;
        remainingPayment -= alloc;
        const newStatus = newPaid >= totalAmt ? "paid" : "partially_paid";

        const historyEntry = {
          id: `payhist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          paymentId: newPayment.id,
          paymentNumber: paymentData.number || "",
          amount: alloc,
          date: paymentData.date || new Date().toISOString().split("T")[0],
          time: new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          mode: paymentData.mode || "Cash",
          referenceNumber: paymentData.referenceNumber || "",
          note:
            paymentData.notes ||
            (linkedInvId && String(inv.id) === String(linkedInvId)
              ? "Direct invoice payment"
              : "Auto-allocated bill payment"),
          recordedBy: authorName,
          recordedByRole: authorRole,
        };

        allocMap[inv.id] = {
          newPaid,
          newStatus,
          historyEntry,
        };
      }

      const updatedInvoices = invoices.map((inv) => {
        if (allocMap[inv.id]) {
          const info = allocMap[inv.id];
          return {
            ...inv,
            paidAmount: info.newPaid,
            status: info.newStatus,
            paymentHistory: [...(inv.paymentHistory || []), info.historyEntry],
            updatedBy: authorName,
            updatedByRole: authorRole,
            updatedAt: new Date().toISOString(),
          };
        }
        return inv;
      });

      setInvoicesState(updatedInvoices);
      saveUserData(currentUser, "invoices", updatedInvoices);
    }

    const updatedPayments = [newPayment, ...payments];
    setPaymentsState(updatedPayments);
    saveUserData(currentUser, "payments", updatedPayments);

    return newPayment;
  };

  // Ledger Handlers
  const addLedger = (ledgerData) => {
    const { authorName, authorRole } = getAuthorInfo();
    const openBal = Number(ledgerData.openingBalance || 0);
    const newLedger = {
      id: `led-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: authorName,
      createdByRole: authorRole,
      name: ledgerData.name || "New Ledger",
      type: ledgerData.type || "Cash",
      openingBalance: openBal,
      closingBalance: openBal,
      ...ledgerData,
    };

    const updatedLedgers = [newLedger, ...ledgers];
    setLedgersState(updatedLedgers);
    saveUserData(currentUser, "ledgers", updatedLedgers);
    return newLedger;
  };

  const addLedgerTransaction = (txData) => {
    const { authorName, authorRole } = getAuthorInfo();
    const amount = Number(txData.amount || 0);
    const newTx = {
      id: `ledtx-${Date.now()}`,
      createdAt: new Date().toISOString(),
      date: txData.date || new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      createdBy: authorName,
      createdByRole: authorRole,
      ...txData,
    };

    const updatedTxList = [newTx, ...ledgerTransactions];
    setLedgerTransactionsState(updatedTxList);
    saveUserData(currentUser, "ledgerTransactions", updatedTxList);

    // Update balances of From and To ledgers
    const updatedLedgers = ledgers.map((l) => {
      let currentBal = Number(l.closingBalance !== undefined ? l.closingBalance : l.openingBalance || 0);
      if (String(l.id) === String(txData.fromLedgerId)) {
        currentBal -= amount;
        return { ...l, closingBalance: currentBal, updatedAt: new Date().toISOString() };
      }
      if (String(l.id) === String(txData.toLedgerId)) {
        currentBal += amount;
        return { ...l, closingBalance: currentBal, updatedAt: new Date().toISOString() };
      }
      return l;
    });

    setLedgersState(updatedLedgers);
    saveUserData(currentUser, "ledgers", updatedLedgers);
    return newTx;
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isLoggedIn,
        loginUser,
        registerUser,
        logoutUser,
        showLogoutModal,
        setShowLogoutModal,
        confirmLogout,
        cancelLogout,
        businesses,
        activeBusiness,
        switchActiveBusiness,
        switchBusiness: switchActiveBusiness,
        saveBusiness,
        updateBusiness,
        deleteBusiness,
        changeUserPassword,
        resetForgotPassword,
        requestForgotPassword,
        resetPasswordWithOtp,
        deleteAccount,
        parties,
        setParties,
        items,
        setItems,
        invoices,
        addInvoice,
        payments,
        addPayment,
        siteProjects,
        setSiteProjects,
        staffList,
        setStaffList,
        ledgers,
        addLedger,
        ledgerTransactions,
        addLedgerTransaction,
        hasPermission,
        theme,
        changeTheme,
        language,
        changeLanguage,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
