"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { IoChevronDown, IoCheckmark, IoSearchOutline } from "react-icons/io5";

export interface SelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
  badge?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export type SelectOptionInput = SelectOption | string | number;

export interface CustomSelectProps {
  options: SelectOptionInput[];
  value?: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  size?: "xs" | "sm" | "md" | "lg";
  searchable?: boolean;
  align?: "left" | "right";
}

export default function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select an option...",
  disabled = false,
  className = "",
  buttonClassName = "",
  size = "md",
  searchable,
  align = "left",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize all options to standard SelectOption objects
  const normalizedOptions = useMemo<SelectOption[]>(() => {
    return (options || []).map((opt) => {
      if (typeof opt === "string" || typeof opt === "number") {
        return { value: opt, label: String(opt) };
      }
      return opt;
    });
  }, [options]);

  const selectedOption = useMemo(() => {
    if (value === undefined || value === null) return undefined;
    return normalizedOptions.find((opt) => String(opt.value) === String(value));
  }, [normalizedOptions, value]);

  // Determine whether to show search input
  const showSearch = useMemo(() => {
    if (searchable !== undefined) return searchable;
    return normalizedOptions.length > 8;
  }, [searchable, normalizedOptions.length]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!showSearch || !searchQuery.trim()) return normalizedOptions;
    const query = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(query);
      const matchSublabel = opt.sublabel?.toLowerCase().includes(query);
      const matchBadge = opt.badge?.toLowerCase().includes(query);
      const matchValue = String(opt.value).toLowerCase().includes(query);
      return matchLabel || matchSublabel || matchBadge || matchValue;
    });
  }, [normalizedOptions, showSearch, searchQuery]);

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

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      if (showSearch) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    }
  }, [isOpen, showSearch]);

  const handleSelect = (optionVal: string | number) => {
    onChange(optionVal);
    setIsOpen(false);
  };

  const sizeClasses = {
    xs: "h-8 py-1 px-2.5 text-xs rounded-lg",
    sm: "h-9 py-1.5 px-3 text-xs rounded-xl",
    md: "h-10 py-2 px-3.5 text-xs sm:text-sm rounded-xl",
    lg: "h-11 py-2.5 px-4 text-sm rounded-xl",
  };

  const pyClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Glassmorphism Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full ${pyClass} border transition-all duration-200 flex items-center justify-between gap-2 text-left cursor-pointer outline-none ${
          disabled ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-zinc-800" : ""
        } ${
          isOpen
            ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-white dark:bg-zinc-900 shadow-md"
            : "border-slate-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md hover:border-indigo-400 dark:hover:border-indigo-500 shadow-2xs"
        } ${buttonClassName}`}
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
        <div
          className={`absolute top-full ${
            align === "right" ? "right-0" : "left-0"
          } min-w-full w-max max-w-[calc(100vw-2rem)] sm:max-w-md mt-1.5 z-[100] rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-indigo-200/60 dark:border-indigo-900/60 p-2 shadow-2xl space-y-1 animate-in fade-in slide-in-from-top-2 duration-150`}
        >
          {/* Optional Search Input */}
          {showSearch && (
            <div className="p-1 pb-1.5 border-b border-slate-100 dark:border-zinc-800/80 mb-1">
              <div className="relative flex items-center">
                <IoSearchOutline className="absolute left-2.5 text-slate-400 text-xs pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search options..."
                  className="w-full h-7 pl-7 pr-2 text-xs rounded-lg bg-slate-100 dark:bg-zinc-800 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 outline-none text-slate-800 dark:text-zinc-200 transition"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
                {searchQuery ? "No matching options found" : "No options available"}
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={`${String(opt.value)}-${index}`}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all ${
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
