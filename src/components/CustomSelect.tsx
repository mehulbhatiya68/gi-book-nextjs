"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { IoChevronDown, IoCheckmark } from "react-icons/io5";

export interface SelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
  badge?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface CustomSelectProps {
  options: SelectOption[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select an option...",
  disabled = false,
  className = "",
  size = "md",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => {
    return options.find((opt) => String(opt.value) === String(value));
  }, [options, value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelect = (optionVal: string | number) => {
    onChange(String(optionVal));
    setIsOpen(false);
  };

  const pyClass = size === "sm" ? "py-1.5 px-3 text-xs" : size === "lg" ? "py-3 px-4 text-sm" : "py-2.5 px-3.5 text-xs";

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Glassmorphism Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full ${pyClass} rounded-xl border transition-all duration-200 flex items-center justify-between gap-2 text-left cursor-pointer outline-none ${
          disabled ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-zinc-800" : ""
        } ${
          isOpen
            ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-white dark:bg-zinc-900 shadow-md"
            : "border-slate-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md hover:border-indigo-400 dark:hover:border-indigo-500 shadow-2xs"
        }`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          {selectedOption ? (
            <div className="truncate flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white truncate">
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 shrink-0">
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 dark:text-zinc-500 font-medium truncate">
              {placeholder}
            </span>
          )}
        </div>

        <IoChevronDown
          className={`text-slate-400 dark:text-zinc-500 text-sm shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-indigo-600 dark:text-indigo-400" : ""
          }`}
        />
      </button>

      {/* Floating Glassmorphism Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-indigo-200/60 dark:border-indigo-900/60 p-2 shadow-2xl space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Options List */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {options.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
                No options available
              </div>
            ) : (
              options.map((opt, index) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={`${String(opt.value)}-${index}`}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    className={`p-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all ${
                      opt.disabled ? "opacity-40 cursor-not-allowed" : ""
                    } ${
                      isSelected
                        ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20"
                        : "hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-800 dark:text-zinc-200 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 truncate">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <div className="min-w-0 truncate">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{opt.label}</span>
                          {opt.badge && !isSelected && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 shrink-0">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.sublabel && (
                          <p
                            className={`text-[10px] truncate mt-0.5 ${
                              isSelected ? "text-indigo-100" : "text-slate-400 dark:text-zinc-400"
                            }`}
                          >
                            {opt.sublabel}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && <IoCheckmark className="text-white text-base shrink-0 ml-2" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

