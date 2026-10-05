"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  IoSaveOutline,
  IoLocationOutline,
  IoBriefcaseOutline,
  IoChevronDown,
} from "react-icons/io5";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import PermissionGuard from "@/components/PermissionGuard";
import PageHeader from "@/components/PageHeader";
import { siteProjectApi } from "@/lib/api/siteProject";
import LimitReachedView from "@/components/LimitReachedView";
import { useLimitCheck } from "@/lib/hooks/useLimitCheck";
import CustomSelect from "@/components/CustomSelect";

export default function AddSiteProject() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeBusiness } = useAuth();

  const editId = searchParams?.get("id");
  const editType = searchParams?.get("type") || "Site";
  const preselectedProjectId = searchParams?.get("project_id") || searchParams?.get("projectId") || "";

  const [type, setType] = useState<"Site" | "Project">(editType === "Project" ? "Project" : "Site");

  const isEdit = Boolean(editId);
  const siteLimit = useLimitCheck("site", isEdit);
  const projectLimit = useLimitCheck("project", isEdit);

  const activeLimit = type === "Site" ? siteLimit : projectLimit;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [projectId, setProjectId] = useState(preselectedProjectId);
  const [projectStatus, setProjectStatus] = useState<"ongoing" | "completed" | "on_hold">("ongoing");
  const [siteStatus, setSiteStatus] = useState<"active" | "inactive">("active");

  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (preselectedProjectId) {
      setProjectId(preselectedProjectId);
    }
  }, [preselectedProjectId]);

  // Load project list for parent dropdown selection when creating/editing a Site
  useEffect(() => {
    siteProjectApi
      .getProjects({ per_page: "all", silentError: true })
      .then((res: any) => {
        const list = res?.body?.projects || res?.body?.data || (Array.isArray(res?.body) ? res.body : []);
        setProjectsList(Array.isArray(list) ? list : []);
      })
      .catch(() => setProjectsList([]));
  }, [activeBusiness?.id]);

  // Load existing details when in Edit mode
  useEffect(() => {
    if (!editId) return;
    setIsLoading(true);

    if (editType === "Project") {
      setType("Project");
      siteProjectApi
        .getProjectDetails(editId, { silentError: true })
        .then((res: any) => {
          const p = res?.body?.project || res?.body?.data || res?.body;
          if (p) {
            setName(p.name || "");
            setDescription(p.description || "");
            setProjectStatus(p.status || "ongoing");
          }
        })
        .catch((err) => console.warn("Failed to load project details:", err))
        .finally(() => setIsLoading(false));
    } else {
      setType("Site");
      siteProjectApi
        .getSiteDetails(editId, { silentError: true })
        .then((res: any) => {
          const s = res?.body?.site || res?.body?.data || res?.body;
          if (s) {
            setName(s.name || "");
            setLocation(s.location || s.address || "");
            setProjectId(s.project_id || s.projectId || s.project?.id || "");
            setSiteStatus(s.status || "active");
          }
        })
        .catch((err) => console.warn("Failed to load site details:", err))
        .finally(() => setIsLoading(false));
    }
  }, [editId, editType]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(`Please enter ${type.toLowerCase()} name.`);
      return;
    }

    if (type === "Project" && !description.trim()) {
      toast.error("Please enter project description.");
      return;
    }

    if (type === "Site" && !projectId) {
      toast.error("Please select a parent project for the site.");
      return;
    }

    if (type === "Site" && !location.trim()) {
      toast.error("Please enter site location / address.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (type === "Project") {
        const payload = {
          name: name.trim(),
          description: description.trim() || undefined,
          status: projectStatus,
        };

        if (editId) {
          await siteProjectApi.updateProject(editId, payload);
          toast.success("Project updated successfully!");
        } else {
          await siteProjectApi.createProject(payload);
          toast.success("Project created successfully!");
        }
      } else {
        const payload = {
          name: name.trim(),
          location: location.trim() || undefined,
          project_id: projectId || undefined,
          status: siteStatus,
        };

        if (editId) {
          await siteProjectApi.updateSite(editId, payload);
          toast.success("Site updated successfully!");
        } else {
          await siteProjectApi.createSite(payload);
          toast.success("Site created successfully!");
        }
      }

      router.replace("/siteProject");
    } catch (error: any) {
      console.error("Failed to save:", error);
      toast.error(error?.message || `Failed to save ${type.toLowerCase()}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PermissionGuard module={type === "Site" ? "Site" : "Project"}>
      <div className="w-full max-w-full space-y-3.5 select-none gi-page">
        {/* Top Header */}
        <PageHeader
          title={editId ? `Edit ${type}` : `Add New ${type}`}
          backUrl="/siteProject"
          className="mb-0 pb-1 border-b-0"
        />

        {/* Entity Type Switcher in Single Div with Motion Sliding Animation */}
        {!editId && (
          <div className="bg-white dark:bg-zinc-900 p-3.5 sm:p-4 rounded-2xl border-none w-full shadow-xs">
            <h2 className="text-[11px] font-bold uppercase tracking-wider gi-text-muted mb-2.5">
              Select Type
            </h2>

            <div className="relative grid grid-cols-2 gap-2 w-full select-none">
              <button
                type="button"
                onClick={() => setType("Site")}
                className={`relative py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer z-10 ${
                  type === "Site"
                    ? "text-white"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
                }`}
              >
                {type === "Site" && (
                  <motion.div
                    layoutId="active-type-pill"
                    className="absolute inset-0 rounded-xl gi-btn-primary z-0 shadow-xs"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <IoLocationOutline className="text-lg relative z-10 shrink-0" />
                <span className="relative z-10 flex items-center gap-1.5">
                  <span>Site / Work Location</span>
                  {siteLimit.isLimitReached && (
                    <span className="text-[9px] bg-rose-500 text-white font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Limit Reached
                    </span>
                  )}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setType("Project")}
                className={`relative py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer z-10 ${
                  type === "Project"
                    ? "text-white"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
                }`}
              >
                {type === "Project" && (
                  <motion.div
                    layoutId="active-type-pill"
                    className="absolute inset-0 rounded-xl gi-btn-primary z-0 shadow-xs"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <IoBriefcaseOutline className="text-lg relative z-10 shrink-0" />
                <span className="relative z-10 flex items-center gap-1.5">
                  <span>Project</span>
                  {projectLimit.isLimitReached && (
                    <span className="text-[9px] bg-rose-500 text-white font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Limit Reached
                    </span>
                  )}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Main Form or Limit Reached Container */}
        {activeLimit.isLimitReached ? (
          <LimitReachedView
            featureName={activeLimit.featureName}
            usedCount={activeLimit.used}
            quotaLimit={activeLimit.quota}
            onBack={() => router.replace("/siteProject")}
          />
        ) : (
          <form onSubmit={handleSave} className="bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-2xl border-none space-y-4 shadow-xs w-full">
            {isLoading ? (
              <div className="py-10 text-center text-slate-500 dark:text-zinc-400 text-xs font-medium">
                Loading details...
              </div>
            ) : (
              <>
              <div className="border-b gi-divider pb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold gi-text-primary flex items-center gap-2">
                  {type === "Site" ? <IoLocationOutline className="text-indigo-500 text-base" /> : <IoBriefcaseOutline className="text-indigo-500 text-base" />}
                  <span>{type} Details</span>
                </h2>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50">
                  {type} Mode
                </span>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 w-full">
                {/* Name Input */}
                <div className="space-y-1.5 md:col-span-1">
                  <label className="block text-xs font-semibold gi-text-primary">
                    {type} Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={type === "Project" ? "e.g. Greenfield Township Project" : "e.g. Block A Foundation Site"}
                    required
                    className="w-full px-3.5 py-2 rounded-xl text-xs gi-input focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                {type === "Site" ? (
                  <>
                    {/* Parent Project Dropdown */}
                    <div className="space-y-1.5 md:col-span-1">
                      <label className="block text-xs font-semibold gi-text-primary">
                        Parent Project <span className="text-rose-500">*</span>
                      </label>
                      <CustomSelect
                        value={projectId}
                        onChange={(val) => setProjectId(val)}
                        placeholder={
                          projectsList.length === 0
                            ? "-- No Projects Found --"
                            : "-- Select Parent Project * --"
                        }
                        options={projectsList.map((p) => ({
                          value: p.id,
                          label: p.name,
                          badge: p.status ? p.status.toUpperCase() : "PROJECT",
                        }))}
                      />
                    </div>

                    {/* Site Status */}
                    <div className="space-y-1.5 md:col-span-1">
                      <label className="block text-xs font-semibold gi-text-primary">
                        Site Status
                      </label>
                      <CustomSelect
                        value={siteStatus}
                        onChange={(val) => setSiteStatus(val as "active" | "inactive")}
                        options={[
                          { value: "active", label: "Active", badge: "Live" },
                          { value: "inactive", label: "Inactive" },
                        ]}
                      />
                    </div>

                    {/* Site Address / Location */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-semibold gi-text-primary">
                        Site Location / Address <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Sector 12, SG Highway, Near City Center, Ahmedabad - 380054"
                        required
                        className="w-full p-3 rounded-xl text-xs gi-input focus:outline-none focus:border-indigo-500 resize-none font-medium leading-relaxed"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Project Status */}
                    <div className="space-y-1.5 md:col-span-1">
                      <label className="block text-xs font-semibold gi-text-primary">
                        Project Status
                      </label>
                      <CustomSelect
                        value={projectStatus}
                        onChange={(val) => setProjectStatus(val as any)}
                        options={[
                          { value: "ongoing", label: "Ongoing", badge: "Active" },
                          { value: "completed", label: "Completed" },
                          { value: "on_hold", label: "On Hold" },
                        ]}
                      />
                    </div>

                    {/* Project Description */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-semibold gi-text-primary">
                        Project Description <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. 200-unit residential township master project details and specifications..."
                        required
                        className="w-full p-3 rounded-xl text-xs gi-input focus:outline-none focus:border-indigo-500 resize-none font-medium leading-relaxed"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t gi-divider">
                <button
                  type="button"
                  onClick={() => router.replace("/siteProject")}
                  className="px-4 py-2 rounded-xl gi-btn-secondary text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !name.trim() ||
                    (type === "Project" && !description.trim()) ||
                    (type === "Site" && (!projectId || !location.trim()))
                  }
                  className="px-5 py-2 rounded-xl gi-btn-primary text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IoSaveOutline className="text-base" />
                  <span>{isSubmitting ? "Saving..." : editId ? `Update ${type}` : `Save ${type}`}</span>
                </button>
              </div>
            </>
          )}
        </form>
        )}
      </div>
    </PermissionGuard>
  );
}
