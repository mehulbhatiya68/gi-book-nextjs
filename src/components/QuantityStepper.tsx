"use client";

import React, { useState, useEffect } from "react";
import { IoRemove, IoAdd } from "react-icons/io5";

interface QuantityStepperProps {
  value: number;
  onChange: (newValue: number) => void;
  onDecrease?: () => void;
  onIncrease?: () => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  allowDirectInput?: boolean;
}

export default function QuantityStepper({
  value,
  onChange,
  onDecrease,
  onIncrease,
  min = 1,
  max,
  disabled = false,
  className = "",
  allowDirectInput = true,
}: QuantityStepperProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(value));

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (onDecrease) {
      onDecrease();
    } else {
      const nextVal = value - 1;
      if (min !== undefined && nextVal < min) return;
      onChange(nextVal);
    }
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (onIncrease) {
      onIncrease();
    } else {
      const nextVal = value + 1;
      if (max !== undefined && nextVal > max) return;
      onChange(nextVal);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    let parsed = parseInt(inputValue, 10);
    if (isNaN(parsed)) {
      setInputValue(String(value));
      return;
    }
    if (min !== undefined && parsed < min) parsed = min;
    if (max !== undefined && parsed > max) parsed = max;
    onChange(parsed);
    setInputValue(String(parsed));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBlur();
    }
  };

  const isDecreaseDisabled = disabled || (min !== undefined && value <= min);
  const isIncreaseDisabled = disabled || (max !== undefined && value >= max);

  return (
    <div
      className={`inline-flex items-center bg-white dark:bg-[#0B0B0D] p-1 rounded-full border border-slate-200/90 dark:border-zinc-800 shadow-2xs transition-colors select-none ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        disabled={isDecreaseDisabled}
        onClick={handleDecrease}
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-medium transition-all cursor-pointer shrink-0 border-0 ${
          isDecreaseDisabled
            ? "bg-slate-100 dark:bg-zinc-800/40 text-slate-300 dark:text-zinc-600 cursor-not-allowed opacity-50"
            : "bg-[#F0EFF5] dark:bg-[#262629] text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-zinc-700 active:scale-95"
        }`}
        title="Decrease quantity"
      >
        <IoRemove className="text-sm sm:text-base" />
      </button>

      {allowDirectInput && isEditing ? (
        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-10 sm:w-12 text-center font-extrabold text-sm sm:text-base text-slate-900 dark:text-white bg-transparent outline-none border-b-2 border-indigo-500 p-0"
        />
      ) : (
        <span
          onClick={(e) => {
            e.stopPropagation();
            if (allowDirectInput && !disabled) setIsEditing(true);
          }}
          className={`px-2.5 sm:px-3 font-extrabold text-sm sm:text-base text-slate-900 dark:text-white min-w-[32px] text-center tracking-tight ${
            allowDirectInput && !disabled ? "cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400" : ""
          }`}
          title={allowDirectInput ? "Click to edit quantity" : undefined}
        >
          {value}
        </span>
      )}

      <button
        type="button"
        disabled={isIncreaseDisabled}
        onClick={handleIncrease}
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-medium transition-all cursor-pointer shrink-0 border-0 ${
          isIncreaseDisabled
            ? "bg-slate-100 dark:bg-zinc-800/40 text-slate-300 dark:text-zinc-600 cursor-not-allowed opacity-50"
            : "bg-[#F0EFF5] dark:bg-[#262629] text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-zinc-700 active:scale-95"
        }`}
        title="Increase quantity"
      >
        <IoAdd className="text-sm sm:text-base" />
      </button>
    </div>
  );
}
