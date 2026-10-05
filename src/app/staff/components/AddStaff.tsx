"use client";

import { useEffect, useState, startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IoArrowBack,
  IoChevronBack,
  IoMailOutline,
  IoCallOutline,
  IoLockClosedOutline,
  IoShieldCheckmarkOutline,
  IoCheckmark,
  IoClose,
  IoPersonAddOutline,
  IoEyeOutline,
  IoEyeOffOutline,
} from "react-icons/io5";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import PermissionGuard from "@/components/PermissionGuard";
import PageHeader from "@/components/PageHeader";
import ToggleSwitch from "@/components/ToggleSwitch";
import { staffApi } from "@/lib/api/staff";
import LimitReachedView from "@/components/LimitReachedView";
import { useLimitCheck } from "@/lib/hooks/useLimitCheck";

// Format module key to human title (e.g. "item_transaction" -> "Item Transaction")
function formatModuleName(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AddStaff() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeBusiness } = useAuth();

  const editingId = searchParams?.get("id");
  const isEditing = Boolean(editingId);

  const { isLimitReached, used, quota, featureName } = useLimitCheck("staff", isEditing);

  const [staffList, setStaffList] = useState<any[]>([]);
  const [catalogPermissions, setCatalogPermissions] = useState<Record<string, Array<{ id: number; name: string }>>>({});
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    allowAccess: true,
  });

  // Fetch catalog permissions on mount (GET /permissions)
  useEffect(() => {
    setIsLoadingPermissions(true);
    staffApi
      .getPermissions()
      .then((res: any) => {
        const permsObj = res?.body?.permissions || res?.permissions || {};
        setCatalogPermissions(permsObj);
      })
      .catch((err) => {
        console.error("Failed to load permissions catalog:", err);
        toast.error("Failed to load permissions catalog.");
      })
      .finally(() => setIsLoadingPermissions(false));
  }, []);

  // Fetch existing staff details when editing (GET /staff/{id})
  useEffect(() => {
    if (!editingId) return;

    staffApi
      .getStaffDetail(editingId)
      .then((res: any) => {
        const staff = res?.body?.staff || res?.body?.data || res?.body || res;
        if (staff && typeof staff === "object" && (staff.id || staff.name)) {
          startTransition(() => {
            setFormData({
              name: staff.name || "",
              email: staff.email || "",
              mobile: staff.mobile_number || staff.mobile || "",
              password: "",
              allowAccess: staff.status ? staff.status === "active" : true,
            });

            // Extract existing permission IDs from staff object
            const ids: number[] = [];
            if (staff.permissions && typeof staff.permissions === "object") {
              if (Array.isArray(staff.permissions)) {
                staff.permissions.forEach((p: any) => {
                  if (typeof p === "number") ids.push(p);
                  else if (p?.id) ids.push(Number(p.id));
                });
              } else {
                Object.values(staff.permissions).forEach((actionList: any) => {
                  if (Array.isArray(actionList)) {
                    actionList.forEach((act: any) => {
                      if (act?.id) ids.push(Number(act.id));
                      else if (typeof act === "number") ids.push(act);
                    });
                  }
                });
              }
            }
            setSelectedPermissionIds(ids);
          });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch staff detail for edit:", err);
      });
  }, [editingId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const togglePermissionId = (id: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const toggleEntireModule = (items: Array<{ id: number; name: string }>) => {
    const moduleIds = items.map((i) => i.id);
    const allSelected = moduleIds.every((id) => selectedPermissionIds.includes(id));

    if (allSelected) {
      setSelectedPermissionIds((prev) => prev.filter((id) => !moduleIds.includes(id)));
    } else {
      setSelectedPermissionIds((prev) => Array.from(new Set([...prev, ...moduleIds])));
    }
  };

  const selectAllPermissions = () => {
    const allIds: number[] = [];
    Object.values(catalogPermissions).forEach((list) => {
      list.forEach((item) => allIds.push(item.id));
    });
    setSelectedPermissionIds(Array.from(new Set(allIds)));
  };

  const clearAllPermissions = () => {
    setSelectedPermissionIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter staff name.");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Please enter staff email.");
      return;
    }

    if (formData.password && formData.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && editingId) {
        // PUT /staff/{id} payload according to staff.md (allowed: name, email, password, mobile_number, country_code, status, permission_ids)
        const updatePayload: any = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          mobile_number: formData.mobile.trim() || undefined,
          country_code: 91,
          status: formData.allowAccess ? "active" : "inactive",
          permission_ids: selectedPermissionIds,
        };

        if (formData.password.trim()) {
          updatePayload.password = formData.password.trim();
        }

        await staffApi.updateStaff(editingId, updatePayload);
        toast.success("Staff member updated successfully!");
      } else {
        // POST /staff/store payload according to staff.md (allowed: name, email, password, mobile_number, country_code, permission_ids)
        const storePayload: any = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password.trim() || "password123",
          mobile_number: formData.mobile.trim() || undefined,
          country_code: 91,
          permission_ids: selectedPermissionIds,
        };

        await staffApi.createStaff(storePayload);
        toast.success("Staff member created successfully!");
      }

      router.replace("/staff");
    } catch (error: any) {
      console.error("Failed to save staff:", error);
      toast.error(error?.message || "Failed to save staff member.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <PermissionGuard module="Staff" action={isEditing ? "Update" : "Create"}>
      <div className="space-y-3 pb-12 select-none gi-page">
        {/* Compact Top Header */}
        <div className="flex items-center justify-between gap-3 py-1">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => router.push("/staff")}
              className="gi-back-btn"
            >
              <IoChevronBack />
              <span className="gi-back-label">Back</span>
            </button>
            <h1 className="text-2xl font-bold gi-text-primary tracking-tight truncate">
              {isEditing ? "Edit Staff Member" : "Add Staff Member"}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Staff Credentials */}
            <div className="lg:col-span-5 space-y-6">
              <section className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-zinc-800">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <IoPersonAddOutline className="text-lg" />
                  </div>

                  <div>
                    <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                      Profile Credentials
                    </h2>
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

                  {!isEditing && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                        Login Password *
                      </label>

                      <div className="relative">
                        <IoLockClosedOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Minimum 8 characters"
                          className="w-full h-9 pl-9 pr-10 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer p-1"
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <IoEyeOffOutline className="text-base" /> : <IoEyeOutline className="text-base" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="pt-2 border-t border-slate-200 dark:border-zinc-800">
                    <div
                      onClick={toggleAccess}
                      className="w-full flex items-center justify-between gap-3 rounded-lg bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-3 text-left transition cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                            formData.allowAccess
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-200 dark:bg-zinc-700 text-slate-500"
                          }`}
                        >
                          <IoShieldCheckmarkOutline className="text-base" />
                        </div>

                        <div>
                          <p className="font-semibold text-xs text-slate-900 dark:text-white">
                            Active Account Status
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                            Controls login & system access status
                          </p>
                        </div>
                      </div>

                      <ToggleSwitch
                        checked={formData.allowAccess}
                        onChange={(val) => setFormData((prev) => ({ ...prev, allowAccess: val }))}
                        size="sm"
                        ariaLabel="Active account status toggle"
                      />
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Right Column: Permission Catalog Matrix */}
            <div className="lg:col-span-7">
              <section className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <IoShieldCheckmarkOutline className="text-lg" />
                    </div>

                    <div>
                      <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                        Module Access Matrix
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Assign module permissions from permission catalog
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllPermissions}
                      className="h-7 px-2.5 rounded border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition text-[11px] font-semibold cursor-pointer"
                    >
                      Select All
                    </button>

                    <button
                      type="button"
                      onClick={clearAllPermissions}
                      className="h-7 px-2.5 rounded border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition text-[11px] font-semibold cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {isLoadingPermissions ? (
                  <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
                    Loading permission catalog...
                  </div>
                ) : Object.keys(catalogPermissions).length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No permissions available in catalog.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(catalogPermissions).map(([moduleKey, items]) => {
                      const moduleName = formatModuleName(moduleKey);
                      const moduleIds = items.map((i) => i.id);
                      const allSelected = moduleIds.every((id) =>
                        selectedPermissionIds.includes(id)
                      );

                      return (
                        <div
                          key={moduleKey}
                          className="rounded-lg bg-slate-50/50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 p-3"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-xs text-slate-900 dark:text-white">
                              {moduleName}
                            </h3>

                            <button
                              type="button"
                              onClick={() => toggleEntireModule(items)}
                              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                            >
                              {allSelected ? "Clear" : "All"}
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {items.map((item) => {
                              const active = selectedPermissionIds.includes(item.id);

                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => togglePermissionId(item.id)}
                                  className={`h-7 px-2.5 rounded text-[11px] font-medium transition flex items-center gap-1 cursor-pointer ${
                                    active
                                      ? "bg-indigo-600 text-white shadow-xs"
                                      : "bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-indigo-500"
                                  }`}
                                >
                                  {active && <IoCheckmark className="text-xs" />}
                                  <span className="capitalize">{item.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </div>

          {/* Bottom Action Footer for Mobile screens (Single Save Staff button at last of page) */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => router.replace("/staff")}
              className="h-10 px-5 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto h-10 px-6 rounded-xl gi-btn-primary disabled:opacity-50 transition text-xs sm:text-sm font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <IoCheckmark className="text-lg" />
              <span>
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                  ? "Update Staff Member"
                  : "Save Staff Member"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </PermissionGuard>
  );
}
