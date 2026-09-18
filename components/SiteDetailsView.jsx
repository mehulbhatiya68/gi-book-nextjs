"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  IoArrowBack,
  IoLocationOutline,
  IoBriefcaseOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoChevronForward,
  IoTimeOutline,
  IoPersonOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoAddOutline,
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";
import PermissionGuard from "./PermissionGuard";

export default function SiteDetailsView() {
  const params = useParams();
  const router = useRouter();
  const siteId = params?.id;

  const { siteProjects = [], setSiteProjects, hasPermission } = useApp();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const site = useMemo(() => {
    if (!siteId) return null;
    return siteProjects.find(
      (item) => item.type === "Site" && String(item.id) === String(siteId)
    );
  }, [siteProjects, siteId]);

  const associatedProject = useMemo(() => {
    if (!site) return null;
    if (site.projectId) {
      const found = siteProjects.find(
        (item) => item.type === "Project" && String(item.id) === String(site.projectId)
      );
      if (found) return found;
    }
    if (site.projectName) {
      return siteProjects.find(
        (item) =>
          item.type === "Project" &&
          item.name.trim().toLowerCase() === site.projectName.trim().toLowerCase()
      );
    }
    return null;
  }, [siteProjects, site]);

  const handleDelete = () => {
    if (!site) return;
    setSiteProjects((prev) => prev.filter((item) => item.id !== site.id));
    setShowDeleteModal(false);
    router.replace("/siteProject");
  };

  if (!site) {
    return (
      <PermissionGuard module="Site">
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center p-6">
          <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-2xl text-slate-400">
            <IoLocationOutline />
          </div>
          <div>
            <h2 className="text-lg font-bold gi-text-primary">Site Not Found</h2>
            <p className="text-xs gi-text-secondary mt-1 max-w-sm">
              The site details you are looking for may have been removed or does not exist.
            </p>
          </div>
          <Link href="/siteProject">
            <button
              type="button"
              className="px-4 py-2 rounded-lg gi-btn-primary text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <IoArrowBack />
              Back to Sites & Projects
            </button>
          </Link>
        </div>
      </PermissionGuard>
    );
  }

  const getStatusBadgeClass = (status) => {
    if (status === "Active" || status === "Ongoing") {
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
    }
    if (status === "Completed") {
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300";
    }
    if (status === "On Hold") {
      return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
    }
    return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300";
  };

  return (
    <PermissionGuard module="Site">
      <div className="space-y-6 pb-12 select-none gi-page">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b gi-divider">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.replace("/siteProject")}
              className="p-2 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer shrink-0 transition"
              title="Back to Sites & Projects"
            >
              <IoArrowBack className="text-lg" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-badge-info">
                  Site Details
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(site.status)}`}>
                  {site.status || "Active"}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight mt-1">
                {site.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasPermission("Site", "Edit") && (
              <Link href={`/addSiteProject?id=${site.id}`}>
                <button
                  type="button"
                  className="px-3.5 py-2 rounded-lg border gi-surface-interactive gi-text-primary text-xs font-semibold flex items-center gap-2 cursor-pointer transition"
                >
                  <IoPencilOutline className="text-sm" />
                  <span>Edit Site</span>
                </button>
              </Link>
            )}

            {hasPermission("Site", "Delete") && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-3.5 py-2 rounded-lg gi-btn-danger text-xs font-semibold flex items-center gap-2 cursor-pointer transition shadow-xs"
              >
                <IoTrashOutline className="text-sm" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Site Primary Overview (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="gi-card p-6 space-y-5">
              <div className="flex items-center gap-3 border-b gi-divider pb-4">
                <div className="h-10 w-10 rounded-xl gi-badge-info flex items-center justify-center text-xl shrink-0">
                  <IoLocationOutline />
                </div>
                <div>
                  <h2 className="text-base font-bold gi-text-primary">Site Information</h2>
                  <p className="text-xs gi-text-secondary">Location & operational specifications</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-lg gi-surface-secondary space-y-1">
                  <span className="gi-text-muted font-semibold uppercase text-[10px]">Site Name</span>
                  <p className="font-medium gi-text-primary text-sm">{site.name}</p>
                </div>

                <div className="p-3.5 rounded-lg gi-surface-secondary space-y-1">
                  <span className="gi-text-muted font-semibold uppercase text-[10px]">Operational Status</span>
                  <div>
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${getStatusBadgeClass(site.status)}`}>
                      {site.status || "Active"}
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-2 p-3.5 rounded-lg gi-surface-secondary space-y-1">
                  <span className="gi-text-muted font-semibold uppercase text-[10px]">Full Address / Location</span>
                  <p className="font-medium gi-text-primary text-xs sm:text-sm leading-relaxed">
                    {site.address || "No detailed address provided."}
                  </p>
                </div>
              </div>

              {/* Audit / Author Info */}
              <div className="pt-4 border-t gi-divider grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] gi-text-muted">
                <div className="flex items-center gap-2">
                  <IoPersonOutline className="text-sm shrink-0" />
                  <span>Created By: <strong className="gi-text-secondary">{site.createdBy || "System"}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <IoTimeOutline className="text-sm shrink-0" />
                  <span>
                    Created Date:{" "}
                    <strong className="gi-text-secondary">
                      {site.createdAt ? new Date(site.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "N/A"}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Associated Project Sidebar Card (1 column) */}
          <div className="space-y-6">
            <div className="gi-card p-6 space-y-5 border-2 border-indigo-500/20 shadow-md">
              <div className="flex items-center justify-between border-b gi-divider pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl gi-badge-warning flex items-center justify-center text-xl shrink-0">
                    <IoBriefcaseOutline />
                  </div>
                  <div>
                    <h2 className="text-base font-bold gi-text-primary">Associated Project</h2>
                    <p className="text-xs gi-text-secondary">Parent project assignment</p>
                  </div>
                </div>
              </div>

              {associatedProject ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase gi-badge-warning">
                          Project
                        </span>
                        <h3 className="text-sm font-bold gi-text-primary mt-1">
                          {associatedProject.name}
                        </h3>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusBadgeClass(associatedProject.status)}`}>
                        {associatedProject.status || "Ongoing"}
                      </span>
                    </div>

                    {associatedProject.description && (
                      <p className="text-xs gi-text-secondary line-clamp-3 leading-relaxed">
                        {associatedProject.description}
                      </p>
                    )}

                    <div className="pt-2 border-t border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between text-xs gi-text-secondary">
                      <span>Status</span>
                      <span className="font-semibold">{associatedProject.status || "Active"}</span>
                    </div>
                  </div>

                  <Link href={`/projectDetails/${associatedProject.id}`} className="block">
                    <button
                      type="button"
                      className="w-full py-2.5 px-4 rounded-xl gi-btn-primary text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                    >
                      <span>View Project Details</span>
                      <IoChevronForward className="text-sm" />
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="p-5 rounded-xl border border-dashed gi-divider text-center space-y-3">
                  <div className="h-10 w-10 mx-auto rounded-full gi-surface-secondary text-amber-500 flex items-center justify-center text-xl">
                    <IoAlertCircleOutline />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold gi-text-primary">No Project Associated</h4>
                    <p className="text-[11px] gi-text-secondary mt-1">
                      {site.projectName
                        ? `Assigned to project "${site.projectName}", but project record was not found.`
                        : "This site is currently independent and not linked to any project."}
                    </p>
                  </div>
                  {hasPermission("Site", "Edit") && (
                    <Link href={`/addSiteProject?id=${site.id}`}>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg border gi-surface-interactive text-xs font-semibold gi-text-primary inline-flex items-center gap-1.5 cursor-pointer mt-1"
                      >
                        <IoAddOutline className="text-sm" />
                        <span>Link to a Project</span>
                      </button>
                    </Link>
                  )}
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
                    Delete Site &quot;{site.name}&quot;?
                  </h3>
                  <p className="text-xs gi-text-secondary mt-1">
                    Are you sure you want to delete this site? This action cannot be undone.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-2 rounded-lg gi-btn-secondary text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
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
