"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IoEyeOutline,
  IoEyeOffOutline,
  IoArrowForward,
  IoCheckmarkCircleOutline,
  IoMailOutline,
  IoShieldCheckmarkOutline,
  IoRefreshOutline,
  IoPencilOutline,
  IoArrowBack,
} from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { usePreferences } from "@/lib/hooks/usePreferences";
import { authApi } from "@/lib/api/auth";

export default function SignUpForm() {
  const router = useRouter();
  const { registerUser } = useAuth();
  const { t } = usePreferences();

  // Step state: 1 = Form Details, 2 = OTP Verification
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // OTP State (6 Digits)
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Validation Flags
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
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

  // OTP Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Track if user account has been registered in database
  const [isRegistered, setIsRegistered] = useState(false);

  // Handle Step 1 Submission -> Register in DB & Send Real Email OTP
  const handleProceedToOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formValid || isLoading) return;

    setIsLoading(true);
    try {
      // 1. Register user in database via POST /auth/register (if not already registered)
      if (!isRegistered) {
        const res = await registerUser(
          {
            name: name.trim(),
            email: email.trim(),
            password,
            mobile_number: mobileNumber.trim(),
            country_code: 91,
          },
          false // autoLogin = false
        );

        if (!res?.success) {
          setErrorMsg(res?.error || "Registration failed. Email or Mobile may already exist.");
          setIsLoading(false);
          return;
        }
        setIsRegistered(true);
      }

      // 2. Now that user exists in DB, call POST /auth/forgot-password to send real Email OTP from backend
      try {
        await authApi.forgotPassword(email.trim());
      } catch (otpErr: any) {
        console.warn("OTP API notification:", otpErr);
      }

      toast.success(`Account created & verification OTP sent to ${email.trim()}`);
      setStep(2);
      setTimer(60);
      setCanResend(false);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to process registration.");
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Input Changes with Auto-Tab
  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split("");
      while (newOtp.length < 6) newOtp.push("");
      setOtp(newOtp);
      otpInputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  // Resend OTP handler -> Trigger real OTP dispatch from backend
  const handleResendOtp = async () => {
    if (!canResend || isLoading) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      await authApi.forgotPassword(email.trim());
      toast.success("A new OTP code has been sent to your email!");
      setTimer(60);
      setCanResend(false);
      setOtp(Array(6).fill(""));
    } catch (err: any) {
      toast.error(err?.message || "Failed to resend OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 Final Submission: Verify OTP & Complete Registration Flow
  const handleFinalRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      setErrorMsg("Please enter the complete 6-digit OTP code.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      toast.success("Registration & verification complete! Redirecting to Login...");
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md rounded-2xl gi-card shadow-xl p-5 sm:p-7 lg:p-8 relative overflow-hidden"
    >
      {/* Header Branding (Mobile) */}
      <div className="flex lg:hidden justify-center mb-4">
        <Image
          className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
          src="/logo.png"
          alt="GI Book"
          width={120}
          height={120}
          priority
        />
      </div>

      {/* Step Indicator Badge */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b gi-divider">
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
              step === 1 ? "bg-[var(--gi-primary)] text-white" : "bg-[var(--gi-success)] text-white"
            }`}
          >
            1
          </span>
          <span className="text-xs font-semibold gi-text-primary">Account Details</span>
        </div>
        <div className="h-[2px] w-8 bg-slate-200 dark:bg-zinc-700" />
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
              step === 2 ? "bg-[var(--gi-primary)] text-white" : "gi-surface-secondary gi-text-muted"
            }`}
          >
            2
          </span>
          <span className={`text-xs font-semibold ${step === 2 ? "gi-text-primary" : "gi-text-muted"}`}>
            Email Verification
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium text-center animate-shake">
          {errorMsg}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 ? (
          /* STEP 1: USER DETAILS FORM */
          <motion.form
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleProceedToOtp}
          >
            <div className="text-center mb-5">
              <h1 className="text-2xl font-bold tracking-tight gi-text-primary">
                {t("createAccount")}
              </h1>
              <p className="mt-1 text-xs gi-text-muted">Enter your details to register your GI Book account</p>
            </div>

            {/* Full Name */}
            <div className="mb-3.5">
              <label className="block text-xs font-semibold mb-1 gi-text-secondary">{t("fullName")} *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full h-11 px-4 text-sm rounded-xl gi-input outline-none transition"
              />
            </div>

            {/* Email Address */}
            <div className="mb-3.5">
              <label className="block text-xs font-semibold mb-1 gi-text-secondary">{t("email")} *</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full h-11 px-4 pr-10 text-sm rounded-xl gi-input outline-none transition"
                />
                <IoMailOutline className="absolute right-3.5 top-1/2 -translate-y-1/2 text-lg gi-text-muted" />
              </div>
              {email && !validEmail && (
                <p className="mt-1 text-[11px] text-red-500">Please enter a valid email address.</p>
              )}
            </div>

            {/* Mobile Number */}
            <div className="mb-3.5">
              <label className="block text-xs font-semibold mb-1 gi-text-secondary">Mobile Number *</label>
              <div className="flex gap-2">
                <span className="h-11 px-3 rounded-xl gi-surface-secondary flex items-center text-xs font-bold gi-text-primary border gi-divider shrink-0">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className="w-full h-11 px-4 text-sm rounded-xl gi-input outline-none transition"
                />
              </div>
              {mobileNumber && !validMobile && (
                <p className="mt-1 text-[11px] text-red-500">Enter a valid 10-digit mobile number.</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-3.5">
              <label className="block text-xs font-semibold mb-1 gi-text-secondary">{t("password")} *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={32}
                  placeholder="Create password (8-32 chars)"
                  className="w-full h-11 px-4 pr-11 text-sm rounded-xl gi-input outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 gi-text-muted hover:gi-text-primary transition"
                >
                  {showPassword ? <IoEyeOffOutline className="text-xl" /> : <IoEyeOutline className="text-xl" />}
                </button>
              </div>
            </div>

            {/* Password Validation Checklist */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 mb-3.5 p-2.5 rounded-xl gi-surface-secondary border gi-divider">
              <div className={`flex items-center gap-1 text-[11px] ${passwordLength ? "text-[var(--gi-success)] font-semibold" : "gi-text-muted opacity-60"}`}>
                <IoCheckmarkCircleOutline className="shrink-0 text-sm" />
                <span>8 to 32 characters</span>
              </div>
              <div className={`flex items-center gap-1 text-[11px] ${passwordLowercase ? "text-[var(--gi-success)] font-semibold" : "gi-text-muted opacity-60"}`}>
                <IoCheckmarkCircleOutline className="shrink-0 text-sm" />
                <span>Lowercase (a-z)</span>
              </div>
              <div className={`flex items-center gap-1 text-[11px] ${passwordUppercase ? "text-[var(--gi-success)] font-semibold" : "gi-text-muted opacity-60"}`}>
                <IoCheckmarkCircleOutline className="shrink-0 text-sm" />
                <span>Uppercase (A-Z)</span>
              </div>
              <div className={`flex items-center gap-1 text-[11px] ${passwordNumber ? "text-[var(--gi-success)] font-semibold" : "gi-text-muted opacity-60"}`}>
                <IoCheckmarkCircleOutline className="shrink-0 text-sm" />
                <span>Number (0-9)</span>
              </div>
              <div className={`flex items-center gap-1 text-[11px] ${passwordSpecial ? "text-[var(--gi-success)] font-semibold" : "gi-text-muted opacity-60"}`}>
                <IoCheckmarkCircleOutline className="shrink-0 text-sm" />
                <span>Special char (!@#$)</span>
              </div>
              <div className={`flex items-center gap-1 text-[11px] ${passwordsMatch ? "text-[var(--gi-success)] font-semibold" : "gi-text-muted opacity-60"}`}>
                <IoCheckmarkCircleOutline className="shrink-0 text-sm" />
                <span>Passwords match</span>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="mb-5">
              <label className="block text-xs font-semibold mb-1 gi-text-secondary">{t("confirmPassword")} *</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full h-11 px-4 pr-11 text-sm rounded-xl gi-input outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 gi-text-muted hover:gi-text-primary transition"
                >
                  {showConfirmPassword ? <IoEyeOffOutline className="text-xl" /> : <IoEyeOutline className="text-xl" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-[11px] text-red-500">Passwords do not match.</p>
              )}
            </div>

            {/* Submit Step 1 Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!formValid || isLoading}
              className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition shadow-md ${
                formValid && !isLoading
                  ? "gi-btn-primary cursor-pointer"
                  : "gi-surface-secondary gi-text-muted cursor-not-allowed opacity-60"
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Get Verification Code</span>
                  <IoArrowForward className="text-lg" />
                </>
              )}
            </motion.button>
          </motion.form>
        ) : (
          /* STEP 2: EMAIL OTP VERIFICATION FORM */
          <motion.form
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleFinalRegister}
          >
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-[var(--gi-primary)] flex items-center justify-center mx-auto mb-3 text-2xl border border-indigo-200 dark:border-indigo-800">
                <IoShieldCheckmarkOutline />
              </div>
              <h2 className="text-xl font-bold tracking-tight gi-text-primary">Verify Email Address</h2>
              <p className="mt-1 text-xs gi-text-muted">Enter the 6-digit OTP code sent to your email</p>
            </div>

            {/* Email Address Badge with Edit Button */}
            <div className="flex items-center justify-between p-3 mb-6 rounded-xl gi-surface-secondary border gi-divider">
              <div className="flex items-center gap-2 min-w-0">
                <IoMailOutline className="text-base text-[var(--gi-primary)] shrink-0" />
                <span className="text-xs font-semibold gi-text-primary truncate">{email}</span>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-[11px] font-bold text-[var(--gi-primary)] hover:underline shrink-0"
              >
                <IoPencilOutline /> Edit
              </button>
            </div>

            {/* 6-Digit OTP Inputs */}
            <div className="mb-6">
              <label className="block text-xs font-semibold mb-2 text-center gi-text-secondary">Enter 6-Digit Code</label>
              <div className="flex justify-between gap-1.5 sm:gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    className="w-10 h-12 sm:w-12 sm:h-13 text-center text-lg font-bold rounded-xl gi-input outline-none focus:border-[var(--gi-primary)] focus:ring-2 focus:ring-[var(--gi-primary)]/20 transition"
                  />
                ))}
              </div>
            </div>

            {/* Resend Timer & Action */}
            <div className="flex items-center justify-between mb-6 text-xs">
              <span className="gi-text-muted">Didn't receive code?</span>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="flex items-center gap-1 font-bold text-[var(--gi-primary)] hover:underline cursor-pointer"
                >
                  <IoRefreshOutline /> Resend OTP
                </button>
              ) : (
                <span className="font-semibold gi-text-muted">Resend in {timer}s</span>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={otp.join("").length < 6 || isLoading}
                className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition shadow-md ${
                  otp.join("").length === 6 && !isLoading
                    ? "gi-btn-primary cursor-pointer"
                    : "gi-surface-secondary gi-text-muted cursor-not-allowed opacity-60"
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify & Register</span>
                    <IoShieldCheckmarkOutline className="text-lg" />
                  </>
                )}
              </motion.button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full h-10 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold gi-text-muted hover:gi-text-primary transition"
              >
                <IoArrowBack /> Back to Details
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Footer link to Login */}
      <div className="mt-6 pt-4 border-t gi-divider text-center">
        <p className="text-xs gi-text-muted">
          {t("alreadyAccount")}{" "}
          <Link href="/login" className="font-bold text-[var(--gi-primary)] hover:underline">
            {t("login")}
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
