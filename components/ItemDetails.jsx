"use client";

import { useEffect, useState, startTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
    IoArrowBack,
    IoCreateOutline,
    IoTrashOutline,
    IoAddCircleOutline,
    IoRemoveCircleOutline,
    IoCubeOutline,
    IoCalendarOutline,
    IoTimeOutline,
    IoTrendingUpOutline,
    IoCloseOutline,
    IoSaveOutline,
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";
import PermissionGuard from "./PermissionGuard";

export default function ItemDetails() {
    const router = useRouter();
    const params = useParams();
    const { items, setItems, hasPermission, currentUser } = useApp();

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showEdit, setShowEdit] = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    const [editData, setEditData] = useState({
        itemName: "",
        hsnCode: "",
        itemType: "Product",
        unit: "PCS",
        salesPrice: "",
        purchasePrice: "",
        gst: "None",
        description: "",
        itemCode: "",
        lowStockAlert: false,
        lowStockAt: "",
    });

    useEffect(() => {
        const foundItem = items.find(
            (savedItem) => String(savedItem.id) === String(params.id)
        );

        startTransition(() => {
            if (foundItem) {
                setItem(foundItem);
            } else {
                router.push("/items");
            }

            setLoading(false);
        });
    }, [items, params.id, router]);

    const openEditPopup = () => {
        if (!item) {
            return;
        }

        setEditData({
            itemName: item.itemName || "",
            hsnCode: item.hsnCode || "",
            itemType: item.itemType || "Product",
            unit: item.unit || "PCS",
            salesPrice: item.salesPrice ?? "",
            purchasePrice: item.purchasePrice ?? "",
            gst: item.gst || "None",
            description: item.description || "",
            itemCode: item.itemCode || "",
            lowStockAlert: Boolean(item.lowStockAlert),
            lowStockAt: item.lowStockAt ?? "",
        });

        setShowEdit(true);
    };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;

        setEditData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const saveEdit = (e) => {
        e.preventDefault();

        if (!editData.itemName.trim()) {
            alert("Item Name is required.");
            return;
        }

        if (!item) {
            return;
        }

        const authorName = currentUser?.name || currentUser?.mobile || (currentUser?.isStaff ? "Staff Member" : "Owner");
        const authorRole = currentUser?.role || (currentUser?.isStaff ? "Staff" : "Owner");

        setItems((prev) =>
            prev.map((savedItem) => {
                if (String(savedItem.id) !== String(item.id)) {
                    return savedItem;
                }

                return {
                    ...savedItem,
                    itemName: editData.itemName.trim(),
                    hsnCode: editData.hsnCode.trim(),
                    itemType: editData.itemType,
                    unit: editData.itemType === "Service" ? "NA" : editData.unit,
                    salesPrice: Number(editData.salesPrice) || 0,
                    purchasePrice: editData.itemType === "Service" ? 0 : (Number(editData.purchasePrice) || 0),
                    gst: editData.gst,
                    description: editData.description.trim(),
                    itemCode: editData.itemCode.trim(),
                    lowStockAlert: editData.lowStockAlert,
                    lowStockAt: Number(editData.lowStockAt) || 0,
                    updatedBy: authorName,
                    updatedByRole: authorRole,
                    updatedAt: new Date().toISOString(),
                };
            })
        );

        setShowEdit(false);
    };

    const deleteItem = () => {
        if (!item) {
            return;
        }

        setItems((prev) => prev.filter((savedItem) => String(savedItem.id) !== String(item.id)));
        setShowDelete(false);
        router.push("/items");
    };

    if (loading) {
        return (
            <div className="min-h-screen p-4 sm:p-6 text-slate-900 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
                <div className="rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-6 py-5 shadow-sm">
                    <p className="text-sm text-slate-500 dark:text-zinc-400">Loading item...</p>
                </div>
            </div>
        );
    }

    if (!item) {
        return null;
    }

    const stock = Number(item.stockQuantity || 0);
    const stockValue = Number(item.stockValue || 0);

    const history = [...(item.stockHistory || [])].sort((a, b) => new Date(`${b.date} ${b.time || ""}`) - new Date(`${a.date} ${a.time || ""}`));

    return (
        <PermissionGuard module="Item Transaction">
            <div className="space-y-6 pb-12 text-slate-900 dark:text-zinc-100">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 border-b pb-4 gi-divider">
                    <div className="flex items-center gap-3 min-w-0">
                        <button type="button" onClick={() => router.push("/items")} className="p-2 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer shrink-0" title="Go Back to Items">
                            <IoArrowBack className="text-lg" />
                        </button>

                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight truncate">
                                {item.itemName}
                            </h1>
                            <p className="text-xs sm:text-sm gi-text-secondary mt-0.5">
                                Inventory Product Specifications & Stock Adjustments
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {hasPermission("Item Transaction", "Update") && (
                            <button type="button" onClick={() => router.push(`/addItem?id=${item.id}`)} className="h-9 px-3.5 flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer font-medium text-xs shadow-xs">
                                <IoCreateOutline className="text-base" />
                                <span>Edit Item</span>
                            </button>
                        )}

                        {hasPermission("Item Transaction", "Delete") && (
                            <button type="button" onClick={() => setShowDelete(true)} className="h-9 px-3.5 flex items-center justify-center gap-1.5 rounded-md bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer font-medium text-xs shadow-xs">
                                <IoTrashOutline className="text-base" />
                                <span>Delete</span>
                            </button>
                        )}

                        {hasPermission("Item Transaction", "Update") && (
                            <button type="button" onClick={() => router.push(`/adjustStock/${item.id}?mode=add`)} className="h-9 px-3.5 flex items-center justify-center gap-1.5 rounded-md bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-zinc-200 transition cursor-pointer font-medium text-xs shadow-xs">
                                <IoCreateOutline className="text-base" />
                                <span>Adjust Stock</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Specifications & Pricing */}
                    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="lg:col-span-5 rounded-xl gi-card border gi-divider p-5 sm:p-6 shadow-xs space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b gi-divider">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="h-12 w-12 rounded-xl gi-badge-info font-bold text-lg flex items-center justify-center shrink-0">
                                    <IoCubeOutline className="text-2xl" />
                                </div>

                                <div className="min-w-0">
                                    <h2 className="text-base sm:text-lg font-bold gi-text-primary truncate">
                                        {item.itemName}
                                    </h2>

                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded gi-badge-info">
                                            {item.itemType}
                                        </span>

                                        <span className="text-xs gi-text-secondary">
                                            Unit: <strong className="font-semibold gi-text-primary">{item.unit}</strong>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="sm:text-right shrink-0">
                                <p className="text-[11px] font-extrabold uppercase tracking-wider gi-text-muted">
                                    Current Stock
                                </p>

                                <p className="text-xl font-bold gi-text-primary mt-0.5">
                                    {stock.toLocaleString("en-IN")} {item.unit}
                                </p>

                                {item.lowStockAlert && stock <= Number(item.lowStockAt || 0) && (
                                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                        Low Stock Warning
                                    </span>
                                )}
                            </div>
                        </div>

                        {hasPermission("Item Transaction", "Update") && (
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => router.push(`/adjustStock/${item.id}?mode=add`)}
                                    className="py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs text-center"
                                >
                                    + Add Stock
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push(`/adjustStock/${item.id}?mode=reduce`)}
                                    className="py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs text-center"
                                >
                                    - Reduce Stock
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <InfoBox title="Sales Price" value={`₹${Number(item.salesPrice || 0).toLocaleString("en-IN")}`} />
                            <InfoBox title="Purchase Price" value={`₹${Number(item.purchasePrice || 0).toLocaleString("en-IN")}`} />
                            <InfoBox title="Stock Value" value={`₹${stockValue.toLocaleString("en-IN")}`} />
                            <InfoBox title="GST Rate" value={item.gst || "None"} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <InfoBox title="HSN / SAC Code" value={item.hsnCode || "N/A"} />
                            <InfoBox title="Item / SKU Code" value={item.itemCode || "N/A"} />
                        </div>

                        {item.description && (
                            <div className="rounded-lg gi-surface-secondary border gi-divider p-3.5">
                                <p className="text-[10px] gi-text-muted uppercase tracking-wider font-semibold mb-1">
                                    Description &amp; Notes
                                </p>
                                <p className="text-xs gi-text-secondary leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        )}

                        {(item.createdBy || item.updatedBy) && (
                            <div className="flex flex-col gap-1.5 pt-3 border-t gi-divider text-[11px] gi-text-secondary">
                                {item.createdBy && (
                                    <div>
                                        Created by: <strong className="gi-text-primary">{item.createdBy}</strong>
                                        {item.createdAt && ` on ${new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                                    </div>
                                )}
                                {item.updatedBy && (
                                    <div>
                                        Last updated by: <strong className="gi-text-primary">{item.updatedBy}</strong>
                                        {item.updatedAt && ` on ${new Date(item.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.section>

                    {/* Right Column: Stock Movement & Adjustments Log */}
                    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.1 }} className="lg:col-span-7 rounded-xl gi-card border gi-divider p-5 sm:p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between gap-3 pb-3 border-b gi-divider">
                            <div>
                                <h2 className="text-base font-bold gi-text-primary tracking-tight">
                                    Stock Movement &amp; Adjustments Log
                                </h2>
                                <p className="text-xs gi-text-secondary mt-0.5">
                                    Audit history of stock additions and reductions
                                </p>
                            </div>

                            <span className="text-xs px-2.5 py-1 rounded-lg gi-badge-info font-bold shrink-0">
                                {history.length} {history.length === 1 ? "Entry" : "Entries"}
                            </span>
                        </div>

                        <div>
                            {history.length === 0 ? (
                                <div className="py-12 text-center gi-text-secondary">
                                    <IoTrendingUpOutline className="text-3xl mx-auto mb-2 gi-text-muted" />
                                    <p className="font-semibold text-sm gi-text-primary">
                                        No Stock Adjustments
                                    </p>
                                    <p className="text-xs gi-text-secondary mt-1">
                                        Stock movements will appear here once recorded.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {history.map((entry, index) => (
                                        <StockHistoryCard key={entry.id || index} entry={entry} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.section>
                </div>

                {/* Edit Item Modal */}
                <AnimatePresence>
                    {showEdit && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2 }} className="w-full max-w-lg rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                                <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-zinc-800">
                                    <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100">
                                        Edit Item Details
                                    </h3>
                                    <button type="button" onClick={() => setShowEdit(false)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                                        <IoCloseOutline className="text-xl" />
                                    </button>
                                </div>

                                <form onSubmit={saveEdit} className="space-y-4 text-xs">
                                    <div>
                                        <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">Item Name *</label>
                                        <input type="text" name="itemName" value={editData.itemName} onChange={handleEditChange} required className="w-full p-2.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-600" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">Sales Price (₹)</label>
                                            <input type="number" name="salesPrice" value={editData.salesPrice} onChange={handleEditChange} className="w-full p-2.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-600" />
                                        </div>
                                        <div>
                                            <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">Purchase Price (₹)</label>
                                            <input type="number" name="purchasePrice" value={editData.purchasePrice} onChange={handleEditChange} className="w-full p-2.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-600" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">HSN / SAC Code</label>
                                            <input type="text" name="hsnCode" value={editData.hsnCode} onChange={handleEditChange} className="w-full p-2.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-600" />
                                        </div>
                                        <div>
                                            <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">Item SKU Code</label>
                                            <input type="text" name="itemCode" value={editData.itemCode} onChange={handleEditChange} className="w-full p-2.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-600" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">Description</label>
                                        <textarea name="description" rows={2} value={editData.description} onChange={handleEditChange} className="w-full p-2.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-indigo-600 resize-none" />
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-zinc-800">
                                        <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2 rounded-md text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer">
                                            Cancel
                                        </button>
                                        <button type="submit" className="px-5 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold transition cursor-pointer shadow-xs">
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Delete Modal */}
                <AnimatePresence>
                    {showDelete && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 1, y: 0 }} transition={{ duration: 0.2 }} className="w-full max-w-md rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl text-center space-y-4">
                                <div className="h-12 w-12 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center text-xl">
                                    <IoTrashOutline />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                                        Delete &quot;{item.itemName}&quot;?
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                                        This action is permanent and cannot be undone.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <button type="button" onClick={() => setShowDelete(false)} className="flex-1 py-2 rounded-md border border-slate-200 dark:border-zinc-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer text-slate-700 dark:text-zinc-300">
                                        Cancel
                                    </button>
                                    <button type="button" onClick={() => deleteItem()} className="flex-1 py-2 rounded-md bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition cursor-pointer">
                                        Yes, Delete
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

function InfoBox({ title, value }) {
    return (
        <div className="rounded-lg gi-surface-secondary border gi-divider p-3">
            <p className="text-[10px] gi-text-muted uppercase tracking-wider font-semibold">
                {title}
            </p>
            <p className="font-bold text-xs sm:text-sm mt-0.5 truncate gi-text-primary">
                {value}
            </p>
        </div>
    );
}

function StockHistoryCard({ entry }) {
    const isAdd = entry.type === "add";
    const formattedDate = entry.date ? new Date(entry.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "No date";

    return (
        <div className="p-3 rounded-xl border gi-divider gi-surface-interactive text-xs transition space-y-2">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 font-bold text-xs ${isAdd
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300"
                        }`}>
                        {isAdd ? <IoAddCircleOutline className="text-base" /> : <IoRemoveCircleOutline className="text-base" />}
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold gi-text-primary text-xs">
                                {isAdd ? "Stock Added" : "Stock Reduced"}
                            </span>
                            <span className="text-[10px] gi-text-secondary flex items-center gap-1">
                                <IoCalendarOutline className="text-xs" />
                                {formattedDate} {entry.time ? `• ${entry.time}` : ""}
                            </span>
                            {entry.adjustedBy && (
                                <span className="text-[10px] gi-text-secondary font-medium">
                                    by {entry.adjustedBy}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="text-right shrink-0">
                    <p className={`font-bold text-xs sm:text-sm ${isAdd ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}>
                        {isAdd ? "+" : "-"}{Number(entry.quantity || 0).toLocaleString("en-IN")} {entry.unit}
                    </p>
                    <p className="text-[10px] gi-text-secondary mt-0.5">
                        After: <span className="font-semibold gi-text-primary">{Number(entry.stockAfter || 0).toLocaleString("en-IN")} {entry.unit}</span>
                    </p>
                </div>
            </div>

            {(entry.note || entry.stockValue) && (
                <div className="flex items-center justify-between gap-2 pt-2 border-t gi-divider text-[11px] gi-text-secondary">
                    {entry.note ? (
                        <p className="truncate italic gi-text-secondary">
                            &quot;{entry.note}&quot;
                        </p>
                    ) : <span />}
                    {entry.stockValue ? (
                        <span className="shrink-0 font-semibold gi-text-primary">
                            Valuation: ₹{Number(entry.stockValue || 0).toLocaleString("en-IN")}
                        </span>
                    ) : null}
                </div>
            )}
        </div>
    );
}
