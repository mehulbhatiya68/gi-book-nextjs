"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import PermissionGuard from "./PermissionGuard";
import PaginationControls from "./PaginationControls";
import {
  IoAdd,
  IoClose,
  IoPersonOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoEyeOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoSwapVerticalOutline,
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";

const PERMISSION_MODULES = [
  { key: "business", label: "Business", actions: ["view", "create", "update", "delete"] },
  { key: "staff", label: "Staff", actions: ["view", "create", "update", "delete"] },
  { key: "subscription", label: "Subscription", actions: ["view", "create"] },
  { key: "payment", label: "Payment", actions: ["view", "create"] },
  { key: "setting", label: "Setting", actions: ["view", "create"] },
  { key: "ledger", label: "Ledger", actions: ["view", "create", "update", "delete"] },
  { key: "itemTransaction", label: "Item Transaction", actions: ["view", "create", "update", "delete"] },
  { key: "invoice", label: "Invoice", actions: ["view", "create", "update", "delete"] },
  { key: "project", label: "Project", actions: ["view", "create", "update", "delete"] },
  { key: "site", label: "Site", actions: ["view", "create", "update", "delete"] },
  { key: "report", label: "Report", actions: ["view"] },
  { key: "notification", label: "Notification", actions: ["view"] },
];

export default function StaffView() {
  const router = useRouter();
  const { staffList = [], setStaffList, hasPermission } = useApp();
  const [selectedStaffDetail, setSelectedStaffDetail] = useState(null);
  const [showDeleteStaffModal, setShowDeleteStaffModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        return { key: null, direction: "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const countTotalPermissions = (staffPermissions = {}) => {
    return Object.values(staffPermissions).reduce((total, actions) => total + (actions?.length || 0), 0);
  };

  const sortedStaff = useMemo(() => {
    if (!sortConfig.key) return staffList;
    return [...staffList].sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case "name":
          aVal = (a.name || "").toLowerCase();
          bVal = (b.name || "").toLowerCase();
          break;
        case "email":
          aVal = (a.email || "").toLowerCase();
          bVal = (b.email || "").toLowerCase();
          break;
        case "mobile":
          aVal = (a.mobile || "").toLowerCase();
          bVal = (b.mobile || "").toLowerCase();
          break;
        case "permissions":
          aVal = countTotalPermissions(a.permissions);
          bVal = countTotalPermissions(b.permissions);
          break;
        case "status":
          aVal = a.allowAccess ? 1 : 0;
          bVal = b.allowAccess ? 1 : 0;
          break;
        default:
          return 0;
      }
      if (typeof aVal === "string") {
        return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [staffList, sortConfig]);

  const confirmDeleteStaff = () => {
    if (!selectedStaffDetail) return;
    setStaffList((prev) => prev.filter((item) => item.id !== selectedStaffDetail.id));
    setShowDeleteStaffModal(false);
    setSelectedStaffDetail(null);
  };

  return (
    <PermissionGuard module="Staff">
      <div className="space-y-5 select-none gi-page">
        {/* Page Heading */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
              Staff Members
            </h1>
            <p className="text-xs gi-text-secondary mt-0.5">
              Manage team access permissions and staff roles
            </p>
          </div>

          {hasPermission("Staff", "Create") && (
            <Link href="/addStaff">
              <button
                type="button"
                className="px-3.5 py-2 rounded-lg gi-btn-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer whitespace-nowrap"
              >
                <IoAdd className="text-base" />
                <span>Add Staff Member</span>
              </button>
            </Link>
          )}
        </div>

        {/* Staff Data Table */}
        <div className="gi-table-container shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs gi-table border-collapse">
              <thead>
                <tr>
                  {[
                    { key: "name", label: "Staff Member", align: "left" },
                    { key: "email", label: "Email", align: "left" },
                    { key: "mobile", label: "Mobile", align: "left" },
                    { key: "permissions", label: "Permissions Granted", align: "left" },
                    { key: "status", label: "Status", align: "center" },
                  ].map((col, idx) => {
                    const isActive = sortConfig.key === col.key;
                    return (
                      <th
                        key={idx}
                        onClick={() => handleSort(col.key)}
                        className={`py-3 px-4 cursor-pointer select-none hover:bg-[var(--gi-hover)] transition text-${col.align}`}
                      >
                        <div className={`flex items-center gap-1.5 ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : "justify-start"}`}>
                          <span>{col.label}</span>
                          {isActive ? (
                            sortConfig.direction === "asc" ? (
                              <IoArrowUpOutline className="text-xs text-indigo-500 shrink-0" />
                            ) : (
                              <IoArrowDownOutline className="text-xs text-indigo-500 shrink-0" />
                            )
                          ) : (
                            <IoSwapVerticalOutline className="text-xs text-slate-400 opacity-40 hover:opacity-100 shrink-0" />
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y gi-divider">
                {sortedStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center gi-text-muted text-xs">
                      No staff members added yet. Click &quot;+ Add Staff Member&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  sortedStaff.map((staff) => {
                    const permCount = countTotalPermissions(staff.permissions);

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
                                {staff.mobile && <><span className="gi-text-muted">·</span><span className="font-mono">{staff.mobile}</span></>}
                                <span className="gi-text-muted">·</span>
                                <span>{staff.allowAccess ? `${permCount} Permissions` : "Access Disabled"}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 gi-text-secondary">
                          {staff.email || "N/A"}
                        </td>
                        <td className="py-3 px-4 font-mono gi-text-secondary">
                          {staff.mobile || "N/A"}
                        </td>
                        <td className="py-3 px-4 gi-text-muted">
                          {staff.allowAccess ? `${permCount} Permissions` : "Access Disabled"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${staff.allowAccess
                              ? "gi-badge-success"
                              : "gi-surface-secondary border gi-border gi-text-muted"
                              }`}
                          >
                            {staff.allowAccess ? "Allowed" : "Disabled"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedStaffDetail(staff)}
                              className="p-1.5 rounded-md hover:bg-[var(--gi-hover)] gi-text-secondary transition"
                              title="View Profile Details"
                            >
                              <IoEyeOutline className="text-base" />
                            </button>
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
                <div className="flex justify-between">
                  <span className="gi-text-muted">Email Address:</span>
                  <span className="font-semibold gi-text-primary">{selectedStaffDetail.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="gi-text-muted">Mobile Number:</span>
                  <span className="font-mono font-semibold gi-text-primary">{selectedStaffDetail.mobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="gi-text-muted">Login Password:</span>
                  <span className="font-mono gi-surface px-1.5 py-0.5 rounded border gi-border font-semibold gi-text-primary">
                    {selectedStaffDetail.password}
                  </span>
                </div>
              </div>

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
