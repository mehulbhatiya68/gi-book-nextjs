"use client";

import Link from "next/link";
import { useState, useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import {
  IoArrowBack,
  IoClose,
  IoSearch,
  IoSettingsOutline,
  IoChevronForward,
  IoCreateOutline,
  IoAdd,
  IoTrashOutline,
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";

export default function SalesInvoiceForm() {
  const router = useRouter();
  const { parties, items, invoices, addInvoice } = useApp();

  const [selectedParty, setSelectedParty] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  const [showInvoicePopup, setShowInvoicePopup] = useState(false);
  const [showPartyPopup, setShowPartyPopup] = useState(false);
  const [showItemPopup, setShowItemPopup] = useState(false);

  const [partySearch, setPartySearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [prefixEnabled, setPrefixEnabled] = useState(true);
  const [invoicePrefix, setInvoicePrefix] = useState("INV");
  const [invoiceNumber, setInvoiceNumber] = useState("0001");
  const [suffixEnabled, setSuffixEnabled] = useState(false);
  const [invoiceSuffix, setInvoiceSuffix] = useState("");

  const [tempInvoiceDate, setTempInvoiceDate] = useState(invoiceDate);
  const [tempPrefixEnabled, setTempPrefixEnabled] = useState(prefixEnabled);
  const [tempInvoicePrefix, setTempInvoicePrefix] = useState(invoicePrefix);
  const [tempInvoiceNumber, setTempInvoiceNumber] = useState(invoiceNumber);
  const [tempSuffixEnabled, setTempSuffixEnabled] = useState(suffixEnabled);
  const [tempInvoiceSuffix, setTempInvoiceSuffix] = useState(invoiceSuffix);

  // Additional Features
  const [discountType, setDiscountType] = useState("percent"); // 'percent' | 'amount'
  const [discountValue, setDiscountValue] = useState("");
  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [enableRoundOff, setEnableRoundOff] = useState(true);
  const [notes, setNotes] = useState("");

  // Unique Auto Invoice Number Logic
  useEffect(() => {
    if (invoices && invoices.length > 0) {
      const salesInvoices = invoices.filter(
        (inv) => inv.invoiceType === "sales" || inv.type === "sales"
      );
      const maxNum = salesInvoices.reduce((max, inv) => {
        const num = Number(inv.invoiceNumber?.number || inv.invoiceNumber || 0);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      const nextNumStr = String(maxNum + 1).padStart(4, "0");
      startTransition(() => {
        setInvoiceNumber(nextNumStr);
        setTempInvoiceNumber(nextNumStr);
      });
    }
  }, [invoices]);

  const openInvoicePopup = () => {
    setTempInvoiceDate(invoiceDate);
    setTempPrefixEnabled(prefixEnabled);
    setTempInvoicePrefix(invoicePrefix);
    setTempInvoiceNumber(invoiceNumber);
    setTempSuffixEnabled(suffixEnabled);
    setTempInvoiceSuffix(invoiceSuffix);
    setShowInvoicePopup(true);
  };

  const handleSaveInvoiceDetails = () => {
    setInvoiceDate(tempInvoiceDate);
    setPrefixEnabled(tempPrefixEnabled);
    setInvoicePrefix(tempInvoicePrefix);
    setInvoiceNumber(tempInvoiceNumber);
    setSuffixEnabled(tempSuffixEnabled);
    setInvoiceSuffix(tempInvoiceSuffix);
    setShowInvoicePopup(false);
  };

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
      const isService = item.itemType === "Service";
      const purchasePrice = Number(item.purchasePrice || 0);
      const stockQty = Number(item.stockQuantity || 0);

      // Check stock if item has purchase price and is a product
      if (!isService && purchasePrice > 0 && stockQty <= 0) {
        alert(
          `Cannot add "${item.itemName}" to invoice because it is out of stock (Stock: 0). Please adjust or purchase stock first.`
        );
        return;
      }

      const price = Number(item.salesPrice || 0);
      const quantity = 1;
      const rate = parseGstRate(item.gst);
      const taxType = item.salesTaxType || "Without Tax";

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
          name: item.itemName,
          price,
          quantity,
          gst: item.gst || "None",
          gstRate: rate,
          taxType,
          taxableAmount,
          taxAmount,
          lineTotal,
        },
      ]);
    }
  };

  const handleQuantityChange = (id, quantity) => {
    if (quantity < 1) return;

    const targetItem = selectedItems.find((item) => item.id === id);
    if (targetItem) {
      const isService = targetItem.itemType === "Service";
      const purchasePrice = Number(targetItem.purchasePrice || 0);
      const stockQty = Number(targetItem.stockQuantity || 0);

      // Stock check if item has purchase price and is product
      if (!isService && purchasePrice > 0 && quantity > stockQty) {
        alert(
          `Cannot add ${quantity} units for "${targetItem.itemName}". Only ${stockQty} units available in inventory.`
        );
        quantity = stockQty;
      }
    }

    setSelectedItems(
      selectedItems.map((item) => {
        if (item.id !== id) return item;

        const price = Number(item.price || item.salesPrice || 0);
        const rate = item.gstRate ?? parseGstRate(item.gst);
        const taxType = item.taxType || item.salesTaxType || "Without Tax";

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
      })
    );
  };

  const handleRemoveItem = (id) => {
    if (!window.confirm("Are you sure you want to remove this item from the invoice?")) return;
    setSelectedItems(selectedItems.filter((item) => item.id !== id));
  };

  // Additional Charges Handlers
  const handleAddCharge = () => {
    setAdditionalCharges([
      ...additionalCharges,
      { id: Date.now(), name: "Shipping Charge", amount: "" },
    ]);
  };

  const handleUpdateCharge = (id, field, value) => {
    setAdditionalCharges(
      additionalCharges.map((ch) =>
        ch.id === id ? { ...ch, [field]: value } : ch
      )
    );
  };

  const handleRemoveCharge = (id) => {
    if (!window.confirm("Are you sure you want to remove this charge?")) return;
    setAdditionalCharges(additionalCharges.filter((ch) => ch.id !== id));
  };

  // Calculations
  const subtotal = selectedItems.reduce((total, item) => {
    return total + (Number(item.taxableAmount) || (Number(item.price || 0) * Number(item.quantity || 1)));
  }, 0);

  const totalTaxAmount = selectedItems.reduce((total, item) => {
    return total + (Number(item.taxAmount) || 0);
  }, 0);

  const itemsTotalWithTax = selectedItems.reduce((total, item) => {
    return total + (Number(item.lineTotal) || (Number(item.price || 0) * Number(item.quantity || 1)));
  }, 0);

  const discountAmount =
    discountType === "percent"
      ? (itemsTotalWithTax * Number(discountValue || 0)) / 100
      : Number(discountValue || 0);

  const totalAdditionalCharges = additionalCharges.reduce(
    (sum, ch) => sum + Number(ch.amount || 0),
    0
  );

  const rawTotal = itemsTotalWithTax - discountAmount + totalAdditionalCharges;
  const totalAmount = enableRoundOff ? Math.round(rawTotal / 10) * 10 : rawTotal;
  const roundOffAmount = enableRoundOff ? totalAmount - rawTotal : 0;

  const handleGenerateInvoice = () => {
    if (!selectedParty) {
      alert("Please select a customer / party.");
      return;
    }

    if (selectedItems.length === 0) {
      alert("Please select at least one item.");
      return;
    }

    const fullInvoiceNum = `${prefixEnabled ? invoicePrefix + " " : ""}${invoiceNumber}${suffixEnabled ? " " + invoiceSuffix : ""}`;

    const invoiceData = {
      type: "sales",
      invoiceType: "sales",
      invoiceDate,
      invoiceNumberStr: fullInvoiceNum,
      invoiceNumber: {
        prefixEnabled,
        prefix: invoicePrefix,
        number: invoiceNumber,
        suffixEnabled,
        suffix: invoiceSuffix,
      },
      partyName: selectedParty.partyName,
      party: selectedParty,
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
    alert("Sales invoice generated successfully!");
    router.replace("/invoice");
  };

  return (
    <div className="space-y-6 pb-12">
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
            Create Sales Invoice
          </h1>
          <p className="text-xs gi-text-secondary mt-0.5">
            Generate a sales bill &amp; tax invoice for your customer
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Unified Invoice Header & Customer Card */}
          <section className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Customer / Party Selector */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 dark:text-zinc-500 mb-1.5">
                  Customer / Party *
                </label>
                <button
                  type="button"
                  onClick={() => setShowPartyPopup(true)}
                  className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 p-3 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-zinc-800/50 hover:border-indigo-500 dark:hover:border-indigo-500 transition cursor-pointer text-left"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {selectedParty ? selectedParty.partyName : "Click to select customer..."}
                    </p>
                    {selectedParty && (
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        {selectedParty.phone || "No Phone"} • {selectedParty.partyType || "Customer"}
                      </p>
                    )}
                  </div>

                  <IoChevronForward className="text-lg text-slate-400 shrink-0" />
                </button>
              </div>

              {/* Invoice Identifier & Configuration */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-semibold">
                    Invoice Identifier
                  </p>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {prefixEnabled ? `${invoicePrefix} ` : ""}
                    {invoiceNumber}
                    {suffixEnabled ? ` ${invoiceSuffix}` : ""}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Issue Date: {new Date(invoiceDate).toLocaleDateString("en-IN")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openInvoicePopup}
                  className="h-8 px-3 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shrink-0"
                  title="Edit Invoice Number & Date"
                >
                  <IoCreateOutline className="text-base" />
                  <span>Configure</span>
                </button>
              </div>
            </div>
          </section>

          {/* Items Section */}
          <section className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Items & Line Products</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Add products or service lines to this sales bill</p>
              </div>

              <button
                type="button"
                onClick={() => setShowItemPopup(true)}
                className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-sm"
              >
                <IoAdd className="text-base" />
                <span>Add Items</span>
              </button>
            </div>

            {selectedItems.length > 0 ? (
              <div className="divide-y divide-slate-200 dark:divide-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-800 overflow-hidden">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-50/50 dark:bg-zinc-800/40 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {item.itemName || item.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        <span>₹{Number(item.price || item.salesPrice || 0).toFixed(2)} / {item.unit || "unit"}</span>
                        {item.gst && item.gst !== "None" && (
                          <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded font-medium text-[10px]">
                            {item.gst} ({item.taxType || "Without Tax"})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] uppercase font-semibold text-slate-400 dark:text-zinc-500">Qty:</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(item.id, Number(e.target.value))
                          }
                          className="w-14 h-8 rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center text-xs font-semibold outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="text-right min-w-[70px]">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          ₹{Number(item.lineTotal || (item.price * item.quantity)).toFixed(2)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="h-7 w-7 rounded text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-zinc-700 transition cursor-pointer flex items-center justify-center"
                      >
                        <IoClose className="text-lg" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => setShowItemPopup(true)}
                className="rounded-lg border-2 border-dashed border-slate-200 dark:border-zinc-800 p-8 text-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 transition"
              >
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">No items added yet</p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Click here or the button above to add products to this invoice</p>
              </div>
            )}
          </section>

          {/* Adjustments & Notes */}
          <section className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Discount & Charges</h3>

            {/* Discount Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Discount Type
                </label>
                <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setDiscountType("percent")}
                    className={`flex-1 py-1 rounded text-xs font-semibold transition cursor-pointer ${discountType === "percent"
                        ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-600 dark:text-zinc-400"
                      }`}
                  >
                    Percent (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("amount")}
                    className={`flex-1 py-1 rounded text-xs font-semibold transition cursor-pointer ${discountType === "amount"
                        ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-600 dark:text-zinc-400"
                      }`}
                  >
                    Fixed (₹)
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Discount Value ({discountType === "percent" ? "%" : "₹"})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "percent" ? "e.g. 10%" : "e.g. ₹50"}
                  className="w-full h-8 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Additional Charges */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Additional Charges (Shipping / Packaging / Tax)
                </label>
                <button
                  type="button"
                  onClick={handleAddCharge}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <IoAdd className="text-sm" /> Add Charge
                </button>
              </div>

              {additionalCharges.length > 0 && (
                <div className="space-y-2 mb-2">
                  {additionalCharges.map((ch) => (
                    <div key={ch.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={ch.name}
                        onChange={(e) => handleUpdateCharge(ch.id, "name", e.target.value)}
                        placeholder="Charge Name (e.g. Delivery)"
                        className="flex-1 h-8 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={ch.amount}
                        onChange={(e) => handleUpdateCharge(ch.id, "amount", e.target.value)}
                        placeholder="Amount ₹"
                        className="w-28 h-8 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCharge(ch.id)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                      >
                        <IoTrashOutline className="text-base" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Terms & Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Notes & Terms
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add payment terms or notes for customer..."
                className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </section>
        </div>

        {/* Sidebar Summary Card */}
        <div className="space-y-6">
          <section className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 shadow-sm space-y-3 sticky top-20">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-200 dark:border-zinc-800 pb-2.5">
              Invoice Calculation
            </h3>

            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
              <span>Taxable Subtotal</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {totalTaxAmount > 0 && (
              <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                <span>Tax / GST</span>
                <span>+ ₹{totalTaxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}

            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <span>Discount</span>
                <span>- ₹{discountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {totalAdditionalCharges > 0 && (
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
                <span>Additional Charges</span>
                <span>+ ₹{totalAdditionalCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {/* Round Off Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-zinc-800 text-xs">
              <span className="text-slate-600 dark:text-zinc-400">Round Off Total</span>
              <button
                type="button"
                onClick={() => setEnableRoundOff(!enableRoundOff)}
                className={`relative w-8 h-4.5 rounded-full transition cursor-pointer ${enableRoundOff ? "bg-indigo-600" : "bg-slate-300 dark:bg-zinc-700"
                  }`}
              >
                <span
                  className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-all ${enableRoundOff ? "left-4" : "left-0.5"
                    }`}
                />
              </button>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-zinc-800">
              <p className="text-xs uppercase font-semibold text-slate-400 dark:text-zinc-500">Grand Total</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                ₹{totalAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateInvoice}
              className="w-full h-10 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition cursor-pointer font-semibold text-xs sm:text-sm shadow-sm mt-4"
            >
              Generate Sales Invoice
            </button>
          </section>
        </div>
      </div>

      {/* Edit Invoice Details Popup */}
      {showInvoicePopup && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center"
          onClick={() => setShowInvoicePopup(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-5"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Invoice Number & Date Configuration
              </h2>
              <button
                type="button"
                onClick={() => setShowInvoicePopup(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <IoClose className="text-xl" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Invoice Date
              </label>
              <input
                type="date"
                value={tempInvoiceDate}
                onChange={(e) => setTempInvoiceDate(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Prefix</label>
                  <button
                    type="button"
                    onClick={() => setTempPrefixEnabled(!tempPrefixEnabled)}
                    className={`relative w-7 h-4 rounded-full transition cursor-pointer ${tempPrefixEnabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-zinc-700"
                      }`}
                  >
                    <span
                      className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${tempPrefixEnabled ? "left-3.5" : "left-0.5"
                        }`}
                    />
                  </button>
                </div>
                <input
                  type="text"
                  value={tempInvoicePrefix}
                  onChange={(e) => setTempInvoicePrefix(e.target.value)}
                  disabled={!tempPrefixEnabled}
                  className="w-full h-8 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs text-slate-900 dark:text-white outline-none disabled:opacity-40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Number
                </label>
                <input
                  type="text"
                  value={tempInvoiceNumber}
                  onChange={(e) => setTempInvoiceNumber(e.target.value)}
                  className="w-full h-8 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Suffix</label>
                  <button
                    type="button"
                    onClick={() => setTempSuffixEnabled(!tempSuffixEnabled)}
                    className={`relative w-7 h-4 rounded-full transition cursor-pointer ${tempSuffixEnabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-zinc-700"
                      }`}
                  >
                    <span
                      className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${tempSuffixEnabled ? "left-3.5" : "left-0.5"
                        }`}
                    />
                  </button>
                </div>
                <input
                  type="text"
                  value={tempInvoiceSuffix}
                  onChange={(e) => setTempInvoiceSuffix(e.target.value)}
                  disabled={!tempSuffixEnabled}
                  className="w-full h-8 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs text-slate-900 dark:text-white outline-none disabled:opacity-40"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveInvoiceDetails}
              className="w-full h-9 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition cursor-pointer font-semibold text-xs shadow-sm"
            >
              Save Parameters
            </button>
          </div>
        </div>
      )}

      {/* Select Party Popup */}
      {showPartyPopup && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center"
          onClick={() => setShowPartyPopup(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[85vh] overflow-hidden rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-5"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Select Customer / Party</h2>
              <button
                type="button"
                onClick={() => setShowPartyPopup(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
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
                placeholder="Search by name or phone..."
                autoFocus
                className="w-full h-8 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white pl-9 pr-3 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div className="overflow-y-auto max-h-[50vh] space-y-1.5 pr-0.5">
              {filteredParties.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                  No parties found. <Link href="/addParty" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">Add Party</Link>
                </div>
              ) : (
                filteredParties.map((party) => (
                  <button
                    key={party.id}
                    type="button"
                    onClick={() => handleSelectParty(party)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-zinc-800/40 transition cursor-pointer text-left"
                  >
                    <div>
                      <span className="font-semibold text-xs text-slate-900 dark:text-white block">{party.partyName}</span>
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400">{party.partyType} • {party.phone}</span>
                    </div>
                    <IoChevronForward className="text-base text-slate-400" />
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
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center"
          onClick={() => setShowItemPopup(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-5 flex flex-col"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Select Items</h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Click items to toggle selection for invoice</p>
              </div>
              <button
                type="button"
                onClick={() => setShowItemPopup(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer shrink-0"
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
                placeholder="Search by HSN or Item Name..."
                autoFocus
                className="w-full h-8 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white pl-9 pr-3 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[45vh] pr-1">
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
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
                  const isService = item.itemType === "Service";
                  const purchasePrice = Number(item.purchasePrice || 0);
                  const stockQty = Number(item.stockQuantity || 0);
                  const isOutOfStock = !isService && purchasePrice > 0 && stockQty <= 0;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleItem(item)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition cursor-pointer text-left ${isSelected
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : isOutOfStock
                            ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40"
                            : "bg-slate-50/50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 hover:border-indigo-500"
                        }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-xs sm:text-sm truncate">{item.itemName}</p>
                          {item.gst && item.gst !== "None" && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${isSelected ? "bg-white/20 text-white" : "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"}`}>
                              {item.gst}
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] mt-0.5 ${isSelected ? "text-white/80" : isOutOfStock ? "text-red-500 font-medium" : "text-slate-500 dark:text-zinc-400"}`}>
                          {isService
                            ? "Service"
                            : isOutOfStock
                              ? "Out of Stock"
                              : `Stock: ${stockQty} ${item.unit || ""}`}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-bold text-xs">
                          ₹{Number(item.salesPrice || 0).toFixed(2)}
                        </p>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${isSelected
                              ? "bg-white/20 text-white"
                              : isOutOfStock
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300"
                            }`}
                        >
                          {isSelected ? "Selected ✓" : isOutOfStock ? "No Stock" : "+ Add"}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom Confirmation Bar */}
            <div className="border-t border-slate-200 dark:border-zinc-800 mt-4 pt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-zinc-400">
                  {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} selected
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  Subtotal: ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/addItem"
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold text-center shrink-0 cursor-pointer"
                >
                  + Create Item
                </Link>
                <button
                  type="button"
                  onClick={() => setShowItemPopup(false)}
                  className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 transition cursor-pointer shadow-sm"
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
