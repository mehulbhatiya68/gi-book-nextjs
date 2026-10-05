"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@mobiscroll/react-lite";
import { IoCalendarOutline, IoChevronBack, IoChevronForward, IoClose } from "react-icons/io5";

interface MobiscrollDatePickerProps {
  value: string; // Format: YYYY-MM-DD
  onChange: (dateStr: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  min?: string;
  max?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MobiscrollDatePicker({
  value,
  onChange,
  label,
  placeholder = "Select Date",
  className = "",
  disabled = false,
  readOnly = false,
}: MobiscrollDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [portalPos, setPortalPos] = useState<{ top: number; left: number } | null>(null);

  // Parse current selected date or fallback to today
  const selectedDate = useMemo(() => {
    if (!value) return new Date();
    const parts = value.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    }
    return new Date();
  }, [value]);

  // Calendar Navigation View State
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  // Dynamic position calculation for fixed portal
  const updatePosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const calendarHeight = 330;
      const calendarWidth = Math.min(280, viewportWidth - 24);

      let top = rect.bottom + 6;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < calendarHeight && spaceAbove > spaceBelow) {
        top = Math.max(10, rect.top - calendarHeight - 6);
      }

      let left = rect.left;
      if (left + calendarWidth > viewportWidth - 12) {
        left = Math.max(12, viewportWidth - calendarWidth - 12);
      }

      setPortalPos({ top, left });
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Handle scroll/resize updates to reposition popover
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  // Open handler
  const handleOpen = () => {
    if (disabled || readOnly) return;
    setViewYear(selectedDate.getFullYear());
    setViewMonth(selectedDate.getMonth());
    updatePosition();
    setIsOpen((prev) => !prev);
  };

  // Month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Select Date
  const handleSelectDay = (day: number) => {
    const monthStr = String(viewMonth + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const formatted = `${viewYear}-${monthStr}-${dayStr}`;
    onChange(formatted);
    setIsOpen(false);
  };

  // Today Quick Button
  const handleSetToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const formatted = `${y}-${m}-${d}`;
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onChange(formatted);
    setIsOpen(false);
  };

  // Days in month matrix
  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewYear, viewMonth]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).getDay();
  }, [viewYear, viewMonth]);

  // Formatted display text
  const displayFormattedDate = useMemo(() => {
    if (!value) return placeholder;
    const parts = value.split("-");
    if (parts.length === 3) {
      const y = parts[0];
      const mIdx = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (mIdx >= 0 && mIdx < 12) {
        return `${d} ${MONTH_NAMES[mIdx].slice(0, 3)} ${y}`;
      }
    }
    return value;
  }, [value, placeholder]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-semibold gi-text-primary mb-1">
          {label}
        </label>
      )}

      {/* Trigger Input */}
      <div
        ref={inputRef}
        onClick={handleOpen}
        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm gi-input cursor-pointer transition select-none touch-manipulation ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-indigo-500 active:scale-[0.99]"
        }`}
      >
        <span className={value ? "gi-text-primary font-medium" : "gi-text-muted"}>
          {displayFormattedDate}
        </span>
        <IoCalendarOutline className="text-base text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />
      </div>

      {/* Calendar Dropdown via Portal attached directly to document.body (Not part of parent div) */}
      {isOpen && portalPos && typeof window !== "undefined" && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: "fixed",
            top: `${portalPos.top}px`,
            left: `${portalPos.left}px`,
            zIndex: 999999,
          }}
          className="p-3 sm:p-3.5 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border gi-divider space-y-3 w-[calc(100vw-1.5rem)] max-w-[280px] sm:w-72 select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b gi-divider pb-2">
            <div>
              <h2 className="text-xs font-bold gi-text-primary">
                {displayFormattedDate}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg gi-hover gi-text-muted cursor-pointer active:scale-95 touch-manipulation"
            >
              <IoClose className="text-base" />
            </button>
          </div>

          {/* Month & Year Navigation */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border gi-divider gi-hover gi-text-primary cursor-pointer active:scale-95 touch-manipulation"
            >
              <IoChevronBack className="text-xs" />
            </button>
            <span className="font-bold text-xs gi-text-primary">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border gi-divider gi-hover gi-text-primary cursor-pointer active:scale-95 touch-manipulation"
            >
              <IoChevronForward className="text-xs" />
            </button>
          </div>

          {/* Day Names Grid */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold gi-text-muted">
            {DAY_NAMES.map((d) => (
              <div key={d} className="py-0.5">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 text-center gap-1">
            {/* Blank leading slots */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const isSelected =
                selectedDate.getFullYear() === viewYear &&
                selectedDate.getMonth() === viewMonth &&
                selectedDate.getDate() === day;
              const isToday =
                new Date().getFullYear() === viewYear &&
                new Date().getMonth() === viewMonth &&
                new Date().getDate() === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-7 w-7 sm:h-7 sm:w-7 mx-auto rounded-full text-xs font-semibold flex items-center justify-center transition cursor-pointer touch-manipulation active:scale-95 ${
                    isSelected
                      ? "bg-indigo-600 text-white font-bold shadow-md scale-105"
                      : isToday
                      ? "border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
                      : "gi-hover gi-text-primary"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between border-t gi-divider pt-2">
            <Button
              variant="outline"
              onClick={handleSetToday}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer active:scale-95"
            >
              Today
            </Button>
            <Button
              variant="flat"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold gi-text-secondary cursor-pointer active:scale-95"
            >
              Cancel
            </Button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
