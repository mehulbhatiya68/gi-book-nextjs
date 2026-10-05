"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  IoDocumentTextOutline,
  IoArrowDownOutline,
  IoArrowUpOutline,
} from "react-icons/io5";
import { useAuth } from "@/context/AuthContext";
import { invoiceApi } from "@/lib/api/invoice";
import { paymentApi } from "@/lib/api/payment";
import { TransactionDisplayUtils } from "@/lib/utils/transactionDisplayUtils";

function formatDateDDMMYYYY(dateStr: any) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export default function PartyTransactions({ party, activeTab = "invoices" }: { party: any; activeTab?: "invoices" | "payments" }) {
  const { activeBusiness } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const pId = party?.id || party?.ledger_id;
    if (activeBusiness?.id && pId) {
      setIsLoading(true);
      Promise.all([
        invoiceApi.getInvoices({ ledger_id: pId, per_page: "all", silentError: true }).catch(() => ({ body: [] })),
        paymentApi.getPayments({ party_ledger_id: pId, silentError: true }).catch(() => ({ body: [] })),
        paymentApi.getPayments({ silentError: true }).catch(() => ({ body: [] })),
      ])
        .then(([invRes, payRes, allPayRes]: any[]) => {
          const invList = invRes?.body?.invoices || invRes?.body?.data || (Array.isArray(invRes?.body) ? invRes.body : []);
          setInvoices(Array.isArray(invList) ? invList : []);

          const payList1 = payRes?.body?.payments || payRes?.body?.data || (Array.isArray(payRes?.body) ? payRes.body : []);
          const payList2 = allPayRes?.body?.payments || allPayRes?.body?.data || (Array.isArray(allPayRes?.body) ? allPayRes.body : []);
          const combinedPay = [...(Array.isArray(payList1) ? payList1 : []), ...(Array.isArray(payList2) ? payList2 : [])];
          setPayments(combinedPay);
        })
        .finally(() => setIsLoading(false));
    } else {
      setInvoices([]);
      setPayments([]);
      setIsLoading(false);
    }
  }, [activeBusiness?.id, party?.id, party?.ledger_id]);

  const partyInvoices = useMemo(() => {
    if (!party) return [];
    const partyIdStr = String(party.id || party.ledger_id || "").toLowerCase().trim();
    const partyLedgerIdStr = String(party.ledger_id || party.id || "").toLowerCase().trim();
    const partyNameLower = (party.name || party.partyName || "").toLowerCase().trim();

    return invoices
      .filter((inv) => {
        const invLedgerId = String(inv.ledger_id || inv.ledger?.id || inv.party?.id || inv.party_id || inv.partyId || inv.supplier?.id || inv.supplier_id || "").toLowerCase().trim();
        const invPartyName = (inv.partyName || inv.ledger?.name || inv.party?.name || inv.party?.partyName || inv.supplier?.partyName || "").toLowerCase().trim();
        if (invLedgerId && (invLedgerId === partyIdStr || invLedgerId === partyLedgerIdStr)) return true;
        if (partyNameLower && invPartyName && invPartyName === partyNameLower) return true;
        return false;
      })
      .map((inv) => ({
        id: inv.id,
        number: inv.invoice_number || inv.invoiceNumberStr || inv.invoiceNumber || `INV-${inv.id}`,
        date: inv.invoice_date || inv.invoiceDate || inv.date || inv.created_at,
        amount: Number(inv.amount ?? inv.total_amount ?? inv.totalAmount ?? inv.total ?? 0),
        status: String(inv.status || "unpaid").toLowerCase(),
      }))
      .sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [party, invoices]);

  const partyPayments = useMemo(() => {
    if (!party) return [];
    const partyIdStr = String(party.id || party.ledger_id || "").toLowerCase().trim();
    const partyLedgerIdStr = String(party.ledger_id || party.id || "").toLowerCase().trim();
    const partyNameLower = (party.name || party.partyName || "").toLowerCase().trim();

    const seen = new Set<string>();
    const list: any[] = [];

    payments.forEach((pay) => {
      const pId = String(pay.id || Math.random());
      if (seen.has(pId)) return;

      const payPartyId = String(pay.party_ledger_id || pay.party_id || pay.partyId || pay.ledger_id || pay.party_ledger?.id || pay.party?.id || "").toLowerCase().trim();
      const payPartyName = (pay.party_ledger?.name || pay.party_name || pay.partyName || pay.party?.name || "").toLowerCase().trim();

      const matchesParty =
        (payPartyId && (payPartyId === partyIdStr || payPartyId === partyLedgerIdStr)) ||
        (partyNameLower && payPartyName && payPartyName === partyNameLower) ||
        (!payPartyId && payments.length <= 50);

      if (matchesParty) {
        seen.add(pId);
        list.push({
          id: pay.id,
          number: pay.transaction_number || pay.number || pay.receipt_number || pay.reference_number || (pay.id ? `TXN-${String(pay.id).slice(0, 8).toUpperCase()}` : "—"),
          date: pay.transaction_date || pay.date || pay.created_at,
          amount: Number(pay.amount || pay.total || 0),
          type: pay.type || "payment_in",
        });
      }
    });

    return list.sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [party, payments]);

  const isPaymentsTab = activeTab === "payments";
  const displayItems = isPaymentsTab ? partyPayments : partyInvoices;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-3 md:mt-5"
    >
      <div className="mt-2 md:mt-4">
        {isLoading ? (
          <div className="py-12 text-center text-xs gi-text-muted">Loading transactions...</div>
        ) : displayItems.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl shadow-2xs">
              <IoDocumentTextOutline />
            </div>
            <p className="font-bold text-sm text-slate-700 dark:text-slate-200">
              No data found
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {isPaymentsTab
              ? partyPayments.map((pay) => {
                const isCredit = TransactionDisplayUtils.isPaymentIn(pay, party?.type || party?.partyType || party?.group);
                const numStr = String(pay.number || "").trim();
                const formattedNum = numStr ? (/^[a-zA-Z#]/.test(numStr) ? numStr : `#${numStr}`) : "";

                return (
                  <div
                    key={pay.id}
                    onClick={() => router.push(`/paymentDetails/${pay.id}?from=${encodeURIComponent(pathname)}`)}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs flex items-center justify-between gap-3 cursor-pointer hover:border-slate-400/50 active:scale-[0.99] transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isCredit
                          ? "bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-100/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                        }`}>
                        {isCredit ? (
                          <IoArrowDownOutline className="text-lg rotate-[45deg]" />
                        ) : (
                          <IoArrowUpOutline className="text-lg rotate-[45deg]" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                          {isCredit ? "Received Payment" : "Payment Out"} {formattedNum}
                        </h3>
                        <p className="text-[11px] gi-text-muted mt-0.5">
                          {formatDateDDMMYYYY(pay.date)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`font-mono font-bold text-xs ${isCredit
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                        }`}>
                        {isCredit ? "+" : "-"} ₹{Number(pay.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })
              : partyInvoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => router.push(`/invoiceDetails/${inv.id}`)}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs flex items-center justify-between gap-3 cursor-pointer hover:border-slate-400/50 active:scale-[0.99] transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                      <IoDocumentTextOutline className="text-lg" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                        Invoice #{inv.number}
                      </h3>
                      <p className="text-[11px] gi-text-muted mt-0.5">
                        {formatDateDDMMYYYY(inv.date)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${inv.status === "paid"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                      }`}>
                      {inv.status === "paid" ? "Paid" : "Unpaid"}
                    </span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-100 text-xs mt-1">
                      ₹{Number(inv.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}

