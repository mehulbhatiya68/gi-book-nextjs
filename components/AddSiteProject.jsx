"use client";

import { useEffect, useState, startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  IoArrowBack,
  IoSaveOutline,
  IoCheckmark,
  IoLocationOutline,
  IoBriefcaseOutline,
  IoLayersOutline,
  IoChevronDown,
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";
import PermissionGuard from "./PermissionGuard";

function getNewId() {
  return Date.now();
}

export default function AddSiteProject() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { siteProjects, setSiteProjects, currentUser } = useApp();

  const editId = searchParams?.get("id");

  const [name, setName] = useState("");
  const [type, setType] = useState("Site");

  const [projectId, setProjectId] = useState("");
  const [address, setAddress] = useState("");
  const [siteStatus, setSiteStatus] = useState("Active");

  const [description, setDescription] = useState("");
  const [projectStatus, setProjectStatus] = useState("Ongoing");

  const projects = siteProjects.filter((item) => item.type === "Project");

  useEffect(() => {
    if (editId) {
      const existing = siteProjects.find(
        (item) => String(item.id) === String(editId)
      );

      if (existing) {
        startTransition(() => {
          setName(existing.name || "");
          setType(existing.type || "Site");

          if (existing.type === "Site") {
            setProjectId(existing.projectId || "");
            setAddress(existing.address || "");
            setSiteStatus(existing.status || "Active");
          } else {
            setDescription(existing.description || "");
            setProjectStatus(existing.status || "Ongoing");
          }
        });
      }
    }
  }, [editId, siteProjects]);

  const handleSave = () => {
    if (!name.trim()) {
      alert("Please enter site or project name.");
      return;
    }

    if (type === "Site" && !address.trim()) {
      alert("Please enter site address.");
      return;
    }

    const selectedProject = projects.find(
      (project) => String(project.id) === String(projectId)
    );

    const authorName =
      currentUser?.role === "staff"
        ? currentUser.staffName || currentUser.name || "Staff Member"
        : currentUser?.name || "Business Owner";
    const authorRole = currentUser?.role === "staff" ? "Staff" : "Owner";

    const existing = editId
      ? siteProjects.find((item) => String(item.id) === String(editId))
      : null;

    const newId = editId ? Number(editId) : getNewId();

    const item = {
      id: newId,
      name: name.trim(),
      type,
      status: type === "Site" ? siteStatus : projectStatus,
      projectId: type === "Site" ? projectId : null,
      projectName: type === "Site" ? selectedProject?.name || "" : "",
      address: type === "Site" ? address.trim() : "",
      description: type === "Project" ? description.trim() : "",
      createdAt: existing?.createdAt || new Date().toISOString(),
      createdBy: existing?.createdBy || authorName,
      createdByRole: existing?.createdByRole || authorRole,
      ...(editId
        ? {
            updatedAt: new Date().toISOString(),
            updatedBy: authorName,
            updatedByRole: authorRole,
          }
        : {}),
    };

    if (editId) {
      setSiteProjects((prev) =>
        prev.map((existingItem) =>
          String(existingItem.id) === String(editId) ? item : existingItem
        )
      );
    } else {
      setSiteProjects((prev) => [...prev, item]);
    }

    router.replace("/siteProject");
  };

  const selectedProjectObj = projects.find(
    (p) => String(p.id) === String(projectId)
  );

  return (
    <PermissionGuard module={type === "Site" ? "Site" : "Project"}>
      <div className="w-full max-w-full space-y-4 select-none gi-page">
        {/* Top Controls */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b gi-divider">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.replace("/siteProject")}
              className="p-2 rounded-lg border gi-surface-interactive gi-text-secondary cursor-pointer shrink-0"
              title="Go Back"
            >
              <IoArrowBack className="text-lg" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
                Add {type}
              </h1>
              <p className="text-xs gi-text-secondary mt-0.5">
                Register job site location or project entity
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={handleSave}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="px-4 py-2 rounded-lg gi-btn-primary text-xs font-semibold flex items-center justify-center gap-2 transition shadow-xs cursor-pointer shrink-0"
          >
            <IoCheckmark className="text-base" />
            <span>Save {type}</span>
          </motion.button>
        </div>

        {/* Full Width 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Section: Form Inputs (7 Cols) */}
          <div className="lg:col-span-7 gi-card p-5 space-y-4">
            {/* Animated Type Selector Pill */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold gi-text-secondary uppercase tracking-wider">
                Entity Category *
              </label>
              <div className="relative flex items-center p-1 rounded-xl gi-surface-secondary border gi-divider max-w-md">
                <button
                  type="button"
                  onClick={() => setType("Site")}
                  className={`relative z-10 flex-1 py-2 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                    type === "Site"
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "gi-text-muted"
                  }`}
                >
                  <IoLocationOutline className="text-sm" />
                  <span>Site</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType("Project")}
                  className={`relative z-10 flex-1 py-2 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                    type === "Project"
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "gi-text-muted"
                  }`}
                >
                  <IoBriefcaseOutline className="text-sm" />
                  <span>Project</span>
                </button>

                <motion.div
                  layoutId="activeTypeHighlight"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute inset-y-1 rounded-lg bg-white dark:bg-zinc-800 shadow-sm border border-slate-200 dark:border-zinc-700"
                  style={{
                    left: type === "Site" ? "4px" : "calc(50% + 2px)",
                    width: "calc(50% - 6px)",
                  }}
                />
              </div>
            </div>

            {/* Item Name Input */}
            <div className="space-y-1.5 max-w-md">
              <label className="block text-xs font-bold gi-text-secondary uppercase tracking-wider">
                {type} Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  type === "Site"
                    ? "e.g. Metro Station Block B Site"
                    : "e.g. City Infrastructure Phase 2"
                }
                className="w-full h-10 px-3.5 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition shadow-2xs"
              />
            </div>

            {/* Animated Conditional Form Fields */}
            <AnimatePresence mode="wait">
              <motion.div
                key={type}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {type === "Site" ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                      {/* Parent Project Dropdown */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold gi-text-secondary uppercase tracking-wider">
                          Parent Project
                        </label>
                        <div className="relative">
                          <select
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                            className="w-full h-10 px-3.5 pr-8 appearance-none rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                          >
                            <option value="">Independent Site (No Project)</option>
                            {projects.map((proj) => (
                              <option key={proj.id} value={proj.id}>
                                {proj.name}
                              </option>
                            ))}
                          </select>
                          <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none gi-text-muted text-sm" />
                        </div>
                      </div>

                      {/* Site Status Animated Selector */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold gi-text-secondary uppercase tracking-wider">
                          Site Status
                        </label>
                        <div className="relative flex items-center p-1 rounded-xl gi-surface-secondary border gi-divider">
                          {["Active", "Inactive"].map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setSiteStatus(st)}
                              className={`relative z-10 flex-1 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                                siteStatus === st
                                  ? "text-indigo-600 dark:text-indigo-400"
                                  : "gi-text-muted"
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                          <motion.div
                            layoutId="activeSiteStatusHighlight"
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 30,
                            }}
                            className="absolute inset-y-1 rounded-lg bg-white dark:bg-zinc-800 shadow-sm border border-slate-200 dark:border-zinc-700"
                            style={{
                              left:
                                siteStatus === "Active"
                                  ? "4px"
                                  : "calc(50% + 2px)",
                              width: "calc(50% - 6px)",
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Site Address Input */}
                    <div className="space-y-1.5 max-w-lg">
                      <label className="block text-xs font-bold gi-text-secondary uppercase tracking-wider">
                        Site Location / Full Address *
                      </label>
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter detailed site address or landmark location..."
                        rows={2}
                        className="w-full p-3 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs focus:outline-none focus:border-indigo-500 transition resize-none shadow-2xs"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Project Status Selector */}
                    <div className="space-y-1.5 max-w-md">
                      <label className="block text-xs font-bold gi-text-secondary uppercase tracking-wider">
                        Project Status
                      </label>
                      <div className="relative flex items-center p-1 rounded-xl gi-surface-secondary border gi-divider">
                        {["Ongoing", "On Hold", "Completed"].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setProjectStatus(st)}
                            className={`relative z-10 flex-1 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                              projectStatus === st
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "gi-text-muted"
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                        <motion.div
                          layoutId="activeProjStatusHighlight"
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                          className="absolute inset-y-1 rounded-lg bg-white dark:bg-zinc-800 shadow-sm border border-slate-200 dark:border-zinc-700"
                          style={{
                            left:
                              projectStatus === "Ongoing"
                                ? "4px"
                                : projectStatus === "On Hold"
                                ? "calc(33.33% + 2px)"
                                : "calc(66.66% + 2px)",
                            width: "calc(33.33% - 5px)",
                          }}
                        />
                      </div>
                    </div>

                    {/* Project Description Input */}
                    <div className="space-y-1.5 max-w-lg">
                      <label className="block text-xs font-bold gi-text-secondary uppercase tracking-wider">
                        Project Description &amp; Scope
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Specify project objectives, client details, or construction deliverables..."
                        rows={3}
                        className="w-full p-3 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs focus:outline-none focus:border-indigo-500 transition resize-none shadow-2xs"
                      />
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="pt-2">
              <motion.button
                type="button"
                onClick={handleSave}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full max-w-md h-10 flex items-center justify-center gap-2 rounded-xl gi-btn-primary font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer"
              >
                <IoSaveOutline className="text-lg" />
                <span>
                  {editId ? "Update" : "Save"} {type} Record
                </span>
              </motion.button>
            </div>
          </div>

          {/* Right Section: Real-time Live Preview Card (5 Cols) */}
          <div className="lg:col-span-5 gi-card p-5 space-y-4 border-2 border-indigo-500/20 shadow-md">
            <div className="flex items-center justify-between border-b gi-divider pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg gi-badge-info flex items-center justify-center text-sm">
                  <IoLayersOutline />
                </div>
                <h2 className="text-xs font-bold gi-text-primary uppercase tracking-wider">
                  Live Card Preview
                </h2>
              </div>
              <span className="text-[10px] font-semibold gi-text-muted">
                Real-time
              </span>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center text-lg shrink-0 ${
                      type === "Site" ? "gi-badge-info" : "gi-badge-warning"
                    }`}
                  >
                    {type === "Site" ? (
                      <IoLocationOutline />
                    ) : (
                      <IoBriefcaseOutline />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                        type === "Site" ? "gi-badge-info" : "gi-badge-warning"
                      }`}
                    >
                      {type}
                    </span>
                    <h3 className="text-sm font-bold gi-text-primary truncate mt-0.5">
                      {name.trim() || `Untitled ${type}`}
                    </h3>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                    (type === "Site" ? siteStatus : projectStatus) === "Active" ||
                    (type === "Site" ? siteStatus : projectStatus) === "Ongoing"
                      ? "gi-badge-success"
                      : (type === "Site" ? siteStatus : projectStatus) ===
                        "Completed"
                      ? "gi-badge-info"
                      : "gi-badge-warning"
                  }`}
                >
                  {type === "Site" ? siteStatus : projectStatus}
                </span>
              </div>

              {type === "Site" ? (
                <div className="space-y-2 text-xs pt-1">
                  <div className="p-2.5 rounded-lg gi-surface-secondary space-y-0.5">
                    <span className="gi-text-muted text-[10px] uppercase font-bold">
                      Location
                    </span>
                    <p className="gi-text-secondary text-xs line-clamp-2">
                      {address.trim() || "No address entered yet"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] gi-text-secondary pt-1 border-t border-indigo-200 dark:border-indigo-800/60">
                    <span>Parent Project:</span>
                    <span className="font-semibold">
                      {selectedProjectObj
                        ? selectedProjectObj.name
                        : "Independent"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs pt-1">
                  <div className="p-2.5 rounded-lg gi-surface-secondary space-y-0.5">
                    <span className="gi-text-muted text-[10px] uppercase font-bold">
                      Description
                    </span>
                    <p className="gi-text-secondary text-xs line-clamp-3">
                      {description.trim() || "No description provided"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}