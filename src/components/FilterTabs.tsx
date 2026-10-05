"use client";

import React from "react";
import { motion } from "framer-motion";

export interface FilterOption {
  id: string;
  label: string;
}

interface FilterTabsProps {
  options: FilterOption[];
  activeId: string;
  onChange: (id: string) => void;
  layoutId?: string;
  className?: string;
}

export default function FilterTabs({
  options,
  activeId,
  onChange,
  layoutId = "activeFilterPill",
  className = "",
}: FilterTabsProps) {
  return (
    <div className={`gi-filter-container relative ${className}`}>
      {options.map((opt) => {
        const isActive = activeId === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer select-none whitespace-nowrap outline-none flex items-center justify-center ${
              isActive
                ? "text-white font-bold"
                : "gi-text-secondary hover:gi-text-primary hover:bg-[var(--gi-hover)]"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg bg-[var(--gi-primary,#2563EB)] shadow-xs"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
