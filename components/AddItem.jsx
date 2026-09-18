"use client";

import { useState, useEffect, startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
    IoArrowBack,
    IoChevronDown,
    IoClose,
    IoCubeOutline,
    IoSaveOutline,
    IoAddCircleOutline,
    IoPencilOutline,
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";
import PermissionGuard from "./PermissionGuard";
import ToggleSwitch from "./ToggleSwitch";

export default function AddItem() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { items = [], setItems, currentUser, hasPermission } = useApp();

    const editId = searchParams?.get("id");

    const [itemName, setItemName] = useState("");
    const [hsnCode, setHsnCode] = useState("");
    const [itemType, setItemType] = useState("Product");
    const [unit, setUnit] = useState("PCS");

    const [salesPrice, setSalesPrice] = useState("");
    const [salesTaxType, setSalesTaxType] = useState("Without Tax");

    const [purchasePrice, setPurchasePrice] = useState("");
    const [purchaseTaxType, setPurchaseTaxType] = useState("With Tax");

    const [gst, setGst] = useState("None");
    const [description, setDescription] = useState("");

    const [showStockModal, setShowStockModal] = useState(false);

    const [stockQuantity, setStockQuantity] = useState("");
    const [stockDate, setStockDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [itemCode, setItemCode] = useState("");
    const [lowStockAlert, setLowStockAlert] = useState(false);
    const [lowStockAt, setLowStockAt] = useState("");

    const [stockSaved, setStockSaved] = useState(false);

    useEffect(() => {
        if (editId && items && items.length > 0) {
            const existing = items.find(
                (savedItem) => String(savedItem.id) === String(editId)
            );
            if (existing) {
                startTransition(() => {
                    setItemName(existing.itemName || "");
                    setHsnCode(existing.hsnCode || "");
                    setItemType(existing.itemType || "Product");
                    setUnit(existing.unit || "PCS");
                    setSalesPrice(existing.salesPrice !== undefined ? String(existing.salesPrice) : "");
                    setSalesTaxType(existing.salesTaxType || "Without Tax");
                    setPurchasePrice(existing.purchasePrice !== undefined ? String(existing.purchasePrice) : "");
                    setPurchaseTaxType(existing.purchaseTaxType || "With Tax");
                    setGst(existing.gst || "None");
                    setDescription(existing.description || "");
                    setStockQuantity(existing.stockQuantity !== undefined ? String(existing.stockQuantity) : "");
                    setStockDate(existing.stockDate || new Date().toISOString().split("T")[0]);
                    setItemCode(existing.itemCode || "");
                    setLowStockAlert(Boolean(existing.lowStockAlert));
                    setLowStockAt(existing.lowStockAt !== undefined ? String(existing.lowStockAt) : "");
                    if (existing.stockQuantity > 0) setStockSaved(true);
                });
            }
        }
    }, [editId, items]);

    const handleSaveItem = (e) => {
        e.preventDefault();

        if (!itemName.trim()) {
            alert("Please enter item name.");
            return;
        }

        const initialQuantity = Number(stockQuantity) || 0;
        const authorName = currentUser?.name || currentUser?.mobile || (currentUser?.isStaff ? "Staff Member" : "Owner");
        const authorRole = currentUser?.role || (currentUser?.isStaff ? "Staff" : "Owner");

        const existingItem = editId ? items.find((i) => String(i.id) === String(editId)) : null;

        const updatedItem = {
            id: editId ? Number(editId) : Date.now(),
            itemName: itemName.trim(),
            hsnCode: hsnCode.trim(),
            itemType,
            unit: itemType === "Service" ? "NA" : unit,
            salesPrice: Number(salesPrice) || 0,
            salesTaxType,
            purchasePrice: itemType === "Service" ? 0 : (Number(purchasePrice) || 0),
            purchaseTaxType,
            gst,
            description: description.trim(),
            stockQuantity: initialQuantity,
            stockDate: stockDate || new Date().toISOString().split("T")[0],
            itemCode: itemCode.trim(),
            lowStockAlert: Boolean(lowStockAlert),
            lowStockAt: Number(lowStockAt) || 0,
            stockValue: initialQuantity * (Number(purchasePrice) || 0),
            stockHistory: existingItem?.stockHistory || (
                initialQuantity > 0
                    ? [
                        {
                            id: Date.now() + 1,
                            type: "add",
                            quantity: initialQuantity,
                            unit: itemType === "Service" ? "NA" : unit,
                            date: stockDate,
                            time: new Date().toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                            }),
                            note: "Opening stock",
                            stockAfter: initialQuantity,
                            stockValue:
                                initialQuantity *
                                (Number(purchasePrice) || 0),
                            adjustedBy: authorName,
                            adjustedByRole: authorRole,
                        },
                    ]
                    : []
            ),
            createdBy: existingItem?.createdBy || authorName,
            createdByRole: existingItem?.createdByRole || authorRole,
            createdAt: existingItem?.createdAt || new Date().toISOString(),
            ...(editId ? {
                updatedBy: authorName,
                updatedByRole: authorRole,
                updatedAt: new Date().toISOString(),
            } : {}),
        };

        if (editId) {
            setItems((prev) =>
                prev.map((item) => (String(item.id) === String(editId) ? updatedItem : item))
            );
        } else {
            setItems((prev) => [...prev, updatedItem]);
        }

        router.replace(editId ? `/items/${editId}` : "/items");
    };

    const saveStockDetails = () => {
        setStockSaved(true);
        setShowStockModal(false);
    };

    return (
        <PermissionGuard module="Item Transaction">
            <div className="space-y-6 pb-12 select-none gi-page">
                {/* Top Control Bar */}
                <div className="flex items-center justify-between gap-3 pb-2 border-b gi-divider">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.push(editId ? `/items/${editId}` : "/items")}
                            className="p-2 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer shrink-0"
                            title="Back to Items"
                        >
                            <IoArrowBack className="text-lg" />
                        </button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
                                {editId ? "Edit Item" : "Create New Item"}
                            </h1>
                            <p className="text-xs gi-text-secondary mt-0.5">
                                {editId ? "Update item pricing & inventory settings" : "Add product or service item to inventory catalog"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="w-full">
                    <div className="rounded-xl gi-card p-6 shadow-sm border gi-divider">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold gi-text-secondary mb-1">
                                        Item Name *
                                    </label>

                                    <input
                                        type="text"
                                        value={itemName}
                                        onChange={(e) => setItemName(e.target.value)}
                                        placeholder="e.g. Industrial Sensor Probe A"
                                        className="w-full h-9 px-3 rounded-lg border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold gi-text-secondary mb-1">
                                        HSN / SAC Code
                                    </label>

                                    <input
                                        type="text"
                                        value={hsnCode}
                                        onChange={(e) => setHsnCode(e.target.value)}
                                        placeholder="e.g. 8471"
                                        className="w-full h-9 px-3 rounded-lg border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold gi-text-secondary mb-1">
                                        Item Type
                                    </label>

                                    <div className="flex items-center gap-1 p-0.5 rounded-lg gi-surface-secondary border gi-border w-full h-9">
                                        <button
                                            type="button"
                                            onClick={() => setItemType("Product")}
                                            className={`flex-1 h-7 rounded text-xs font-semibold transition cursor-pointer ${itemType === "Product" ? "gi-card gi-text-primary shadow-xs" : "gi-text-muted"}`}
                                        >
                                            Product (Physical)
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setItemType("Service")}
                                            className={`flex-1 h-7 rounded text-xs font-semibold transition cursor-pointer ${itemType === "Service" ? "gi-card gi-text-primary shadow-xs" : "gi-text-muted"}`}
                                        >
                                            Service (Labor/Consulting)
                                        </button>
                                    </div>
                                </div>

                                {itemType === "Product" && (
                                    <div>
                                        <label className="block text-xs font-semibold gi-text-secondary mb-1">
                                            Measurement Unit
                                        </label>

                                        <SelectInput value={unit} onChange={setUnit} options={["PCS", "BOX", "KG", "LBS", "MTR", "SETS"]} />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-semibold gi-text-secondary mb-1">
                                        Applicable GST Rate
                                    </label>

                                    <SelectInput value={gst} onChange={setGst} options={["None", "GST @ 5%", "GST @ 12%", "GST @ 18%", "GST @ 28%"]} />
                                </div>
                            </div>

                            <div className={`grid ${itemType === "Product" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"} gap-4`}>
                                <PriceField title="Sales Price (₹)" price={salesPrice} setPrice={setSalesPrice} taxType={salesTaxType} setTaxType={setSalesTaxType} taxOptions={["Without Tax", "With Tax"]} />

                                {itemType === "Product" && (
                                    <PriceField title="Purchase Price (₹)" price={purchasePrice} setPrice={setPurchasePrice} taxType={purchaseTaxType} setTaxType={setPurchaseTaxType} taxOptions={["With Tax", "Without Tax"]} />
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold gi-text-secondary mb-1">
                                    Item Description
                                </label>

                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add specifications or notes..."
                                    rows={3}
                                    className="w-full p-2.5 rounded-lg border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs focus:outline-none focus:border-indigo-500 transition resize-none"
                                />
                            </div>

                            {itemType === "Product" && (
                                <button
                                    type="button"
                                    onClick={() => setShowStockModal(true)}
                                    className="w-full rounded-lg gi-surface-secondary hover:bg-[var(--gi-hover)] border gi-divider p-3.5 text-left transition cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg gi-badge-info flex items-center justify-center shrink-0">
                                            <IoAddCircleOutline className="text-lg" />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="font-semibold text-xs gi-text-primary">
                                                Inventory Stock &amp; Alert Settings
                                            </p>

                                            <p className="text-[11px] gi-text-secondary mt-0.5">
                                                {stockSaved ? `${Number(stockQuantity || 0).toLocaleString("en-IN")} ${unit} opening stock set` : "Add opening stock quantity, item code and low stock alert limit"}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={handleSaveItem}
                                className="w-full h-10 flex items-center justify-center gap-2 rounded-lg gi-btn-primary text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs mt-3"
                            >
                                <IoSaveOutline className="text-base" />
                                <span>{editId ? "Update Item Details" : "Save Product"}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {showStockModal && (
                        <StockModal
                            unit={unit}
                            quantity={stockQuantity}
                            setQuantity={setStockQuantity}
                            date={stockDate}
                            setDate={setStockDate}
                            itemCode={itemCode}
                            setItemCode={setItemCode}
                            lowStockAlert={lowStockAlert}
                            setLowStockAlert={setLowStockAlert}
                            lowStockAt={lowStockAt}
                            setLowStockAt={setLowStockAt}
                            onClose={() => setShowStockModal(false)}
                            onSave={saveStockDetails}
                        />
                    )}
                </AnimatePresence>
            </div>
        </PermissionGuard>
    );
}

function SelectInput({ value, onChange, options }) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-9 px-3 pr-8 appearance-none rounded-lg border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition cursor-pointer"
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>

            <IoChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none gi-text-muted text-sm" />
        </div>
    );
}

function PriceField({ title, price, setPrice, taxType, setTaxType, taxOptions }) {
    return (
        <div>
            <label className="block text-xs font-semibold gi-text-secondary mb-1">
                {title}
            </label>

            <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full h-9 px-3 rounded-lg border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
            />

            <div className="flex items-center gap-1 mt-1.5 p-0.5 rounded-lg gi-surface-secondary border gi-border w-fit">
                {taxOptions.map((option) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => setTaxType(option)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${taxType === option ? "gi-card gi-text-primary shadow-xs" : "gi-text-muted"}`}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
}

function StockModal({ unit, quantity, setQuantity, date, setDate, itemCode, setItemCode, lowStockAlert, setLowStockAlert, lowStockAt, setLowStockAt, onClose, onSave }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center gi-modal-overlay backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2 }} className="w-full max-w-md rounded-xl gi-modal-content p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between gap-3 border-b gi-divider pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg gi-badge-info flex items-center justify-center">
                            <IoCubeOutline className="text-lg" />
                        </div>

                        <h2 className="text-sm font-bold gi-text-primary">
                            Opening Stock Details
                        </h2>
                    </div>

                    <button type="button" onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg gi-text-muted hover:gi-text-primary transition cursor-pointer">
                        <IoClose className="text-xl" />
                    </button>
                </div>

                <div className="space-y-3.5 text-xs">
                    <div>
                        <label className="block text-xs font-semibold gi-text-secondary mb-1">
                            Opening Quantity
                        </label>

                        <div className="relative">
                            <input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" className="w-full h-8 px-3 pr-14 rounded-lg border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs outline-none focus:border-indigo-500" />

                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium gi-text-muted">
                                {unit}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold gi-text-secondary mb-1">
                            As of Date
                        </label>

                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-8 px-3 rounded-lg border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs outline-none focus:border-indigo-500" />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold gi-text-secondary mb-1">
                            Item / Barcode SKU
                        </label>

                        <input type="text" value={itemCode} onChange={(e) => setItemCode(e.target.value)} placeholder="e.g. SKU-1002" className="w-full h-8 px-3 rounded-lg border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs outline-none focus:border-indigo-500" />
                    </div>

                    <div className="rounded-lg gi-surface-secondary border gi-divider p-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="font-semibold text-xs gi-text-primary">
                                    Low Stock Alert
                                </p>

                                <p className="text-[11px] gi-text-secondary">
                                    Notify when stock drops below threshold
                                </p>
                            </div>

                            <ToggleSwitch
                                checked={lowStockAlert}
                                onChange={(val) => setLowStockAlert(val)}
                                size="sm"
                                ariaLabel="Low stock alert toggle"
                            />
                        </div>

                        {lowStockAlert && (
                            <div className="mt-2.5">
                                <label className="block text-[11px] font-semibold gi-text-secondary mb-1">
                                    Low Stock Threshold
                                </label>

                                <div className="relative">
                                    <input type="number" min="0" value={lowStockAt} onChange={(e) => setLowStockAt(e.target.value)} placeholder="Minimum qty" className="w-full h-8 px-3 pr-14 rounded-lg border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs outline-none focus:border-indigo-500" />

                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium gi-text-muted">
                                        {unit}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <button type="button" onClick={onSave} className="w-full h-9 flex items-center justify-center gap-2 rounded-lg gi-btn-primary font-semibold text-xs shadow-xs cursor-pointer">
                        <IoSaveOutline className="text-base" />
                        <span>Save Stock Parameters</span>
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}