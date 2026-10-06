"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  IoAdd,
  IoLocationOutline,
  IoBriefcaseOutline,
  IoEyeOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoSearch,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoSwapVerticalOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
} from "react-icons/io5";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import PermissionGuard from "@/components/PermissionGuard";
import { siteProjectApi } from "@/lib/api/siteProject";
import { SkeletonCard, SkeletonBox } from "@/components/Skeleton";
import FilterTabs from "@/components/FilterTabs";

export default function SiteProject() {
  const router = useRouter();
  const { activeBusiness, hasPermission } = useAuth();
  const [siteProjects, setSiteProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: string }>({ key: null, direction: "asc" });

  const loadSiteProjects = async () => {
    if (!activeBusiness?.id) {
      setSiteProjects([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res: any = await siteProjectApi.getSiteProjects(activeBusiness.id, { silentError: true });
      const list = Array.isArray(res?.body) ? res.body : [];
      setSiteProjects(list);
    } catch (err) {
      console.warn("Failed to fetch site/projects:", err);
      setSiteProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSiteProjects();
  }, [activeBusiness?.id]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        return { key: null, direction: "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const filters = [
    { id: "all", label: "All" },
    { id: "sites", label: "Sites" },
    { id: "projects", label: "Projects" },
  ];

  const filteredItems = siteProjects.filter((item) => {
    const matchesFilter =
      activeFilter === "all"
        ? true
        : activeFilter === "sites"
          ? item.type === "Site"
          : activeFilter === "projects"
            ? item.type === "Project"
            : true;

    const query = searchQuery.toLowerCase().trim();
    const nameStr = (item.name || "").toLowerCase();
    const locationStr = (item.location || item.address || "").toLowerCase();
    const descStr = (item.description || "").toLowerCase();
    const statusStr = (item.status || "").toLowerCase();
    const projNameStr = (item.project?.name || item.projectName || "").toLowerCase();

    const matchesSearch =
      query === "" ||
      nameStr.includes(query) ||
      locationStr.includes(query) ||
      descStr.includes(query) ||
      statusStr.includes(query) ||
      projNameStr.includes(query);

    return matchesFilter && matchesSearch;
  });

  const sortedItems = useMemo(() => {
    if (!sortConfig.key) return filteredItems;
    return [...filteredItems].sort((a, b) => {
      let aVal = "";
      let bVal = "";
      switch (sortConfig.key) {
        case "name":
          aVal = (a.name || "").toLowerCase();
          bVal = (b.name || "").toLowerCase();
          break;
        case "type":
          aVal = (a.type || "").toLowerCase();
          bVal = (b.type || "").toLowerCase();
          break;
        case "location":
          aVal = (a.location || a.address || a.project?.name || "").toLowerCase();
          bVal = (b.location || b.address || b.project?.name || "").toLowerCase();
          break;
        case "status":
          aVal = (a.status || "").toLowerCase();
          bVal = (b.status || "").toLowerCase();
          break;
        default:
          return 0;
      }
      return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [filteredItems, sortConfig]);

  // KPI Calculations
  const totalProjects = useMemo(() => siteProjects.filter((i) => i.type === "Project").length, [siteProjects]);
  const ongoingProjects = useMemo(
    () => siteProjects.filter((i) => i.type === "Project" && (i.status === "ongoing" || i.status === "Ongoing")).length,
    [siteProjects]
  );
  const totalSites = useMemo(() => siteProjects.filter((i) => i.type === "Site").length, [siteProjects]);

  const handleDeleteItem = async () => {
    if (!itemToDelete?.id) return;
    setIsDeleting(true);
    try {
      if (itemToDelete.type === "Project") {
        await siteProjectApi.deleteProject(itemToDelete.id);
        toast.success("Project deleted successfully.");
      } else {
        await siteProjectApi.deleteSite(itemToDelete.id);
        toast.success("Site deleted successfully.");
      }
      setItemToDelete(null);
      loadSiteProjects();
    } catch (err: any) {
      console.error("Failed to delete site/project:", err);
      toast.error(err.message || "Failed to delete item.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string = "", type: string) => {
    const s = (status || "").toLowerCase();
    let text = "Active";
    if (type === "Project") {
      if (s === "completed") text = "Completed";
      else if (s === "on_hold" || s === "on hold") text = "On Hold";
      else text = "Ongoing";
    } else {
      if (s === "inactive") text = "Inactive";
      else text = "Active";
    }
    return (
      <span className="inline-block px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300">
        {text}
      </span>
    );
  };

  return (
    <PermissionGuard module="Site">
      <div className="space-y-4 select-none gi-page">
        {/* Desktop Header (>= 768px) */}
        <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold gi-text-primary tracking-tight">
              Sites &amp; Projects
            </h1>
          </div>

          {(hasPermission("Site", "Create") || hasPermission("Project", "Create")) && (
            <Link href="/addSiteProject" className="shrink-0">
              <button
                type="button"
                className="px-3.5 py-2 rounded-lg gi-btn-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer whitespace-nowrap"
              >
                <IoAdd className="text-base" />
                <span>Add Site / Project</span>
              </button>
            </Link>
          )}
        </div>

        {/* Mobile Header (< 768px): Title + Add button on right side */}
        <div className="flex md:hidden items-center justify-between gap-3 py-1">
          <h1 className="text-2xl font-bold gi-text-primary tracking-tight">
            Sites &amp; Projects
          </h1>
          {(hasPermission("Site", "Create") || hasPermission("Project", "Create")) && (
            <Link href="/addSiteProject" className="shrink-0">
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl gi-btn-primary text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer whitespace-nowrap"
              >
                <IoAdd className="text-base" />
                <span>Add Site / Project</span>
              </button>
            </Link>
          )}
        </div>

        {/* Searchbar (Desktop only: hidden on mobile) & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="hidden md:block relative flex-1 max-w-md">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, location, or status..."
              className="w-full h-9 pl-9 pr-4 rounded-xl border-none bg-white dark:bg-zinc-900 gi-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition shadow-xs"
            />
          </div>

          <FilterTabs
            options={filters}
            activeId={activeFilter}
            onChange={setActiveFilter}
            layoutId="siteProjectFilterPill"
            className="sm:ml-auto"
          />
        </div>

        {/* Desktop Only Financial / Count KPI Summary Cards (hidden on mobile) */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 shadow-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] font-medium gi-text-muted uppercase tracking-wider">Total Projects</p>
              <p className="text-xl font-extrabold gi-text-primary">{totalProjects}</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg">
              <IoBriefcaseOutline />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 shadow-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] font-medium gi-text-muted uppercase tracking-wider">Ongoing Projects</p>
              <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{ongoingProjects}</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg">
              <IoTimeOutline />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 shadow-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] font-medium gi-text-muted uppercase tracking-wider">Operational Sites</p>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{totalSites}</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
              <IoLocationOutline />
            </div>
          </div>
        </div>

        {/* Mobile Cards View (< 768px) - Separated by Shadow */}
        <div className="block md:hidden space-y-3 pt-1">
          {isLoading ? (
            <SkeletonCard count={4} />
          ) : sortedItems.length === 0 ? (
            <div className="py-10 text-center bg-white dark:bg-zinc-900 rounded-2xl text-xs gi-text-muted shadow-xs">
              No sites or projects found.
            </div>
          ) : (
            sortedItems.map((item) => {
              const isProject = item.type === "Project";
              const itemUrl = isProject ? `/projectDetails/${item.id}` : `/siteDetails/${item.id}`;
              const addressStr = item.location || item.address || "";
              const descStr = item.description || "";

              const rawStatus = (item.status || "").toLowerCase();
              let statusText = "Active";
              let statusColorClass = "text-emerald-600 dark:text-emerald-400";

              if (isProject) {
                if (rawStatus === "completed") {
                  statusText = "Completed";
                  statusColorClass = "text-emerald-600 dark:text-emerald-400";
                } else if (rawStatus === "on_hold" || rawStatus === "on hold") {
                  statusText = "On Hold";
                  statusColorClass = "text-amber-600 dark:text-amber-400";
                } else {
                  statusText = "Ongoing";
                  statusColorClass = "text-indigo-600 dark:text-indigo-400";
                }
              } else {
                if (rawStatus === "inactive") {
                  statusText = "Inactive";
                  statusColorClass = "text-slate-400 dark:text-slate-500";
                } else {
                  statusText = "Active";
                  statusColorClass = "text-emerald-600 dark:text-emerald-400";
                }
              }

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => router.push(itemUrl)}
                  className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-xs cursor-pointer hover:shadow-md transition-all flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-semibold text-slate-600 dark:text-slate-300 text-lg shrink-0">
                      {item.name ? item.name.charAt(0).toUpperCase() : (isProject ? "P" : "S")}
                    </div>
                    <div className="min-w-0 space-y-1 pt-0.5">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Status : <span className={`font-semibold ${statusColorClass}`}>{statusText}</span>
                      </p>
                      {isProject ? (
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                          Description : <span className="text-slate-800 dark:text-slate-200">{descStr || "-"}</span>
                        </p>
                      ) : (
                        <>
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                            Address : <span className="text-slate-800 dark:text-slate-200">{addressStr || "-"}</span>
                          </p>
                          {(item.project?.name || item.projectName) && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              Project : <span className="text-slate-700 dark:text-slate-300 font-medium">{item.project?.name || item.projectName}</span>
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-medium shrink-0 ${
                      isProject
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                        : "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300"
                    }`}
                  >
                    {item.type}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Data Table (>= 768px) */}
        <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-2xl !border-none shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs gi-table border-collapse">
              <thead>
                <tr>
                  {[
                    { key: "name", label: "Name", align: "left" },
                    { key: "type", label: "Type", align: "left" },
                    { key: "location", label: "Address / Location", align: "left" },
                    { key: "description", label: "Description", align: "left" },
                    { key: "status", label: "Status", align: "center" },
                  ].map((col, idx) => {
                    const isActive = sortConfig.key === col.key;
                    return (
                      <th
                        key={idx}
                        onClick={() => handleSort(col.key)}
                        className={`py-3 px-4 cursor-pointer select-none hover:bg-[var(--gi-hover)] transition text-${col.align}`}
                      >
                        <div className={`flex items-center gap-1.5 ${col.align === "center" ? "justify-center" : "justify-start"}`}>
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
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-3 px-4"><SkeletonBox className="h-5 w-36" /></td>
                      <td className="py-3 px-4"><SkeletonBox className="h-5 w-20" /></td>
                      <td className="py-3 px-4"><SkeletonBox className="h-5 w-36" /></td>
                      <td className="py-3 px-4"><SkeletonBox className="h-5 w-48" /></td>
                      <td className="py-3 px-4"><SkeletonBox className="h-5 w-20 mx-auto" /></td>
                      <td className="py-3 px-4"><SkeletonBox className="h-5 w-20 mx-auto" /></td>
                    </tr>
                  ))
                ) : sortedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center gi-text-muted text-xs">
                      No sites or projects found matching your search.
                    </td>
                  </tr>
                ) : (
                  sortedItems.map((item) => {
                    const isProject = item.type === "Project";
                    const itemUrl = isProject ? `/projectDetails/${item.id}` : `/siteDetails/${item.id}`;
                    const editUrl = `/addSiteProject?id=${item.id}&type=${item.type}`;

                    return (
                      <tr
                        key={`${item.type}-${item.id}`}
                        onClick={() => router.push(itemUrl)}
                        className="hover:bg-[var(--gi-hover)] transition cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`h-7 w-7 rounded-md font-bold text-xs flex items-center justify-center shrink-0 ${isProject ? "gi-badge-warning" : "gi-badge-info"}`}>
                              {isProject ? <IoBriefcaseOutline /> : <IoLocationOutline />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold gi-text-primary truncate">{item.name}</p>
                              {!isProject && (item.project?.name || item.projectName) && (
                                <p className="text-[10px] gi-text-muted truncate">Project: {item.project?.name || item.projectName}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isProject ? "gi-badge-warning" : "gi-badge-info"}`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 gi-text-secondary max-w-[200px] truncate" title={item.location || item.address || ""}>
                          {item.location || item.address || "-"}
                        </td>
                        <td className="py-3 px-4 gi-text-secondary max-w-[250px] truncate" title={item.description || ""}>
                          {item.description || "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {getStatusBadge(item.status, item.type)}
                        </td>
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">

                            {(hasPermission("Site", "Edit") || hasPermission("Project", "Edit")) && (
                              <Link href={editUrl}>
                                <button
                                  type="button"
                                  className="p-1.5 rounded-md hover:bg-[var(--gi-hover)] text-indigo-600 dark:text-indigo-400 transition cursor-pointer"
                                  title="Edit Item"
                                >
                                  <IoPencilOutline className="text-base" />
                                </button>
                              </Link>
                            )}

                            {(hasPermission("Site", "Delete") || hasPermission("Project", "Delete")) && (
                              <button
                                type="button"
                                onClick={() => setItemToDelete(item)}
                                className="p-1.5 rounded-md hover:bg-[var(--gi-hover)] text-rose-600 dark:text-rose-400 transition cursor-pointer"
                                title="Delete Item"
                              >
                                <IoTrashOutline className="text-base" />
                              </button>
                            )}
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

        {/* Delete Modal */}
        <AnimatePresence>
          {itemToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center gi-modal-overlay backdrop-blur-sm p-4"
              onClick={() => setItemToDelete(null)}
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
                    Delete &quot;{itemToDelete.name}&quot;?
                  </h3>
                  <p className="text-xs gi-text-secondary mt-1">
                    Are you sure you want to delete this {itemToDelete.type?.toLowerCase() || "item"}? This action cannot be undone.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setItemToDelete(null)}
                    className="flex-1 py-2 rounded-lg gi-btn-secondary text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDeleteItem}
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
