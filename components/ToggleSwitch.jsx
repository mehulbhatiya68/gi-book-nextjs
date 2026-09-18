"use client";

import { motion } from "motion/react";

export default function ToggleSwitch({
  checked = false,
  onChange,
  disabled = false,
  size = "md",
  ariaLabel = "Toggle switch",
  className = "",
}) {
  const sizeConfig = {
    sm: { container: "w-9 h-5 p-0.5", knob: "w-4 h-4", translate: 16 },
    md: { container: "w-12 h-6.5 p-0.5", knob: "w-5 h-5", translate: 22 },
    lg: { container: "w-14 h-7.5 p-1", knob: "w-5.5 h-5.5", translate: 26 },
  }[size] || { container: "w-12 h-6.5 p-0.5", knob: "w-5 h-5", translate: 22 };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange && onChange(!checked)}
      className={`relative rounded-full transition-colors duration-300 ease-in-out cursor-pointer flex items-center shrink-0 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${
        checked
          ? "bg-indigo-600 dark:bg-indigo-500 shadow-inner"
          : "bg-slate-300 dark:bg-zinc-700"
      } ${sizeConfig.container} ${className}`}
    >
      <motion.div
        className={`rounded-full bg-white shadow-md ${sizeConfig.knob}`}
        animate={{ x: checked ? sizeConfig.translate : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}
