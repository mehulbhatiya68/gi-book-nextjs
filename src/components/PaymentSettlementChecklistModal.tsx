"use client";

import { useEffect, useState } from "react";
import {
  IoCheckmarkCircle,
  IoCheckmarkDoneCircle,
  IoReceiptOutline,
  IoWalletOutline,
  IoSparklesOutline,
  IoClose,
} from "react-icons/io5";

export interface SettledInvoiceInfo {
  invoiceNumber: string;
  amountApplied: number;
  isFullySettled: boolean;
  partyName?: string;
}

interface PaymentSettlementChecklistModalProps {
  isOpen: boolean;
  amount: number;
  partyName?: string;
  paymentType?: "credit" | "debit" | "payment_in" | "payment_out";
  settledInvoices: SettledInvoiceInfo[];
  onComplete: () => void;
  onClose?: () => void;
}

export default function PaymentSettlementChecklistModal({
  isOpen,
  amount,
  partyName,
  paymentType = "credit",
  settledInvoices = [],
  onComplete,
  onClose,
}: PaymentSettlementChecklistModalProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Total steps = 2 base steps + settledInvoices.length + 1 final balance step
  const totalSteps = 2 + settledInvoices.length + 1;

  useEffect(() => {
    if (!isOpen) {
      setCompletedSteps([]);
      setIsFinished(false);
      setShowConfetti(false);
      return;
    }

    setCompletedSteps([]);
    setIsFinished(false);
    setShowConfetti(false);

    const stepDelay = 350; // Delay per step in ms

    const timers: NodeJS.Timeout[] = [];

    // Step 0: Immediate check (Payment Created)
    timers.push(
      setTimeout(() => {
        setCompletedSteps((prev) => [...prev, 0]);
      }, 150)
    );

    // Step 1: Fund Allocation
    timers.push(
      setTimeout(() => {
        setCompletedSteps((prev) => [...prev, 1]);
      }, 150 + stepDelay)
    );

    // Invoices steps
    settledInvoices.forEach((_, idx) => {
      const stepIndex = 2 + idx;
      timers.push(
        setTimeout(() => {
          setCompletedSteps((prev) => [...prev, stepIndex]);
        }, 150 + stepDelay * stepIndex)
      );
    });

    // Final balance step
    const finalStepIdx = 2 + settledInvoices.length;
    timers.push(
      setTimeout(() => {
        setCompletedSteps((prev) => [...prev, finalStepIdx]);
        setIsFinished(true);
        setShowConfetti(true);
      }, 150 + stepDelay * finalStepIdx)
    );

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [isOpen, settledInvoices.length]);

  if (!isOpen) return null;

  const isPaymentIn = paymentType === "credit" || paymentType === "payment_in";

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
      {/* Confetti spark effect overlays */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 flex items-center justify-center">
          <div className="absolute w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl animate-pulse" />
          <div className="absolute w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl animate-pulse delay-300" />
        </div>
      )}

      <div className="relative w-full max-w-md bg-[var(--gi-surface)] rounded-3xl shadow-2xl border gi-divider overflow-hidden z-20 transition-all transform animate-scaleUp">
        {/* Top Header Glow */}
        <div className="relative p-6 text-center border-b gi-divider bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent">
          {onClose && isFinished && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-white/10 transition cursor-pointer"
            >
              <IoClose className="text-xl" />
            </button>
          )}

          {/* Animated Success Badge */}
          <div className="relative mx-auto w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.3)] mb-3">
            <IoCheckmarkCircle className={`text-4xl transition-all duration-500 ${isFinished ? "scale-110 text-emerald-400" : "scale-100"}`} />
            {isFinished && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
              </span>
            )}
          </div>

          <h2 className="text-lg font-extrabold gi-text-primary tracking-tight">
            {isPaymentIn ? "Payment Received!" : "Payment Out Processed!"}
          </h2>
          <p className="text-xs gi-text-muted mt-0.5">
            {partyName ? `Party: ${partyName} • ` : ""}
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-sm">
              ₹{Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </strong>
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full transition-all duration-300 ease-out"
              style={{
                width: `${Math.min(100, Math.round((completedSteps.length / totalSteps) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Animated Checklist Section */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="text-[11px] font-bold uppercase tracking-wider gi-text-muted flex items-center gap-1.5">
            <IoSparklesOutline className="text-emerald-500" />
            <span>Auto-Settlement Checklist</span>
          </p>

          <div className="space-y-2.5">
            {/* Step 0: Payment Entry */}
            <div
              className={`p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 ${
                completedSteps.includes(0)
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-slate-50/50 dark:bg-zinc-900/50 border-transparent text-slate-400 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="shrink-0">
                  {completedSteps.includes(0) ? (
                    <IoCheckmarkCircle className="text-lg text-emerald-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-zinc-700 animate-spin border-t-transparent" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold gi-text-primary">
                    Transaction Entry Created
                  </p>
                  <p className="text-[10px] gi-text-muted">
                    Recorded payment amount of ₹{Number(amount).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              <IoWalletOutline className="text-base shrink-0 text-emerald-500" />
            </div>

            {/* Step 1: Fund Allocation Engine */}
            <div
              className={`p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 ${
                completedSteps.includes(1)
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-slate-50/50 dark:bg-zinc-900/50 border-transparent text-slate-400 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="shrink-0">
                  {completedSteps.includes(1) ? (
                    <IoCheckmarkCircle className="text-lg text-emerald-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-zinc-700 animate-spin border-t-transparent" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold gi-text-primary">
                    Allocating Payment Funds
                  </p>
                  <p className="text-[10px] gi-text-muted">
                    {settledInvoices.length > 0
                      ? `Matching ${settledInvoices.length} due invoice(s)`
                      : "Unallocated amount added to party balance"}
                  </p>
                </div>
              </div>
              <IoSparklesOutline className="text-base shrink-0 text-indigo-500" />
            </div>

            {/* Settled Invoices List */}
            {settledInvoices.map((inv, idx) => {
              const stepIdx = 2 + idx;
              const isDone = completedSteps.includes(stepIdx);

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 ${
                    isDone
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-50/50 dark:bg-zinc-900/50 border-transparent text-slate-400 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="shrink-0">
                      {isDone ? (
                        <IoCheckmarkCircle className="text-lg text-emerald-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-zinc-700 animate-spin border-t-transparent" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold gi-text-primary flex items-center gap-1.5">
                        <span>Invoice {inv.invoiceNumber}</span>
                        {isDone && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              inv.isFullySettled
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                                : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40"
                            }`}
                          >
                            {inv.isFullySettled ? "Fully Settled" : "Partially Settled"}
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] gi-text-muted">
                        Applied ₹{Number(inv.amountApplied || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <IoReceiptOutline className="text-base shrink-0 text-indigo-500" />
                </div>
              );
            })}

            {/* Final Step: Account Balance Update */}
            {(() => {
              const finalStepIdx = 2 + settledInvoices.length;
              const isDone = completedSteps.includes(finalStepIdx);

              return (
                <div
                  className={`p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 ${
                    isDone
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-50/50 dark:bg-zinc-900/50 border-transparent text-slate-400 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="shrink-0">
                      {isDone ? (
                        <IoCheckmarkDoneCircle className="text-lg text-emerald-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-zinc-700 animate-spin border-t-transparent" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold gi-text-primary">
                        Ledger & Balances Updated
                      </p>
                      <p className="text-[10px] gi-text-muted">
                        All cash/bank balances synchronized cleanly
                      </p>
                    </div>
                  </div>
                  <IoCheckmarkDoneCircle className="text-base shrink-0 text-emerald-500" />
                </div>
              );
            })()}
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 border-t gi-divider bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onComplete}
            disabled={!isFinished}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer ${
              isFinished
                ? "gi-btn-primary hover:opacity-95 active:scale-95"
                : "bg-slate-300 dark:bg-zinc-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            <span>{isFinished ? "Continue to Details" : "Processing Settlement..."}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
