"use client";

import React from "react";
import { toast, ToastOptions } from "react-toastify";
import {
  IoCheckmarkCircle,
  IoAlertCircle,
  IoWarning,
  IoInformationCircle,
} from "react-icons/io5";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface CustomToastProps {
  title: string;
  message?: string;
  variant?: ToastVariant;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

export const CustomToastContent: React.FC<CustomToastProps> = ({
  title,
  message,
  variant = "success",
  action,
  onClose,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "error":
        return {
          iconBg: "bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] border border-red-500/30",
          icon: <IoAlertCircle className="w-6 h-6 text-red-500" />,
        };
      case "warning":
        return {
          iconBg: "bg-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-amber-500/30",
          icon: <IoWarning className="w-5 h-5 text-amber-400" />,
        };
      case "info":
        return {
          iconBg: "bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-500/30",
          icon: <IoInformationCircle className="w-6 h-6 text-cyan-400" />,
        };
      case "success":
      default:
        return {
          iconBg: "bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-500/30",
          icon: <IoCheckmarkCircle className="w-6 h-6 text-emerald-400" />,
        };
    }
  };

  const style = getVariantStyles();

  return (
    <div className="flex items-start gap-3 w-full pr-1">
      {/* Glowing Status Icon Container */}
      <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${style.iconBg} transition-all duration-300`}>
        {style.icon}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-snug tracking-tight">
          {title}
        </h4>
        {message && (
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed break-words">
            {message}
          </p>
        )}

        {/* Optional Action Link */}
        {action && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
              if (onClose) onClose();
            }}
            className="mt-2 text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 underline underline-offset-2 transition-colors cursor-pointer"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};

export const showToast = {
  success: (titleOrPayload: string | CustomToastProps, message?: string, options?: ToastOptions) => {
    if (typeof titleOrPayload === "object") {
      return toast.success(<CustomToastContent {...titleOrPayload} variant="success" />, options);
    }
    return toast.success(<CustomToastContent title={titleOrPayload} message={message} variant="success" />, options);
  },
  error: (titleOrPayload: string | CustomToastProps, message?: string, options?: ToastOptions) => {
    if (typeof titleOrPayload === "object") {
      return toast.error(<CustomToastContent {...titleOrPayload} variant="error" />, options);
    }
    return toast.error(<CustomToastContent title={titleOrPayload} message={message} variant="error" />, options);
  },
  warning: (titleOrPayload: string | CustomToastProps, message?: string, options?: ToastOptions) => {
    if (typeof titleOrPayload === "object") {
      return toast.warning(<CustomToastContent {...titleOrPayload} variant="warning" />, options);
    }
    return toast.warning(<CustomToastContent title={titleOrPayload} message={message} variant="warning" />, options);
  },
  info: (titleOrPayload: string | CustomToastProps, message?: string, options?: ToastOptions) => {
    if (typeof titleOrPayload === "object") {
      return toast.info(<CustomToastContent {...titleOrPayload} variant="info" />, options);
    }
    return toast.info(<CustomToastContent title={titleOrPayload} message={message} variant="info" />, options);
  },
};
