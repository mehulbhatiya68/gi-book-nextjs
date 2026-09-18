"use client";

import { useEffect, useState, startTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
    IoArrowBack,
    IoCreateOutline,
    IoTrashOutline,
    IoPeopleOutline,
    IoCallOutline,
    IoDocumentTextOutline,
    IoWalletOutline,
    IoLocationOutline,
    IoClose,
    IoWarningOutline,
    IoPrintOutline,
} from "react-icons/io5";
import PartyTransactions from "./PartyTransactions";
import { useApp } from "@/context/AppContext";
import PermissionGuard from "./PermissionGuard";

export default function PartyDetails() {
    const router = useRouter();
    const params = useParams();
    const { parties, setParties, activeBusiness, hasPermission } = useApp();

    const [party, setParty] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        const foundParty = parties.find((item) => String(item.id) === String(params.id));
        startTransition(() => {
            if (foundParty) {
                setParty(foundParty);
            } else {
                router.push("/parties");
            }
        });
    }, [params.id, parties, router]);

    const handleDelete = () => {
        setParties((prev) => prev.filter((item) => String(item.id) !== String(params.id)));
        router.push("/parties");
    };

    const handlePrintStatement = () => {
        if (!party) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            alert("Pop-up blocker prevented printing. Please allow pop-ups for this site.");
            return;
        }

        const bizName = activeBusiness?.name || "GI BOOK";
        const bizAddress =
            typeof activeBusiness?.address === "object" && activeBusiness?.address !== null
                ? [activeBusiness.address.address, activeBusiness.address.city, activeBusiness.address.state, activeBusiness.address.pinCode].filter(Boolean).join(", ")
                : (activeBusiness?.address || "");
        const bizPhone = activeBusiness?.phone || "";

        const partyName = party.partyName || "Party";
        const partyPhone = party.phone || "N/A";
        const partyGSTIN = party.gstNumber || party.gstin || "N/A";
        const closingBal = Number(party.closingBalance || 0);

        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Party Statement - ${partyName} - ${bizName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #0f172a; background: #ffffff; line-height: 1.5; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
            .biz-title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
            .biz-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
            .report-badge { background: #4f46e5; color: #ffffff; padding: 6px 14px; border-radius: 8px; font-weight: 700; font-size: 14px; text-transform: uppercase; }
            .party-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .footer { margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="biz-title">${bizName}</h1>
              <p class="biz-sub">${bizAddress} ${bizPhone ? "• Ph: " + bizPhone : ""}</p>
            </div>
            <div class="report-badge">PARTY STATEMENT</div>
          </div>

          <div class="party-card">
            <div>
              <h2 style="margin: 0; font-size: 16px;">${partyName}</h2>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569;">Phone: ${partyPhone} | GSTIN: ${partyGSTIN}</p>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700;">Closing Balance</span>
              <div style="font-size: 18px; font-weight: 800; color: ${closingBal >= 0 ? "#059669" : "#e11d48"};">₹${Math.abs(closingBal).toLocaleString("en-IN", { minimumFractionDigits: 2 })} ${closingBal >= 0 ? "(Receivable)" : "(Payable)"}</div>
            </div>
          </div>

          <div class="footer">
            <span>Generated via GI BOOK ERP Statement System</span>
            <span>Authorized Signature _____________________</span>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
    };

    if (!party) {
        return (
            <div className="min-h-screen p-4 sm:p-6 gi-page flex items-center justify-center">
                <div className="rounded-lg gi-card px-6 py-5 shadow-sm">
                    <p className="text-sm gi-text-secondary">Loading party...</p>
                </div>
            </div>
        );
    }

    const balance = Number(party.closingBalance || 0);

    return (
        <PermissionGuard module="Ledger">
            <div className="space-y-6 pb-12 gi-page">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 border-b pb-4 gi-divider">
                    <div className="flex items-center gap-3 min-w-0">
                        <button type="button" onClick={() => router.push("/parties")} className="p-2 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer shrink-0" title="Go Back to Parties">
                            <IoArrowBack className="text-lg" />
                        </button>

                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight truncate">
                                {party.partyName}
                            </h1>
                            <p className="text-xs sm:text-sm gi-text-secondary mt-0.5">
                                Party Ledger Profile &amp; Transaction History
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={handlePrintStatement} className="h-9 px-3 flex items-center justify-center gap-1.5 rounded-md border border-[var(--gi-divider)] gi-surface-interactive gi-text-secondary transition cursor-pointer font-medium text-xs shadow-xs" title="Print Party Statement">
                            <IoPrintOutline className="text-base" />
                            <span className="hidden sm:inline">Print Statement</span>
                        </button>

                        {hasPermission("Ledger", "Update") && (
                            <button type="button" onClick={() => router.push(`/addParty?id=${party.id}`)} className="h-9 px-3.5 flex items-center justify-center gap-1.5 rounded-md gi-btn-primary transition cursor-pointer font-medium text-xs shadow-xs" title="Edit Party">
                                <IoCreateOutline className="text-base" />
                                <span>Edit Party</span>
                            </button>
                        )}

                        {hasPermission("Ledger", "Delete") && (
                            <button type="button" onClick={() => setShowDeleteModal(true)} className="h-9 px-3.5 flex items-center justify-center gap-1.5 rounded-md gi-btn-danger transition cursor-pointer font-medium text-xs shadow-xs" title="Delete Party">
                                <IoTrashOutline className="text-base" />
                                <span>Delete</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Profile Overview Card */}
                <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="rounded-lg gi-card p-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5 pb-6 border-b" style={{ borderColor: "var(--gi-border)" }}>
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="h-14 w-14 rounded-lg gi-badge-info border text-lg font-bold flex items-center justify-center shrink-0" style={{ borderColor: "var(--gi-info-border)" }}>
                                {party.partyName?.charAt(0) || "P"}
                            </div>

                            <div className="min-w-0">
                                <h2 className="text-lg font-bold gi-text-primary truncate">
                                    {party.partyName}
                                </h2>

                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded gi-surface-secondary gi-text-secondary" style={{ border: "1px solid var(--gi-border)" }}>
                                        {party.partyType}
                                    </span>

                                    {party.phone && (
                                        <span className="text-xs gi-text-muted flex items-center gap-1">
                                            <IoCallOutline />
                                            {party.phone}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="sm:text-right">
                            <p className="text-xs gi-text-muted uppercase tracking-wider font-semibold">
                                Closing Ledger Balance
                            </p>

                            <p className="text-2xl font-bold mt-1 gi-text-primary">
                                ₹{Math.abs(balance).toLocaleString("en-IN")}
                            </p>

                            <span className={`inline-block mt-1 text-[10px] px-2.5 py-0.5 rounded font-bold uppercase tracking-wider ${balance > 0
                                    ? "gi-badge-success"
                                    : balance < 0
                                        ? "gi-badge-danger"
                                        : "gi-badge-info"
                                }`}>
                                {balance > 0 ? "To Receive (Receivable)" : balance < 0 ? "To Pay (Payable)" : "Settled (Zero Balance)"}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                        <div className="rounded-md gi-surface-secondary p-4" style={{ border: "1px solid var(--gi-border)" }}>
                            <div className="flex items-center gap-2 mb-1.5">
                                <IoDocumentTextOutline className="text-base gi-text-muted" />
                                <p className="text-xs font-semibold gi-text-muted uppercase tracking-wider">
                                    GSTIN Registration Number
                                </p>
                            </div>

                            <p className="font-mono text-sm font-semibold gi-text-primary">
                                {party.gstNumber || "Not registered"}
                            </p>
                        </div>

                        <div className="rounded-md gi-surface-secondary p-4" style={{ border: "1px solid var(--gi-border)" }}>
                            <div className="flex items-center gap-2 mb-1.5">
                                <IoWalletOutline className="text-base gi-text-muted" />
                                <p className="text-xs font-semibold gi-text-muted uppercase tracking-wider">
                                    Opening Balance
                                </p>
                            </div>

                            <p className="text-sm font-semibold gi-text-primary">
                                ₹{Number(party.openingBalance || 0).toLocaleString("en-IN")}
                                <span className="text-xs font-normal gi-text-muted ml-2">
                                    ({party.balanceType})
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <AddressCard title="Billing Address" address={party.billingAddress} />
                        <AddressCard title="Shipping Address" address={party.shippingAddress} />
                    </div>

                    {(party.createdBy || party.updatedBy) && (
                        <div className="flex flex-wrap items-center justify-between gap-2 mt-5 pt-4 border-t gi-text-muted text-xs" style={{ borderColor: "var(--gi-border)" }}>
                            {party.createdBy && (
                                <span>
                                    Created by: <strong className="gi-text-primary">{party.createdBy}</strong>
                                    {party.createdAt && ` on ${new Date(party.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                                </span>
                            )}
                            {party.updatedBy && (
                                <span>
                                    Last updated by: <strong className="gi-text-primary">{party.updatedBy}</strong>
                                    {party.updatedAt && ` on ${new Date(party.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                                </span>
                            )}
                        </div>
                    )}
                </motion.section>

                <PartyTransactions party={party} />

                {/* Delete Modal */}
                <AnimatePresence>
                    {showDeleteModal && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center gi-modal-overlay backdrop-blur-sm p-4">
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2 }} className="w-full max-w-md rounded-lg gi-modal-content p-6 shadow-2xl">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-md gi-badge-danger flex items-center justify-center shrink-0">
                                            <IoWarningOutline className="text-xl" />
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-base gi-text-primary">
                                                Delete Party?
                                            </h3>
                                            <p className="text-xs gi-text-muted mt-0.5">
                                                This action is permanent and cannot be undone.
                                            </p>
                                        </div>
                                    </div>

                                    <button type="button" onClick={() => setShowDeleteModal(false)} className="h-8 w-8 flex items-center justify-center rounded-md gi-text-muted hover:gi-text-primary transition cursor-pointer">
                                        <IoClose className="text-lg" />
                                    </button>
                                </div>

                                <div className="mt-4 rounded-md gi-surface-secondary p-3" style={{ border: "1px solid var(--gi-border)" }}>
                                    <p className="text-xs gi-text-muted">
                                        Target Party:
                                    </p>
                                    <p className="font-bold text-sm gi-text-primary mt-0.5">
                                        {party.partyName}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 mt-5">
                                    <button type="button" onClick={() => setShowDeleteModal(false)} className="flex-1 h-9 rounded-md gi-btn-secondary text-xs font-semibold transition cursor-pointer">
                                        Cancel
                                    </button>

                                    <button type="button" onClick={handleDelete} className="flex-1 h-9 rounded-md gi-btn-danger transition font-semibold text-xs cursor-pointer shadow-xs">
                                        Delete Party
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PermissionGuard>
    );
}

function AddressCard({ title, address }) {
    if (typeof address === "string" && address.trim()) {
        return (
            <div className="rounded-md gi-surface-secondary p-4" style={{ border: "1px solid var(--gi-border)" }}>
                <div className="flex items-center gap-2 mb-1.5">
                    <IoLocationOutline className="text-base gi-text-muted" />
                    <p className="text-xs font-semibold gi-text-muted uppercase tracking-wider">
                        {title}
                    </p>
                </div>
                <div className="text-xs gi-text-primary leading-5">
                    <p>{address}</p>
                </div>
            </div>
        );
    }

    const hasAddress = address && typeof address === "object" && (address.address || address.city || address.state || address.pinCode);

    return (
        <div className="rounded-md gi-surface-secondary p-4" style={{ border: "1px solid var(--gi-border)" }}>
            <div className="flex items-center gap-2 mb-1.5">
                <IoLocationOutline className="text-base gi-text-muted" />
                <p className="text-xs font-semibold gi-text-muted uppercase tracking-wider">
                    {title}
                </p>
            </div>

            {hasAddress ? (
                <div className="text-xs gi-text-primary leading-5">
                    {address.address && <p>{address.address}</p>}
                    <p>
                        {[address.city, address.state, address.pinCode].filter(Boolean).join(", ")}
                    </p>
                </div>
            ) : (
                <p className="text-xs gi-text-muted">
                    Not provided
                </p>
            )}
        </div>
    );
}