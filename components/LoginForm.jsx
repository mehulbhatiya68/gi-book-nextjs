"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IoEyeOutline,
  IoEyeOffOutline,
  IoArrowForward,
  IoPeopleOutline,
  IoPersonOutline,
  IoClose,
  IoKeyOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "@/context/AppContext";

export default function LoginForm() {
  const router = useRouter();
  const { loginUser, requestForgotPassword, resetPasswordWithOtp, staffList, t } = useApp();

  const [loginType, setLoginType] = useState("owner"); // 'owner' | 'staff'
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Request OTP, 2: Enter OTP & Set Password
  const [forgotEmail, setForgotEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotConfirmPass, setForgotConfirmPass] = useState("");
  const [showForgotPassToggle, setShowForgotPassToggle] = useState(false);
  const [forgotErrorMsg, setForgotErrorMsg] = useState("");
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState("");

  const validEmail = loginType === "staff" ? email.trim().length > 0 : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const formValid = validEmail && password.trim() !== "";

  // Forgot Password Criteria
  const forgotValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail);
  const passLength = forgotNewPass.length >= 8 && forgotNewPass.length <= 32;
  const passLower = /[a-z]/.test(forgotNewPass);
  const passUpper = /[A-Z]/.test(forgotNewPass);
  const passNum = /[0-9]/.test(forgotNewPass);
  const passSpec = /[!@#$%^&*(),.?":{}|<>_\-\\\/\[\]]/.test(forgotNewPass);
  const passMatch = forgotNewPass !== "" && forgotNewPass === forgotConfirmPass;
  const forgotFormValid = forgotValidEmail && otpCode.trim() !== "" && passLength && passLower && passUpper && passNum && passSpec && passMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formValid || isLoading) return;

    setIsLoading(true);
    try {
      const result = await loginUser(email, password, loginType);
      if (result.success) {
        router.push("/home");
      } else {
        setErrorMsg(result.error || "Invalid credentials. Please check email and password.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setForgotErrorMsg("");
    setForgotSuccessMsg("");

    if (!forgotValidEmail || isLoading) return;

    setIsLoading(true);
    try {
      const res = await requestForgotPassword(forgotEmail);
      if (res.success) {
        setForgotSuccessMsg(res.message || "OTP sent successfully to your email.");
        setForgotStep(2);
      } else {
        setForgotErrorMsg(res.error || "Failed to send OTP.");
      }
    } catch (err) {
      setForgotErrorMsg(err.message || "Failed to request OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    setForgotErrorMsg("");
    setForgotSuccessMsg("");

    if (!forgotFormValid || isLoading) return;

    setIsLoading(true);
    try {
      const res = await resetPasswordWithOtp({
        identifier: forgotEmail,
        otp: otpCode,
        password: forgotNewPass,
        password_confirmation: forgotConfirmPass,
      });

      if (res.success) {
        setForgotSuccessMsg("Password set successfully! Redirecting...");
        setEmail(forgotEmail);
        setTimeout(() => {
          setShowForgotModal(false);
          setForgotStep(1);
          setOtpCode("");
          setForgotSuccessMsg("");
          setForgotEmail("");
          setForgotNewPass("");
          setForgotConfirmPass("");
          router.push("/home");
        }, 1500);
      } else {
        setForgotErrorMsg(res.error || "Failed to set new password.");
      }
    } catch (err) {
      setForgotErrorMsg(err.message || "Failed to set new password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStaffDemo = (staff) => {
    setEmail(staff.email || staff.mobile || staff.name);
    setPassword(staff.password || "123456");
  };

  return (
    <>
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

        {/* Role Selection Toggle */}
        <div className="flex items-center p-1 rounded-xl gi-surface-secondary border gi-divider mb-6">
          <button
            type="button"
            onClick={() => {
              setLoginType("owner");
              setErrorMsg("");
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${loginType === "owner"
              ? "gi-btn-primary shadow-xs"
              : "gi-text-secondary hover:bg-[var(--gi-hover)]"
              }`}
          >
            <IoPersonOutline className="text-base" />
            <span>Business Owner</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginType("staff");
              setErrorMsg("");
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${loginType === "staff"
              ? "gi-btn-primary shadow-sm"
              : "gi-text-secondary hover:bg-[var(--gi-hover)]"
              }`}
          >
            <IoPeopleOutline className="text-base" />
            <span>Staff Member</span>
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="text-center mb-5 sm:mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight gi-text-primary">
            {loginType === "staff" ? "Staff Portal Login" : t("welcomeBack")}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm gi-text-muted">
            {loginType === "staff"
              ? "Login to access your assigned business & allowed operations."
              : t("loginSubtitle")}
          </p>
        </motion.div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium text-center">
            {errorMsg}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5 gi-text-primary">
            {loginType === "staff" ? "Staff Email or Mobile Number" : t("email")}
          </label>
          <input
            type={loginType === "staff" ? "text" : "email"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={loginType === "staff" ? "Enter staff email or phone" : "Enter your email"}
            className="w-full h-11 px-4 rounded-xl gi-input outline-none transition"
          />
          {email && !validEmail && loginType !== "staff" && (
            <p className="mt-1.5 text-xs text-red-500">Enter a valid email address.</p>
          )}
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium mb-1.5 gi-text-primary">{t("password")}</label>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full h-11 px-4 pr-11 rounded-xl gi-input outline-none transition"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 gi-text-muted hover:gi-text-primary transition cursor-pointer"
            >
              {showPassword ? (
                <IoEyeOffOutline className="text-xl" />
              ) : (
                <IoEyeOutline className="text-xl" />
              )}
            </button>
          </div>
        </div>

        {loginType === "staff" && staffList.length > 0 && (
          <div className="mb-4 pt-1">
            <p className="text-[11px] font-semibold gi-text-muted uppercase tracking-wider mb-2">
              Available Staff Members ({staffList.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {staffList.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectStaffDemo(s)}
                  className="px-2.5 py-1 rounded-lg gi-surface-secondary hover:bg-[var(--gi-hover)] text-xs font-medium gi-text-primary transition cursor-pointer" style={{ border: "1px solid var(--gi-border)" }}
                >
                  {s.name} ({s.email || s.mobile})
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={() => {
              setForgotEmail(email);
              setForgotErrorMsg("");
              setForgotSuccessMsg("");
              setShowForgotModal(true);
            }}
            className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
          >
            Forgot Password?
          </button>

          <button
            type="button"
            onClick={() => {
              if (loginType === "staff") {
                if (staffList.length > 0) {
                  handleSelectStaffDemo(staffList[0]);
                } else {
                  setEmail("staff@gibook.com");
                  setPassword("123456");
                }
              } else {
                setEmail("admin@gibook.com");
                setPassword("admin123");
              }
            }}
            className="text-xs font-medium text-sky-600 hover:underline cursor-pointer"
          >
            {loginType === "staff" ? "Fill Demo Staff Login" : "Use Demo Credentials"}
          </button>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={!formValid}
          className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 font-medium transition ${formValid
            ? "gi-btn-primary cursor-pointer shadow-sm"
            : "gi-surface-secondary gi-text-muted cursor-not-allowed opacity-60"
            }`}
        >
          <span>{loginType === "staff" ? "Login as Staff" : t("login")}</span>
          <IoArrowForward className="text-lg" />
        </motion.button>

        <div className="mt-5 text-center">
          <p className="text-sm gi-text-muted">
            {t("noAccount")}{" "}
            <Link href="/sign-up" className="font-semibold gi-text-primary hover:underline">
              {t("signUp")}
            </Link>
          </p>
        </div>

        <p className="mt-5 text-center text-[10px] sm:text-xs gi-text-muted opacity-60">
          {t("tagline")}
        </p>
      </motion.form>

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      <AnimatePresence>
        {showForgotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center gi-modal-overlay backdrop-blur-sm p-4"
            onClick={() => setShowForgotModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl gi-modal-content p-5 sm:p-7 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--gi-border)" }}>
                <div className="flex items-center gap-2">
                  <IoKeyOutline className="text-2xl gi-text-primary" />
                  <h3 className="text-xl font-bold gi-text-primary">
                    {forgotStep === 1 ? "Forgot Password" : "Verify OTP & Set Password"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotStep(1);
                  }}
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-[var(--gi-hover)] transition cursor-pointer gi-text-muted"
                >
                  <IoClose className="text-2xl" />
                </button>
              </div>

              <p className="text-xs gi-text-muted">
                {forgotStep === 1
                  ? "Enter your registered email address to receive an OTP verification code."
                  : `Enter the OTP sent to ${forgotEmail} along with your new password.`}
              </p>

              {forgotSuccessMsg && (
                <div className="p-3 rounded-xl gi-badge-success font-semibold text-xs text-center">
                  {forgotSuccessMsg}
                </div>
              )}

              {forgotErrorMsg && (
                <div className="p-3 rounded-xl gi-badge-danger font-semibold text-xs text-center">
                  {forgotErrorMsg}
                </div>
              )}

              {forgotStep === 1 ? (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold gi-text-secondary mb-1">
                      Registered Email Address *
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="john@example.com"
                      required
                      className="w-full p-2.5 rounded-xl gi-input text-sm focus:outline-none"
                    />
                    {forgotEmail && !forgotValidEmail && (
                      <p className="text-[11px] text-red-500 mt-1">Please enter a valid email address.</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold gi-btn-secondary transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!forgotValidEmail || isLoading}
                      className={`px-5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${forgotValidEmail && !isLoading
                        ? "gi-btn-primary shadow-md"
                        : "gi-surface-secondary gi-text-muted cursor-not-allowed opacity-60"
                        }`}
                    >
                      {isLoading ? "Sending OTP..." : "Send Verification OTP"}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSetNewPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold gi-text-secondary mb-1">
                      OTP Verification Code *
                    </label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter 6-digit OTP code"
                      required
                      className="w-full p-2.5 rounded-xl gi-input text-sm font-mono tracking-widest focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold gi-text-secondary mb-1">
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showForgotPassToggle ? "text" : "password"}
                        value={forgotNewPass}
                        onChange={(e) => setForgotNewPass(e.target.value)}
                        maxLength={32}
                        placeholder="Enter new password (8-32 chars)"
                        className="w-full p-2.5 pr-10 rounded-xl gi-input text-sm focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotPassToggle(!showForgotPassToggle)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 gi-text-muted hover:gi-text-primary transition cursor-pointer"
                      >
                        {showForgotPassToggle ? (
                          <IoEyeOffOutline className="text-lg" />
                        ) : (
                          <IoEyeOutline className="text-lg" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold gi-text-secondary mb-1">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      value={forgotConfirmPass}
                      onChange={(e) => setForgotConfirmPass(e.target.value)}
                      maxLength={32}
                      placeholder="Confirm new password"
                      className="w-full p-2.5 rounded-xl gi-input text-sm focus:outline-none"
                    />
                  </div>

                  {/* Password Criteria Checklist */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-2 gi-surface-secondary rounded-xl">
                    <div className={`flex items-center gap-1 text-[10px] ${passLength ? "text-[var(--gi-success)] font-semibold" : "gi-text-muted opacity-60"}`}>
                      <IoCheckmarkCircleOutline className="shrink-0" />
                      <span>8 to 32 characters</span>
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] ${passLower ? "text-[var(--gi-success)] font-semibold" : "gi-text-muted opacity-60"}`}>
                      <IoCheckmarkCircleOutline className="shrink-0" />
                      <span>1 Lowercase (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] ${passUpper ? "text-[var(--gi-success)] font-semibold" : "gi-text-muted opacity-60"}`}>
                      <IoCheckmarkCircleOutline className="shrink-0" />
                      <span>1 Uppercase (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] ${passNum ? "text-[var(--gi-success)] font-semibold" : "gi-text-muted opacity-60"}`}>
                      <IoCheckmarkCircleOutline className="shrink-0" />
                      <span>1 Number (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] ${passSpec ? "text-[var(--gi-success)] font-semibold" : "gi-text-muted opacity-60"}`}>
                      <IoCheckmarkCircleOutline className="shrink-0" />
                      <span>1 Special char (!@#$)</span>
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] ${passMatch ? "text-[var(--gi-success)] font-semibold" : "gi-text-muted opacity-60"}`}>
                      <IoCheckmarkCircleOutline className="shrink-0" />
                      <span>Passwords match</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-xs text-sky-600 font-semibold hover:underline cursor-pointer"
                    >
                      &larr; Change Email
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotModal(false);
                          setForgotStep(1);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-semibold gi-btn-secondary transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!forgotFormValid || isLoading}
                        className={`px-5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${forgotFormValid && !isLoading
                          ? "gi-btn-primary shadow-md"
                          : "gi-surface-secondary gi-text-muted cursor-not-allowed opacity-60"
                          }`}
                      >
                        {isLoading ? "Setting Password..." : "Set New Password"}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
