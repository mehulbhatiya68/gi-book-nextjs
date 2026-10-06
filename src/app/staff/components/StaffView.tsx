"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import PermissionGuard from "@/components/PermissionGuard";
import {
  IoAdd,
  IoClose,
  IoPersonOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoEyeOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";
import { useAuth } from "@/context/AuthContext";
import { staffApi } from "@/lib/api/staff";
import { SkeletonCard, SkeletonBox } from "@/components/Skeleton";

// Helper to format staff phone numbers with country code
function formatPhone(staff: any): string {
  const num = staff?.mobile_number || staff?.mobile;
  if (!num) return "N/A";
  if (staff?.country_code) {
    const code = String(staff.country_code).startsWith("+")
      ? staff.country_code
      : `+${staff.country_code}`;
    return `${code} ${num}`;
  }
  return num;
}

// Helper to count permissions assigned to staff member
function countTotalPermissions(staffPermissions: any = {}): number {
  if (!staffPermissions) return 0;
  if (Array.isArray(staffPermissions)) return staffPermissions.length;
  if (typeof staffPermissions === "object") {
    return Object.values(staffPermissions).reduce<number>((total, actions: any) => {
      if (Array.isArray(actions)) return total + actions.length;
      return total + (actions ? 1 : 0);
    }, 0);
  }
  return 0;
}

// Helper to format module permissions for profile modal detail view
function getPermissionsSummary(staffPermissions: any): Array<{ module: string; actions: string }> {
  if (!staffPermissions || typeof staffPermissions !== "object") return [];
  if (Array.isArray(staffPermissions)) {
    return [{ module: "Assigned Permissions", actions: `${staffPermissions.length} granted` }];
  }
  return Object.entries(staffPermissions).map(([moduleKey, actions]: [string, any]) => {
    const actionNames = Array.isArray(actions)
      ? actions.map((a: any) => (typeof a === "object" ? a.name || a.id : a)).join(", ")
      : String(actions);
    return {
      module: moduleKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      actions: actionNames || "None",
    };
  });
}

export default function StaffView() {
  const { activeBusiness } = useAuth();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStaffDetail, setSelectedStaffDetail] = useState<any>(null);
  const [showDeleteStaffModal, setShowDeleteStaffModal] = useState(false);

  const loadStaff = () => {
    setIsLoading(true);
    staffApi
      .getStaff({ per_page: "all" })
      .then((res: any) => {
        const list = res?.body?.staff || res?.body?.data || (Array.isArray(res?.body) ? res.body : []);
        setStaffList(list);
      })
      .catch((err) => {
        console.error("Failed to load staff members:", err);
        setStaffList([]);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadStaff();
  }, [activeBusiness?.id]);

  const confirmDeleteStaff = async () => {
    if (!selectedStaffDetail) return;
    try {
      await staffApi.deleteStaff(selectedStaffDetail.id);
      loadStaff();
    } catch (err) {
      console.error("Failed to delete staff member:", err);
    }
    setShowDeleteStaffModal(false);
    setSelectedStaffDetail(null);
  };

  return (
    <PermissionGuard module="Staff">
      <div className="space-y-5 select-none gi-page">
        {/* Page Heading */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b gi-divider">
          <div>
            <h1 className="text-2xl font-bold gi-text-primary tracking-tight">
              Staff Members
            </h1>
          </div>

          {hasPermission("Staff", "Create") && (
            <Link href="/addStaff">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg gi-btn-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer whitespace-nowrap"
              >
                <IoAdd className="text-base" />
                <span>Add Staff Member</span>
              </button>
            </Link>
          )}
        </div>

        {/* Mobile Cards View (< 768px) */}
        <div className="block md:hidden space-y-2.5">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 rounded-xl gi-card shadow-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <SkeletonBox className="h-9 w-9 rounded-lg shrink-0" />
                    <div className="space-y-1 min-w-0">
                      <SkeletonBox className="h-4 w-32 rounded-md" />
                      <SkeletonBox className="h-3 w-40 rounded-md" />
                    </div>
                  </div>
                  <SkeletonBox className="h-5 w-14 rounded-full shrink-0" />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t gi-divider text-xs">
                  <div className="space-y-1">
                    <SkeletonBox className="h-3 w-12 rounded" />
                    <SkeletonBox className="h-4 w-24 rounded-md" />
                  </div>
                  <div className="space-y-1">
                    <SkeletonBox className="h-3 w-16 rounded" />
                    <SkeletonBox className="h-4 w-20 rounded-md" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t gi-divider">
                  <SkeletonBox className="h-7 w-24 rounded-lg" />
                  <SkeletonBox className="h-7 w-16 rounded-lg" />
                </div>
              </div>
            ))
          ) : staffList.length === 0 ? (
            <div className="py-8 text-center gi-card text-xs gi-text-muted">
              No staff members added yet. Click &quot;+ Add Staff Member&quot; to create one.
            </div>
          ) : (
            staffList.map((staff) => {
              const permCount = countTotalPermissions(staff.permissions);
              const isActive = staff.status === "active";
              const phone = formatPhone(staff);

              return (
                <div
                  key={staff.id}
                  onClick={() => router.push(`/staffDetails/${staff.id}`)}
                  className="p-3 rounded-xl gi-card shadow-xs space-y-2 cursor-pointer hover:border-indigo-500/40 transition active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-9 w-9 rounded-lg gi-badge-info font-bold text-sm flex items-center justify-center shrink-0">
                        {staff.name?.charAt(0) || "S"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm gi-text-primary truncate">{staff.name}</h3>
                        {staff.email && <p className="text-xs gi-text-muted truncate">{staff.email}</p>}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${isActive ? "gi-badge-success" : "gi-surface-secondary border gi-border gi-text-muted"
                        }`}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t gi-divider text-xs">
                    <div>
                      <span className="gi-text-muted block text-[11px]">Mobile</span>
                      <span className="font-mono font-semibold gi-text-primary">
                        {phone}
                      </span>
                    </div>
                    <div>
                      <span className="gi-text-muted block text-[11px]">Permissions</span>
                      <span className="font-medium gi-text-secondary">
                        {permCount > 0 ? `${permCount} Granted` : "No Permissions"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Data Table (>= 768px) */}
        <div className="hidden md:block gi-table-container shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs gi-table border-collapse">
              <thead>
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Permissions Granted</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y gi-divider">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <SkeletonBox className="h-7 w-7 rounded-md shrink-0" />
                          <div className="space-y-1">
                            <SkeletonBox className="h-4 w-28 rounded-md" />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <SkeletonBox className="h-4 w-36 rounded-md" />
                      </td>
                      <td className="py-3 px-4">
                        <SkeletonBox className="h-4 w-24 rounded-md" />
                      </td>
                      <td className="py-3 px-4">
                        <SkeletonBox className="h-4 w-24 rounded-md" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <SkeletonBox className="h-5 w-14 rounded-full mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <SkeletonBox className="h-7 w-7 rounded-md" />
                          <SkeletonBox className="h-7 w-7 rounded-md" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : staffList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center gi-text-muted text-xs">
                      No staff members added yet. Click &quot;+ Add Staff Member&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  staffList.map((staff) => {
                    const permCount = countTotalPermissions(staff.permissions);
                    const isActive = staff.status === "active";
                    const phone = formatPhone(staff);

                    return (
                      <tr
                        key={staff.id}
                        onClick={() => setSelectedStaffDetail(staff)}
                        className="hover:bg-[var(--gi-hover)] transition cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-md gi-badge-info font-bold text-xs flex items-center justify-center shrink-0">
                              {staff.name?.charAt(0) || "S"}
                            </div>
                            <div className="min-w-0">
                              <p className="gi-mob-primary font-semibold gi-text-primary">{staff.name}</p>
                              <div className="gi-mob-secondary">
                                {staff.email && <span>{staff.email}</span>}
                                {phone !== "N/A" && <><span className="gi-text-muted">·</span><span className="font-mono">{phone}</span></>}
                                <span className="gi-text-muted">·</span>
                                <span>{permCount > 0 ? `${permCount} Permissions` : "No Permissions"}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 gi-text-secondary">
                          {staff.email || "N/A"}
                        </td>
                        <td className="py-3 px-4 font-mono gi-text-secondary">
                          {phone}
                        </td>
                        <td className="py-3 px-4 gi-text-muted">
                          {permCount > 0 ? `${permCount} Permissions` : "No Permissions"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isActive
                                ? "gi-badge-success"
                                : "gi-surface-secondary border gi-border gi-text-muted"
                              }`}
                          >
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => router.push(`/addStaff?id=${staff.id}`)}
                              className="p-1.5 rounded-md gi-badge-info transition"
                              title="Edit Staff"
                            >
                              <IoPencilOutline className="text-base" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Staff Profile Details Modal */}
        {selectedStaffDetail && (
          <div
            onClick={() => setSelectedStaffDetail(null)}
            className="fixed inset-0 z-50 flex items-center justify-center gi-modal-overlay backdrop-blur-sm p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-xl gi-modal-content shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b gi-divider pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg gi-badge-info flex items-center justify-center">
                    <IoPersonOutline />
                  </div>
                  <div>
                    <h2 className="text-base font-bold gi-text-primary">
                      {selectedStaffDetail.name}
                    </h2>
                    <p className="text-[10px] gi-text-muted font-semibold uppercase">
                      Staff Profile Details
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStaffDetail(null)}
                  className="p-1 rounded-md gi-text-muted hover:gi-text-primary"
                >
                  <IoClose className="text-xl" />
                </button>
              </div>

              <div className="space-y-2 rounded-lg gi-surface-secondary p-3 text-xs border gi-border">
                <div className="flex justify-between items-center">
                  <span className="gi-text-muted">Email Address:</span>
                  <span className="font-semibold gi-text-primary">{selectedStaffDetail.email || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="gi-text-muted">Mobile Number:</span>
                  <span className="font-mono font-semibold gi-text-primary">
                    {formatPhone(selectedStaffDetail)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="gi-text-muted">Account Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${selectedStaffDetail.status === "active"
                        ? "gi-badge-success"
                        : "gi-surface-secondary border gi-border gi-text-muted"
                      }`}
                  >
                    {selectedStaffDetail.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="gi-text-muted">Total Permissions:</span>
                  <span className="font-semibold gi-text-primary">
                    {countTotalPermissions(selectedStaffDetail.permissions)} Granted
                  </span>
                </div>
              </div>

              {/* Module Permissions Breakdown */}
              {countTotalPermissions(selectedStaffDetail.permissions) > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold gi-text-primary flex items-center gap-1.5">
                    <IoShieldCheckmarkOutline className="text-indigo-500" />
                    Assigned Module Permissions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {getPermissionsSummary(selectedStaffDetail.permissions).map((item, idx) => (
                      <div key={idx} className="p-2 rounded-md gi-surface border gi-border flex flex-col gap-0.5">
                        <span className="font-semibold gi-text-primary">{item.module}</span>
                        <span className="text-[11px] gi-text-muted capitalize">{item.actions}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t gi-divider">
                <button
                  type="button"
                  onClick={() => router.push(`/addStaff?id=${selectedStaffDetail.id}`)}
                  className="px-3.5 py-1.5 rounded-lg gi-btn-secondary text-xs font-semibold transition cursor-pointer"
                >
                  Edit Permissions
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteStaffModal(true)}
                  className="px-3.5 py-1.5 rounded-lg gi-btn-danger text-xs font-semibold transition cursor-pointer"
                >
                  Delete Staff
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Staff Confirmation Modal */}
        <AnimatePresence>
          {showDeleteStaffModal && selectedStaffDetail && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center gi-modal-overlay backdrop-blur-sm p-4"
              onClick={() => setShowDeleteStaffModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-xl gi-modal-content shadow-2xl overflow-hidden p-6 space-y-4 text-center"
              >
                <div className="h-12 w-12 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center text-xl">
                  <IoTrashOutline />
                </div>

                <div>
                  <h3 className="text-base font-bold gi-text-primary">
                    Delete Staff &quot;{selectedStaffDetail.name}&quot;?
                  </h3>
                  <p className="text-xs gi-text-secondary mt-1">
                    Are you sure you want to delete this staff member? Their access permissions will be immediately revoked.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteStaffModal(false)}
                    className="flex-1 py-2 rounded-lg gi-btn-secondary text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteStaff}
                    className="flex-1 py-2 rounded-lg gi-btn-danger text-xs font-semibold transition cursor-pointer shadow-xs"
                  >
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

