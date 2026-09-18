"use client";

import { useEffect, useState, startTransition } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
    IoArrowBack,
    IoSaveOutline,
    IoCubeOutline,
    IoAddCircleOutline,
    IoRemoveCircleOutline,
    IoTrendingUpOutline,
    IoTrendingDownOutline,
    IoCloseOutline,
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";
import PermissionGuard from "./PermissionGuard";

export default function AdjustStock() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { items, setItems, currentUser } = useApp();

    const itemId = params?.id;
    const initialMode = searchParams?.get("mode") === "reduce" ? "reduce" : "add";

    const [item, setItem] = useState(null);
    const [mode, setMode] = useState(initialMode);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [quantity, setQuantity] = useState("");
    const [note, setNote] = useState("");

    useEffect(() => {
        const foundItem = items.find(
            (savedItem) => String(savedItem.id) === String(itemId)
        );

        if (!foundItem) {
            router.push("/items");
            return;
        }

        startTransition(() => {
            setItem(foundItem);
        });
    }, [itemId, items, router]);

    const handleSave = (e) => {
        if (e) e.preventDefault();
        if (!item) return;

        const adjustedQuantity = Number(quantity);

        if (!adjustedQuantity || adjustedQuantity <= 0) {
            alert("Please enter a valid quantity.");
            return;
        }

        if (mode === "reduce" && adjustedQuantity > Number(item.stockQuantity || 0)) {
            alert("Reduce quantity cannot be greater than current stock.");
            return;
        }

        const authorName = currentUser?.name || currentUser?.mobile || (currentUser?.isStaff ? "Staff Member" : "Owner");
        const authorRole = currentUser?.role || (currentUser?.isStaff ? "Staff" : "Owner");

        setItems((prev) =>
            prev.map((savedItem) => {
                if (String(savedItem.id) !== String(itemId)) {
                    return savedItem;
                }

                const currentStock = Number(savedItem.stockQuantity || 0);

                const newStock =
                    mode === "add"
                        ? currentStock + adjustedQuantity
                        : currentStock - adjustedQuantity;

                const purchasePrice = Number(savedItem.purchasePrice || 0);

                const historyEntry = {
                    id: Date.now(),
                    type: mode,
                    quantity: adjustedQuantity,
                    unit: savedItem.unit,
                    date,
                    time: new Date().toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    note: note.trim() || `${mode === "add" ? "Added" : "Reduced"} stock manually`,
                    stockBefore: currentStock,
                    stockAfter: newStock,
                    stockValue: newStock * purchasePrice,
                    adjustedBy: authorName,
                    adjustedByRole: authorRole,
                };

                return {
                    ...savedItem,
                    stockQuantity: newStock,
                    stockValue: newStock * purchasePrice,
                    updatedBy: authorName,
                    updatedByRole: authorRole,
                    updatedAt: new Date().toISOString(),
                    stockHistory: [
                        ...(savedItem.stockHistory || []),
                        historyEntry,
                    ],
                };
            })
        );

        router.replace(`/items/${itemId}`);
    };

    if (!item) {
        return (
            <div className="min-h-screen p-4 sm:p-6 gi-page flex items-center justify-center">
                <div className="rounded-lg gi-card border gi-divider px-6 py-5 shadow-sm">
                    <p className="text-sm gi-text-secondary">
                        Loading item details...
                    </p>
                </div>
            </div>
        );
    }

    const currentStock = Number(item.stockQuantity || 0);
    const purchasePrice = Number(item.purchasePrice || 0);
    const salesPrice = Number(item.salesPrice || 0);
    const stockValue = Number(item.stockValue || (currentStock * purchasePrice));

    const qtyNum = Number(quantity) || 0;
    const projectedStock = mode === "add" ? currentStock + qtyNum : currentStock - qtyNum;
    const projectedValuation = Math.max(0, projectedStock) * purchasePrice;
    const isReduceInvalid = mode === "reduce" && qtyNum > currentStock;

    return (
        <PermissionGuard module="Item Transaction" action="Update">
            <div className="space-y-6 pb-12 select-none gi-page">
                {/* Header Bar */}
                <div className="flex items-center justify-between gap-3 border-b pb-4 gi-divider">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={() => router.replace(`/items/${itemId}`)}
                            className="p-2 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer shrink-0"
                            title="Back to Item Details"
                        >
                            <IoArrowBack className="text-lg" />
                        </button>

                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight truncate">
                                Adjust Stock Quantity
                            </h1>
                            <p className="text-xs sm:text-sm gi-text-secondary mt-0.5">
                                Manual stock adjustments for <strong className="gi-text-primary">{item.itemName}</strong>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => router.replace(`/items/${itemId}`)}
                            className="px-3.5 py-2 rounded-lg gi-btn-secondary text-xs font-semibold transition cursor-pointer hidden sm:flex items-center gap-1.5"
                        >
                            <IoCloseOutline className="text-base" />
                            <span>Cancel</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isReduceInvalid || qtyNum <= 0}
                            className="px-4 py-2 rounded-lg gi-btn-primary text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <IoSaveOutline className="text-base" />
                            <span>Save Adjustment</span>
                        </button>
                    </div>
                </div>

                {/* Full Width 2-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column (lg:col-span-5): Product Specs & Stock Overview */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="lg:col-span-5 space-y-5"
                    >
                        {/* Product Info Card */}
                        <div className="rounded-xl gi-card border gi-divider p-5 shadow-xs space-y-4">
                            <div className="flex items-start justify-between gap-3 pb-4 border-b gi-divider">
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="h-11 w-11 rounded-xl gi-badge-info font-bold text-lg flex items-center justify-center shrink-0">
                                        <IoCubeOutline className="text-2xl" />
                                    </div>

                                    <div className="min-w-0">
                                        <h2 className="text-base font-bold gi-text-primary truncate">
                                            {item.itemName}
                                        </h2>

                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded gi-badge-info">
                                                {item.itemType || "Product"}
                                            </span>
                                            <span className="text-xs gi-text-secondary">
                                                Unit: <strong className="font-semibold gi-text-primary">{item.unit || "PCS"}</strong>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Current vs Projected Metrics Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg gi-surface-secondary border gi-divider p-3.5">
                                    <p className="text-[10px] gi-text-muted uppercase tracking-wider font-semibold">
                                        Current Stock
                                    </p>
                                    <p className="text-xl font-extrabold gi-text-primary mt-1">
                                        {currentStock.toLocaleString("en-IN")} <span className="text-xs font-normal gi-text-secondary">{item.unit || "PCS"}</span>
                                    </p>
                                    <p className="text-[11px] gi-text-secondary mt-1">
                                        Value: ₹{stockValue.toLocaleString("en-IN")}
                                    </p>
                                </div>

                                <div className={`rounded-lg border p-3.5 transition ${
                                    isReduceInvalid
                                        ? "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200"
                                        : mode === "add" && qtyNum > 0
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-200"
                                        : mode === "reduce" && qtyNum > 0
                                        ? "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200"
                                        : "gi-surface-secondary gi-divider"
                                }`}>
                                    <p className="text-[10px] uppercase tracking-wider font-semibold opacity-80">
                                        Projected Stock
                                    </p>
                                    <p className="text-xl font-extrabold mt-1">
                                        {projectedStock.toLocaleString("en-IN")} <span className="text-xs font-normal opacity-80">{item.unit || "PCS"}</span>
                                    </p>
                                    <p className="text-[11px] mt-1 opacity-80">
                                        Value: ₹{projectedValuation.toLocaleString("en-IN")}
                                    </p>
                                </div>
                            </div>

                            {/* Additional Product Meta */}
                            <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                                <div className="rounded-lg gi-surface-secondary border gi-divider p-3">
                                    <span className="text-[10px] gi-text-muted font-semibold uppercase block">Sales Price</span>
                                    <span className="font-bold gi-text-primary mt-0.5 block">
                                        ₹{salesPrice.toLocaleString("en-IN")}
                                    </span>
                                </div>
                                <div className="rounded-lg gi-surface-secondary border gi-divider p-3">
                                    <span className="text-[10px] gi-text-muted font-semibold uppercase block">Purchase Price</span>
                                    <span className="font-bold gi-text-primary mt-0.5 block">
                                        ₹{purchasePrice.toLocaleString("en-IN")}
                                    </span>
                                </div>
                                <div className="rounded-lg gi-surface-secondary border gi-divider p-3">
                                    <span className="text-[10px] gi-text-muted font-semibold uppercase block">HSN / SKU</span>
                                    <span className="font-mono font-semibold gi-text-primary mt-0.5 block truncate">
                                        {item.hsnCode || item.itemCode || "N/A"}
                                    </span>
                                </div>
                                <div className="rounded-lg gi-surface-secondary border gi-divider p-3">
                                    <span className="text-[10px] gi-text-muted font-semibold uppercase block">GST Rate</span>
                                    <span className="font-semibold gi-text-primary mt-0.5 block">
                                        {item.gst || "None"}
                                    </span>
                                </div>
                            </div>

                            {item.lowStockAlert && currentStock <= Number(item.lowStockAt || 0) && (
                                <div className="p-3 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 text-xs flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                                    <span>Currently in <strong>Low Stock Warning</strong> status (Threshold: {item.lowStockAt} {item.unit})</span>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Right Column (lg:col-span-7): Adjustment Form Controls */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: 0.05 }}
                        className="lg:col-span-7 space-y-5"
                    >
                        <form onSubmit={handleSave} className="rounded-xl gi-card border gi-divider p-5 sm:p-6 shadow-xs space-y-5">
                            <div className="border-b pb-3 gi-divider">
                                <h2 className="text-base font-bold gi-text-primary tracking-tight">
                                    Adjustment Action & Details
                                </h2>
                                <p className="text-xs gi-text-secondary mt-0.5">
                                    Select adjustment type and specify the quantity to add or reduce
                                </p>
                            </div>

                            {/* Adjustment Mode Selector Tabs */}
                            <div>
                                <label className="block text-xs font-semibold gi-text-secondary uppercase tracking-wider mb-2">
                                    Adjustment Type *
                                </label>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setMode("add")}
                                        className={`p-3.5 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-bold transition cursor-pointer ${
                                            mode === "add"
                                                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                                : "gi-surface-interactive border-gi-divider gi-text-secondary hover:gi-text-primary"
                                        }`}
                                    >
                                        <IoAddCircleOutline className="text-lg shrink-0" />
                                        <span>+ Add Stock (Received)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setMode("reduce")}
                                        className={`p-3.5 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-bold transition cursor-pointer ${
                                            mode === "reduce"
                                                ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                                                : "gi-surface-interactive border-gi-divider gi-text-secondary hover:gi-text-primary"
                                        }`}
                                    >
                                        <IoRemoveCircleOutline className="text-lg shrink-0" />
                                        <span>- Reduce Stock (Damaged/Used)</span>
                                    </button>
                                </div>
                            </div>

                            {/* Quantity and Date Inputs Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold gi-text-primary mb-1.5">
                                        Quantity ({item.unit || "PCS"}) *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            step="any"
                                            required
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            placeholder="Enter quantity"
                                            className={`w-full px-3.5 py-2.5 rounded-lg text-sm gi-input focus:outline-none transition ${
                                                isReduceInvalid ? "border-rose-500 focus:border-rose-500" : ""
                                            }`}
                                        />
                                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold gi-text-muted">
                                            {item.unit || "PCS"}
                                        </span>
                                    </div>

                                    {isReduceInvalid && (
                                        <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-semibold">
                                            Cannot reduce more than current stock ({currentStock} {item.unit})
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold gi-text-primary mb-1.5">
                                        Adjustment Date *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-lg text-sm gi-input focus:outline-none cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Note / Remarks */}
                            <div>
                                <label className="block text-xs font-semibold gi-text-primary mb-1.5">
                                    Reason / Note (Optional)
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder={mode === "add" ? "e.g. Received new stock shipment from vendor" : "e.g. Damaged during handling / internal store usage"}
                                    rows={3}
                                    className="w-full px-3.5 py-2.5 rounded-lg text-sm gi-input focus:outline-none transition resize-none"
                                />
                            </div>

                            {/* Live Projection Impact Banner */}
                            {qtyNum > 0 && !isReduceInvalid && (
                                <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                                    mode === "add"
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-200"
                                        : "bg-amber-50 border-amber-200 text-amber-950 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200"
                                }`}>
                                    <div className="flex items-center justify-between font-bold">
                                        <span className="flex items-center gap-1.5">
                                            {mode === "add" ? <IoTrendingUpOutline className="text-base text-emerald-600" /> : <IoTrendingDownOutline className="text-base text-amber-600" />}
                                            <span>Adjustment Summary</span>
                                        </span>
                                        <span>
                                            {mode === "add" ? "+" : "-"}{qtyNum} {item.unit}
                                        </span>
                                    </div>
                                    <p className="leading-relaxed">
                                        Stock will change from <strong>{currentStock} {item.unit}</strong> to <strong>{projectedStock} {item.unit}</strong>.
                                        Total stock valuation will be <strong>₹{projectedValuation.toLocaleString("en-IN")}</strong>.
                                    </p>
                                </div>
                            )}

                            {/* Submit & Cancel Actions */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t gi-divider">
                                <button
                                    type="button"
                                    onClick={() => router.replace(`/items/${itemId}`)}
                                    className="px-4 py-2.5 rounded-lg gi-btn-secondary text-xs font-semibold transition cursor-pointer"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={isReduceInvalid || qtyNum <= 0}
                                    className="px-6 py-2.5 rounded-lg gi-btn-primary text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <IoSaveOutline className="text-base" />
                                    <span>Save Adjustment</span>
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </PermissionGuard>
    );
}