"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  IoDocumentTextOutline,
  IoWalletOutline,
  IoReceiptOutline,
  IoArrowDownOutline,
  IoArrowUpOutline,
  IoChevronForward,
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";
import InvoiceDetailsModal from "./InvoiceDetailsModal";

export default function PartyTransactions({ party }) {
  const router = useRouter();
  const { invoices, payments } = useApp();
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const transactions = useMemo(() => {
    if (!party) return [];

    const partyIdStr = String(party.id);
    const partyNameLower = (party.partyName || "").toLowerCase();

    const partyInvoices = invoices
      .filter((inv) => {
        const invPartyId = String(inv.party?.id || inv.supplier?.id || inv.partyId || "");
        const invPartyName = (inv.partyName || inv.party?.partyName || inv.supplier?.partyName || "").toLowerCase();
        return (invPartyId && invPartyId === partyIdStr) || (partyNameLower && invPartyName === partyNameLower);
      })
      .map((inv) => ({
        id: inv.id,
        type: "invoice",
        raw: inv,
        title:
          typeof inv.invoiceNumber === "object"
            ? `${inv.invoiceNumber.prefix || ""} ${inv.invoiceNumber.number || ""}`
            : inv.invoiceNumberStr || inv.invoiceNumber || "Invoice",
        date: inv.invoiceDate || inv.date || inv.createdAt,
        amount: Number(inv.totalAmount || inv.total || 0),
        status: inv.status || "unpaid",
        createdBy: inv.createdBy,
        createdByRole: inv.createdByRole,
      }));

    const partyPayments = payments
      .filter((pay) => {
        const payPartyId = String(pay.party?.id || pay.partyId || "");
        const payPartyName = (pay.partyName || pay.party?.partyName || "").toLowerCase();
        return (payPartyId && payPartyId === partyIdStr) || (partyNameLower && payPartyName === partyNameLower);
      })
      .map((pay) => ({
        id: pay.id,
        type: "payment",
        raw: pay,
        title: pay.number ? `Receipt #${pay.number}` : "Payment",
        date: pay.date || pay.createdAt,
        amount: Number(pay.amount || 0),
        status: pay.type === "credit" ? "Payment In" : "Payment Out",
        createdBy: pay.createdBy,
        createdByRole: pay.createdByRole,
      }));

    return [...partyInvoices, ...partyPayments].sort(
      (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
    );
  }, [party, invoices, payments]);

  const filteredTransactions = useMemo(() => {
    if (activeFilter === "invoices") {
      return transactions.filter((t) => t.type === "invoice");
    }
    if (activeFilter === "payments") {
      return transactions.filter((t) => t.type === "payment");
    }
    return transactions;
  }, [transactions, activeFilter]);

  const filters = [
    { id: "all", label: "All Transactions" },
    { id: "invoices", label: "Invoices Only" },
    { id: "payments", label: "Payments Only" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-5 rounded-lg gi-card p-5 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b gi-divider">
        <div>
          <h2 className="text-base font-bold tracking-tight gi-text-primary">
            Party Ledger Transactions
          </h2>
          <p className="text-xs gi-text-secondary mt-0.5">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? "record" : "records"} found
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-md gi-surface-secondary border gi-border w-fit text-xs">
          {filters.map((filter) => {
            const isSelected = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`px-3 py-1 rounded text-xs transition cursor-pointer ${
                  isSelected
                    ? "gi-filter-active"
                    : "gi-filter-inactive"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        {filteredTransactions.length === 0 ? (
          <div className="rounded-md gi-surface-secondary border gi-border py-12 flex flex-col items-center justify-center gi-text-muted px-4 text-center">
            {activeFilter === "invoices" ? (
              <IoDocumentTextOutline className="text-3xl opacity-50 mb-2" />
            ) : activeFilter === "payments" ? (
              <IoWalletOutline className="text-3xl opacity-50 mb-2" />
            ) : (
              <IoReceiptOutline className="text-3xl opacity-50 mb-2" />
            )}
            <p className="font-semibold text-sm gi-text-primary">
              No {activeFilter === "all" ? "" : activeFilter} recorded yet
            </p>
            <p className="text-xs gi-text-secondary mt-1">
              Transactions linked to this party will appear here in the ledger.
            </p>
          </div>
        ) : (
          <div className="divide-y gi-divider border gi-border rounded-lg overflow-hidden gi-card">
            {filteredTransactions.map((tx, index) => {
              const isInvoice = tx.type === "invoice";
              const formattedDate = tx.date
                ? new Date(tx.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "No date";

              return (
                <div
                  key={`${tx.type}-${tx.id}-${index}`}
                  onClick={() => {
                    if (isInvoice) {
                      router.push(`/invoiceDetails/${tx.id}`);
                    } else {
                      router.push(`/paymentDetails/${tx.id}`);
                    }
                  }}
                  className="p-4 hover:bg-[var(--gi-hover)] transition flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-md flex items-center justify-center shrink-0 font-bold text-sm ${
                        isInvoice
                          ? "gi-badge-info"
                          : "gi-badge-success"
                      }`}
                    >
                      {isInvoice ? (
                        <IoDocumentTextOutline className="text-lg" />
                      ) : (
                        <IoWalletOutline className="text-lg" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-sm gi-text-primary truncate">
                        {tx.title}
                      </p>
                      <p className="text-xs gi-text-secondary mt-0.5">
                        {formattedDate} • {tx.status}
                        {tx.createdBy && ` • by ${tx.createdBy}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-sm sm:text-base gi-text-primary">
                        ₹{Math.abs(tx.amount).toLocaleString("en-IN")}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          isInvoice
                            ? "gi-badge-info"
                            : "gi-badge-success"
                        }`}
                      >
                        {isInvoice ? (
                          <>
                            <IoArrowUpOutline /> Invoice
                          </>
                        ) : (
                          <>
                            <IoArrowDownOutline /> Payment
                          </>
                        )}
                      </span>
                    </div>

                    {isInvoice && (
                      <IoChevronForward className="text-base gi-text-muted" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onRecordPayment={(inv) => {
            const isSales = (inv.invoiceType || inv.type) === "sales";
            const targetPartyId = inv.party?.id || inv.supplier?.id || party?.id || "";
            router.push(
              `/payment/receivedPayment?type=${isSales ? "credit" : "debit"}&invoiceId=${inv.id}&partyId=${targetPartyId}`
            );
          }}
        />
      )}
    </motion.section>
  );
}