"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, usePathname, useSearchParams } from "next/navigation";
import { handleSmartBack } from "@/lib/utils/smartNavigation";
import { AnimatePresence, motion } from "motion/react";
import {
  IoArrowBack,
  IoChevronBack,
  IoBriefcaseOutline,
  IoLocationOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoChevronForward,
  IoTimeOutline,
  IoAddOutline,
  IoLayersOutline,
  IoReceiptOutline,
} from "react-icons/io5";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import PermissionGuard from "@/components/PermissionGuard";
import PageHeader from "@/components/PageHeader";
import { SkeletonDetails } from "@/components/Skeleton";
import { siteProjectApi } from "@/lib/api/siteProject";

export default function ProjectDetailsView() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = params?.id as string;
  const { hasPermission } = useAuth();

  const [project, setProject] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjectDetails = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [projRes, txRes]: [any, any] = await Promise.all([
        siteProjectApi.getProjectDetails(projectId, { silentError: true }),
        siteProjectApi.getTransactions({ type: "project", id: projectId, per_page: "all", silentError: true }).catch(() => ({ body: [] }))
      ]);

      const pObj = projRes?.body?.project || projRes?.body?.data || projRes?.body;
      const txList = Array.isArray(txRes?.body)
        ? txRes.body
        : (txRes?.body?.transactions || txRes?.body?.data || []);

      setProject(pObj || null);
      setTransactions(Array.isArray(txList) ? txList : []);
    } catch (err) {
      console.warn("Failed to load project details:", err);
      setProject(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const handleDeleteProject = async () => {
    if (!projectId) return;
    setIsDeleting(true);
    try {
      await siteProjectApi.deleteProject(projectId);
      toast.success("Project deleted successfully.");
      setShowDeleteModal(false);
      router.replace("/siteProject");
    } catch (err: any) {
      console.error("Failed to delete project:", err);
      toast.error(err.message || "Failed to delete project.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <PermissionGuard module="Project">
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <SkeletonDetails />
        </div>
      </PermissionGuard>
    );
  }

  if (!project) {
    return (
      <PermissionGuard module="Project">
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center p-6 gi-page">
          <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-2xl text-slate-400">
            <IoBriefcaseOutline />
          </div>
          <div>
            <h2 className="text-lg font-bold gi-text-primary">Project Not Found</h2>
            <p className="text-xs gi-text-secondary mt-1 max-w-sm">
              The project details you are looking for may have been removed or does not exist.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSmartBack(router, pathname, searchParams ? searchParams.get("from") : null, "/siteProject")}
            className="gi-back-btn"
          >
            <IoChevronBack />
            <span className="gi-back-label">Back</span>
          </button>
        </div>
      </PermissionGuard>
    );
  }

  const getStatusBadge = (status: string = "") => {
    const s = status.toLowerCase();
    let text = "Ongoing";
    if (s === "completed") text = "Completed";
    else if (s === "on_hold" || s === "on hold") text = "On Hold";
    return (
      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider gi-surface-secondary border gi-border gi-text-secondary">
        {text}
      </span>
    );
  };

  const assignedSites = Array.isArray(project.sites) ? project.sites : [];

  return (
    <PermissionGuard module="Project">
      <div className="space-y-5 pb-12 select-none gi-page">
        {/* Mobile View (< 768px) - Matching Reference Image Design */}
        <div className="block md:hidden space-y-4">
          {/* Mobile Top Header: Back Arrow + Title + Create Site Button & Edit/Delete Icons */}
          <div className="flex items-center justify-between gap-2 py-1">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => handleSmartBack(router, pathname, searchParams ? searchParams.get("from") : null, "/siteProject")}
                className="gi-back-btn"
                aria-label="Back"
              >
                <IoChevronBack />
                <span className="gi-back-label">Back</span>
              </button>
              <h1 className="text-2xl font-bold gi-text-primary tracking-tight truncate">
                {project.name}
              </h1>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {hasPermission("Site", "Create") && (
                <Link href={`/addSiteProject?type=Site&project_id=${project.id}`}>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-xl gi-btn-primary text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    <IoAddOutline className="text-base" />
                    <span>Create Site</span>
                  </button>
                </Link>
              )}

              {hasPermission("Project", "Edit") && (
                <Link href={`/addSiteProject?id=${project.id}&type=Project`}>
                  <button
                    type="button"
                    className="p-2 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition cursor-pointer"
                    title="Edit Project"
                  >
                    <IoPencilOutline className="text-xl" />
                  </button>
                </Link>
              )}

              {hasPermission("Project", "Delete") && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="p-2 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition cursor-pointer"
                  title="Delete Project"
                >
                  <IoTrashOutline className="text-xl" />
                </button>
              )}
            </div>
          </div>

          {/* Project Details Main Overview Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-semibold text-slate-600 dark:text-slate-300 text-lg shrink-0">
                  {project.name ? project.name.charAt(0).toUpperCase() : "P"}
                </div>
                <div className="min-w-0 space-y-1 pt-0.5">
                  <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                    {project.name}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Status : <span className="font-semibold text-indigo-600 dark:text-indigo-400">{project.status ? (project.status.toLowerCase() === 'completed' ? 'Completed' : project.status.toLowerCase() === 'on_hold' ? 'On Hold' : 'Ongoing') : 'Ongoing'}</span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Description : <span className="text-slate-800 dark:text-slate-200">{project.description || "-"}</span>
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 text-xs font-medium shrink-0">
                Project
              </span>
            </div>
          </div>

          {/* Sites Section */}
          <div className="space-y-3 pt-1">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Sites ({assignedSites.length})
            </h2>

            {assignedSites.length === 0 ? (
              <div className="py-6 text-center text-xs gi-text-muted bg-white dark:bg-zinc-900 rounded-2xl shadow-xs">
                No sites assigned to this project.
              </div>
            ) : (
              <div className="space-y-3">
                {assignedSites.map((siteItem: any) => (
                  <div
                    key={siteItem.id}
                    onClick={() => router.push(`/siteDetails/${siteItem.id}`)}
                    className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-xs cursor-pointer hover:shadow-md transition-all flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-semibold text-slate-600 dark:text-slate-300 text-lg shrink-0">
                        {siteItem.name ? siteItem.name.charAt(0).toUpperCase() : "S"}
                      </div>
                      <div className="min-w-0 space-y-1 pt-0.5">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {siteItem.name}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Status : <span className="font-semibold text-emerald-600 dark:text-emerald-400">{siteItem.status || "Active"}</span>
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                          Description : <span className="text-slate-800 dark:text-slate-200">{siteItem.location || siteItem.address || siteItem.description || "-"}</span>
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 text-xs font-medium shrink-0">
                      Site
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ledger Transactions Section (Bottom) */}
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-bold gi-text-primary">
              Ledger Transactions ({transactions.length})
            </h2>

            {transactions.length === 0 ? (
              <div className="py-6 text-center text-xs gi-text-muted bg-white dark:bg-zinc-900 rounded-2xl shadow-xs">
                No ledger transactions recorded for this project yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {transactions.map((tx: any) => {
                  const targetId = tx.id || tx.payment_id || tx.paymentId || tx.transaction_number;
                  return (
                    <div
                      key={tx.id}
                      onClick={() => {
                        if (targetId) router.push(`/paymentDetails/${targetId}?from=${encodeURIComponent(pathname)}`);
                      }}
                      className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 shadow-xs space-y-2 cursor-pointer hover:border-indigo-500/40 transition active:scale-[0.99]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold gi-text-primary block font-mono">
                            {tx.transaction_number || tx.number || (tx.id ? `TXN-${String(tx.id).slice(0, 8).toUpperCase()}` : "Transaction")}
                          </span>
                          <span className="text-[11px] gi-text-muted">
                            {tx.transaction_date || tx.created_at ? new Date(tx.transaction_date || tx.created_at).toLocaleDateString("en-IN") : "N/A"}
                          </span>
                        </div>
                        <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-100">
                          ₹{Number(tx.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t gi-divider text-xs">
                        <div>
                          <span className="gi-text-muted block text-[11px]">Party Account</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200 truncate block">
                            {tx.party_ledger?.name || tx.party_name || "-"}
                          </span>
                        </div>
                        <div>
                          <span className="gi-text-muted block text-[11px]">Payment Account</span>
                          <span className="font-medium gi-text-secondary truncate block">
                            {tx.payment_ledger?.name || tx.payment_name || "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Desktop View (>= 768px) */}
        <div className="hidden md:block space-y-6">
          {/* Header & Action Controls */}
          <PageHeader
            title={project.name}
            subtitle="Project overview and assigned sites"
            backUrl="/siteProject"
            actions={
              <div className="flex items-center gap-2">
                {hasPermission("Site", "Create") && (
                  <Link href={`/addSiteProject?type=Site&project_id=${project.id}`}>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-lg gi-btn-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                    >
                      <IoAddOutline className="text-sm" />
                      <span>Create Site</span>
                    </button>
                  </Link>
                )}

                {hasPermission("Project", "Edit") && (
                  <Link href={`/addSiteProject?id=${project.id}&type=Project`}>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-lg border gi-surface-interactive gi-text-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <IoPencilOutline className="text-sm" />
                      <span>Edit Project</span>
                    </button>
                  </Link>
                )}

                {hasPermission("Project", "Delete") && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="px-3.5 py-1.5 rounded-lg gi-btn-danger text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                  >
                    <IoTrashOutline className="text-sm" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            }
          />

          {/* Overview Card */}
          <div className="gi-card p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b gi-divider pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl gi-badge-warning flex items-center justify-center text-xl shrink-0">
                  <IoBriefcaseOutline />
                </div>
                <div>
                  <h2 className="text-base font-bold gi-text-primary">Project Overview</h2>
                  <p className="text-xs gi-text-secondary">Project scope and specifications</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] gi-text-muted uppercase font-semibold">Assigned Sites</span>
                <p className="text-base font-extrabold gi-text-primary">{assignedSites.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-lg gi-surface-secondary space-y-1">
                <span className="gi-text-muted font-semibold uppercase text-[10px]">Project Name</span>
                <p className="font-semibold gi-text-primary text-sm">{project.name}</p>
              </div>

              <div className="p-3.5 rounded-lg gi-surface-secondary space-y-1">
                <span className="gi-text-muted font-semibold uppercase text-[10px]">Lifecycle Status</span>
                <div>{getStatusBadge(project.status)}</div>
              </div>

              <div className="p-3.5 rounded-lg gi-surface-secondary space-y-1">
                <span className="gi-text-muted font-semibold uppercase text-[10px]">Created Date</span>
                <p className="font-medium gi-text-primary text-xs">
                  {project.created_at ? new Date(project.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "N/A"}
                </p>
              </div>

              <div className="md:col-span-3 p-3.5 rounded-lg gi-surface-secondary space-y-1">
                <span className="gi-text-muted font-semibold uppercase text-[10px]">Description / Scope</span>
                <p className="font-medium gi-text-primary text-xs leading-relaxed">
                  {project.description || "No detailed project description specified."}
                </p>
              </div>
            </div>
          </div>

          {/* Assigned Sites Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg gi-badge-info flex items-center justify-center text-base">
                  <IoLayersOutline />
                </div>
                <div>
                  <h2 className="text-base font-bold gi-text-primary">
                    Assigned Sites ({assignedSites.length})
                  </h2>
                  <p className="text-xs gi-text-secondary">
                    Sites operating under project &quot;{project.name}&quot;
                  </p>
                </div>
              </div>
            </div>

            {assignedSites.length === 0 ? (
              <div className="gi-card p-8 text-center space-y-3 shadow-xs">
                <div className="h-12 w-12 mx-auto rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 flex items-center justify-center text-xl">
                  <IoLocationOutline />
                </div>
                <div>
                  <h3 className="text-sm font-bold gi-text-primary">No Sites Assigned</h3>
                  <p className="text-xs gi-text-secondary mt-1 max-w-sm mx-auto">
                    There are currently no operational sites linked to this project.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignedSites.map((siteItem: any) => (
                  <div
                    key={siteItem.id}
                    onClick={() => router.push(`/siteDetails/${siteItem.id}`)}
                    className="gi-card p-5 hover:border-indigo-500/50 hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg gi-badge-info flex items-center justify-center shrink-0">
                            <IoLocationOutline className="text-base" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold gi-text-primary group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate">
                              {siteItem.name}
                            </h3>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase gi-badge-info">
                              Site
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase gi-surface-secondary border gi-border gi-text-secondary">
                          {siteItem.status || "Active"}
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <span className="gi-text-muted font-semibold uppercase text-[9px]">Location</span>
                        <p className="gi-text-secondary text-xs line-clamp-2">
                          {siteItem.location || siteItem.address || "No location details specified"}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t gi-divider flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      <span>View Site Details</span>
                      <IoChevronForward className="text-sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Project Transactions History */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gi-badge-info flex items-center justify-center text-base">
                <IoReceiptOutline />
              </div>
              <div>
                <h2 className="text-base font-bold gi-text-primary">Project Transactions ({transactions.length})</h2>
                <p className="text-xs gi-text-secondary">Financial entries linked to this project</p>
              </div>
            </div>

            <div className="gi-table-container shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs gi-table border-collapse">
                  <thead>
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Txn Ref</th>
                      <th className="py-3 px-4">Party Account</th>
                      <th className="py-3 px-4">Payment Account</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y gi-divider">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center gi-text-muted text-xs">
                          No transactions recorded for this project yet.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx: any) => {
                        const targetId = tx.id || tx.payment_id || tx.paymentId || tx.transaction_number;
                        return (
                          <tr
                            key={tx.id}
                            onClick={() => {
                              if (targetId) router.push(`/paymentDetails/${targetId}?from=${encodeURIComponent(pathname)}`);
                            }}
                            className="hover:bg-[var(--gi-hover)] transition cursor-pointer"
                          >
                            <td className="py-3 px-4 font-medium gi-text-secondary">
                              {tx.transaction_date || tx.created_at ? new Date(tx.transaction_date || tx.created_at).toLocaleDateString("en-IN") : "N/A"}
                            </td>
                            <td className="py-3 px-4 font-semibold gi-text-primary font-mono">
                              {tx.transaction_number || tx.number || (tx.id ? `TXN-${String(tx.id).slice(0, 8).toUpperCase()}` : "—")}
                            </td>
                            <td className="py-3 px-4 font-medium gi-text-primary">
                              {tx.party_ledger?.name || tx.party_name || "-"}
                            </td>
                            <td className="py-3 px-4 gi-text-secondary">
                              {tx.payment_ledger?.name || tx.payment_name || "-"}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${tx.type === "payment_in"
                                  ? "gi-badge-success"
                                  : tx.type === "payment_out"
                                    ? "gi-badge-warning"
                                    : "gi-badge-info"
                                }`}>
                                {tx.type ? tx.type.replace("_", " ") : "Transaction"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-extrabold gi-text-primary">
                              ₹{Number(tx.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
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
                    Delete Project &quot;{project.name}&quot;?
                  </h3>
                  <p className="text-xs gi-text-secondary mt-1">
                    Are you sure you want to delete this project? This action cannot be undone.
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
                    onClick={handleDeleteProject}
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
