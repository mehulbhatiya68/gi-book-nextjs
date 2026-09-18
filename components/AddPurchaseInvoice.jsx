"use client";

import Link from "next/link";
import { useState, useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import {
  IoArrowBack,
  IoClose,
  IoSearch,
  IoChevronForward,
  IoAdd,
  IoTrashOutline,
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";

export default function AddPurchaseInvoice() {
  const router = useRouter();
  const { parties, items, invoices, addInvoice } = useApp();

  const [selectedParty, setSelectedParty] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  const [showPartyPopup, setShowPartyPopup] = useState(false);
  const [showItemPopup, setShowItemPopup] = useState(false);

  const [partySearch, setPartySearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [invoiceNumber, setInvoiceNumber] = useState("PUR-0001");

  // Additional Features
  const [discountType, setDiscountType] = useState("percent"); // 'percent' | 'amount'
  const [discountValue, setDiscountValue] = useState("");
  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [enableRoundOff, setEnableRoundOff] = useState(true);
  const [notes, setNotes] = useState("");

  // Unique Auto Purchase Invoice Number Logic
  useEffect(() => {
    if (invoices && invoices.length > 0) {
      const purchaseInvoices = invoices.filter(
        (inv) => inv.invoiceType === "purchase" || inv.type === "purchase"
      );
      const maxNum = purchaseInvoices.reduce((max, inv) => {
        const numStr = String(inv.invoiceNumberStr || inv.invoiceNumber?.number || inv.invoiceNumber || "");
        const match = numStr.match(/(\d+)/);
        const num = match ? Number(match[1]) : 0;
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      const nextNumStr = `PUR-${String(maxNum + 1).padStart(4, "0")}`;
      startTransition(() => {
        setInvoiceNumber(nextNumStr);
      });
    }
  }, [invoices]);

  const filteredParties = parties.filter((party) => {
    const search = partySearch.toLowerCase();
    return (
      party.partyName?.toLowerCase().includes(search) ||
      party.phone?.includes(search)
    );
  });

  const filteredItems = items.filter((item) => {
    const search = itemSearch.toLowerCase();
    return (
      item.itemName?.toLowerCase().includes(search) ||
      item.hsnCode?.toLowerCase().includes(search)
    );
  });

  const handleSelectParty = (party) => {
    setSelectedParty(party);
    setPartySearch("");
    setShowPartyPopup(false);
  };

  // Helper for GST extraction
  const parseGstRate = (gstVal) => {
    if (!gstVal || gstVal === "None") return 0;
    const match = String(gstVal).match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const handleToggleItem = (item) => {
    const alreadySelected = selectedItems.find(
      (selectedItem) => selectedItem.id === item.id
    );

    if (alreadySelected) {
      setSelectedItems(
        selectedItems.filter((selectedItem) => selectedItem.id !== item.id)
      );
    } else {
      const price = Number(item.purchasePrice || item.salesPrice || 0);
      const quantity = 1;
      const rate = parseGstRate(item.gst);
      const taxType = item.purchaseTaxType || "With Tax";

      let taxableAmount = price * quantity;
      let taxAmount = 0;
      let lineTotal = price * quantity;

      if (taxType === "With Tax") {
        taxableAmount = rate > 0 ? (lineTotal / (1 + rate / 100)) : lineTotal;
        taxAmount = lineTotal - taxableAmount;
      } else {
        taxAmount = (taxableAmount * rate) / 100;
        lineTotal = taxableAmount + taxAmount;
      }

      setSelectedItems([
        ...selectedItems,
        {
          ...item,
          quantity,
          price,
          rate,
          taxType,
          taxableAmount,
          taxAmount,
          lineTotal,
        },
      ]);
    }
  };

  const handleQuantityChange = (id, newQty) => {
    const quantity = Math.max(1, newQty);
    setSelectedItems(
      selectedItems.map((item) => {
        if (item.id === id) {
          const price = Number(item.price || 0);
          const rate = item.rate || 0;
          const taxType = item.taxType || "With Tax";

          let taxableAmount = price * quantity;
          let taxAmount = 0;
          let lineTotal = price * quantity;

          if (taxType === "With Tax") {
            taxableAmount = rate > 0 ? (lineTotal / (1 + rate / 100)) : lineTotal;
            taxAmount = lineTotal - taxableAmount;
          } else {
            taxAmount = (taxableAmount * rate) / 100;
            lineTotal = taxableAmount + taxAmount;
          }

          return {
            ...item,
            quantity,
            taxableAmount,
            taxAmount,
            lineTotal,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id) => {
    setSelectedItems(selectedItems.filter((item) => item.id !== id));
  };

  const handleAddAdditionalCharge = () => {
    setAdditionalCharges([
      ...additionalCharges,
      { id: Date.now(), title: "", amount: "" },
    ]);
  };

  const handleUpdateAdditionalCharge = (id, field, value) => {
    setAdditionalCharges(
      additionalCharges.map((charge) =>
        charge.id === id ? { ...charge, [field]: value } : charge
      )
    );
  };

  const handleRemoveAdditionalCharge = (id) => {
    setAdditionalCharges(additionalCharges.filter((charge) => charge.id !== id));
  };

  // Calculation Logic
  const subtotal = selectedItems.reduce(
    (sum, item) => sum + (item.taxableAmount || 0),
    0
  );

  const totalTaxAmount = selectedItems.reduce(
    (sum, item) => sum + (item.taxAmount || 0),
    0
  );

  const itemsTotalWithTax = selectedItems.reduce(
    (sum, item) => sum + (item.lineTotal || 0),
    0
  );

  let discountAmount = 0;
  const numDiscount = Number(discountValue || 0);
  if (discountType === "percent") {
    discountAmount = (itemsTotalWithTax * numDiscount) / 100;
  } else {
    discountAmount = numDiscount;
  }

  const extraChargesTotal = additionalCharges.reduce(
    (sum, charge) => sum + Number(charge.amount || 0),
    0
  );

  const rawTotal = Math.max(
    0,
    itemsTotalWithTax - discountAmount + extraChargesTotal
  );

  const totalAmount = enableRoundOff ? Math.round(rawTotal / 10) * 10 : rawTotal;
  const roundOffAmount = enableRoundOff ? totalAmount - rawTotal : 0;

  const handleGenerateInvoice = () => {
    if (!selectedParty) {
      alert("Please select a supplier / party.");
      return;
    }

    if (selectedItems.length === 0) {
      alert("Please select at least one item.");
      return;
    }

    const fullInvoiceNum = invoiceNumber.trim() || "PUR-0001";

    const invoiceData = {
      type: "purchase",
      invoiceType: "purchase",
      invoiceDate,
      invoiceNumberStr: fullInvoiceNum,
      invoiceNumber: fullInvoiceNum,
      partyName: selectedParty.partyName,
      supplier: selectedParty,
      items: selectedItems,
      subtotal,
      taxAmount: totalTaxAmount,
      itemsTotalWithTax,
      discountType,
      discountValue: Number(discountValue || 0),
      discountAmount,
      additionalCharges,
      roundOffEnabled: enableRoundOff,
      roundOffAmount,
      totalAmount,
      notes,
      status: "unpaid",
      paidAmount: 0,
    };

    addInvoice(invoiceData);
    alert("Purchase invoice generated successfully!");
    router.replace("/invoice");
  };

  return (
    <div className="space-y-6 pb-12 select-none gi-page">
      {/* Top Header & Back Button */}
      <div className="flex items-center gap-3 pb-2 border-b gi-divider">
        <button
          type="button"
          onClick={() => router.replace("/invoice")}
          className="p-2 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer shrink-0"
          title="Back to Invoices"
        >
          <IoArrowBack className="text-lg" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
            Add Purchase Invoice
          </h1>
          <p className="text-xs gi-text-secondary mt-0.5">
            Record a vendor purchase bill &amp; inward stock entry
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Purchase Credentials Card (Supplier, Invoice Number, Invoice Date) */}
          <section className="rounded-xl gi-card p-5 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Supplier / Vendor Selector */}
              <div className="md:col-span-1">
                <label className="block text-xs uppercase tracking-wider font-semibold gi-text-secondary mb-1.5">
                  Supplier / Vendor *
                </label>
                <button
                  type="button"
                  onClick={() => setShowPartyPopup(true)}
                  className="w-full h-10 rounded-lg border gi-border px-3 flex items-center justify-between gap-2 bg-[var(--gi-card-bg)] hover:border-indigo-500 transition cursor-pointer text-left"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-xs gi-text-primary truncate">
                      {selectedParty ? selectedParty.partyName : "Select vendor..."}
                    </p>
                  </div>
                  <IoChevronForward className="text-base gi-text-muted shrink-0" />
                </button>
              </div>

              {/* Input for Invoice Number */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold gi-text-secondary mb-1.5">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. PUR-0001"
                  className="w-full h-10 rounded-lg border gi-border bg-[var(--gi-card-bg)] gi-text-primary px-3 text-xs font-semibold outline-none focus:border-indigo-500 transition shadow-2xs"
                />
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold gi-text-secondary mb-1.5">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full h-10 rounded-lg border gi-border bg-[var(--gi-card-bg)] gi-text-primary px-3 text-xs font-semibold outline-none focus:border-indigo-500 transition shadow-2xs"
                />
              </div>
            </div>
          </section>

          {/* Items Section */}
          <section className="rounded-xl gi-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm gi-text-primary">Purchased Items &amp; Supplies</h3>
                <p className="text-xs gi-text-secondary">Add inventory products or services to this bill</p>
              </div>

              <button
                type="button"
                onClick={() => setShowItemPopup(true)}
                className="h-8 px-3 rounded-lg gi-btn-primary text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-xs"
              >
                <IoAdd className="text-base" />
                <span>Add Items</span>
              </button>
            </div>

            {selectedItems.length > 0 ? (
              <div className="divide-y gi-divider rounded-lg border gi-border overflow-hidden">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 gi-surface-secondary flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs sm:text-sm gi-text-primary truncate">
                        {item.itemName || item.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs gi-text-secondary mt-0.5">
                        <span>₹{Number(item.price || item.purchasePrice || 0).toFixed(2)} / {item.unit || "unit"}</span>
                        {item.gst && item.gst !== "None" && (
                          <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.2 rounded font-medium text-[10px]">
                            {item.gst} ({item.taxType || "With Tax"})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] uppercase font-semibold gi-text-muted">Qty:</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(item.id, Number(e.target.value))
                          }
                          className="w-14 h-8 rounded border gi-border bg-[var(--gi-card-bg)] text-center text-xs font-semibold outline-none focus:border-indigo-500 gi-text-primary"
                        />
                      </div>

                      <div className="text-right min-w-[70px]">
                        <span className="text-xs font-bold gi-text-primary block">
                          ₹{Number(item.lineTotal || (item.price * item.quantity)).toFixed(2)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="h-7 w-7 rounded gi-text-muted hover:text-red-500 hover:bg-[var(--gi-hover)] transition cursor-pointer flex items-center justify-center"
                      >
                        <IoClose className="text-lg" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center border-2 border-dashed gi-divider rounded-xl">
                <p className="text-xs gi-text-muted">No items added to this purchase invoice yet.</p>
                <button
                  type="button"
                  onClick={() => setShowItemPopup(true)}
                  className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  + Click to select items
                </button>
              </div>
            )}
          </section>

          {/* Discount & Additional Charges */}
          <section className="rounded-xl gi-card p-5 shadow-xs space-y-4">
            <h3 className="font-semibold text-sm gi-text-primary">Discounts &amp; Extra Charges</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Discount Entry */}
              <div className="p-3.5 rounded-lg border gi-divider gi-surface-secondary space-y-2">
                <label className="block text-xs font-semibold gi-text-secondary">Vendor Discount</label>
                <div className="flex items-center gap-2">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="h-9 px-2 rounded-lg border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="amount">Fixed Amount (₹)</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    placeholder={discountType === "percent" ? "e.g. 5%" : "e.g. 500"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-lg border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                {discountAmount > 0 && (
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Discount Applied: -₹{discountAmount.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Additional Freight / Loading Charges */}
              <div className="p-3.5 rounded-lg border gi-divider gi-surface-secondary space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold gi-text-secondary">Freight &amp; Additional Charges</label>
                  <button
                    type="button"
                    onClick={handleAddAdditionalCharge}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                  >
                    + Add Charge
                  </button>
                </div>

                {additionalCharges.length === 0 ? (
                  <p className="text-xs gi-text-muted italic">No extra freight or packing charges added.</p>
                ) : (
                  <div className="space-y-2">
                    {additionalCharges.map((charge) => (
                      <div key={charge.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Freight / Transport"
                          value={charge.title}
                          onChange={(e) =>
                            handleUpdateAdditionalCharge(charge.id, "title", e.target.value)
                          }
                          className="flex-1 h-8 px-2 rounded border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs outline-none focus:border-indigo-500"
                        />
                        <input
                          type="number"
                          placeholder="Amount"
                          value={charge.amount}
                          onChange={(e) =>
                            handleUpdateAdditionalCharge(charge.id, "amount", e.target.value)
                          }
                          className="w-24 h-8 px-2 rounded border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveAdditionalCharge(charge.id)}
                          className="h-8 w-8 rounded text-slate-400 hover:text-red-500 transition flex items-center justify-center cursor-pointer"
                        >
                          <IoTrashOutline className="text-base" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Bill Notes / Terms */}
          <section className="rounded-xl gi-card p-5 shadow-xs space-y-2">
            <label className="block text-xs font-semibold gi-text-secondary">Vendor Bill Notes &amp; Terms</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal purchase notes, payment terms, or vehicle tracking details..."
              className="w-full p-3 rounded-lg border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs outline-none focus:border-indigo-500 transition"
            />
          </section>
        </div>

        {/* Right Sidebar - Financial Summary */}
        <div className="space-y-6">
          <section className="rounded-xl gi-card p-5 shadow-xs space-y-4 sticky top-4">
            <h3 className="font-semibold text-sm gi-text-primary pb-3 border-b gi-divider">
              Purchase Summary
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between gi-text-secondary">
                <span>Items Subtotal (Excl. Tax)</span>
                <span className="font-mono">₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between gi-text-secondary">
                <span>GST Tax Total</span>
                <span className="font-mono">₹{totalTaxAmount.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between gi-text-primary font-semibold">
                <span>Items Total (Incl. Tax)</span>
                <span className="font-mono">₹{itemsTotalWithTax.toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Vendor Discount</span>
                  <span className="font-mono">-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              {extraChargesTotal > 0 && (
                <div className="flex items-center justify-between gi-text-secondary">
                  <span>Extra Charges</span>
                  <span className="font-mono">+₹{extraChargesTotal.toFixed(2)}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t gi-divider gi-text-secondary">
                <div className="flex items-center gap-1.5">
                  <span>Round Off</span>
                  <input
                    type="checkbox"
                    checked={enableRoundOff}
                    onChange={(e) => setEnableRoundOff(e.target.checked)}
                    className="rounded text-indigo-600 cursor-pointer"
                  />
                </div>
                <span className="font-mono">
                  {roundOffAmount >= 0 ? "+" : ""}
                  ₹{roundOffAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t-2 border-indigo-500/20 text-sm font-bold gi-text-primary">
                <span>Grand Total</span>
                <span className="text-base font-mono text-indigo-600 dark:text-indigo-400">
                  ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateInvoice}
              className="w-full py-3 rounded-lg gi-btn-primary font-semibold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition mt-4"
            >
              <span>Save &amp; Record Purchase Invoice</span>
            </button>
          </section>
        </div>
      </div>

      {/* Select Supplier Popup */}
      {showPartyPopup && (
        <div
          className="fixed inset-0 z-50 gi-modal-overlay backdrop-blur-sm p-4 flex items-center justify-center"
          onClick={() => setShowPartyPopup(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[85vh] overflow-hidden rounded-xl gi-card shadow-2xl p-5"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-bold gi-text-primary">Select Supplier / Party</h2>
              <button
                type="button"
                onClick={() => setShowPartyPopup(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg gi-text-muted hover:gi-text-primary transition cursor-pointer"
              >
                <IoClose className="text-xl" />
              </button>
            </div>

            <div className="relative mb-3">
              <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                value={partySearch}
                onChange={(e) => setPartySearch(e.target.value)}
                placeholder="Search by name..."
                autoFocus
                className="w-full h-8 rounded-lg border gi-border bg-[var(--gi-card-bg)] gi-text-primary pl-9 pr-3 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div className="overflow-y-auto max-h-[50vh] space-y-1.5 pr-0.5">
              {filteredParties.length === 0 ? (
                <div className="py-8 text-center text-xs gi-text-muted">
                  No suppliers found. <Link href="/addParty" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">Add Party</Link>
                </div>
              ) : (
                filteredParties.map((party) => (
                  <button
                    key={party.id}
                    type="button"
                    onClick={() => handleSelectParty(party)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border gi-divider hover:border-indigo-500 gi-surface-secondary transition cursor-pointer text-left"
                  >
                    <div>
                      <span className="font-semibold text-xs gi-text-primary block">{party.partyName}</span>
                      <span className="text-[11px] gi-text-secondary">{party.partyType} • {party.phone}</span>
                    </div>
                    <IoChevronForward className="text-base gi-text-muted" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Select Items Popup */}
      {showItemPopup && (
        <div
          className="fixed inset-0 z-50 gi-modal-overlay backdrop-blur-sm p-4 flex items-center justify-center"
          onClick={() => setShowItemPopup(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] rounded-xl gi-card shadow-2xl p-5 flex flex-col"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold gi-text-primary">Select Items</h2>
                <p className="text-xs gi-text-secondary">Click items to toggle selection for bill</p>
              </div>
              <button
                type="button"
                onClick={() => setShowItemPopup(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg gi-text-muted hover:gi-text-primary transition cursor-pointer shrink-0"
              >
                <IoClose className="text-xl" />
              </button>
            </div>

            <div className="relative mb-3">
              <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="Search by HSN / Name..."
                autoFocus
                className="w-full h-8 rounded-lg border gi-border bg-[var(--gi-card-bg)] gi-text-primary pl-9 pr-3 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[45vh] pr-1">
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-xs gi-text-muted">
                  No items found.{" "}
                  <Link href="/addItem" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">
                    + Create New Item
                  </Link>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedItems.some(
                    (selectedItem) => selectedItem.id === item.id
                  );

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleItem(item)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition cursor-pointer text-left ${isSelected
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "gi-surface-secondary border-transparent hover:border-indigo-500"
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-xs sm:text-sm truncate">{item.itemName}</p>
                        <p className={`text-[11px] mt-0.5 ${isSelected ? "text-white/80" : "gi-text-secondary"}`}>
                          {item.hsnCode ? `HSN: ${item.hsnCode}` : "No HSN"} • Stock: {item.stockQuantity} {item.unit}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-bold text-xs">
                          ₹{Number(item.purchasePrice || 0).toFixed(2)}
                        </p>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${isSelected ? "bg-white/20 text-white" : "gi-surface-interactive gi-text-primary"}`}>
                          {isSelected ? "Selected ✓" : "+ Add"}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom Confirmation Bar */}
            <div className="border-t gi-divider mt-4 pt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="gi-text-secondary">
                  {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} selected
                </span>
                <span className="font-bold gi-text-primary">
                  Subtotal: ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/addItem"
                  className="px-3 py-2 rounded-lg border gi-border hover:bg-[var(--gi-hover)] gi-text-primary text-xs font-semibold text-center shrink-0 cursor-pointer"
                >
                  + Create Item
                </Link>
                <button
                  type="button"
                  onClick={() => setShowItemPopup(false)}
                  className="flex-1 py-2 rounded-lg gi-btn-primary font-semibold text-xs transition cursor-pointer shadow-xs"
                >
                  Done Selecting ({selectedItems.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
