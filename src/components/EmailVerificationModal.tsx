"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoClose,
  IoShieldCheckmarkOutline,
  IoMailOutline,
  IoRefreshOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
} from "react-icons/io5";
import { toast } from "react-toastify";
import { authApi } from "@/lib/api/auth";

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
  onSuccess?: () => void;
}

export default function EmailVerificationModal({
  isOpen,
  onClose,
  email = "",
  onSuccess,
}: EmailVerificationModalProps) {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [isOpen, timer]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtp(Array(6).fill(""));
      setTimer(60);
      setCanResend(false);
      setErrorMsg("");
      setIsSuccess(false);
      setIsLoading(false);
      // Auto-send initial OTP code if email is present
      if (email) {
        authApi.forgotPassword(email).catch((err) => {
          console.warn("Auto OTP send notice:", err);
        });
      }
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [isOpen, email]);

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (errorMsg) setErrorMsg("");

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

  const handleResendOtp = async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    setErrorMsg("");
    try {
      if (email) {
        await authApi.forgotPassword(email);
      }
      toast.success("A new 6-digit OTP code has been sent to your email!");
      setTimer(60);
      setCanResend(false);
      setOtp(Array(6).fill(""));
      otpInputRefs.current[0]?.focus();
    } catch (err: any) {
      toast.error(err?.message || "Failed to resend OTP code");
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      setErrorMsg("Please enter the full 6-digit OTP code.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      await authApi.verifyEmail({ email, otp: otpCode });
      setIsSuccess(true);
      toast.success("Email verified successfully!");
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Invalid or expired OTP code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md gi-card rounded-2xl shadow-2xl p-6 sm:p-7 relative border gi-divider overflow-hidden"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl gi-surface-secondary text-slate-400 hover:gi-text-primary transition cursor-pointer"
          >
            <IoClose className="text-xl" />
          </button>

          {isSuccess ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-3xl border border-emerald-200 dark:border-emerald-800">
                <IoCheckmarkCircleOutline />
              </div>
              <h3 className="text-xl font-bold gi-text-primary">Email Verified!</h3>
              <p className="text-xs gi-text-muted">
                Your email address has been verified. You can now access all features.
              </p>
            </div>
          ) : (
            <form onSubmit={handleVerifySubmit} className="space-y-5">
              {/* Icon Header */}
              <div className="text-center">
                <div className="w-13 h-13 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-[var(--gi-primary)] flex items-center justify-center mx-auto mb-3 text-2xl border border-indigo-200 dark:border-indigo-800">
                  <IoShieldCheckmarkOutline />
                </div>
                <h3 className="text-xl font-bold tracking-tight gi-text-primary">
                  Verify Email Address
                </h3>
                <p className="mt-1 text-xs gi-text-muted">
                  Enter the 6-digit OTP verification code sent to your email
                </p>
              </div>

              {/* Email Badge */}
              <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl gi-surface-secondary border gi-divider text-xs font-semibold gi-text-primary">
                <IoMailOutline className="text-base text-[var(--gi-primary)] shrink-0" />
                <span className="truncate">{email || "Your Registered Email"}</span>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2 border border-rose-200 dark:border-rose-800 animate-shake">
                  <IoAlertCircleOutline className="text-lg shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 6-Digit OTP Inputs */}
              <div>
                <label className="block text-xs font-semibold mb-2.5 text-center gi-text-secondary">
                  Enter 6-Digit Code
                </label>
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

              {/* Resend OTP Actions */}
              <div className="flex items-center justify-between text-xs">
                <span className="gi-text-muted">Didn't receive the code?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isResending}
                    className="flex items-center gap-1 font-bold text-[var(--gi-primary)] hover:underline cursor-pointer disabled:opacity-50"
                  >
                    <IoRefreshOutline className={isResending ? "animate-spin" : ""} />
                    <span>Resend OTP</span>
                  </button>
                ) : (
                  <span className="font-semibold gi-text-muted">Resend in {timer}s</span>
                )}
              </div>

              {/* Verify Submit Button */}
              <button
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
                    <span>Verify &amp; Continue</span>
                    <IoShieldCheckmarkOutline className="text-lg" />
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
