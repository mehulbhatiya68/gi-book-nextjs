"use client";

import { useState } from "react";
import {
  IoArrowBack,
  IoChevronBack,
  IoSaveOutline,
  IoBusinessOutline,
  IoImageOutline,
  IoTrashOutline,
  IoGlobeOutline,
  IoCallOutline,
  IoMailOutline,
  IoLocationOutline,
} from "react-icons/io5";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { usePreferences } from "@/lib/hooks/usePreferences";
import { compressImageFile } from "@/utils/imageCompressor";
import { storeBusinessProfileAction } from "@/app/actions/business";
import LimitReachedView from "@/components/LimitReachedView";
import { useLimitCheck } from "@/lib/hooks/useLimitCheck";
import CustomSelect from "@/components/CustomSelect";
import { COUNTRY_CODES } from "@/utils/countryCodes";
import CustomBusinessLogo from "@/components/CustomBusinessLogo";

export default function AddBusiness() {
  const router = useRouter();
  const { t } = usePreferences();
  const {
    currentUser,
    switchActiveBusiness,
    updateActiveBusinessLogo,
    refreshBusinesses,
    openEmailVerificationModal,
  } = useAuth();

  const { isLimitReached, used, quota, featureName } = useLimitCheck("business", false);

  // Form State strictly adhering to the API schema
  const [businessName, setBusinessName] = useState("");
  const [businessLogo, setBusinessLogo] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [businessType, setBusinessType] = useState("Agency");
  const [address, setAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [cin, setCin] = useState("");
  const [tin, setTin] = useState("");
  const [contactEmail, setContactEmail] = useState(currentUser?.email || "");
  const [contactPhone, setContactPhone] = useState(currentUser?.mobile || "");
  const [countryCode, setCountryCode] = useState("91");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleResendVerification = () => {
    openEmailVerificationModal(currentUser?.email || contactEmail.trim());
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      try {
        const compressed = await compressImageFile(file, 200, 200, 0.7);
        if (compressed) {
          setBusinessLogo(compressed);
          toast.success("Business logo selected successfully.");
        }
      } catch (err) {
        console.error("Error processing logo image:", err);
        toast.error("Failed to process logo image.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameClean = businessName.trim();
    if (!nameClean) {
      setErrorMsg("Business Name is required.");
      return;
    }

    const addressClean = address.trim();
    if (!addressClean) {
      setErrorMsg("Business Address is required.");
      return;
    }

    const emailClean = contactEmail.trim();
    if (!emailClean) {
      setErrorMsg("Contact Email is required.");
      return;
    }

    const rawPhoneDigits = contactPhone.toString().replace(/\D/g, "");
    if (!rawPhoneDigits) {
      setErrorMsg("Contact Phone number is required.");
      return;
    }

    const phoneInt = parseInt(rawPhoneDigits, 10);
    const countryCodeInt = parseInt(countryCode.toString().replace(/\D/g, "") || "91", 10);

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      // Build raw JSON body adhering strictly to backend validation schema
      const businessData = {
        business_name: nameClean.slice(0, 255),
        business_logo: logoFile || businessLogo || null,
        business_type: businessType ? businessType.trim().slice(0, 255) : null,
        address: addressClean.slice(0, 1000),
        gst_number: gstNumber.trim() ? gstNumber.trim().toUpperCase().slice(0, 50) : null,
        pan_number: panNumber.trim() ? panNumber.trim().toUpperCase().slice(0, 50) : null,
        cin: cin.trim() ? cin.trim().slice(0, 50) : null,
        tin: tin.trim() ? tin.trim().slice(0, 50) : null,
        contact_email: emailClean.slice(0, 255),
        contact_phone: phoneInt,
        country_code: countryCodeInt,
      };

      const res = await storeBusinessProfileAction(businessData);
      if (!res.success) {
        throw new Error(res.error || "Failed to create business profile.");
      }

      const createdBiz = res?.data?.business || res?.data?.data || res?.data;

      if (createdBiz?.id && businessLogo && typeof updateActiveBusinessLogo === "function") {
        updateActiveBusinessLogo(createdBiz.id, businessLogo);
      }
      if (typeof refreshBusinesses === "function") {
        await refreshBusinesses();
      }
      if (createdBiz?.id && typeof switchActiveBusiness === "function") {
        await switchActiveBusiness({
          ...createdBiz,
          logo: businessLogo || createdBiz?.logo || createdBiz?.business_logo,
          business_logo: businessLogo || createdBiz?.business_logo || createdBiz?.logo,
        });
      }

      toast.success("Business profile created successfully!");
      router.replace("/home");
    } catch (err: any) {
      if (err?.isEmailUnverified || err?.message?.toLowerCase().includes("verify your email")) {
        setErrorMsg("Please verify your email address to continue creating business profile.");
        openEmailVerificationModal(currentUser?.email || contactEmail.trim());
      } else {
        console.error("Error creating business profile:", err);
        setErrorMsg(err?.message || "Failed to create business profile. Please check details and try again.");
      }
      setIsSubmitting(false);
    }
  };

  if (isLimitReached) {
    return (
      <LimitReachedView
        featureName={featureName}
        usedCount={used}
        quotaLimit={quota}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 gi-page select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b pb-4 gi-divider">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.replace("/home")}
            className="gi-back-btn"
            title="Back to Home"
          >
            <IoChevronBack />
            <span className="gi-back-label">Back</span>
          </button>

          <div>
            <h1 className="text-2xl font-bold gi-text-primary tracking-tight">
              {t("addBusiness") || "Add New Business Profile"}
            </h1>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="gi-card p-6 rounded-2xl border gi-divider space-y-6 shadow-xs">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 text-xs font-semibold border border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span>{errorMsg}</span>
            {(errorMsg.toLowerCase().includes("verify your email") || errorMsg.toLowerCase().includes("verify email")) && (
              <button
                type="button"
                onClick={handleResendVerification}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition shrink-0 cursor-pointer shadow-xs"
              >
                Verify Email &amp; Enter OTP
              </button>
            )}
          </div>
        )}

        {/* 1. Business Name (Required, string, max 255) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold gi-text-primary">
            Business Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <IoBusinessOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            <input
              type="text"
              value={businessName}
              onChange={(e) => {
                setBusinessName(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              maxLength={255}
              placeholder="e.g. Acme Global Traders Pvt Ltd"
              required
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm gi-input focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>
        </div>

        {/* 2. Business Logo (Exact Dart UI: Dotted Dropzone when empty, Logo + Change + Remove Row when selected) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold gi-text-primary">
            Business Logo
          </label>
          {businessLogo ? (
            <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-2xl border gi-divider bg-[var(--gi-surface)]">
              <CustomBusinessLogo
                logoPath={businessLogo}
                width={80}
                height={80}
                shape="rounded"
              />
              <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1">
                <label
                  htmlFor="add-biz-logo-change"
                  className="flex-1 py-2 px-4 rounded-xl border gi-divider gi-surface-interactive text-center text-xs font-semibold cursor-pointer transition gi-text-primary"
                >
                  Change Logo
                  <input
                    id="add-biz-logo-change"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setBusinessLogo("");
                    setLogoFile(null);
                  }}
                  className="flex-1 py-2 px-4 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-center text-xs font-semibold cursor-pointer transition"
                >
                  Remove Logo
                </button>
              </div>
            </div>
          ) : (
            <label
              htmlFor="business-logo-upload"
              className="border-2 border-dashed gi-divider rounded-2xl py-7 px-4 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors bg-[var(--gi-surface)] text-center group"
            >
              <span className="text-base sm:text-lg font-semibold gi-text-primary group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Upload Business Logo
              </span>
              <span className="text-xs gi-text-secondary mt-1">
                Recommended up to 5MB
              </span>
              <input
                id="business-logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* 3. Business Type (Optional, string, max 255) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold gi-text-primary">
            Business Type
          </label>
          <CustomSelect
            value={businessType}
            onChange={(val) => setBusinessType(val)}
            options={[
              { value: "Agency", label: "Agency" },
              { value: "Retail", label: "Retail" },
              { value: "Wholesale", label: "Wholesale" },
              { value: "Manufacturing", label: "Manufacturing" },
              { value: "Service", label: "Service" },
              { value: "Technology", label: "Technology" },
              { value: "Healthcare", label: "Healthcare" },
              { value: "Other", label: "Other" },
            ]}
          />
        </div>

        {/* 4. Contact Details (Email, Phone, Country Code) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          {/* Contact Email (Required, string, email, max 255) */}
          <div className="sm:col-span-4 space-y-1.5">
            <label className="block text-xs font-semibold gi-text-primary">
              Contact Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <IoMailOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                maxLength={255}
                placeholder="contact@example.com"
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm gi-input focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Country Code (Required, integer) */}
          <div className="sm:col-span-4 space-y-1.5">
            <label className="block text-xs font-semibold gi-text-primary">
              Country Code <span className="text-rose-500">*</span>
            </label>
            <CustomSelect
              value={countryCode}
              onChange={(val) => setCountryCode(val)}
              options={COUNTRY_CODES.map((c) => ({
                value: c.value,
                label: c.label,
              }))}
            />
          </div>

          {/* Contact Phone (Required, integer) */}
          <div className="sm:col-span-4 space-y-1.5">
            <label className="block text-xs font-semibold gi-text-primary">
              Contact Phone <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <IoCallOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="1234567890"
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm gi-input focus:outline-none focus:border-indigo-500 font-mono font-medium"
              />
            </div>
          </div>
        </div>

        {/* 5. Address (Required, string, max 1000) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold gi-text-primary">
            Registered Address <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <IoLocationOutline className="absolute left-3.5 top-3 text-slate-400 text-base" />
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={1000}
              placeholder="e.g. 123 Business St, Suite 400, Financial District..."
              rows={3}
              required
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm gi-input focus:outline-none focus:border-indigo-500 resize-none font-medium"
            />
          </div>
        </div>

        {/* 6. Tax & Identification Details (GST, PAN, CIN, TIN) */}
        <div className="border-t gi-divider pt-4 space-y-4">
          <h3 className="text-xs font-bold gi-text-primary uppercase tracking-wider">
            Tax &amp; Government Registration Details (Optional)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* GST Number (max 50) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold gi-text-primary">
                GST Number
              </label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                maxLength={50}
                placeholder="e.g. GSTIN123456"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm gi-input focus:outline-none focus:border-indigo-500 font-mono uppercase"
              />
            </div>

            {/* PAN Number (max 50) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold gi-text-primary">
                PAN Number
              </label>
              <input
                type="text"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                maxLength={50}
                placeholder="e.g. ABCDE1234F"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm gi-input focus:outline-none focus:border-indigo-500 font-mono uppercase"
              />
            </div>

            {/* CIN (max 50) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold gi-text-primary">
                CIN (Corporate Identification No.)
              </label>
              <input
                type="text"
                value={cin}
                onChange={(e) => setCin(e.target.value)}
                maxLength={50}
                placeholder="e.g. L12345MH2000PLC123456"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm gi-input focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* TIN (max 50) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold gi-text-primary">
                TIN (Tax Identification No.)
              </label>
              <input
                type="text"
                value={tin}
                onChange={(e) => setTin(e.target.value)}
                maxLength={50}
                placeholder="e.g. 12345678901"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm gi-input focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t gi-divider">
          <button
            type="button"
            onClick={() => router.replace("/home")}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold border gi-surface-interactive gi-text-secondary cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl gi-btn-primary text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition shadow-sm disabled:opacity-50"
          >
            <IoSaveOutline className="text-base" />
            <span>{isSubmitting ? "Creating Business..." : "Save Business Profile"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
