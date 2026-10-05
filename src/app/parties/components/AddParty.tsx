"use client";

import { useEffect, useState, startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
    IoArrowBack,
    IoClose,
    IoChevronDown,
    IoLocationOutline,
    IoSaveOutline,
} from "react-icons/io5";
import { useAuth } from "@/context/AuthContext";
import { usePreferences } from "@/lib/hooks/usePreferences";
import PermissionGuard from "@/components/PermissionGuard";
import PageHeader from "@/components/PageHeader";
import { partyApi } from "@/lib/api/party";
import { toast } from "react-toastify";
import LimitReachedView from "@/components/LimitReachedView";
import { useLimitCheck } from "@/lib/hooks/useLimitCheck";

export default function AddParty() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currentUser } = useAuth();
    const [parties, setParties] = useState([]);

    const editId = searchParams?.get("id");
    const isEditMode = Boolean(editId);

    const { isLimitReached, used, quota, featureName } = useLimitCheck("party", isEditMode);

    const [partyName, setPartyName] = useState("");
    const [partyType, setPartyType] = useState("Customer");
    const [phone, setPhone] = useState("");
    const [gstNumber, setGstNumber] = useState("");
    const [openingBalance, setOpeningBalance] = useState("");
    const [balanceType, setBalanceType] = useState("To Receive");

    const [billingAddress, setBillingAddress] = useState({
        address: "",
        state: "",
        pinCode: "",
        city: "",
    });

    const [shippingAddress, setShippingAddress] = useState({
        address: "",
        state: "",
        pinCode: "",
        city: "",
    });

    const [activeAddress, setActiveAddress] = useState(null);
    const [sameAsBilling, setSameAsBilling] = useState(true);
    const [activeTab, setActiveTab] = useState("address");

    const [isLoading, setIsLoading] = useState(isEditMode);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (!isEditMode) {
            startTransition(() => {
                setIsLoading(false);
            });
            return;
        }

        startTransition(async () => {
            try {
                const res: any = await partyApi.getPartyDetails(editId as string).catch(() => null);
                const party = res?.body?.party || res?.body?.data || res?.body;

                if (!party) {
                    router.push("/parties");
                    return;
                }
                
                setPartyName(party.name || party.partyName || "");
                setPartyType(party.type ? (party.type.toLowerCase() === "supplier" ? "Supplier" : "Customer") : (party.partyType || "Customer"));
                setPhone(party.contact_number || party.phone || "");
                setGstNumber(party.gst_number || party.gstNumber || "");
                setOpeningBalance(String(party.opening_balance ?? party.openingBalance ?? ""));
                
                const obType = String(party.opening_balance_type || party.openingBalanceType || "").toLowerCase();
                setBalanceType(obType === "credit" || obType === "cr" ? "To Pay" : "To Receive");

                setBillingAddress({
                    address: party.billing_address?.street || party.billing_address?.address || party.billingAddress?.street || party.billingAddress?.address || "",
                    state: party.billing_address?.state || party.billingAddress?.state || "",
                    pinCode: party.billing_address?.pincode || party.billing_address?.pin || party.billingAddress?.pincode || party.billingAddress?.pin || party.billingAddress?.pinCode || "",
                    city: party.billing_address?.city || party.billingAddress?.city || "",
                });

                setShippingAddress({
                    address: party.shipping_address?.street || party.shipping_address?.address || party.shippingAddress?.street || party.shippingAddress?.address || "",
                    state: party.shipping_address?.state || party.shippingAddress?.state || "",
                    pinCode: party.shipping_address?.pincode || party.shipping_address?.pin || party.shippingAddress?.pincode || party.shippingAddress?.pin || party.shippingAddress?.pinCode || "",
                    city: party.shipping_address?.city || party.shippingAddress?.city || "",
                });

                setSameAsBilling(party.sameAsBilling ?? true);
                setIsLoading(false);
            } catch (error) {
                console.error(error);
                router.push("/parties");
            }
        });
    }, [editId, isEditMode, router]);

    const handleAddressChange = (type: any, field: any, value: any) => {
        if (type === "billing") {
            setBillingAddress((prev) => ({
                ...prev,
                [field]: value,
            }));
        } else {
            setShippingAddress((prev) => ({
                ...prev,
                [field]: value,
            }));
        }
    };

    const handleSave = async (e: any) => {
        e.preventDefault();

        if (!partyName.trim()) {
            setErrorMsg("Party Name is required.");
            return;
        }

        const balance = Number(openingBalance) || 0;
        setIsSaving(true);
        setErrorMsg("");

        try {
            const payload: any = {
                name: partyName.trim(),
                type: partyType.toLowerCase() === "supplier" ? "supplier" : "customer",
                opening_balance: balance,
                opening_balance_type: balanceType === "To Pay" ? "credit" : "debit",
                gst_number: gstNumber.trim() || undefined,
                contact_number: phone.trim() || undefined,
                country_code: 91,
            };

            if (billingAddress.address.trim() || billingAddress.city.trim() || billingAddress.state.trim() || billingAddress.pinCode.trim()) {
                payload.billing_address = {
                    street: billingAddress.address.trim(),
                    city: billingAddress.city.trim(),
                    state: billingAddress.state.trim(),
                    pincode: billingAddress.pinCode.trim(),
                    pin: billingAddress.pinCode.trim(),
                };
            }

            const targetShipping = sameAsBilling ? billingAddress : shippingAddress;
            if (targetShipping.address.trim() || targetShipping.city.trim() || targetShipping.state.trim() || targetShipping.pinCode.trim()) {
                payload.shipping_address = {
                    street: targetShipping.address.trim(),
                    city: targetShipping.city.trim(),
                    state: targetShipping.state.trim(),
                    pincode: targetShipping.pinCode.trim(),
                    pin: targetShipping.pinCode.trim(),
                };
            }

            if (isEditMode && editId) {
                await partyApi.updateParty(editId as string, payload);
                toast.success("Party details updated successfully!");
                router.replace(`/parties/${editId}`);
            } else {
                const res: any = await partyApi.createParty(payload);
                const createdId = res?.body?.party?.id || res?.body?.ledger?.id || res?.body?.id;
                toast.success("Party created successfully!");
                if (createdId) {
                    router.replace(`/parties/${createdId}`);
                } else {
                    router.replace("/parties");
                }
            }
        } catch (error: any) {
            console.error("Failed to save party:", error);
            setErrorMsg(error?.message || "Failed to save party details.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center gi-page">
                <div className="gi-card p-6 rounded-xl border gi-divider text-center shadow-xs">
                    <p className="text-sm gi-text-secondary">
                        Loading party details...
                    </p>
                </div>
            </div>
        );
    }

    if (isLimitReached) {
        return (
            <LimitReachedView
                featureName={featureName}
                usedCount={used}
                quotaLimit={quota}
            />
        );
    }

    return (
        <PermissionGuard module="Ledger" action={isEditMode ? "Update" : "Create"}>
            <div className="max-w-3xl mx-auto space-y-6 pb-12 gi-page select-none">
                {/* Top Control Bar */}
                <PageHeader
                  title={isEditMode ? "Edit Party Profile" : "Add New Party"}
                  subtitle={isEditMode ? "Update contact & billing details" : "Register a customer or vendor account"}
                  backUrl={isEditMode ? `/parties/${editId}` : "/parties"}
                />

                {/* Form Card */}
                <form onSubmit={handleSave} className="gi-card p-6 rounded-xl border gi-divider space-y-5 shadow-xs">
                    {errorMsg && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 text-xs font-semibold">
                            {errorMsg}
                        </div>
                    )}

                    {/* Party Name */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold gi-text-primary">
                            Party / Business Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={partyName}
                            onChange={(e) => {
                                setPartyName(e.target.value);
                                if (errorMsg) setErrorMsg("");
                            }}
                            placeholder="e.g. Apex Retail Enterprises, Global Logistics..."
                            required
                            className="w-full px-3.5 py-2 rounded-lg text-sm gi-input focus:outline-none"
                        />
                    </div>

                    {/* Party Category Selector */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold gi-text-primary">
                            Party Category
                        </label>
                        <div className="flex items-center gap-2 pt-0.5">
                            {["Customer", "Supplier"].map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setPartyType(cat)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${partyType === cat
                                            ? "gi-filter-active border-indigo-500"
                                            : "gi-surface-interactive gi-text-secondary"
                                        }`}
                                >
                                    {cat === "Supplier" ? "Supplier / Vendor" : "Customer"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Phone & GSTIN Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold gi-text-primary">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="e.g. 9876543210"
                                className="w-full px-3.5 py-2 rounded-lg text-sm gi-input focus:outline-none"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold gi-text-primary">
                                GSTIN / Tax ID
                            </label>
                            <input
                                type="text"
                                value={gstNumber}
                                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                                placeholder="e.g. 27AAAAA0000A1Z5"
                                className="w-full px-3.5 py-2 rounded-lg text-sm gi-input focus:outline-none font-mono uppercase"
                            />
                        </div>
                    </div>

                    {/* Opening Financial Balance */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold gi-text-primary">
                            Opening Financial Balance (₹)
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="number"
                                min="0"
                                step="any"
                                value={openingBalance}
                                onChange={(e) => setOpeningBalance(e.target.value)}
                                placeholder="0.00"
                                className="flex-1 px-3.5 py-2 rounded-lg text-sm gi-input focus:outline-none font-bold"
                            />

                            <select
                                value={balanceType}
                                onChange={(e) => setBalanceType(e.target.value)}
                                className="w-full sm:w-40 px-3.5 py-2 rounded-lg text-sm gi-input focus:outline-none cursor-pointer"
                            >
                                <option value="To Receive">To Receive</option>
                                <option value="To Pay">To Pay</option>
                            </select>
                        </div>
                    </div>

                    {/* Address Configuration */}
                    <div className="pt-2 border-t gi-divider space-y-3">
                        <label className="block text-xs font-semibold gi-text-primary">
                            Address Configuration
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setActiveAddress("billing")}
                                className="rounded-xl border gi-divider p-3 text-left transition cursor-pointer bg-[var(--gi-surface)] hover:bg-[var(--gi-hover)]"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="h-8 w-8 rounded-lg gi-badge-info flex items-center justify-center shrink-0">
                                        <IoLocationOutline className="text-base" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="font-semibold text-xs gi-text-primary">
                                            Billing Address
                                        </p>
                                        <p className="text-[11px] gi-text-secondary truncate mt-0.5">
                                            {billingAddress.address || "Click to add billing address..."}
                                        </p>
                                    </div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveAddress("shipping")}
                                className="rounded-xl border gi-divider p-3 text-left transition cursor-pointer bg-[var(--gi-surface)] hover:bg-[var(--gi-hover)]"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="h-8 w-8 rounded-lg gi-badge-info flex items-center justify-center shrink-0">
                                        <IoLocationOutline className="text-base" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="font-semibold text-xs gi-text-primary">
                                            Shipping Address
                                        </p>
                                        <p className="text-[11px] gi-text-secondary truncate mt-0.5">
                                            {shippingAddress.address || "Click to add shipping address..."}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t gi-divider">
                        <button
                            type="button"
                            onClick={() => router.replace(isEditMode ? `/parties/${editId}` : "/parties")}
                            className="px-4 py-2 rounded-lg text-xs font-semibold border gi-surface-interactive gi-text-secondary cursor-pointer"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="px-5 py-2 rounded-lg gi-btn-primary text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
                        >
                            <IoSaveOutline className="text-base" />
                            <span>{isEditMode ? "Update Party Profile" : "Save Party Profile"}</span>
                        </button>
                    </div>
                </form>

                {/* Address Modal */}
                <AnimatePresence>
                    {activeAddress && (
                        <AddressModal
                            type={activeAddress}
                            address={
                                activeAddress === "billing"
                                    ? billingAddress
                                    : shippingAddress
                            }
                            onChange={handleAddressChange}
                            onClose={() => setActiveAddress(null)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </PermissionGuard>
    );
}

function AddressModal({ type, address, onChange, onClose }) {
    const title = type === "billing" ? "Billing Address" : "Shipping Address";

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs gi-modal-overlay"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-md rounded-xl gi-modal-content p-5 shadow-2xl space-y-4"
            >
                <div className="flex items-center justify-between border-b pb-3 gi-divider">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg gi-badge-info flex items-center justify-center">
                            <IoLocationOutline className="text-lg" />
                        </div>

                        <h2 className="text-sm font-bold gi-text-primary">
                            {title}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer"
                    >
                        <IoClose className="text-lg" />
                    </button>
                </div>

                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="block text-xs font-semibold gi-text-primary">
                            Street Address
                        </label>
                        <textarea
                            value={address.address}
                            onChange={(e) => onChange(type, "address", e.target.value)}
                            placeholder="Building, Street name, area..."
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg text-xs gi-input focus:outline-none resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold gi-text-primary">
                                State
                            </label>
                            <input
                                type="text"
                                value={address.state}
                                onChange={(e) => onChange(type, "state", e.target.value)}
                                placeholder="State"
                                className="w-full px-3 py-2 rounded-lg text-xs gi-input focus:outline-none"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-semibold gi-text-primary">
                                City
                            </label>
                            <input
                                type="text"
                                value={address.city}
                                onChange={(e) => onChange(type, "city", e.target.value)}
                                placeholder="City"
                                className="w-full px-3 py-2 rounded-lg text-xs gi-input focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-semibold gi-text-primary">
                            PIN Code
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={address.pinCode}
                            onChange={(e) => onChange(type, "pinCode", e.target.value)}
                            placeholder="PIN Code"
                            className="w-full px-3 py-2 rounded-lg text-xs gi-input focus:outline-none"
                        />
                    </div>

                    <div className="pt-2 flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 rounded-lg gi-btn-primary text-xs font-semibold cursor-pointer shadow-sm"
                        >
                            Save Address
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

