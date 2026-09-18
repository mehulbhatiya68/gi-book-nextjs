"use client";

import { useState, useEffect, startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
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
  IoChevronForward,
  IoSunnyOutline,
  IoMoonOutline,
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";
import { compressImageFile } from "@/utils/imageCompressor";

export default function Settings() {
  const router = useRouter();
  const {
    currentUser,
    logoutUser,
    activeBusiness,
    businesses,
    switchActiveBusiness,
    updateBusiness,
    deleteBusiness,
    changeUserPassword,
    resetForgotPassword,
    deleteAccount,
    theme,
    changeTheme,
    language,
    changeLanguage,
    t,
    hasPermission,
  } = useApp();

  const [activeTab, setActiveTab] = useState("business"); // 'business' | 'account' | 'subscription' | 'appearance' | 'about'
  const [mobileSubView, setMobileSubView] = useState(null); // null | 'business' | 'account' | 'subscription' | 'about'
  const [bizViewMode, setBizViewMode] = useState("view"); // 'view' | 'edit'

  // Account / Password state
  const [passTab, setPassTab] = useState("change"); // 'change' | 'forgot'
  const [currentPassword, setCurrentPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState(currentUser?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passSuccessMsg, setPassSuccessMsg] = useState("");
  const [passErrorMsg, setPassErrorMsg] = useState("");
  const [showDeleteAccConfirm, setShowDeleteAccConfirm] = useState(false);
  const [showDeleteBizConfirm, setShowDeleteBizConfirm] = useState(false);

  // Business Edit state
  const [bizForm, setBizForm] = useState({
    name: activeBusiness?.name || "",
    logo: activeBusiness?.logo || "",
    type: activeBusiness?.type || "agency",
    email: activeBusiness?.email || "",
    phone: activeBusiness?.phone || "",
    address: activeBusiness?.address || "",
    gstNumber: activeBusiness?.gstNumber || "",
    panNumber: activeBusiness?.panNumber || "",
    cin: activeBusiness?.cin || "",
    tin: activeBusiness?.tin || "",
  });

  useEffect(() => {
    if (activeBusiness) {
      startTransition(() => {
        setBizForm({
          name: activeBusiness.name || "",
          logo: activeBusiness.logo || "",
          type: activeBusiness.type || "agency",
          email: activeBusiness.email || "",
          phone: activeBusiness.phone || "",
          address: activeBusiness.address || "",
          gstNumber: activeBusiness.gstNumber || "",
          panNumber: activeBusiness.panNumber || "",
          cin: activeBusiness.cin || "",
          tin: activeBusiness.tin || "",
        });
      });
    }
  }, [activeBusiness]);

  useEffect(() => {
    if (currentUser?.email) {
      startTransition(() => {
        setForgotEmail(currentUser.email);
      });
    }
  }, [currentUser]);

  const validForgotEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail);
  const passLength = newPassword.length >= 8 && newPassword.length <= 32;
  const passLower = /[a-z]/.test(newPassword);
  const passUpper = /[A-Z]/.test(newPassword);
  const passNum = /[0-9]/.test(newPassword);
  const passSpec = /[!@#$%^&*(),.?":{}|<>_\-\\\/\[\]]/.test(newPassword);
  const passMatch = newPassword !== "" && newPassword === confirmNewPassword;

  const changePassValid = currentPassword.trim() !== "" && passLength && passLower && passUpper && passNum && passSpec && passMatch;
  const forgotPassValid = validForgotEmail && passLength && passLower && passUpper && passNum && passSpec && passMatch;

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPassErrorMsg("");
    setPassSuccessMsg("");

    if (passTab === "change") {
      if (!changePassValid) return;
      const res = changeUserPassword(currentPassword, newPassword);
      if (res?.success) {
        setPassSuccessMsg("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setTimeout(() => setPassSuccessMsg(""), 3000);
      } else {
        setPassErrorMsg(res?.error || "Current password is incorrect or update failed.");
      }
    } else {
      if (!forgotPassValid) return;
      const res = resetForgotPassword(forgotEmail, newPassword);
      if (res?.success) {
        setPassSuccessMsg("Password reset successfully after email validation!");
        setNewPassword("");
        setConfirmNewPassword("");
        setTimeout(() => setPassSuccessMsg(""), 3000);
      } else {
        setPassErrorMsg(res?.error || "No registered account found with this email address.");
      }
    }
  };

  const handleDeleteAccountConfirm = () => {
    deleteAccount();
    router.push("/login");
  };

  const handleDeleteBusinessConfirm = () => {
    if (!activeBusiness) return;
    deleteBusiness(activeBusiness.id);
    setShowDeleteBizConfirm(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedLogo = await compressImageFile(file, 300, 300, 0.8);
        if (compressedLogo) {
          setBizForm((prev) => ({ ...prev, logo: compressedLogo }));
        }
      } catch (err) {
        console.error("Error compressing image:", err);
      }
    }
  };

  const handleSaveBizDetails = (e) => {
    e.preventDefault();
    if (!bizForm.name.trim()) {
      alert("Business Name is required.");
      return;
    }
    updateBusiness({
      id: activeBusiness?.id,
      ...bizForm,
    });
    alert("Business details updated successfully!");
    setBizViewMode("view");
  };

  const menuTabs = [
    { id: "business", label: "Business Details", icon: IoBusinessOutline },
    { id: "account", label: "Account & Security", icon: IoKeyOutline },
    { id: "subscription", label: "Subscription", icon: IoSparklesOutline },
    { id: "appearance", label: "Theme & Appearance", icon: IoColorPaletteOutline },
    { id: "about", label: "About GI Book", icon: IoInformationCircleOutline },
  ];

  const renderTabContent = (tabToRender) => (
    <>
      {/* BUSINESS DETAILS TAB */}
      {tabToRender === "business" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 gi-divider">
            <div>
              <h2 className="text-base font-bold gi-text-primary">
                Business Profile &amp; Registration
              </h2>
              <p className="text-xs gi-text-secondary">
                Manage details printed on your official invoices and tax documents
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/addBusiness" className="px-3 py-1.5 rounded-lg gi-btn-primary text-xs font-semibold transition cursor-pointer flex items-center gap-1">
                <IoAdd className="text-sm" />
                <span>Add Business</span>
              </Link>

              <button type="button" onClick={() => setBizViewMode(bizViewMode === "view" ? "edit" : "view")} className="px-3 py-1.5 rounded-lg gi-filter-active text-xs font-semibold transition cursor-pointer">
                {bizViewMode === "view" ? "Edit Business" : "View Business"}
              </button>

              <button type="button" onClick={() => setShowDeleteBizConfirm(true)} className="px-3 py-1.5 rounded-lg gi-btn-danger text-xs font-semibold transition cursor-pointer">
                Delete Business
              </button>
            </div>
          </div>

          {bizViewMode === "view" ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl gi-card flex items-center gap-4">
                <div className="h-14 w-14 rounded-lg gi-badge-info flex items-center justify-center overflow-hidden shrink-0">
                  {activeBusiness?.logo ? (
                    <img src={activeBusiness.logo} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold" style={{ color: "var(--gi-primary)" }}>
                      {activeBusiness?.name?.charAt(0) || "B"}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold gi-text-primary">
                    {activeBusiness?.name || "Business Name"}
                  </h3>
                  <p className="text-xs gi-text-muted capitalize mt-0.5">
                    Type: {activeBusiness?.type || "Agency"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg gi-surface-secondary" style={{ border: "1px solid var(--gi-border)" }}>
                  <p className="text-[10px] font-bold gi-text-secondary uppercase tracking-wider">Email Address</p>
                  <p className="font-semibold gi-text-primary mt-0.5 truncate">{activeBusiness?.email || "Not specified"}</p>
                </div>
                <div className="p-3 rounded-lg gi-surface-secondary" style={{ border: "1px solid var(--gi-border)" }}>
                  <p className="text-[10px] font-bold gi-text-secondary uppercase tracking-wider">Phone Number</p>
                  <p className="font-semibold gi-text-primary mt-0.5 truncate">{activeBusiness?.phone || "Not specified"}</p>
                </div>
                <div className="p-3 rounded-lg gi-surface-secondary sm:col-span-2" style={{ border: "1px solid var(--gi-border)" }}>
                  <p className="text-[10px] font-bold gi-text-secondary uppercase tracking-wider">Business Address</p>
                  <p className="font-semibold gi-text-primary mt-0.5">{activeBusiness?.address || "Not specified"}</p>
                </div>
                <div className="p-3 rounded-lg gi-surface-secondary" style={{ border: "1px solid var(--gi-border)" }}>
                  <p className="text-[10px] font-bold gi-text-secondary uppercase tracking-wider">GSTIN Number</p>
                  <p className="font-mono font-semibold gi-text-primary mt-0.5">{activeBusiness?.gstNumber || "Not registered"}</p>
                </div>
                <div className="p-3 rounded-lg gi-surface-secondary" style={{ border: "1px solid var(--gi-border)" }}>
                  <p className="text-[10px] font-bold gi-text-secondary uppercase tracking-wider">PAN Number</p>
                  <p className="font-mono font-semibold gi-text-primary mt-0.5">{activeBusiness?.panNumber || "Not specified"}</p>
                </div>
              </div>
            </div>

          ) : (
            <form onSubmit={handleSaveBizDetails} className="space-y-4 text-xs">
              {/* Business Logo Upload / Change */}
              <div>
                <label className="block font-semibold gi-text-secondary text-xs mb-1.5">
                  Business Logo
                </label>
                <div className="flex items-center gap-4 p-3 rounded-xl gi-surface-secondary" style={{ border: "1px solid var(--gi-border)" }}>
                  <div className="h-16 w-16 rounded-xl gi-badge-info flex items-center justify-center overflow-hidden shrink-0 relative" style={{ border: "1px solid var(--gi-border)" }}>
                    {bizForm.logo ? (
                      <img src={bizForm.logo} alt="Business Logo" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold" style={{ color: "var(--gi-primary)" }}>
                        {bizForm.name?.charAt(0) || "B"}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="edit-biz-logo"
                        className="px-3 py-1.5 rounded-lg gi-btn-primary text-xs font-semibold cursor-pointer transition inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <IoPencilOutline className="text-sm" />
                        <span>{bizForm.logo ? "Change Logo" : "Upload Logo"}</span>
                        <input
                          id="edit-biz-logo"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>

                      {bizForm.logo && (
                        <button
                          type="button"
                          onClick={() => setBizForm((prev) => ({ ...prev, logo: "" }))}
                          className="px-3 py-1.5 rounded-lg gi-btn-danger text-xs font-semibold cursor-pointer transition inline-flex items-center gap-1.5"
                        >
                          <IoTrashOutline className="text-sm" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] gi-text-muted">
                      Upload PNG, JPG or WEBP image. Printed on invoices.
                    </p>
                  </div>
                </div>
              </div>

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold gi-text-secondary text-xs mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={bizForm.email}
                    onChange={(e) => setBizForm({ ...bizForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-lg gi-input text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold gi-text-secondary text-xs mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={bizForm.phone}
                    onChange={(e) => setBizForm({ ...bizForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-lg gi-input text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold gi-text-secondary text-xs mb-1">
                  Business Address
                </label>
                <textarea
                  rows={2}
                  value={bizForm.address}
                  onChange={(e) => setBizForm({ ...bizForm, address: e.target.value })}
                  className="w-full p-2.5 rounded-lg gi-input text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold gi-text-secondary text-xs mb-1">
                    GSTIN Number
                  </label>
                  <input
                    type="text"
                    value={bizForm.gstNumber}
                    onChange={(e) => setBizForm({ ...bizForm, gstNumber: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 rounded-lg gi-input text-xs focus:outline-none"
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
                    className="w-full p-2.5 rounded-lg gi-input text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: "var(--gi-border)" }}>
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

      {/* ACCOUNT & SECURITY TAB */}
      {tabToRender === "account" && (
        <div className="space-y-6">
          <div className="border-b pb-3" style={{ borderColor: "var(--gi-border)" }}>
            <h2 className="text-base font-bold gi-text-primary">
              Account Credentials &amp; Security
            </h2>
            <p className="text-xs gi-text-secondary">
              View your account credentials, owner businesses, update security password, or reset password
            </p>
          </div>

          {/* Account Credentials Card */}
          <div className="p-4 sm:p-5 rounded-xl gi-surface-secondary space-y-4" style={{ border: "1px solid var(--gi-border)" }}>
            <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: "var(--gi-border)" }}>
              <div className="h-12 w-12 rounded-xl gi-btn-primary font-bold text-lg flex items-center justify-center shadow-sm shrink-0">
                {currentUser?.name?.charAt(0) || "U"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold gi-text-primary">
                    {currentUser?.name || "Account User"}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase gi-badge-info">
                    {currentUser?.role || (currentUser?.isStaff ? "Staff" : "Owner")}
                  </span>
                </div>
                <p className="text-xs gi-text-muted mt-0.5">
                  Account ID: #{currentUser?.id || "1001"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg gi-card" style={{ border: "1px solid var(--gi-border)" }}>
                <p className="text-[10px] font-bold gi-text-muted uppercase tracking-wider">Email Address</p>
                <p className="font-semibold gi-text-primary mt-0.5 truncate">
                  {currentUser?.email || "Not specified"}
                </p>
              </div>

              <div className="p-3 rounded-lg gi-card" style={{ border: "1px solid var(--gi-border)" }}>
                <p className="text-[10px] font-bold gi-text-muted uppercase tracking-wider">Mobile Number</p>
                <p className="font-semibold gi-text-primary mt-0.5">
                  {currentUser?.mobile || currentUser?.phone || "Not specified"}
                </p>
              </div>
            </div>

            {/* Owner's Businesses List */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold gi-text-muted uppercase tracking-wider">
                  Owner&apos;s Registered Businesses ({businesses?.length || 0})
                </p>
                <Link href="/addBusiness" className="px-2.5 py-1 rounded-md gi-btn-primary text-xs font-semibold flex items-center gap-1 transition cursor-pointer">
                  <IoAdd className="text-sm" />
                  <span>Add Business</span>
                </Link>
              </div>

              <div className="space-y-2">
                {businesses && businesses.length > 0 ? (
                  businesses.map((biz) => {
                    const isActive = activeBusiness?.id === biz.id;
                    return (
                      <div key={biz.id} className={`p-3 rounded-lg border flex items-center justify-between transition ${isActive ? "bg-[var(--gi-primary-light)] border-[var(--gi-primary)]" : "gi-card"}`} style={{ borderColor: isActive ? undefined : "var(--gi-border)" }}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <IoBusinessOutline className="text-base shrink-0" style={{ color: "var(--gi-primary)" }} />
                          <div className="min-w-0">
                            <p className="font-semibold text-xs gi-text-primary truncate">
                              {biz.name}
                            </p>
                            <p className="text-[11px] gi-text-muted truncate">
                              {biz.phone ? `Phone: ${biz.phone}` : ""} {biz.gstNumber ? `• GST: ${biz.gstNumber}` : ""}
                            </p>
                          </div>
                        </div>

                        {isActive && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold gi-btn-primary shrink-0">
                            Active Business
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs gi-text-muted italic">No business profiles created yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Password Management */}
          <div className="pt-2">
            <h3 className="text-sm font-bold gi-text-primary mb-3">
              Password Management
            </h3>

            {/* Tab Selector */}
            <div className="flex items-center p-1 rounded-lg gi-surface-secondary w-fit text-xs" style={{ border: "1px solid var(--gi-border)" }}>
              <button
                type="button"
                onClick={() => {
                  setPassTab("change");
                  setPassErrorMsg("");
                  setPassSuccessMsg("");
                }}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${passTab === "change"
                    ? "gi-card gi-text-primary shadow-sm"
                    : "gi-text-muted hover:gi-text-primary"
                  }`}
              >
                Change Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setPassTab("forgot");
                  setPassErrorMsg("");
                  setPassSuccessMsg("");
                }}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${passTab === "forgot"
                    ? "gi-card gi-text-primary shadow-sm"
                    : "gi-text-muted hover:gi-text-primary"
                  }`}
              >
                Forgot Password
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md text-xs">
              {passSuccessMsg && (
                <div className="p-3 rounded-lg gi-badge-success font-semibold">
                  {passSuccessMsg}
                </div>
              )}
              {passErrorMsg && (
                <div className="p-3 rounded-lg gi-badge-danger font-semibold">
                  {passErrorMsg}
                </div>
              )}

              {passTab === "change" ? (
                <div>
                  <label className="block font-semibold gi-text-secondary mb-1">
                    Current Password *
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="w-full p-2.5 rounded-lg gi-input text-xs focus:outline-none"
                  />
                </div>
              ) : (
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
                    className="w-full p-2.5 rounded-lg gi-input text-xs focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold gi-text-secondary mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  maxLength={32}
                  placeholder="Enter new password (8-32 chars)"
                  className="w-full p-2.5 rounded-lg gi-input text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold gi-text-secondary mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  maxLength={32}
                  placeholder="Confirm new password"
                  className="w-full p-2.5 rounded-lg gi-input text-xs focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={passTab === "change" ? !changePassValid : !forgotPassValid}
                className={`w-full py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${(passTab === "change" ? changePassValid : forgotPassValid)
                    ? "gi-btn-primary shadow-sm"
                    : "gi-surface-secondary gi-text-muted cursor-not-allowed"
                  }`}
              >
                {passTab === "change" ? "Update Password" : "Reset Password (Email Validated)"}
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="pt-6 border-t space-y-3" style={{ borderColor: "var(--gi-border)" }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gi-danger)" }}>
              Danger Zone
            </p>
            <div className="p-4 rounded-xl gi-badge-danger flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-xs">
                  Delete Account Permanently
                </p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  Irreversibly delete your profile, businesses, invoices, and ledgers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteAccConfirm(true)}
                className="px-3.5 py-2 rounded-lg gi-btn-danger text-xs font-semibold transition cursor-pointer shrink-0"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBSCRIPTION TAB */}
      {tabToRender === "subscription" && (
        <div className="space-y-4 text-xs">
          <div className="border-b pb-3" style={{ borderColor: "var(--gi-border)" }}>
            <h2 className="text-base font-bold gi-text-primary">
              Subscription &amp; Billing Plan
            </h2>
            <p className="text-xs gi-text-secondary">
              Your active GI Book plan features and billing cycle
            </p>
          </div>

          <div className="p-5 rounded-xl space-y-2" style={{ background: "var(--gi-primary-light)", border: "1px solid var(--gi-primary)" }}>
            <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase gi-btn-primary">
              Active Plan: Enterprise Pro
            </span>
            <h3 className="text-xl font-bold gi-text-primary">
              Unlimited Business Suite
            </h3>
            <p className="text-xs gi-text-secondary">
              Includes multi-business support, staff role permission management, unlimited invoicing, and automated reports.
            </p>
          </div>
        </div>
      )}

      {/* APPEARANCE / THEME TAB */}
      {tabToRender === "appearance" && (
        <div className="space-y-5 text-xs">
          <div className="border-b pb-3" style={{ borderColor: "var(--gi-border)" }}>
            <h2 className="text-base font-bold gi-text-primary">
              Theme &amp; Visual Appearance
            </h2>
            <p className="text-xs gi-text-secondary">
              Customize theme preferences for high efficiency and contrast
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
                  onClick={() => changeTheme(th.id)}
                  className={`p-4 rounded-xl border text-left transition cursor-pointer ${isSelected
                      ? "bg-[var(--gi-primary-light)] border-[var(--gi-primary)] text-[var(--gi-primary)] font-bold shadow-sm"
                      : "gi-surface-secondary border gi-border gi-text-secondary hover:bg-[var(--gi-hover)]"
                    }`}
                >
                  <p className="font-semibold text-xs gi-text-primary">{th.label}</p>
                  <p className="text-[11px] gi-text-muted font-normal mt-1">{th.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ABOUT TAB */}
      {tabToRender === "about" && (
        <div className="space-y-4 text-xs">
          <div className="border-b pb-3" style={{ borderColor: "var(--gi-border)" }}>
            <h2 className="text-base font-bold gi-text-primary">
              About GI Book ERP
            </h2>
            <p className="text-xs gi-text-secondary">
              Version and system information
            </p>
          </div>

          <div className="p-4 rounded-xl gi-surface-secondary space-y-2" style={{ border: "1px solid var(--gi-border)" }}>
            <h3 className="font-bold text-sm gi-text-primary">
              GI BOOK Accounting &amp; ERP System
            </h3>
            <p className="text-xs gi-text-muted">Version 1.0.0 (Production)</p>
            <p className="text-xs gi-text-secondary">
              Built for Indian SMEs, agencies, retail, and manufacturing enterprises.
            </p>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-5 select-none gi-page">
      {/* Page Heading */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
            Settings
          </h1>
          <p className="text-xs gi-text-secondary mt-0.5">
            Manage your business profile, security, subscription, and preferences
          </p>
        </div>
      </div>

      {/* ==========================================================================
         MOBILE NATIVE APP SETTINGS EXPERIENCE (< 768px)
         ========================================================================== */}
      <div className="block md:hidden space-y-4">
        {mobileSubView === null ? (
          /* Mobile Main Settings List */
          <div className="space-y-4">
            {/* Section 1: Business & Operations */}
            <div className="rounded-xl gi-card shadow-xs overflow-hidden divide-y gi-divider">
              <div className="px-4 py-2.5 bg-[var(--gi-surface-secondary)] text-[10px] font-bold gi-text-secondary uppercase tracking-wider">
                Business &amp; Operations
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileSubView("business");
                  setActiveTab("business");
                }}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[var(--gi-hover)] transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg gi-surface-secondary flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <IoBusinessOutline className="text-lg" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs gi-text-primary">Business Profile &amp; Registration</p>
                    <p className="text-[11px] gi-text-muted truncate">{activeBusiness?.name || "Manage Business Details"}</p>
                  </div>
                </div>
                <IoChevronForward className="text-base gi-text-muted shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileSubView("account");
                  setActiveTab("account");
                }}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[var(--gi-hover)] transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg gi-surface-secondary flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <IoKeyOutline className="text-lg" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs gi-text-primary">Account Credentials &amp; Security</p>
                    <p className="text-[11px] gi-text-muted truncate">{currentUser?.email || "Manage Password & Accounts"}</p>
                  </div>
                </div>
                <IoChevronForward className="text-base gi-text-muted shrink-0" />
              </button>
            </div>

            {/* Section 2: Preferences & Plans */}
            <div className="rounded-xl gi-card shadow-xs overflow-hidden divide-y gi-divider">
              <div className="px-4 py-2.5 bg-[var(--gi-surface-secondary)] text-[10px] font-bold gi-text-secondary uppercase tracking-wider">
                Preferences &amp; Plans
              </div>

              {/* Theme Setting Inline Toggle (Requirement: "except theme setting it has toggle") */}
              <div className="flex items-center justify-between p-3.5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg gi-surface-secondary flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    {theme === "dark" ? <IoMoonOutline className="text-lg" /> : <IoSunnyOutline className="text-lg" />}
                  </div>
                  <div>
                    <p className="font-semibold text-xs gi-text-primary">Dark Mode</p>
                    <p className="text-[11px] gi-text-muted capitalize">{theme === "dark" ? "Dark Theme Active" : "Light Theme Active"}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => changeTheme(theme === "dark" ? "light" : "dark")}
                  className={`relative w-11 h-6 rounded-full transition cursor-pointer shrink-0 ${
                    theme === "dark" ? "bg-indigo-600" : "bg-slate-300 dark:bg-zinc-700"
                  }`}
                  title="Toggle Light/Dark Theme"
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all shadow-xs ${
                      theme === "dark" ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMobileSubView("subscription");
                  setActiveTab("subscription");
                }}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[var(--gi-hover)] transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg gi-surface-secondary flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <IoSparklesOutline className="text-lg" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs gi-text-primary">Subscription Plan</p>
                    <p className="text-[11px] gi-text-muted">Enterprise Pro Active</p>
                  </div>
                </div>
                <IoChevronForward className="text-base gi-text-muted shrink-0" />
              </button>
            </div>

            {/* Section 3: App Details */}
            <div className="rounded-xl gi-card shadow-xs overflow-hidden divide-y gi-divider">
              <div className="px-4 py-2.5 bg-[var(--gi-surface-secondary)] text-[10px] font-bold gi-text-secondary uppercase tracking-wider">
                System Info
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileSubView("about");
                  setActiveTab("about");
                }}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[var(--gi-hover)] transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg gi-surface-secondary flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <IoInformationCircleOutline className="text-lg" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs gi-text-primary">About GI Book</p>
                    <p className="text-[11px] gi-text-muted">v1.0.0 (Production)</p>
                  </div>
                </div>
                <IoChevronForward className="text-base gi-text-muted shrink-0" />
              </button>
            </div>

            {/* Section 4: Log out */}
            <div className="rounded-xl gi-card shadow-xs overflow-hidden">
              <button
                type="button"
                onClick={logoutUser}
                className="w-full flex items-center gap-3 p-3.5 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer text-left text-red-600 font-semibold text-xs"
              >
                <IoLogOutOutline className="text-xl" />
                <span>Log Out of Account</span>
              </button>
            </div>
          </div>
        ) : (
          /* Dedicated Mobile Settings Subview with Back Button */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b gi-divider">
              <button
                type="button"
                onClick={() => setMobileSubView(null)}
                className="px-3.5 py-1.5 rounded-lg gi-btn-secondary text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <IoArrowBack className="text-base" />
                <span>Back to Settings</span>
              </button>
              <span className="text-xs font-bold gi-text-muted uppercase tracking-wider truncate max-w-[150px] text-right">
                {mobileSubView === "business" && "Business Profile"}
                {mobileSubView === "account" && "Account & Security"}
                {mobileSubView === "subscription" && "Subscription"}
                {mobileSubView === "about" && "About GI Book"}
              </span>
            </div>

            <div className="rounded-xl gi-card shadow-xs p-4 sm:p-5 space-y-6">
              {renderTabContent(mobileSubView)}
            </div>
          </div>
        )}
      </div>

      {/* ==========================================================================
         DESKTOP 2-COLUMN ENTERPRISE LAYOUT (md:grid)
         ========================================================================== */}
      <div className="hidden md:grid grid-cols-4 gap-6 items-start">
        {/* Left Column: Navigation Menu */}
        <div className="md:col-span-1 rounded-xl gi-card shadow-xs p-2 space-y-1">
          <p className="px-3 py-1.5 text-[10px] font-bold gi-text-secondary uppercase tracking-wider">
            Settings Menu
          </p>
          {menuTabs.map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;

            return (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer text-left ${isCurrent ? "gi-filter-active" : "gi-text-secondary hover:bg-[var(--gi-hover)] gi-text-primary"}`}>
                <Icon className="text-base shrink-0" style={{ color: isCurrent ? "var(--gi-primary)" : "var(--gi-text-muted)" }} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}

          <div className="pt-2 border-t gi-divider">
            <button type="button" onClick={logoutUser} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer text-left" style={{ color: "var(--gi-danger)" }} onMouseEnter={e => e.currentTarget.style.background = "var(--gi-danger-bg)"} onMouseLeave={e => e.currentTarget.style.background = ""}>
              <IoLogOutOutline className="text-base" />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* Right Column: Configuration Panel */}
        <div className="md:col-span-3 rounded-xl gi-card shadow-xs p-5 sm:p-6 space-y-6">
          {renderTabContent(activeTab)}
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteAccConfirm && (
          <div onClick={() => setShowDeleteAccConfirm(false)} className="fixed inset-0 z-50 flex items-center justify-center gi-modal-overlay backdrop-blur-sm p-4">
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-xl gi-modal-content shadow-2xl p-5 text-center space-y-4">
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
                <button type="button" onClick={() => setShowDeleteAccConfirm(false)} className="flex-1 py-2 rounded-lg gi-btn-secondary text-xs font-semibold transition cursor-pointer">
                  Cancel
                </button>
                <button type="button" onClick={handleDeleteAccountConfirm} className="flex-1 py-2 rounded-lg gi-btn-danger text-xs font-semibold transition cursor-pointer">
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Business Confirmation Modal */}
      <AnimatePresence>
        {showDeleteBizConfirm && (
          <div onClick={() => setShowDeleteBizConfirm(false)} className="fixed inset-0 z-50 flex items-center justify-center gi-modal-overlay backdrop-blur-sm p-4">
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-xl gi-modal-content shadow-2xl p-5 text-center space-y-4">
              <div className="h-12 w-12 mx-auto rounded-full gi-badge-danger flex items-center justify-center text-xl">
                <IoTrashOutline />
              </div>
              <div>
                <h3 className="text-base font-bold gi-text-primary">
                  Delete &quot;{activeBusiness?.name}&quot;?
                </h3>
                <p className="text-xs gi-text-muted mt-1">
                  Are you sure you want to delete this business profile and all its invoice &amp; party data?
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button type="button" onClick={() => setShowDeleteBizConfirm(false)} className="flex-1 py-2 rounded-lg gi-btn-secondary text-xs font-semibold transition cursor-pointer">
                  Cancel
                </button>
                <button type="button" onClick={handleDeleteBusinessConfirm} className="flex-1 py-2 rounded-lg gi-btn-danger text-xs font-semibold transition cursor-pointer">
                  Yes, Delete Business
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}