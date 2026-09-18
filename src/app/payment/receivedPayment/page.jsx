"use client";

import { Suspense, useEffect, useState, startTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IoArrowBack,
  IoCreateOutline,
  IoChevronForward,
  IoCloudUploadOutline,
  IoClose,
  IoSearch,
  IoWalletOutline,
  IoSaveOutline,
  IoAdd,
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";
import PermissionGuard from "../../../../components/PermissionGuard";

function ReceivedPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { parties = [], invoices = [], payments = [], addPayment } = useApp();

  const urlType = searchParams?.get("type");
  const invoiceIdParam = searchParams?.get("invoiceId");
  const partyIdParam = searchParams?.get("partyId");

  const [paymentType, setPaymentType] = useState(
    urlType === "debit" ? "debit" : "credit"
  );
  const [linkedInvoice, setLinkedInvoice] = useState(null);

  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentNumber, setPaymentNumber] = useState("0001");

  const [tempPaymentDate, setTempPaymentDate] = useState(paymentDate);
  const [tempPaymentNumber, setTempPaymentNumber] = useState(paymentNumber);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);

  const [showPartyPopup, setShowPartyPopup] = useState(false);
  const [partySearch, setPartySearch] = useState("");
  const [selectedParty, setSelectedParty] = useState(null);

  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Auto-fill from Invoice / Party Query Parameters
  useEffect(() => {
    startTransition(() => {
      if (invoiceIdParam && invoices && invoices.length > 0) {
        const foundInv = invoices.find(
          (inv) => String(inv.id) === String(invoiceIdParam)
        );

        if (foundInv) {
          setLinkedInvoice(foundInv);
          const isSales = (foundInv.invoiceType || foundInv.type) === "sales";
          setPaymentType(isSales ? "credit" : "debit");

          const due = Math.max(
            0,
            Number(foundInv.totalAmount || 0) - Number(foundInv.paidAmount || 0)
          );
          setAmount(String(due > 0 ? due : foundInv.totalAmount || ""));

          const targetPartyId =
            foundInv.party?.id || foundInv.supplier?.id || partyIdParam;
          if (targetPartyId) {
            const matchedParty = parties.find(
              (p) => String(p.id) === String(targetPartyId)
            );
            if (matchedParty) setSelectedParty(matchedParty);
          } else if (foundInv.partyName) {
            const matchedParty = parties.find(
              (p) =>
                p.partyName?.toLowerCase() === foundInv.partyName?.toLowerCase()
            );
            if (matchedParty) setSelectedParty(matchedParty);
          }
        }
      } else if (partyIdParam && parties && parties.length > 0) {
        const matchedParty = parties.find(
          (p) => String(p.id) === String(partyIdParam)
        );
        if (matchedParty) setSelectedParty(matchedParty);
      }

      if (urlType === "debit") {
        setPaymentType("debit");
      } else if (urlType === "credit") {
        setPaymentType("credit");
      }
    });
  }, [urlType, invoiceIdParam, partyIdParam, invoices, parties]);

  const paymentModes = [
    "Cash",
    "Bank / Transfer",
    "UPI / GPay / PhonePe",
    "Cheque",
    "Card",
    "Net Banking",
  ];

  const openPaymentDetailsPopup = () => {
    setTempPaymentDate(paymentDate);
    setTempPaymentNumber(paymentNumber);
    setShowPaymentPopup(true);
  };

  const handleSavePaymentDetails = () => {
    setPaymentDate(tempPaymentDate);
    setPaymentNumber(tempPaymentNumber);
    setShowPaymentPopup(false);
  };

  const handleSelectParty = (party) => {
    setSelectedParty(party);
    setPartySearch("");
    setShowPartyPopup(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
  };

  // Auto-generate next unique payment receipt number
  useEffect(() => {
    startTransition(() => {
      if (payments && payments.length > 0) {
        const existingNums = payments
          .map((p) => parseInt(String(p.number || "0").replace(/\D/g, ""), 10))
          .filter((n) => !isNaN(n));
        const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
        setPaymentNumber(String(maxNum + 1).padStart(4, "0"));
      } else {
        setPaymentNumber("0001");
      }
    });
  }, [payments]);

  const handleSavePayment = (isSaveAndNew = false) => {
    if (!selectedParty) {
      setErrorMsg("Please select a party/contact.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setErrorMsg("Please enter a valid payment amount greater than 0.");
      return;
    }

    const isDuplicate = payments.some(
      (p) => String(p.number || p.id).trim().toLowerCase() === String(paymentNumber).trim().toLowerCase()
    );

    if (isDuplicate) {
      setErrorMsg(`Receipt #${paymentNumber} already exists. Receipt numbers must be unique.`);
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

    const payload = {
      type: paymentType, // 'credit' (In) or 'debit' (Out)
      date: paymentDate,
      time: timeStr,
      number: paymentNumber,
      partyName: selectedParty.partyName,
      party: selectedParty,
      amount: Number(amount),
      mode: paymentMode,
      referenceNumber,
      notes,
      linkedInvoiceId: linkedInvoice ? linkedInvoice.id : null,
      attachmentName: attachment ? attachment.name : null,
      attachmentUrl: attachmentPreview || null,
      status: "completed",
    };

    addPayment(payload);

    if (isSaveAndNew) {
      setAmount("");
      setReferenceNumber("");
      setNotes("");
      setLinkedInvoice(null);
      setSelectedParty(null);
      setAttachment(null);
      setAttachmentPreview(null);
      setErrorMsg("");
    } else {
      router.replace("/payments");
    }
  };

  const filteredParties = parties.filter((party) => {
    const query = partySearch.toLowerCase();
    return (
      party.partyName?.toLowerCase().includes(query) ||
      party.phone?.includes(query) ||
      party.partyType?.toLowerCase().includes(query)
    );
  });

  return (
    <PermissionGuard module="Payment" action="Create">
      <div className="space-y-6 pb-20 gi-page select-none w-full">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b pb-4 gi-divider">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => router.replace("/payments")}
              className="p-2 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer shrink-0"
              title="Back to Payments"
            >
              <IoArrowBack className="text-lg" />
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
                {paymentType === "credit" ? "Payment Received" : "Payment Made"}
              </h1>
              <p className="text-xs sm:text-sm gi-text-secondary mt-0.5">
                Record an incoming or outgoing payment transaction
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/paymentHistory">
              <button
                type="button"
                className="px-3.5 py-2 rounded-lg border gi-surface-interactive gi-text-secondary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <IoWalletOutline className="text-base" />
                <span className="hidden sm:inline">Payment History</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Type Toggle Selector */}
        <div className="flex items-center gap-2 p-1 rounded-xl border gi-divider bg-[var(--gi-surface)] w-fit">
          <button
            type="button"
            onClick={() => setPaymentType("credit")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${paymentType === "credit"
                ? "gi-filter-active border-emerald-500 shadow-xs"
                : "gi-text-secondary hover:gi-text-primary"
              }`}
          >
            Payment In (Received)
          </button>

          <button
            type="button"
            onClick={() => setPaymentType("debit")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${paymentType === "debit"
                ? "gi-filter-active border-rose-500 shadow-xs"
                : "gi-text-secondary hover:gi-text-primary"
              }`}
          >
            Payment Out (Paid)
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Linked Invoice Banner */}
        {linkedInvoice && (
          <div className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border gi-badge-info">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg gi-btn-primary font-bold text-xs flex items-center justify-center shrink-0">
                INV
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-xs sm:text-sm gi-text-primary truncate">
                    Recording payment for Invoice #{linkedInvoice.invoiceNumberStr || (typeof linkedInvoice.invoiceNumber === "object" ? linkedInvoice.invoiceNumber?.number : linkedInvoice.invoiceNumber) || "INV"}
                  </p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase gi-badge-info">
                    Linked Bill
                  </span>
                </div>
                <p className="text-xs gi-text-secondary mt-0.5">
                  Bill Total: ₹{Number(linkedInvoice.totalAmount || 0).toLocaleString("en-IN")} • Current Due: ₹{Math.max(0, Number(linkedInvoice.totalAmount || 0) - Number(linkedInvoice.paidAmount || 0)).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLinkedInvoice(null)}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline shrink-0 cursor-pointer"
            >
              Unlink Invoice
            </button>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <section className="gi-card p-6 rounded-xl border gi-divider space-y-5 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* Party Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold gi-text-primary">
                    {paymentType === "credit" ? "Received From (Party)" : "Paid To (Party)"} <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPartyPopup(true)}
                    className="w-full rounded-lg p-3 flex items-center justify-between gap-3 border gi-divider gi-input text-left transition cursor-pointer"
                  >
                    {selectedParty ? (
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm gi-text-primary truncate">
                            {selectedParty.partyName}
                          </p>
                          <span className="text-[10px] px-2 py-0.5 rounded font-semibold capitalize gi-badge-info">
                            {selectedParty.partyType}
                          </span>
                        </div>
                        <p className="text-xs gi-text-secondary mt-0.5">
                          Phone: {selectedParty.phone || "N/A"} • Balance: ₹{Math.abs(Number(selectedParty.closingBalance || 0)).toLocaleString("en-IN")}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs gi-text-secondary">
                        Select Customer / Supplier / Party...
                      </span>
                    )}
                    <IoChevronForward className="text-base gi-text-secondary shrink-0" />
                  </button>
                </div>

                {/* Receipt No & Date */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border gi-divider bg-[var(--gi-surface)]">
                  <div>
                    <p className="text-[11px] font-semibold gi-text-secondary uppercase tracking-wider">
                      Payment Receipt No.
                    </p>
                    <p className="text-base font-bold gi-text-primary mt-0.5">
                      #{paymentNumber}
                    </p>
                    <p className="text-xs gi-text-secondary mt-0.5">
                      {new Date(paymentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openPaymentDetailsPopup}
                    className="p-2 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer shrink-0"
                    title="Edit Date & Receipt No."
                  >
                    <IoCreateOutline className="text-base" />
                  </button>
                </div>
              </div>
            </section>

            {/* Amount & Payment Details Card */}
            <section className="gi-card p-6 rounded-xl border gi-divider space-y-5 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold gi-text-primary">
                    Amount {paymentType === "credit" ? "Received (₹)" : "Paid (₹)"} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-semibold gi-text-secondary">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        if (errorMsg) setErrorMsg("");
                      }}
                      placeholder="0.00"
                      className="w-full pl-9 pr-3.5 py-2.5 text-lg font-bold rounded-lg gi-input focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold gi-text-primary">
                    Reference / Transaction / Cheque No.
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. UPI Ref / Cheque No / IMPS ID"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg gi-input focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold gi-text-primary">
                  Payment Mode
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {paymentModes.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition text-center cursor-pointer ${paymentMode === mode
                          ? "gi-filter-active border-indigo-500"
                          : "gi-surface-interactive gi-text-secondary"
                        }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes & Remarks */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold gi-text-primary">
                  Notes &amp; Remarks
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add payment description or notes..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg gi-input focus:outline-none resize-none"
                />
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Attachment Card */}
            <section className="gi-card p-6 rounded-xl border gi-divider space-y-3 shadow-xs">
              <label className="block text-xs font-semibold gi-text-primary">
                Receipt / Bill Attachment
              </label>
              {attachmentPreview ? (
                <div className="relative rounded-xl overflow-hidden border gi-divider group">
                  <img src={attachmentPreview} alt="Receipt Preview" className="w-full h-44 object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveAttachment}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition cursor-pointer"
                  >
                    <IoClose className="text-lg" />
                  </button>
                  <div className="p-2 text-xs truncate gi-text-secondary border-t gi-divider bg-[var(--gi-surface)]">
                    {attachment?.name || "Uploaded document"}
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed gi-divider rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors bg-[var(--gi-surface)] text-center">
                  <IoCloudUploadOutline className="text-3xl gi-text-secondary mb-2" />
                  <span className="text-xs font-semibold gi-text-primary">
                    Upload Receipt Image
                  </span>
                  <span className="text-[11px] gi-text-secondary mt-0.5">
                    PNG, JPG or PDF up to 5MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </section>

            {/* Action Summary Card */}
            <section className="gi-card p-6 rounded-xl border gi-divider space-y-4 shadow-xs">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="gi-text-secondary font-medium">Payment Type</span>
                <span className={`font-bold ${paymentType === "credit" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {paymentType === "credit" ? "Payment In (Credit)" : "Payment Out (Debit)"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="gi-text-secondary font-medium">Total Amount</span>
                <span className="text-base sm:text-lg font-bold font-mono gi-text-primary">
                  ₹{Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="pt-4 border-t gi-divider space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleSavePayment(false)}
                  className="w-full py-2.5 rounded-lg font-semibold gi-btn-primary transition cursor-pointer shadow-sm text-xs flex items-center justify-center gap-2"
                >
                  <IoSaveOutline className="text-base" />
                  <span>Save Payment</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSavePayment(true)}
                  className="w-full py-2 rounded-lg font-semibold text-xs border gi-surface-interactive gi-text-primary cursor-pointer transition"
                >
                  Save &amp; Add Another
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* Edit Payment Details Modal */}
        {showPaymentPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs gi-modal-overlay">
            <div className="w-full max-w-md rounded-xl gi-modal-content p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3 gi-divider">
                <h3 className="text-sm font-bold gi-text-primary">Payment Details</h3>
                <button
                  type="button"
                  onClick={() => setShowPaymentPopup(false)}
                  className="p-1 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer"
                >
                  <IoClose className="text-lg" />
                </button>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold gi-text-primary">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={tempPaymentDate}
                  onChange={(e) => setTempPaymentDate(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-xs gi-input focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold gi-text-primary">
                  Payment / Receipt Number
                </label>
                <input
                  type="text"
                  value={tempPaymentNumber}
                  onChange={(e) => setTempPaymentNumber(e.target.value)}
                  placeholder="0001"
                  className="w-full rounded-lg px-3 py-2 text-xs gi-input focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t gi-divider">
                <button
                  type="button"
                  onClick={() => setShowPaymentPopup(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border gi-surface-interactive gi-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePaymentDetails}
                  className="px-5 py-2 rounded-lg gi-btn-primary text-xs font-semibold cursor-pointer shadow-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Select Party Modal */}
        {showPartyPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs gi-modal-overlay">
            <div className="w-full max-w-lg rounded-xl gi-modal-content p-5 shadow-2xl max-h-[85vh] flex flex-col space-y-3">
              <div className="flex items-center justify-between border-b pb-3 gi-divider">
                <h3 className="text-sm font-bold gi-text-primary">
                  Select Party / Ledger
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPartyPopup(false)}
                  className="p-1 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer"
                >
                  <IoClose className="text-lg" />
                </button>
              </div>

              <div className="relative">
                <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-sm gi-text-secondary" />
                <input
                  type="text"
                  value={partySearch}
                  onChange={(e) => setPartySearch(e.target.value)}
                  placeholder="Search party by name or phone..."
                  className="w-full rounded-lg pl-9 pr-3 py-2 text-xs gi-input focus:outline-none"
                />
              </div>

              <div className="overflow-y-auto space-y-2 flex-1 pr-1">
                {filteredParties.length === 0 ? (
                  <div className="p-8 text-center text-xs gi-text-secondary">
                    No matching parties found.{" "}
                    <Link href="/addParty" className="font-semibold text-indigo-600 dark:text-indigo-400 underline">
                      Add New Party
                    </Link>
                  </div>
                ) : (
                  filteredParties.map((party) => (
                    <div
                      key={party.id}
                      onClick={() => handleSelectParty(party)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${selectedParty?.id === party.id
                          ? "gi-filter-active border-indigo-500"
                          : "gi-surface-interactive gi-text-primary"
                        }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-xs gi-text-primary truncate">
                            {party.partyName}
                          </p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold capitalize gi-badge-info">
                            {party.partyType}
                          </span>
                        </div>
                        <p className="text-[11px] gi-text-secondary mt-0.5">
                          Phone: {party.phone || "N/A"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] gi-text-secondary">Closing Balance</p>
                        <p className="text-xs font-bold font-mono gi-text-primary">
                          ₹{Math.abs(Number(party.closingBalance || 0)).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}

export default function ReceivedPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-5 flex items-center justify-center gi-text-secondary">Loading payment details...</div>}>
      <ReceivedPaymentContent />
    </Suspense>
  );
}
