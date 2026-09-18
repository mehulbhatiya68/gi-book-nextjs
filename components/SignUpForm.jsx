"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IoEyeOutline, IoEyeOffOutline, IoArrowForward, IoCheckmarkCircleOutline } from "react-icons/io5";
import { motion } from "motion/react";
import { useApp } from "@/context/AppContext";

export default function SignUpForm() {
  const router = useRouter();
  const { registerUser, t } = useApp();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validMobile = mobileNumber.trim().length >= 8 && mobileNumber.trim().length <= 20;
  const passwordLength = password.length >= 8 && password.length <= 32;
  const passwordLowercase = /[a-z]/.test(password);
  const passwordUppercase = /[A-Z]/.test(password);
  const passwordNumber = /[0-9]/.test(password);
  const passwordSpecial = /[!@#$%^&*(),.?":{}|<>_\-\\\/\[\]]/.test(password);
  const passwordsMatch = password !== "" && password === confirmPassword;

  const formValid =
    name.trim() !== "" &&
    validEmail &&
    validMobile &&
    passwordLength &&
    passwordLowercase &&
    passwordUppercase &&
    passwordNumber &&
    passwordSpecial &&
    passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formValid || isLoading) return;

    setIsLoading(true);
    try {
      const res = await registerUser({
        name,
        email,
        password,
        mobile_number: mobileNumber,
        country_code: 91,
        user_type: "user",
      });

      if (res?.success) {
        router.push("/home");
      } else {
        setErrorMsg(res?.error || "Registration failed. Email may already exist.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-2xl gi-card shadow-lg p-4 sm:p-7 lg:p-8"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex lg:hidden justify-center mb-4 sm:mb-6"
      >
        <Image
          className="w-20 h-20 sm:w-28 sm:h-28 object-contain"
          src="/logo.png"
          alt="GI Book"
          width={150}
          height={150}
          priority
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="text-center mb-5 sm:mb-7"
      >
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight gi-text-primary">
          {t("createAccount")}
        </h1>
        <p className="mt-1.5 text-sm gi-text-muted">Create your GI Book account</p>
      </motion.div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium text-center">
          {errorMsg}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1.5">{t("fullName")}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full h-11 px-4 rounded-xl gi-input outline-none transition"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1.5">{t("email")}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full h-11 px-4 rounded-xl gi-input outline-none transition"
        />
        {email && !validEmail && (
          <p className="mt-1.5 text-xs text-red-500">Enter a valid email address.</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1.5">Mobile Number *</label>
        <input
          type="tel"
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          placeholder="Enter 10-digit mobile number"
          className="w-full h-11 px-4 rounded-xl gi-input outline-none transition"
        />
        {mobileNumber && !validMobile && (
          <p className="mt-1.5 text-xs text-red-500">Enter a valid mobile number (8-20 digits).</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1.5">{t("password")}</label>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={32}
            placeholder="Create a password (8-32 chars)"
            className="w-full h-11 px-4 pr-11 rounded-xl gi-input outline-none transition"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 gi-text-muted hover:gi-text-primary transition"
          >
            {showPassword ? (
              <IoEyeOffOutline className="text-xl" />
            ) : (
              <IoEyeOutline className="text-xl" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1 mb-4">
        <div className={`flex items-center gap-1 text-[11px] ${passwordLength ? "text-[var(--gi-success)] font-semibold" : "gi-text-muted opacity-60"}`}>
          <IoCheckmarkCircleOutline className="shrink-0" />
          <span>8 to 32 characters</span>
        </div>

        <div className={`flex items-center gap-1 text-[11px] ${passwordLowercase ? "text-[var(--gi-success)] font-semibold" : "gi-text-muted opacity-60"}`}>
          <IoCheckmarkCircleOutline className="shrink-0" />
          <span>1 Lowercase (a-z)</span>
        </div>

        <div className={`flex items-center gap-1 text-[11px] ${passwordUppercase ? "text-[var(--gi-success)] font-semibold" : "gi-text-muted opacity-60"}`}>
          <IoCheckmarkCircleOutline className="shrink-0" />
          <span>1 Uppercase (A-Z)</span>
        </div>

        <div className={`flex items-center gap-1 text-[11px] ${passwordNumber ? "text-[var(--gi-success)] font-semibold" : "gi-text-muted opacity-60"}`}>
          <IoCheckmarkCircleOutline className="shrink-0" />
          <span>1 Number (0-9)</span>
        </div>

        <div className={`flex items-center gap-1 text-[11px] ${passwordSpecial ? "text-[var(--gi-success)] font-semibold" : "gi-text-muted opacity-60"}`}>
          <IoCheckmarkCircleOutline className="shrink-0" />
          <span>1 Special char (!@#$)</span>
        </div>

        <div className={`flex items-center gap-1 text-[11px] ${passwordsMatch ? "text-[var(--gi-success)] font-semibold" : "gi-text-muted opacity-60"}`}>
          <IoCheckmarkCircleOutline className="shrink-0" />
          <span>Passwords match</span>
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-sm font-medium mb-1.5">{t("confirmPassword")}</label>

        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            className="w-full h-11 px-4 pr-11 rounded-xl gi-input outline-none transition"
          />

          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 gi-text-muted hover:gi-text-primary transition"
          >
            {showConfirmPassword ? (
              <IoEyeOffOutline className="text-xl" />
            ) : (
              <IoEyeOutline className="text-xl" />
            )}
          </button>
        </div>

        {confirmPassword && !passwordsMatch && (
          <p className="mt-1.5 text-xs text-red-500">Passwords do not match.</p>
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={!formValid}
        className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 font-medium transition ${formValid
            ? "gi-btn-primary cursor-pointer"
            : "gi-surface-secondary gi-text-muted cursor-not-allowed opacity-60"
          }`}
      >
        <span>{t("createAccount")}</span>
        <IoArrowForward className="text-lg" />
      </motion.button>

      <div className="mt-5 text-center">
        <p className="text-sm gi-text-muted">
          {t("alreadyAccount")}{" "}
          <Link href="/login" className="font-semibold gi-text-primary hover:underline">
            {t("login")}
          </Link>
        </p>
      </div>

      <p className="mt-5 text-center text-[10px] sm:text-xs gi-text-muted opacity-60">
        {t("tagline")}
      </p>
    </motion.form>
  );
}
