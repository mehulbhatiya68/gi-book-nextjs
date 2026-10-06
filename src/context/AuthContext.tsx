"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "@/lib/api/auth";
import { businessApi } from "@/lib/api/business";
import Cookies from "js-cookie";
import { getAuthToken, setAuthToken } from "@/lib/api/client";

import EmailVerificationModal from "@/components/EmailVerificationModal";

const normalizeBusiness = (b: any) => {
  if (!b) return null;
  const rawLogo =
    b.business_logo ||
    b.logo ||
    b.business_logo_url ||
    b.logo_url ||
    b.image_url ||
    b.image ||
    "";

  let logoVal = "";
  if (typeof rawLogo === "string") {
    logoVal = rawLogo.trim();
  } else if (typeof rawLogo === "object" && rawLogo !== null) {
    logoVal = (rawLogo.url || rawLogo.path || rawLogo.full_url || rawLogo.file_path || "").toString().trim();
  }

  return {
    ...b,
    name: b.name || b.business_name || "Business",
    business_name: b.business_name || b.name || "Business",
    logo: logoVal,
    business_logo: logoVal,
    type: b.type || b.business_type || "",
    business_type: b.business_type || b.type || "",
    email: b.email || b.contact_email || "",
    contact_email: b.contact_email || b.email || "",
    phone: b.phone || b.contact_phone || "",
    contact_phone: b.contact_phone || b.phone || "",
    gstNumber: b.gstNumber || b.gst_number || b.gstin || "",
    gst_number: b.gst_number || b.gstNumber || b.gstin || "",
    panNumber: b.panNumber || b.pan_number || b.pan || "",
    pan_number: b.pan_number || b.panNumber || b.pan || "",
  };
};

const AuthContext = createContext<any>(undefined);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isEmailVerificationOpen, setIsEmailVerificationOpen] = useState(false);
  const [emailVerificationAddress, setEmailVerificationAddress] = useState("");

  const openEmailVerificationModal = (targetEmail?: string) => {
    const emailToUse = targetEmail || currentUser?.email || "";
    setEmailVerificationAddress(emailToUse);
    setIsEmailVerificationOpen(true);
  };

  const closeEmailVerificationModal = () => {
    setIsEmailVerificationOpen(false);
  };

  const fetchSession = async () => {
    const token = getAuthToken();
    if (!token) {
      setIsLoggedIn(false);
      setCurrentUser(null);
      setActiveBusiness(null);
      setBusinesses([]);
      setIsLoading(false);
      return;
    }

    try {
      const [splashResult, bizResult] = await Promise.allSettled([
        authApi.getSplash(),
        businessApi.getBusinesses({ per_page: "all", silentError: true }),
      ]);

      const splashData = splashResult.status === "fulfilled" ? splashResult.value : null;
      const b = splashData?.body || splashData?.data || splashData;

      const bizListResponse = bizResult.status === "fulfilled" ? bizResult.value : null;

      const rawBizArray =
        bizListResponse?.body?.data ||
        bizListResponse?.body?.business_profiles ||
        bizListResponse?.data?.data ||
        bizListResponse?.data ||
        b?.business_profiles ||
        b?.businesses ||
        [];

      const rawList = Array.isArray(rawBizArray) ? rawBizArray : [];
      const bizList = rawList.map(normalizeBusiness);

      const rawActive =
        b?.selected_business_profile ||
        b?.business_profile ||
        b?.business ||
        b?.active_business ||
        rawList[0];

      const activeBiz = normalizeBusiness(rawActive);

      setIsLoggedIn(true);
      if (activeBiz) setActiveBusiness(activeBiz);
      if (bizList.length > 0) setBusinesses(bizList);

      const userObj = b?.user || b?.profile || b?.user_profile || {};
      setCurrentUser({
        id: userObj.id || "owner",
        name: userObj.name || "Owner",
        email: userObj.email || "",
        mobile: userObj.mobile_number || "",
        permissions: b?.permissions || {},
        role: "Owner",
        isStaff: false,
        activeBusiness: activeBiz,
      });
    } catch (error: any) {
      console.warn("Session hydration failed:", error);
      if (error?.status === 401) {
        await setAuthToken(null);
        setIsLoggedIn(false);
        setCurrentUser(null);
        setActiveBusiness(null);
        setBusinesses([]);
      } else {
        setIsLoggedIn(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const loginUser = async (emailOrPhone, password) => {
    try {
      const res = await authApi.login({ email: emailOrPhone, password });
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

      const rawActiveBiz = splashData?.body?.selected_business_profile || res?.body?.selected_business_profile || res?.body?.business;
      const rawBizList = splashData?.body?.business_profiles || res?.body?.business_profiles || res?.body?.businesses || [];

      const activeBiz = normalizeBusiness(rawActiveBiz);
      const bizList = (Array.isArray(rawBizList) ? rawBizList : []).map(normalizeBusiness);

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

  const registerUser = async (payload, autoLogin = true) => {
    try {
      const res = await authApi.register(
        {
          name: payload.name,
          email: payload.email,
          password: payload.password,
          mobile_number: payload.mobile_number || payload.mobile || "1234567890",
          country_code: payload.country_code ? parseInt(payload.country_code, 10) : 91,
        },
        autoLogin
      );

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

      if (autoLogin) {
        setCurrentUser(appUser);
        setIsLoggedIn(true);
      }

      return { success: true, user: appUser };
    } catch (err) {
      return { success: false, error: err.message || "Registration failed." };
    }
  };

  const logoutUser = () => setShowLogoutModal(true);
  const cancelLogout = () => setShowLogoutModal(false);

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
      setAuthToken(null);
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
    }
  };

  const switchActiveBusiness = async (bizOrId: any) => {
    if (!bizOrId) return;
    const rawTarget =
      typeof bizOrId === "object"
        ? bizOrId
        : businesses.find((b: any) => String(b.id) === String(bizOrId)) || {
          id: bizOrId,
          name: String(bizOrId),
        };

    const targetBiz = normalizeBusiness(rawTarget);
    setActiveBusiness(targetBiz);

    if (targetBiz?.id) {
      try {
        await businessApi.selectBusiness(targetBiz.id);
      } catch (err) {
        console.warn("API select active business warning:", err);
      }
    }
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

  const updateActiveBusinessLogo = (bizId: any, newLogo: string | null) => {
    setActiveBusiness((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        logo: newLogo || "",
        business_logo: newLogo || "",
      };
    });

    setBusinesses((prevList: any[]) =>
      (prevList || []).map((b: any) => {
        if (String(b.id) === String(bizId)) {
          return {
            ...b,
            logo: newLogo || "",
            business_logo: newLogo || "",
          };
        }
        return b;
      })
    );
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoggedIn,
        loginUser,
        registerUser,
        logoutUser,
        confirmLogout,
        cancelLogout,
        showLogoutModal,
        businesses,
        activeBusiness,
        switchActiveBusiness,
        updateActiveBusinessLogo,
        refreshBusinesses: fetchSession,
        hasPermission,
        isLoading,
        openEmailVerificationModal,
        closeEmailVerificationModal,
        isEmailVerificationOpen,
      }}
    >
      {children}
      <EmailVerificationModal
        isOpen={isEmailVerificationOpen}
        onClose={closeEmailVerificationModal}
        email={emailVerificationAddress}
        onSuccess={fetchSession}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
