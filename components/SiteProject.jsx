"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  IoAdd,
  IoLocationOutline,
  IoBriefcaseOutline,
  IoClose,
  IoEyeOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoSearch,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoSwapVerticalOutline,
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";
import PermissionGuard from "./PermissionGuard";
import PaginationControls from "./PaginationControls";

export default function SiteProject() {
  const router = useRouter();
  const { siteProjects: items = [], setSiteProjects: setItems, hasPermission } = useApp();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  const filters = [
    { id: "all", label: "All Sites & Projects" },
    { id: "sites", label: "Sites" },
    { id: "projects", label: "Projects" },
  ];

  const filteredItems = items.filter((item) => {
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
    const projStr = (item.projectName || "").toLowerCase();
    const addrStr = (item.address || "").toLowerCase();
    const statusStr = (item.status || "").toLowerCase();
    const matchesSearch =
      query === "" ||
      nameStr.includes(query) ||
      projStr.includes(query) ||
      addrStr.includes(query) ||
      statusStr.includes(query);

    return matchesFilter && matchesSearch;
  });

  const sortedItems = useMemo(() => {
    if (!sortConfig.key) return filteredItems;
    return [...filteredItems].sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case "name":
          aVal = (a.name || "").toLowerCase();
          bVal = (b.name || "").toLowerCase();
          break;
        case "type":
          aVal = (a.type || "").toLowerCase();
          bVal = (b.type || "").toLowerCase();
          break;
        case "details":
          aVal = (a.details || a.associatedProject || a.location || "").toLowerCase();
          bVal = (b.details || b.associatedProject || b.location || "").toLowerCase();
          break;
        case "status":
          aVal = (a.status || "active").toLowerCase();
          bVal = (b.status || "active").toLowerCase();
          break;
        default:
          return 0;
      }
      if (typeof aVal === "string") {
        return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [filteredItems, sortConfig]);

  const getStatusStyle = (status) => {
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

  const getProjectSites = (projectId) => {
    return items.filter(
      (item) => item.type === "Site" && String(item.projectId) === String(projectId)
    );
  };

  return (
    <PermissionGuard module="Site">
      <div className="space-y-5 select-none gi-page">
        {/* Page Heading & Action Button */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold gi-text-primary tracking-tight">
              Sites &amp; Projects
            </h1>
            <p className="text-xs gi-text-secondary mt-0.5">
              Track construction sites, client projects, and project budgets
            </p>
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

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search site, project name, location..."
              className="w-full h-9 pl-9 pr-4 rounded-xl border gi-border bg-[var(--gi-card-bg)] gi-text-primary text-xs focus:outline-none focus:border-indigo-500 transition shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex items-center gap-1 p-1 rounded-xl gi-card shadow-xs">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-md text-xs transition cursor-pointer whitespace-nowrap ${
                    activeFilter === filter.id
                      ? "gi-filter-active"
                      : "gi-filter-inactive font-medium"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            </div>
          </div>

        {/* Enterprise Data Table */}
        <div className="gi-table-container shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs gi-table border-collapse">
              <thead>
                <tr>
                  {[
                    { key: "name", label: "Name", align: "left" },
                    { key: "type", label: "Type", align: "left" },
                    { key: "details", label: "Associated Project / Details", align: "left" },
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
                {sortedItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center gi-text-muted text-xs">
                      No sites or projects found matching this filter.
                    </td>
                  </tr>
                ) : (
                  sortedItems.map((item) => {
                    const isProject = item.type === "Project";

                    return (
                      <tr
                        key={item.id}
                        onClick={() =>
                          router.push(
                            isProject
                              ? `/projectDetails/${item.id}`
                              : `/siteDetails/${item.id}`
                          )
                        }
                        className="hover:bg-[var(--gi-hover)] transition cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-md gi-badge-info font-bold text-xs flex items-center justify-center shrink-0">
                              {isProject ? <IoBriefcaseOutline /> : <IoLocationOutline />}
                            </div>
                            <div className="min-w-0">
                              <p className="gi-mob-primary font-semibold gi-text-primary">{item.name}</p>
                              <div className="gi-mob-secondary">
                                <span className={`inline-block px-1.5 py-0 rounded text-[10px] font-bold uppercase ${isProject ? "gi-badge-warning" : "gi-badge-info"}`}>{item.type}</span>
                                <span className="gi-text-muted">·</span>
                                <span>{isProject ? `${getProjectSites(item.id).length} sites` : item.projectName || item.address || "General"}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isProject
                              ? "gi-badge-warning"
                              : "gi-badge-info"
                              }`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 gi-text-secondary">
                          {isProject
                            ? `${getProjectSites(item.id).length} assigned sites`
                            : item.projectName || item.address || "General Location"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === "Active" || item.status === "Ongoing"
                              ? "gi-badge-success"
                              : item.status === "Completed"
                                ? "gi-badge-info"
                                : "gi-badge-warning"
                              }`}
                          >
                            {item.status || "Active"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                isProject
                                  ? `/projectDetails/${item.id}`
                                  : `/siteDetails/${item.id}`
                              )
                            }
                            className="p-1.5 rounded-md hover:bg-[var(--gi-hover)] gi-text-secondary transition"
                            title="View Details Page"
                          >
                            <IoEyeOutline className="text-base" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Details */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center gi-modal-overlay backdrop-blur-sm p-4"
              onClick={() => setSelectedItem(null)}
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-xl gi-modal-content shadow-2xl overflow-hidden p-5 space-y-4"
              >
                <div className="flex items-center justify-between border-b gi-divider pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg gi-badge-info flex items-center justify-center">
                      {selectedItem.type === "Project" ? <IoBriefcaseOutline /> : <IoLocationOutline />}
                    </div>
                    <div>
                      <h2 className="text-base font-bold gi-text-primary">
                        {selectedItem.name}
                      </h2>
                      <p className="text-[10px] gi-text-muted uppercase font-semibold">
                        {selectedItem.type}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="p-1 rounded-md gi-text-muted hover:gi-text-primary"
                  >
                    <IoClose className="text-xl" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="gi-text-muted font-semibold uppercase text-[10px]">Status</span>
                    <div className="mt-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase gi-badge-success">
                        {selectedItem.status || "Active"}
                      </span>
                    </div>
                  </div>

                  {selectedItem.description && (
                    <div>
                      <span className="gi-text-muted font-semibold uppercase text-[10px]">Description</span>
                      <p className="mt-1 gi-text-secondary">{selectedItem.description}</p>
                    </div>
                  )}

                  {selectedItem.address && (
                    <div>
                      <span className="gi-text-muted font-semibold uppercase text-[10px]">Address</span>
                      <p className="mt-1 gi-text-secondary">{selectedItem.address}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t gi-divider">
                  <button
                    type="button"
                    onClick={() => router.push(`/addSiteProject?id=${selectedItem.id}`)}
                    className="px-3 py-1.5 rounded-lg gi-btn-secondary text-xs font-semibold transition cursor-pointer"
                  >
                    Edit Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="px-3 py-1.5 rounded-lg gi-btn-danger text-xs font-semibold transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && selectedItem && (
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
                    Delete &quot;{selectedItem.name}&quot;?
                  </h3>
                  <p className="text-xs gi-text-secondary mt-1">
                    Are you sure you want to delete this {selectedItem.type?.toLowerCase() || "item"}? This action cannot be undone.
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
                    onClick={() => {
                      const updated = items.filter((i) => i.id !== selectedItem.id);
                      setItems(updated);
                      setShowDeleteModal(false);
                      setSelectedItem(null);
                    }}
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