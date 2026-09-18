"use client";

import { useEffect, useState, startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    IoArrowBack,
    IoMailOutline,
    IoCallOutline,
    IoLockClosedOutline,
    IoShieldCheckmarkOutline,
    IoCheckmark,
    IoClose,
    IoPersonAddOutline,
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";
import PermissionGuard from "./PermissionGuard";
import ToggleSwitch from "./ToggleSwitch";

const PERMISSION_MODULES = [
    { name: "Business", actions: ["View", "Create", "Update", "Delete"] },
    { name: "Staff", actions: ["View", "Create", "Update", "Delete"] },
    { name: "Subscription", actions: ["View", "Create"] },
    { name: "Payment", actions: ["View", "Create"] },
    { name: "Setting", actions: ["View", "Create"] },
    { name: "Ledger", actions: ["View", "Create", "Update", "Delete"] },
    { name: "Item Transaction", actions: ["View", "Create", "Update", "Delete"] },
    { name: "Invoice", actions: ["View", "Create", "Update", "Delete"] },
    { name: "Project", actions: ["View", "Create", "Update", "Delete"] },
    { name: "Site", actions: ["View", "Create", "Update", "Delete"] },
    { name: "Report", actions: ["View"] },
    { name: "Notification", actions: ["View"] },
];

const emptyPermissions = () => {
    const permissions = {};

    PERMISSION_MODULES.forEach((module) => {
        permissions[module.name] = [];
    });

    return permissions;
};

export default function AddStaff() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { staffList, setStaffList, activeBusiness, currentUser } = useApp();

    const editingId = searchParams?.get("id");
    const isEditing = Boolean(editingId);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobile: "",
        password: "",
        allowAccess: true,
    });

    const [permissions, setPermissions] = useState(emptyPermissions());

    useEffect(() => {
        if (!editingId) return;

        const staff = staffList.find((item) => item.id === editingId);

        if (!staff) return;

        startTransition(() => {
            setFormData({
                name: staff.name || "",
                email: staff.email || "",
                mobile: staff.mobile || "",
                password: staff.password || "",
                allowAccess: Boolean(staff.allowAccess),
            });

            if (staff.permissions) {
                setPermissions((prev) => ({
                    ...prev,
                    ...staff.permissions,
                }));
            }
        });
    }, [editingId, staffList]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const toggleAccess = () => {
        setFormData((prev) => ({
            ...prev,
            allowAccess: !prev.allowAccess,
        }));
    };

    const togglePermission = (moduleName, action) => {
        setPermissions((prev) => {
            const currentActions = prev[moduleName] || [];
            const exists = currentActions.includes(action);

            const updatedActions = exists
                ? currentActions.filter((act) => act !== action)
                : [...currentActions, action];

            return {
                ...prev,
                [moduleName]: updatedActions,
            };
        });
    };

    const toggleEntireModule = (moduleName, actions) => {
        setPermissions((prev) => {
            const currentActions = prev[moduleName] || [];
            const allSelected = actions.every((action) =>
                currentActions.includes(action)
            );

            return {
                ...prev,
                [moduleName]: allSelected ? [] : [...actions],
            };
        });
    };

    const clearModule = (moduleName) => {
        setPermissions((prev) => ({
            ...prev,
            [moduleName]: [],
        }));
    };

    const selectAllPermissions = () => {
        const all = {};

        PERMISSION_MODULES.forEach((module) => {
            all[module.name] = [...module.actions];
        });

        setPermissions(all);
    };

    const clearAllPermissions = () => {
        setPermissions(emptyPermissions());
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert("Please enter staff name.");
            return;
        }

        if (!formData.email.trim()) {
            alert("Please enter staff email.");
            return;
        }

        const ownerUserKey = currentUser?.isStaff && currentUser?.ownerKey 
            ? currentUser.ownerKey 
            : (currentUser?.email || currentUser?.mobile || currentUser?.name || "guest").toLowerCase().replace(/[^a-z0-9]/g, "_");
        const ownerBizKey = activeBusiness?.id 
            ? String(activeBusiness.id).replace(/[^a-z0-9]/gi, "_") 
            : "default_biz";
        const currentBizName = activeBusiness?.name || activeBusiness?.businessName || currentUser?.businessName || "GI Enterprises";

        if (isEditing) {
            setStaffList((prev) =>
                prev.map((staff) =>
                    staff.id === editingId
                        ? {
                            ...staff,
                            ...formData,
                            businessId: staff.businessId || activeBusiness?.id,
                            businessName: staff.businessName || currentBizName,
                            ownerKey: staff.ownerKey || ownerUserKey,
                            bizKey: staff.bizKey || ownerBizKey,
                            assignedBusiness: staff.assignedBusiness || activeBusiness,
                            permissions,
                        }
                        : staff
                )
            );
        } else {
            const newStaff = {
                id: `staff-${Date.now()}`,
                ...formData,
                businessId: activeBusiness?.id,
                businessName: currentBizName,
                ownerKey: ownerUserKey,
                bizKey: ownerBizKey,
                assignedBusiness: activeBusiness,
                permissions,
                createdAt: new Date().toISOString(),
            };

            setStaffList((prev) => [...prev, newStaff]);
        }

        router.replace("/staff");
    };

    return (
        <PermissionGuard module="Staff" action={isEditing ? "Update" : "Create"}>
            <div className="space-y-6 pb-12">
                {/* Top Controls */}
                <div className="flex items-center justify-between gap-3 pb-2 border-b gi-divider">
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => router.replace("/staff")} className="p-2 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer shrink-0" title="Back to Staff">
                            <IoArrowBack className="text-lg" />
                        </button>
                        <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
                            {isEditing ? "Edit Staff Member" : "Add Staff Member"}
                        </h1>
                    </div>

                    <button onClick={handleSubmit} className="h-9 px-4 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer font-semibold text-xs sm:text-sm shadow-sm shrink-0">
                        <IoCheckmark className="text-lg" />
                        <span>
                            {isEditing ? "Update Staff" : "Save Staff Member"}
                        </span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Left Column: Staff Credentials & Actions */}
                        <div className="lg:col-span-5 space-y-6">
                            <section className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-sm space-y-4">
                                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-zinc-800">
                                    <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                        <IoPersonAddOutline className="text-lg" />
                                    </div>

                                    <div>
                                        <h2 className="font-bold text-sm text-slate-900 dark:text-white">Profile Credentials</h2>
                                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                                            Name, contact information and login credentials
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                                            Full Name *
                                        </label>

                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="e.g. Rahul Sharma"
                                            className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                                            Email Address *
                                        </label>

                                        <div className="relative">
                                            <IoMailOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="rahul@company.com"
                                                className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                                            Mobile Phone Number
                                        </label>

                                        <div className="relative">
                                            <IoCallOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

                                            <input
                                                type="tel"
                                                name="mobile"
                                                value={formData.mobile}
                                                onChange={handleChange}
                                                placeholder="9876543210"
                                                className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                                            Login Password
                                        </label>

                                        <div className="relative">
                                            <IoLockClosedOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                placeholder="••••••••"
                                                className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-200 dark:border-zinc-800">
                                    <div onClick={toggleAccess} className="w-full flex items-center justify-between gap-3 rounded-lg bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-3 text-left transition cursor-pointer select-none">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${formData.allowAccess ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-zinc-700 text-slate-500"}`}>
                                                <IoShieldCheckmarkOutline className="text-base" />
                                            </div>

                                            <div>
                                                <p className="font-semibold text-xs text-slate-900 dark:text-white">
                                                    Enable Active System Access
                                                </p>
                                                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                                                    Controls workspace login access
                                                </p>
                                            </div>
                                        </div>

                                        <ToggleSwitch
                                            checked={formData.allowAccess}
                                            onChange={(val) => setFormData((prev) => ({ ...prev, allowAccess: val }))}
                                            size="sm"
                                            ariaLabel="Enable active system access toggle"
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => router.replace("/staff")} className="h-9 px-4 rounded-lg bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition text-xs font-semibold cursor-pointer">
                                    Cancel
                                </button>

                                <button type="submit" className="h-9 px-5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer">
                                    <IoCheckmark className="text-base" />
                                    <span>{isEditing ? "Update Staff Profile" : "Save Staff Member"}</span>
                                </button>
                            </div>
                        </div>

                        {/* Right Column: Permission Module Access Matrix */}
                        <div className="lg:col-span-7">
                            {formData.allowAccess ? (
                                <section className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-sm space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-zinc-800">
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                                <IoShieldCheckmarkOutline className="text-lg" />
                                            </div>

                                            <div>
                                                <h2 className="font-bold text-sm text-slate-900 dark:text-white">Module Access Matrix</h2>
                                                <p className="text-xs text-slate-500 dark:text-zinc-400">
                                                    Grant view, create, edit, or delete capabilities per module
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={selectAllPermissions} className="h-7 px-2.5 rounded border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition text-[11px] font-semibold">
                                                Select All
                                            </button>

                                            <button type="button" onClick={clearAllPermissions} className="h-7 px-2.5 rounded border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition text-[11px] font-semibold">
                                                Clear All
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {PERMISSION_MODULES.map((module) => {
                                            const selected = permissions[module.name] || [];
                                            const allSelected = selected.length === module.actions.length;

                                            return (
                                                <div key={module.name} className="rounded-lg bg-slate-50/50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 p-3">
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <h3 className="font-semibold text-xs text-slate-900 dark:text-white">
                                                            {module.name}
                                                        </h3>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toggleEntireModule(module.name, module.actions)
                                                            }
                                                            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                                        >
                                                            {allSelected ? "Clear" : "All"}
                                                        </button>
                                                    </div>

                                                    <div className="flex flex-wrap gap-1.5">
                                                        {module.actions.map((action) => {
                                                            const active = selected.includes(action);

                                                            return (
                                                                <button
                                                                    key={action}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        togglePermission(module.name, action)
                                                                    }
                                                                    className={`h-7 px-2.5 rounded text-[11px] font-medium transition flex items-center gap-1 cursor-pointer ${active ? "bg-indigo-600 text-white shadow-sm" : "bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-indigo-500"}`}
                                                                >
                                                                    {active && <IoCheckmark className="text-xs" />}
                                                                    {action}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            ) : (
                                <div className="rounded-xl border border-dashed border-slate-300 dark:border-zinc-800 p-8 text-center bg-slate-50/50 dark:bg-zinc-900/50">
                                    <p className="text-sm font-semibold text-slate-600 dark:text-zinc-400">System Access Disabled</p>
                                    <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Toggle &quot;Enable Active System Access&quot; on the left to configure permissions for this staff member.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </PermissionGuard>
    );
}