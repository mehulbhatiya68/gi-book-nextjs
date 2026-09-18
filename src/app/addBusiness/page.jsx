"use client";

import { useState } from "react";
import { IoArrowBack, IoSaveOutline, IoBusinessOutline, IoImageOutline, IoTrashOutline } from "react-icons/io5";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { compressImageFile } from "@/utils/imageCompressor";

export default function AddBusiness() {
  const router = useRouter();
  const { saveBusiness, t } = useApp();

  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [type, setType] = useState("Agency");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [cin, setCin] = useState("");
  const [tin, setTin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg("Business Name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const businessData = {
        name: name.trim(),
        logo,
        type,
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        gstNumber: gstNumber.trim(),
        panNumber: panNumber.trim(),
        cin: cin.trim(),
        tin: tin.trim(),
      };

      saveBusiness(businessData);
      router.replace("/home");
    } catch (err) {
      console.error("Error creating business:", err);
      setErrorMsg("Failed to create business. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedLogo = await compressImageFile(file, 300, 300, 0.8);
        if (compressedLogo) {
          setLogo(compressedLogo);
        }
      } catch (err) {
        console.error("Error compressing logo:", err);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 gi-page select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b pb-4 gi-divider">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.replace("/home")}
            className="p-2 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer"
            title="Back to Home"
          >
            <IoArrowBack className="text-lg" />
          </button>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
              {t("addBusiness") || "Add New Business"}
            </h1>
            <p className="text-xs sm:text-sm gi-text-secondary mt-0.5">
              Setup a new business profile to manage separate invoices, inventory, and ledgers
            </p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="gi-card p-6 rounded-xl border gi-divider space-y-5 shadow-xs">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Business Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold gi-text-primary">
            Business Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errorMsg) setErrorMsg("");
            }}
            placeholder="e.g. GI Enterprises, Apex Tech Solutions..."
            required
            className="w-full px-3.5 py-2 rounded-lg text-sm gi-input focus:outline-none"
          />
        </div>

        {/* Business Logo */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold gi-text-primary">
            Business Logo
          </label>
          {logo ? (
            <div className="relative rounded-xl border gi-divider p-2 flex items-center justify-between bg-[var(--gi-surface)]">
              <div className="flex items-center gap-3">
                <img
                  src={logo}
                  alt="Business Logo Preview"
                  className="h-14 w-14 object-contain rounded-lg border gi-divider p-1 bg-white"
                />
                <div>
                  <span className="text-xs font-semibold gi-text-primary block">
                    Logo Uploaded
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Ready for invoices
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you sure you want to remove the business logo?")) {
                    setLogo("");
                  }
                }}
                className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                title="Remove Logo"
              >
                <IoTrashOutline className="text-lg" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="business-logo"
              className="border-2 border-dashed gi-divider rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors bg-[var(--gi-surface)]"
            >
              <IoImageOutline className="text-2xl gi-text-secondary mb-1" />
              <span className="text-xs font-semibold gi-text-primary">
                Click to upload business logo
              </span>
              <span className="text-[11px] gi-text-secondary mt-0.5">
                PNG, JPG or WEBP (Max 300x300 recommended)
              </span>
              <input
                id="business-logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Business Type */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold gi-text-primary">
            Business Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg text-sm gi-input focus:outline-none cursor-pointer"
          >
            <option value="Agency">Agency</option>
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Service">Service</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Contact Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold gi-text-primary">
              Business Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. contact@business.com"
              className="w-full px-3.5 py-2 rounded-lg text-sm gi-input focus:outline-none"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold gi-text-primary">
              Business Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-3.5 py-2 rounded-lg text-sm gi-input focus:outline-none"
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold gi-text-primary">
            Business Address
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter full office/registered business address..."
            rows={3}
            className="w-full px-3.5 py-2 rounded-lg text-sm gi-input focus:outline-none resize-none"
          />
        </div>

        {/* GST & PAN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold gi-text-primary">
              GST Number
            </label>
            <input
              type="text"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
              placeholder="e.g. 24ABCDE1234F1Z5"
              className="w-full px-3.5 py-2 rounded-lg text-sm gi-input focus:outline-none font-mono uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold gi-text-primary">
              PAN Number
            </label>
            <input
              type="text"
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
              placeholder="e.g. ABCDE1234F"
              className="w-full px-3.5 py-2 rounded-lg text-sm gi-input focus:outline-none font-mono uppercase"
            />
          </div>
        </div>

        {/* CIN & TIN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold gi-text-primary">
              CIN (Corporate Identification Number)
            </label>
            <input
              type="text"
              value={cin}
              onChange={(e) => setCin(e.target.value)}
              placeholder="e.g. U12345MH2020PTC123456"
              className="w-full px-3.5 py-2 rounded-lg text-sm gi-input focus:outline-none font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold gi-text-primary">
              TIN (Tax Identification Number)
            </label>
            <input
              type="text"
              value={tin}
              onChange={(e) => setTin(e.target.value)}
              placeholder="e.g. 24123456789"
              className="w-full px-3.5 py-2 rounded-lg text-sm gi-input focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t gi-divider">
          <button
            type="button"
            onClick={() => router.replace("/home")}
            className="px-4 py-2 rounded-lg text-xs font-semibold border gi-surface-interactive gi-text-secondary cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg gi-btn-primary text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <IoSaveOutline className="text-base" />
            <span>{isSubmitting ? "Creating..." : "Create Business"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}