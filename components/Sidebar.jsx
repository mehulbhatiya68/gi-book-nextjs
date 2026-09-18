"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { AnimatePresence, motion, LayoutGroup } from "motion/react";
import {
  IoHomeOutline,
  IoDocumentTextOutline,
  IoCardOutline,
  IoPeopleOutline,
  IoCubeOutline,
  IoPeopleCircleOutline,
  IoStatsChartOutline,
  IoLocationOutline,
  IoSettingsOutline,
  IoClose,
  IoChevronForward,
  IoChevronBack,
  IoWalletOutline,
  IoSwapHorizontalOutline,
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";

export default function Sidebar({
  mobileDrawerOpen = false,
  onCloseMobileSidebar,
  sidebarWidth = 256,
  onSidebarWidthChange,
  isCollapsed = false,
  onToggleCollapse,
}) {
  const pathname = usePathname();
  const { currentUser, activeBusiness, hasPermission, t } = useApp();

  const [pendingPath, setPendingPath] = useState(null);

  // Synchronize state when route changes
  useEffect(() => {
    setPendingPath(null);
  }, [pathname]);

  // Close drawer on route change
  useEffect(() => {
    if (onCloseMobileSidebar) {
      onCloseMobileSidebar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleMouseDown = (e) => {
    if (isCollapsed) return;
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.min(Math.max(startWidth + delta, 190), 380);
      if (onSidebarWidthChange) {
        onSidebarWidthChange(newWidth);
      }
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Don't render navigation on auth pages
  if (pathname === "/login" || pathname === "/sign-up" || pathname === "/") {
    return null;
  }

  const currentPath = pendingPath || pathname;

  const isActive = (path) => {
    if (path === "/home") return currentPath === "/home";
    return currentPath.startsWith(path);
  };

  // Navigation Groups Structure
  const navigationGroups = [
    {
      items: [
        {
          name: "Dashboard",
          href: "/home",
          icon: IoHomeOutline,
          module: "Home",
        },
      ],
    },
    {
      items: [
        {
          name: "Invoices",
          href: "/invoice",
          icon: IoDocumentTextOutline,
          module: "Invoice",
        },
        {
          name: "Payments",
          href: "/payments",
          icon: IoCardOutline,
          module: "Payment",
        },
        {
          name: "Parties",
          href: "/parties",
          icon: IoPeopleOutline,
          module: "Party",
        },
        {
          name: "Items / Stock",
          href: "/items",
          icon: IoCubeOutline,
          module: "Item",
        },
        {
          name: "Sites / Projects",
          href: "/siteProject",
          icon: IoLocationOutline,
          module: "SiteProject",
        },
        {
          name: "Staff",
          href: "/staff",
          icon: IoPeopleCircleOutline,
          module: "Staff",
        },
      ],
    },
    {
      items: [
        {
          name: "Reports",
          href: "/reports",
          icon: IoStatsChartOutline,
          module: "Report",
        },
      ],
    },
    {
      items: [
        {
          name: "Settings",
          href: "/settings",
          icon: IoSettingsOutline,
          module: "Setting",
        },
      ],
    },
  ];

  return (
    <>
      {/* DESKTOP FIXED SIDEBAR WITH RESIZE HANDLE */}
      <aside
        className="hidden md:block fixed top-14 left-0 bottom-0 z-30 group/sidebar transition-[width] duration-300 ease-in-out"
        style={{ width: `${sidebarWidth}px` }}
        suppressHydrationWarning={true}
      >
        <SidebarContent
          collapsed={isCollapsed}
          navigationGroups={navigationGroups}
          hasPermission={hasPermission}
          isActive={isActive}
          onSelectPath={(path) => setPendingPath(path)}
        />

        {/* Center Edge Toggle Button (Desktop Only) */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="absolute top-1/2 -translate-y-1/2 -right-3.5 h-7 w-7 rounded-full bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 shadow-md text-slate-700 dark:text-zinc-200 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 hover:border-indigo-600 flex items-center justify-center transition-all duration-300 cursor-pointer z-50 hover:scale-110"
            title={isCollapsed ? "Open / Expand Sidebar" : "Close / Collapse Sidebar"}
          >
            <IoChevronBack
              className={`text-sm transition-transform duration-300 ease-in-out ${
                isCollapsed ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>
        )}

        {/* Drag Handle (only when expanded) */}
        {!isCollapsed && (
          <div
            onMouseDown={handleMouseDown}
            className="absolute top-0 right-0 bottom-0 w-2 cursor-col-resize hover:bg-indigo-500/30 active:bg-indigo-600 group transition z-40 flex items-center justify-center"
            title="Drag to resize sidebar"
          >
            <div className="w-0.5 h-8 rounded-full bg-zinc-300 dark:bg-zinc-700 group-hover:bg-indigo-500 transition" />
          </div>
        )}
      </aside>

      {/* MOBILE SLIDE-OUT DRAWER */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobileSidebar}
              className="fixed inset-0 gi-modal-overlay"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-64 h-full z-10 shadow-2xl flex flex-col overflow-hidden"
            >
              <SidebarContent
                isMobile={true}
                onCloseMobileSidebar={onCloseMobileSidebar}
                navigationGroups={navigationGroups}
                hasPermission={hasPermission}
                isActive={isActive}
                onSelectPath={(path) => setPendingPath(path)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarContent({
  collapsed = false,
  isMobile = false,
  onCloseMobileSidebar,
  navigationGroups = [],
  hasPermission,
  isActive,
  onSelectPath,
}) {

  return (
    <div className="flex flex-col h-full gi-sidebar select-none overflow-hidden">
      {/* Mobile Drawer Header */}
      {isMobile && (
        <div className="h-12 px-3 border-b gi-divider flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg gi-btn-primary font-bold text-xs flex items-center justify-center shrink-0">
              GI
            </div>
            <span className="font-bold text-sm gi-text-primary tracking-tight">
              GI BOOK ERP
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobileSidebar}
            className="p-1 rounded-md gi-surface-secondary gi-text-secondary hover:bg-[var(--gi-hover)] transition cursor-pointer"
            title="Close Menu"
          >
            <IoClose className="text-lg" />
          </button>
        </div>
      )}

      {/* Navigation Sections */}
      <LayoutGroup id={isMobile ? "sidebar-mobile-group" : "sidebar-desktop-group"}>
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1" suppressHydrationWarning={true}>
          {navigationGroups.map((group, groupIdx) => {
            const visibleItems = group.items.filter(
              (item) => item.module === "Home" || (hasPermission && hasPermission(item.module, "View"))
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={groupIdx} suppressHydrationWarning={true}>
                {groupIdx > 0 && (
                  <div className="border-t gi-divider my-2 mx-1" />
                )}

                <div className="space-y-1" suppressHydrationWarning={true}>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive ? isActive(item.href) : false;

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => onSelectPath && onSelectPath(item.href)}
                        title={collapsed ? item.name : undefined}
                        className="relative block"
                      >
                        <div
                          className={`relative h-10 px-2.5 flex items-center gap-2.5 rounded-lg text-xs transition-colors duration-200 cursor-pointer overflow-hidden w-full ${
                            active
                              ? "font-semibold gi-text-primary"
                              : "gi-text-secondary hover:bg-[var(--gi-hover)] font-medium"
                          }`}
                        >
                          {active && (
                            <motion.div
                              layoutId={isMobile ? "sidebar-blue-pill-mobile" : "sidebar-blue-pill-desktop"}
                              className="absolute inset-0 rounded-lg gi-filter-active z-0 shadow-2xs"
                              transition={{
                                type: "spring",
                                stiffness: 350,
                                damping: 28,
                                mass: 0.8,
                              }}
                            />
                          )}

                          <div className="relative z-10 w-5 h-5 flex items-center justify-center shrink-0">
                            <Icon
                              className="text-base shrink-0"
                              style={{ color: active ? "var(--gi-primary)" : "var(--gi-text-muted)" }}
                            />
                          </div>
                          <span
                            className={`relative z-10 truncate whitespace-nowrap transition-all duration-300 ease-in-out ${
                              collapsed ? "max-w-0 opacity-0 pointer-events-none" : "max-w-[160px] opacity-100"
                            }`}
                          >
                            {item.name}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </LayoutGroup>

      {/* Version Footer */}
      <div className="h-10 px-3 border-t gi-divider flex items-center justify-between text-[11px] gi-text-muted shrink-0 overflow-hidden">
        <span className={`whitespace-nowrap transition-all duration-300 ease-in-out ${collapsed ? "max-w-0 opacity-0 pointer-events-none" : "max-w-[120px] opacity-100"}`}>
          GI BOOK ERP
        </span>
        <span className="font-mono text-[10px] shrink-0">
          {collapsed ? "v1.0" : "v1.0.0"}
        </span>
      </div>
    </div>
  );
}

