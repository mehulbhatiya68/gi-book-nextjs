"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  IoArrowBack,
  IoBriefcaseOutline,
  IoLocationOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoChevronForward,
  IoTimeOutline,
  IoPersonOutline,
  IoAddOutline,
  IoLayersOutline,
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";
import PermissionGuard from "./PermissionGuard";

export default function ProjectDetailsView() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id;

  const { siteProjects = [], setSiteProjects, hasPermission } = useApp();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const project = useMemo(() => {
    if (!projectId) return null;
    return siteProjects.find(
      (item) => item.type === "Project" && String(item.id) === String(projectId)
    );
  }, [siteProjects, projectId]);

  const relatedSites = useMemo(() => {
    if (!project) return [];
    return siteProjects.filter(
      (item) =>
        item.type === "Site" &&
        (String(item.projectId) === String(project.id) ||
          (item.projectName &&
            item.projectName.trim().toLowerCase() === project.name.trim().toLowerCase()))
    );
  }, [siteProjects, project]);

  const handleDelete = () => {
    if (!project) return;
    setSiteProjects((prev) => prev.filter((item) => item.id !== project.id));
    setShowDeleteModal(false);
    router.replace("/siteProject");
  };

  if (!project) {
    return (
      <PermissionGuard module="Project">
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center p-6">
          <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-2xl text-slate-400">
            <IoBriefcaseOutline />
          </div>
          <div>
            <h2 className="text-lg font-bold gi-text-primary">Project Not Found</h2>
            <p className="text-xs gi-text-secondary mt-1 max-w-sm">
              The project details you are looking for may have been removed or does not exist.
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
    <PermissionGuard module="Project">
      <div className="space-y-6 pb-12 select-none gi-page">
        {/* Header & Controls */}
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
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider gi-badge-warning">
                  Project Details
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(project.status)}`}>
                  {project.status || "Ongoing"}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight mt-1">
                {project.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasPermission("Project", "Edit") && (
              <Link href={`/addSiteProject?id=${project.id}`}>
                <button
                  type="button"
                  className="px-3.5 py-2 rounded-lg border gi-surface-interactive gi-text-primary text-xs font-semibold flex items-center gap-2 cursor-pointer transition"
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
                className="px-3.5 py-2 rounded-lg gi-btn-danger text-xs font-semibold flex items-center gap-2 cursor-pointer transition shadow-xs"
              >
                <IoTrashOutline className="text-sm" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Project Primary Info Overview Card */}
        <div className="gi-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b gi-divider pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gi-badge-warning flex items-center justify-center text-xl shrink-0">
                <IoBriefcaseOutline />
              </div>
              <div>
                <h2 className="text-base font-bold gi-text-primary">Project Overview</h2>
                <p className="text-xs gi-text-secondary">Master project description & status</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs gi-text-muted">Assigned Sites</span>
              <p className="text-base font-extrabold gi-text-primary">{relatedSites.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-lg gi-surface-secondary space-y-1">
              <span className="gi-text-muted font-semibold uppercase text-[10px]">Project Name</span>
              <p className="font-medium gi-text-primary text-sm">{project.name}</p>
            </div>

            <div className="p-3.5 rounded-lg gi-surface-secondary space-y-1">
              <span className="gi-text-muted font-semibold uppercase text-[10px]">Project Status</span>
              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${getStatusBadgeClass(project.status)}`}>
                  {project.status || "Ongoing"}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg gi-surface-secondary space-y-1">
              <span className="gi-text-muted font-semibold uppercase text-[10px]">Associated Sites Count</span>
              <p className="font-medium gi-text-primary text-sm">{relatedSites.length} site(s)</p>
            </div>

            <div className="md:col-span-3 p-3.5 rounded-lg gi-surface-secondary space-y-1">
              <span className="gi-text-muted font-semibold uppercase text-[10px]">Project Description / Scope</span>
              <p className="font-medium gi-text-primary text-xs sm:text-sm leading-relaxed">
                {project.description || "No project description provided."}
              </p>
            </div>
          </div>

          {/* Audit / Author Info */}
          <div className="pt-4 border-t gi-divider grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] gi-text-muted">
            <div className="flex items-center gap-2">
              <IoPersonOutline className="text-sm shrink-0" />
              <span>Created By: <strong className="gi-text-secondary">{project.createdBy || "System"}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <IoTimeOutline className="text-sm shrink-0" />
              <span>
                Created Date:{" "}
                <strong className="gi-text-secondary">
                  {project.createdAt ? new Date(project.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "N/A"}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Related Sites Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gi-badge-info flex items-center justify-center text-base">
                <IoLayersOutline />
              </div>
              <div>
                <h2 className="text-base font-bold gi-text-primary">
                  Related Sites ({relatedSites.length})
                </h2>
                <p className="text-xs gi-text-secondary">
                  Construction and operational locations assigned to this project
                </p>
              </div>
            </div>

            {hasPermission("Site", "Create") && (
              <Link href="/addSiteProject">
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-lg gi-btn-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                >
                  <IoAddOutline className="text-base" />
                  <span>Add New Site</span>
                </button>
              </Link>
            )}
          </div>

          {relatedSites.length === 0 ? (
            <div className="gi-card p-8 text-center space-y-3">
              <div className="h-12 w-12 mx-auto rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 flex items-center justify-center text-xl">
                <IoLocationOutline />
              </div>
              <div>
                <h3 className="text-sm font-bold gi-text-primary">No Sites Linked Yet</h3>
                <p className="text-xs gi-text-secondary mt-1 max-w-sm mx-auto">
                  There are currently no operational sites assigned to project &quot;{project.name}&quot;.
                </p>
              </div>
              {hasPermission("Site", "Create") && (
                <Link href="/addSiteProject" className="inline-block pt-1">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg gi-btn-primary text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <IoAddOutline className="text-base" />
                    <span>Create & Assign Site</span>
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedSites.map((siteItem) => (
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
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${getStatusBadgeClass(siteItem.status)}`}>
                        {siteItem.status || "Active"}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <span className="gi-text-muted font-semibold uppercase text-[9px]">Location / Address</span>
                      <p className="gi-text-secondary text-xs line-clamp-2">
                        {siteItem.address || "No address specified"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t gi-divider flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                    <span>View Site Details</span>
                    <IoChevronForward className="text-sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
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
                    Are you sure you want to delete this project? Sites linked to this project will remain in the database.
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
