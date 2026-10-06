"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, usePathname, useSearchParams } from "next/navigation";
import { handleSmartBack } from "@/lib/utils/smartNavigation";
import { AnimatePresence, motion } from "motion/react";
import {
  IoChevronBack,
  IoPersonOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoShieldCheckmarkOutline,
  IoMailOutline,
  IoCallOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import PermissionGuard from "@/components/PermissionGuard";
import PageHeader from "@/components/PageHeader";
import { SkeletonDetails } from "@/components/Skeleton";
import { staffApi } from "@/lib/api/staff";

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

export default function StaffDetailsView() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const staffId = params?.id as string;
  const { hasPermission } = useAuth();

  const [staff, setStaff] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStaffDetails = async () => {
    if (!staffId) return;
    setIsLoading(true);
    try {
      const res: any = await staffApi.getStaffDetail(staffId);
      const sObj = res?.body?.staff || res?.body?.data || res?.body;
      setStaff(sObj || null);
    } catch (err) {
      console.error("Failed to load staff details:", err);
      setStaff(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffDetails();
  }, [staffId]);

  const handleDeleteStaff = async () => {
    if (!staffId) return;
    setIsDeleting(true);
    try {
      await staffApi.deleteStaff(staffId);
      toast.success("Staff member deleted successfully.");
      setShowDeleteModal(false);
      router.replace("/staff");
    } catch (err: any) {
      console.error("Failed to delete staff member:", err);
      toast.error(err.message || "Failed to delete staff member.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <PermissionGuard module="Staff">
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <SkeletonDetails />
        </div>
      </PermissionGuard>
    );
  }

  if (!staff) {
    return (
      <PermissionGuard module="Staff">
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center p-6 gi-page">
          <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-2xl text-slate-400">
            <IoPersonOutline />
          </div>
          <div>
            <h2 className="text-lg font-bold gi-text-primary">Staff Member Not Found</h2>
            <p className="text-xs gi-text-secondary mt-1 max-w-sm">
              The staff member details you are looking for may have been removed or does not exist.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSmartBack(router, pathname, searchParams ? searchParams.get("from") : null, "/staff")}
            className="gi-back-btn"
          >
            <IoChevronBack />
            <span className="gi-back-label">Back</span>
          </button>
        </div>
      </PermissionGuard>
    );
  }

  const isActive = staff.status === "active";
  const phone = formatPhone(staff);
  const permCount = countTotalPermissions(staff.permissions);
  const permissionsSummary = getPermissionsSummary(staff.permissions);

  return (
    <PermissionGuard module="Staff">
      <div className="space-y-5 pb-12 select-none gi-page">
        {/* Mobile View (< 768px) - Clean Full Screen Staff Detail Page */}
        <div className="block md:hidden space-y-4">
          {/* Mobile Top Header: Back Arrow + Title + Action Icons */}
          <div className="flex items-center justify-between gap-3 py-1">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => handleSmartBack(router, pathname, searchParams ? searchParams.get("from") : null, "/staff")}
                className="gi-back-btn"
                aria-label="Back"
              >
                <IoChevronBack />
                <span className="gi-back-label">Back</span>
              </button>
              <h1 className="text-xl font-bold gi-text-primary tracking-tight truncate">
                Staff Profile
              </h1>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {hasPermission("Staff", "Edit") && (
                <Link href={`/addStaff?id=${staff.id}`}>
                  <button
                    type="button"
                    className="p-2 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition cursor-pointer"
                    title="Edit Staff"
                  >
                    <IoPencilOutline className="text-xl" />
                  </button>
                </Link>
              )}

              {hasPermission("Staff", "Delete") && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full transition cursor-pointer"
                  title="Delete Staff"
                >
                  <IoTrashOutline className="text-xl" />
                </button>
              )}
            </div>
          </div>

          {/* Main Staff Profile Card */}
          <div className="bg-white dark:bg-[#161B22] border gi-divider rounded-2xl p-4 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl gi-badge-info font-bold text-xl flex items-center justify-center shrink-0 shadow-xs">
                {staff.name?.charAt(0)?.toUpperCase() || "S"}
              </div>
              <div className="min-w-0 space-y-1">
                <h2 className="font-bold text-base gi-text-primary truncate">
                  {staff.name}
                </h2>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isActive
                        ? "gi-badge-success"
                        : "gi-surface-secondary border gi-border gi-text-muted"
                    }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="text-xs gi-text-muted">
                    {permCount > 0 ? `${permCount} Permissions` : "No Permissions"}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Details List */}
            <div className="space-y-2.5 pt-3 border-t gi-divider text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl gi-surface-secondary">
                <span className="gi-text-muted flex items-center gap-1.5 font-medium">
                  <IoCallOutline className="text-sm" />
                  Mobile Number
                </span>
                <span className="font-mono font-bold gi-text-primary">
                  {phone}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl gi-surface-secondary">
                <span className="gi-text-muted flex items-center gap-1.5 font-medium">
                  <IoMailOutline className="text-sm" />
                  Email Address
                </span>
                <span className="font-semibold gi-text-primary truncate max-w-[200px]">
                  {staff.email || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Permissions Section */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold gi-text-primary flex items-center gap-1.5">
                <IoShieldCheckmarkOutline className="text-indigo-600 dark:text-indigo-400 text-base" />
                <span>Assigned Permissions</span>
              </h2>
              <span className="text-xs font-semibold gi-text-secondary">
                {permCount} Total
              </span>
            </div>

            {permissionsSummary.length === 0 ? (
              <div className="py-6 text-center text-xs gi-text-muted bg-white dark:bg-[#161B22] border gi-divider rounded-2xl shadow-xs">
                No permissions assigned to this staff member yet.
              </div>
            ) : (
              <div className="space-y-2">
                {permissionsSummary.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white dark:bg-[#161B22] border gi-divider rounded-2xl shadow-2xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs gi-text-primary flex items-center gap-1.5">
                        <IoCheckmarkCircleOutline className="text-emerald-500 text-sm" />
                        {item.module}
                      </span>
                    </div>
                    <p className="text-xs gi-text-secondary pl-5 capitalize">
                      {item.actions}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop View (>= 768px) */}
        <div className="hidden md:block space-y-6">
          <PageHeader
            title={staff.name}
            subtitle="Staff member profile & access permissions"
            backUrl="/staff"
            actions={
              <div className="flex items-center gap-2">
                {hasPermission("Staff", "Edit") && (
                  <Link href={`/addStaff?id=${staff.id}`}>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-lg border gi-surface-interactive gi-text-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <IoPencilOutline className="text-sm" />
                      <span>Edit Staff</span>
                    </button>
                  </Link>
                )}

                {hasPermission("Staff", "Delete") && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="px-3.5 py-1.5 rounded-lg gi-btn-danger text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                  >
                    <IoTrashOutline className="text-sm" />
                    <span>Delete Staff</span>
                  </button>
                )}
              </div>
            }
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Primary Profile Details (1 col) */}
            <div className="gi-card p-6 space-y-5 shadow-xs">
              <div className="flex items-center gap-3 border-b gi-divider pb-4">
                <div className="h-12 w-12 rounded-xl gi-badge-info font-bold text-lg flex items-center justify-center shrink-0">
                  {staff.name?.charAt(0)?.toUpperCase() || "S"}
                </div>
                <div>
                  <h2 className="text-base font-bold gi-text-primary">{staff.name}</h2>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1 ${
                      isActive
                        ? "gi-badge-success"
                        : "gi-surface-secondary border gi-border gi-text-muted"
                    }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-lg gi-surface-secondary space-y-1">
                  <span className="gi-text-muted font-semibold uppercase text-[10px]">Mobile Number</span>
                  <p className="font-mono font-semibold gi-text-primary text-sm">{phone}</p>
                </div>

                <div className="p-3.5 rounded-lg gi-surface-secondary space-y-1">
                  <span className="gi-text-muted font-semibold uppercase text-[10px]">Email Address</span>
                  <p className="font-semibold gi-text-primary text-sm">{staff.email || "N/A"}</p>
                </div>

                <div className="p-3.5 rounded-lg gi-surface-secondary space-y-1">
                  <span className="gi-text-muted font-semibold uppercase text-[10px]">Total Permissions</span>
                  <p className="font-semibold gi-text-primary text-sm">{permCount} Granted</p>
                </div>
              </div>
            </div>

            {/* Permissions Breakdown (2 cols) */}
            <div className="lg:col-span-2 gi-card p-6 space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b gi-divider pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl shrink-0">
                    <IoShieldCheckmarkOutline />
                  </div>
                  <div>
                    <h2 className="text-base font-bold gi-text-primary">Assigned Module Permissions</h2>
                    <p className="text-xs gi-text-secondary">System access control policies for this user</p>
                  </div>
                </div>
              </div>

              {permissionsSummary.length === 0 ? (
                <div className="py-12 text-center text-xs gi-text-muted gi-surface-secondary rounded-xl">
                  No module permissions assigned to this staff member yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {permissionsSummary.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl gi-surface-secondary border gi-border space-y-1">
                      <span className="font-bold text-sm gi-text-primary flex items-center gap-1.5">
                        <IoCheckmarkCircleOutline className="text-emerald-500 text-base" />
                        {item.module}
                      </span>
                      <p className="text-xs gi-text-secondary pl-5 capitalize">{item.actions}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center gi-modal-overlay backdrop-blur-sm p-4"
              onClick={() => setShowDeleteModal(false)}
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
                    Delete Staff &quot;{staff.name}&quot;?
                  </h3>
                  <p className="text-xs gi-text-secondary mt-1">
                    Are you sure you want to delete this staff member? Their access permissions will be immediately revoked.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-2 rounded-lg gi-btn-secondary text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDeleteStaff}
                    className="flex-1 py-2 rounded-lg gi-btn-danger text-xs font-semibold transition cursor-pointer shadow-xs"
                  >
                    {isDeleting ? "Deleting..." : "Yes, Delete"}
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
