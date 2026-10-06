"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
  IoBusinessOutline,
  IoChevronDown,
  IoAdd,
} from "react-icons/io5";
import { useAuth } from "@/context/AuthContext";
import { usePreferences } from "@/lib/hooks/usePreferences";
import CustomBusinessLogo from "@/components/CustomBusinessLogo";

export default function Sidebar({
  mobileDrawerOpen = false,
  onCloseMobileSidebar = () => { },
  sidebarWidth = 210,
  onSidebarWidthChange = () => { },
  isCollapsed = false,
  onToggleCollapse = () => { },
}: {
  mobileDrawerOpen?: boolean;
  onCloseMobileSidebar?: () => void;
  sidebarWidth?: number;
  onSidebarWidthChange?: (width: number) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const { t } = usePreferences();
  const { currentUser, activeBusiness, logoutUser, hasPermission } = useAuth();

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

  // Don't render navigation on outer auth pages
  if (pathname === "/login" || pathname === "/sign-up" || pathname === "/" || pathname === "/access-denied") {
    return null;
  }

  const currentPath = pendingPath || pathname;

  const isActive = (path: string) => {
    if (path === "/home") return currentPath === "/home";
    if (path === "/items") return currentPath.startsWith("/items") || currentPath.startsWith("/addItem") || currentPath.startsWith("/adjustStock");
    if (path === "/invoice") return currentPath.startsWith("/invoice") || currentPath.startsWith("/addInvoice") || currentPath.startsWith("/invoiceDetails");
    if (path === "/siteProject") return currentPath.startsWith("/siteProject") || currentPath.startsWith("/addSiteProject") || currentPath.startsWith("/projectDetails") || currentPath.startsWith("/siteDetails");
    if (path === "/staff") return currentPath.startsWith("/staff") || currentPath.startsWith("/addStaff");
    if (path === "/ledgers") return currentPath === "/ledgers" || currentPath.startsWith("/addLedger");
    if (path === "/parties") return currentPath.startsWith("/parties") || currentPath.startsWith("/addParty");
    if (path === "/payments") return currentPath.startsWith("/payment");
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
          name: "Ledgers",
          href: "/ledgers",
          icon: IoWalletOutline,
          module: "Ledger",
        },
        {
          name: "Transactions",
          href: "/ledgerTransactions",
          icon: IoSwapHorizontalOutline,
          module: "Ledger",
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
      {/* DESKTOP FIXED SIDEBAR */}
      <aside
        className="hidden md:block fixed top-0 left-0 bottom-0 z-50 group/sidebar"
        style={{ width: `${sidebarWidth}px` }}
        suppressHydrationWarning={true}
      >
        <SidebarContent
          collapsed={isCollapsed}
          navigationGroups={navigationGroups}
          hasPermission={hasPermission}
          isActive={isActive}
          onSelectPath={(path) => setPendingPath(path)}
          onCloseMobileSidebar={() => { }}
          onToggleCollapse={onToggleCollapse}
        />
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
  onToggleCollapse,
}: any) {
  const { t } = usePreferences();
  const { currentUser, activeBusiness, businesses, switchActiveBusiness } = useAuth();
  const [businessMenuOpen, setBusinessMenuOpen] = useState(false);
  const businessMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (businessMenuRef.current && !businessMenuRef.current.contains(e.target as Node)) {
        setBusinessMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setBusinessMenuOpen(false);
  }, [collapsed]);

  const getBizName = (biz: any) => {
    if (!biz) return "Select Business";
    return biz.business_name || biz.name || biz.title || "Select Business";
  };

  const getBizLogo = (biz: any) => {
    if (!biz) return null;
    return biz.business_logo || biz.logo || null;
  };

  const getBizType = (biz: any) => {
    if (!biz) return "Active Workspace";
    const typeStr = biz.business_type || biz.type;
    return typeStr ? `${typeStr} Business` : "Active Workspace";
  };

  const getTranslatedName = (name: string, key?: string) => {
    if (key) {
      const translated = t(key);
      if (translated && translated !== key) return translated;
    }
    if (name === "Dashboard") return t("home") || name;
    if (name === "Invoices") return t("invoices") || name;
    if (name === "Payments") return t("payments") || name;
    if (name === "Ledgers") return t("ledgers") || name;
    if (name === "Transactions" || name === "Ledger Transfers") return t("transactions") || name;
    if (name === "Parties") return t("parties") || name;
    if (name === "Items / Stock") return t("items") || name;
    if (name === "Sites / Projects") return t("siteProject") || name;
    if (name === "Staff") return t("staff") || name;
    if (name === "Reports") return t("reports") || name;
    if (name === "Settings") return t("settings") || name;
    return t(name) || name;
  };

  return (
    <div className="flex flex-col h-full gi-sidebar select-none relative z-20">
      {/* ── Brand Logo Section (Top of Sidebar) ── */}
      <div className={`h-14 px-3 flex items-center shrink-0 border-b border-white/5 ${collapsed ? "justify-center" : "justify-between"}`}>
        {collapsed ? (
          /* When collapsed: Logo container transforms into collapse slider toggle button on hover */
          <button
            type="button"
            onClick={() => onToggleCollapse && onToggleCollapse()}
            className="group/logo relative h-9 w-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition cursor-pointer"
            title="Click to expand sidebar"
            aria-label="Expand sidebar"
          >
            {/* Logo shown by default */}
            <img
              src="/GiBook_logo_mark_transparent.png"
              alt="GiBook Logo"
              className="h-8 w-8 object-contain transition-all duration-200 group-hover/logo:opacity-0 group-hover/logo:scale-75"
            />
            {/* Slider toggle icon shown on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-all duration-200 text-white">
              <div className="h-7 w-7 rounded-lg bg-blue-600 hover:bg-blue-500 flex items-center justify-center shadow-md">
                <IoChevronForward className="text-base" />
              </div>
            </div>
          </button>
        ) : (
          /* When expanded: Brand logo + Collapse Slider button */
          <>
            <Link href="/home" className="flex items-center gap-2 overflow-hidden py-1">
              <img
                src="/logo.png"
                alt="GiBook Logo"
                className="h-10 sm:h-11 w-auto object-contain shrink-0 max-w-[150px] py-0.5"
              />
            </Link>

            {!isMobile && onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0 shadow-2xs"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <IoChevronBack className="text-sm" />
              </button>
            )}
          </>
        )}
      </div>

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
                {groupIdx > 0 && <div className="h-2" />}

                <div className="space-y-1" suppressHydrationWarning={true}>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive ? isActive(item.href) : false;
                    const displayName = getTranslatedName(item.name, item.key);

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => onSelectPath && onSelectPath(item.href)}
                        title={collapsed ? displayName : undefined}
                        className="relative block"
                      >
                        <div
                          className={`relative h-10 px-2.5 flex items-center gap-2.5 rounded-lg text-xs transition-colors duration-200 cursor-pointer overflow-hidden w-full ${active
                            ? "font-bold text-white"
                            : "text-slate-300 hover:text-white hover:bg-white/10 font-medium"
                            }`}
                        >
                          {active && (
                            <div className="absolute inset-0 rounded-lg bg-blue-600 text-white z-0 shadow-md transition-all duration-150" />
                          )}

                          <div className="relative z-10 w-5 h-5 flex items-center justify-center shrink-0">
                            <Icon
                              className="text-base shrink-0"
                              style={{ color: active ? "#ffffff" : "#94A3B8" }}
                            />
                          </div>
                          <span
                            className={`relative z-10 truncate whitespace-nowrap ${collapsed ? "hidden" : "max-w-[160px] opacity-100"
                              }`}
                            style={{ color: active ? "#ffffff" : undefined }}
                          >
                            {displayName}
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

      {/* ── Business Selection Section (Bottom of Sidebar) ── */}
      <div className="p-2 relative shrink-0 z-30" ref={businessMenuRef}>
        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => {
              if (collapsed && onToggleCollapse) {
                onToggleCollapse();
              } else {
                setBusinessMenuOpen(!businessMenuOpen);
              }
            }}
            className={`w-full h-11 px-2 rounded-xl bg-white/5 hover:bg-white/10 flex items-center cursor-pointer group min-w-0 transition ${collapsed ? "justify-center" : "gap-2.5 px-2.5"
              }`}
            title={collapsed ? "Click to expand sidebar" : "Click to switch active business"}
          >
            <CustomBusinessLogo
              logoPath={getBizLogo(activeBusiness)}
              name={getBizName(activeBusiness)}
              size={28}
              shape="rounded"
            />

            {/* Business Details */}
            <div
              className={`min-w-0 text-left flex-1 overflow-hidden whitespace-nowrap ${collapsed ? "hidden" : "max-w-[200px] opacity-100"
                }`}
            >
              <h1 className="text-xs font-bold text-white tracking-tight truncate leading-tight group-hover:opacity-90">
                {getBizName(activeBusiness)}
              </h1>
              <p className="text-[10px] font-medium text-slate-400 leading-none mt-0.5 truncate">
                {getBizType(activeBusiness)}
              </p>
            </div>

            {/* Chevron Arrow */}
            <IoChevronDown
              className={`text-xs text-slate-400 shrink-0 ${collapsed ? "hidden" : "w-3 opacity-100"
                }`}
            />
          </button>

          {isMobile && (
            <button
              type="button"
              onClick={onCloseMobileSidebar}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-300 transition cursor-pointer shrink-0 md:hidden"
              title="Close Drawer"
            >
              <IoClose className="text-lg" />
            </button>
          )}
        </div>

        {/* Business Dropdown Menu */}
        <AnimatePresence>
          {businessMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.15 }}
              className={`absolute z-50 rounded-2xl bg-[#19223C] border border-white/10 text-white shadow-2xl p-2.5 space-y-1 ${collapsed ? "left-16 bottom-2 w-64" : "left-2 right-2 bottom-full mb-2 w-[calc(100%-16px)]"
                }`}
            >
              <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-white/10 mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Business
                </span>
                {(!currentUser?.isStaff || currentUser?.role === "Owner") && (
                  <Link
                    href="/addBusiness"
                    onClick={() => setBusinessMenuOpen(false)}
                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-0.5 transition"
                  >
                    <IoAdd className="text-xs" />
                    <span>Add New</span>
                  </Link>
                )}
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1 pt-0.5">
                {businesses && businesses.length > 0 ? (
                  businesses.map((bus: any) => (
                    <button
                      key={bus.id}
                      type="button"
                      onClick={() => {
                        switchActiveBusiness(bus);
                        setBusinessMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-xs text-left transition cursor-pointer ${activeBusiness?.id === bus.id
                        ? "bg-blue-600 text-white font-bold shadow-md"
                        : "text-slate-300 hover:text-white hover:bg-white/10 font-medium"
                        }`}
                    >
                      <CustomBusinessLogo
                        logoPath={getBizLogo(bus)}
                        name={getBizName(bus)}
                        size={26}
                        shape="rounded"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`truncate font-semibold ${activeBusiness?.id === bus.id ? "text-white" : ""}`}>{getBizName(bus)}</p>
                        <p className={`text-[10px] capitalize ${activeBusiness?.id === bus.id ? "text-blue-100" : "text-slate-400"}`}>{getBizType(bus)}</p>
                      </div>
                      {activeBusiness?.id === bus.id && (
                        <span className="h-2 w-2 rounded-full bg-white shrink-0 shadow-xs" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400">
                    No businesses found
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

