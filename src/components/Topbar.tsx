"use client";

import { useState, useEffect, useRef, startTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  IoNotificationsOutline,
  IoAdd,
  IoChevronDown,
  IoBusinessOutline,
  IoLogOutOutline,
  IoDocumentTextOutline,
  IoReceiptOutline,
  IoPersonAddOutline,
  IoCubeSharp,
  IoCardOutline,
  IoArrowUpOutline,
  IoPeopleCircleOutline,
  IoLocationOutline,
  IoMenu,
  IoWalletOutline,
  IoSwapHorizontalOutline,
  IoHomeOutline,
  IoKeyOutline,
  IoSettingsOutline,
  IoSearchOutline,
  IoClose,
} from "react-icons/io5";
import { useAuth } from "@/context/AuthContext";
import { usePreferences } from "@/lib/hooks/usePreferences";
import { authApi } from "@/lib/api/auth";
import { notificationApi } from "@/lib/api/notification";
import SearchBar from "@/components/SearchBar";

export default function Topbar({
  onOpenMobileSidebar,
  sidebarWidth = 256,
  isDesktop = false,
  isCollapsed = false,
  onToggleCollapse = () => { },
}: {
  onOpenMobileSidebar?: () => void;
  sidebarWidth?: number;
  isDesktop?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, theme, setTheme, language, setLanguage } = usePreferences();
  const {
    currentUser,
    activeBusiness,
    businesses,
    switchActiveBusiness,
    logoutUser,
    hasPermission,
  } = useAuth();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [businessMenuOpen, setBusinessMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [topbarProfile, setTopbarProfile] = useState<any>(null);
  const [topbarNotifs, setTopbarNotifs] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const fetchTopbarNotifs = async () => {
    try {
      const res: any = await notificationApi.getNotifications({ page: 1, per_page: 5, silentError: true });
      const list = res?.body?.notifications || res?.body?.data || res?.data || (Array.isArray(res?.body) ? res.body : []);
      if (Array.isArray(list)) {
        setTopbarNotifs(list);
        setUnreadNotifCount(list.filter((n: any) => !n.is_read).length);
      }
    } catch (err) {
      console.warn("Topbar fetch notifications warning:", err);
    }
  };

  useEffect(() => {
    const fetchTopbarProfile = async () => {
      try {
        const res = await authApi.getProfile({ silentError: true });
        const uData = res?.body?.user || res?.user || res?.body?.data || res?.data || res?.body || res;
        if (uData && typeof uData === "object" && uData.name) {
          setTopbarProfile(uData);
        }
      } catch (err) {
        console.warn("Topbar fetch profile warning:", err);
      }
    };
    fetchTopbarProfile();
    fetchTopbarNotifs();
  }, [activeBusiness?.id]);

  const userMenuRef = useRef(null);
  const quickAddRef = useRef(null);
  const notifRef = useRef(null);
  const businessMenuRef = useRef(null);
  const mobileSearchRef = useRef(null);

  // Close menus on route change
  useEffect(() => {
    startTransition(() => {
      setUserMenuOpen(false);
      setQuickAddOpen(false);
      setNotificationsOpen(false);
      setBusinessMenuOpen(false);
      setMobileSearchOpen(false);
    });
  }, [pathname]);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (quickAddRef.current && !quickAddRef.current.contains(e.target)) {
        setQuickAddOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (businessMenuRef.current && !businessMenuRef.current.contains(e.target)) {
        setBusinessMenuOpen(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target)) {
        setMobileSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't render topbar on auth pages
  if (pathname === "/login" || pathname === "/sign-up" || pathname === "/") {
    return null;
  }

  const quickActions = [
    {
      title: "Sales Invoice",
      href: "/addInvoice/sales",
      icon: IoDocumentTextOutline,
      allowed: hasPermission("Invoice", "Create"),
    },
    {
      title: "Purchase Invoice",
      href: "/addInvoice/purchase",
      icon: IoReceiptOutline,
      allowed: hasPermission("Invoice", "Create"),
    },
    {
      title: "New Party",
      href: "/addParty",
      icon: IoPersonAddOutline,
      allowed: hasPermission("Ledger", "Create"),
    },
    {
      title: "New Item",
      href: "/addItem",
      icon: IoCubeSharp,
      allowed: hasPermission("Item Transaction", "Create"),
    },
    {
      title: "Record Payment",
      href: "/payment/receivedPayment",
      icon: IoCardOutline,
      allowed: hasPermission("Payment", "Create"),
    },
    {
      title: "New Ledger",
      href: "/addLedger",
      icon: IoWalletOutline,
      allowed: hasPermission("Ledger", "Create"),
    },
    {
      title: "Ledger Transfer",
      href: "/addLedgerTransaction",
      icon: IoSwapHorizontalOutline,
      allowed: hasPermission("Ledger", "Create"),
    },
    {
      title: "Add Staff Member",
      href: "/addStaff",
      icon: IoPeopleCircleOutline,
      allowed: hasPermission("Staff", "Create"),
    },
    {
      title: "New Site/Project",
      href: "/addSiteProject",
      icon: IoLocationOutline,
      allowed: hasPermission("Site", "Create") || hasPermission("Project", "Create"),
    },
  ].filter((a) => a.allowed);

  return (
    <>
      <header
        className="fixed top-0 right-0 z-40 h-14 gi-topbar flex items-center justify-between px-3 sm:px-5 select-none gap-3 transition-all duration-200"
        style={{ left: isDesktop ? `${sidebarWidth}px` : 0 }}
        suppressHydrationWarning
      >
        {/* ── Left: Mobile Menu + Mobile Logo + Search Bar ── */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0 flex-1 max-w-md">

          {/* Mobile Drawer Toggle */}
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="h-9 w-9 rounded-lg gi-surface-secondary gi-text-secondary hover:bg-[var(--gi-hover)] flex items-center justify-center transition cursor-pointer md:hidden shrink-0"
            title="Open Menu"
          >
            <IoMenu className="text-xl" />
          </button>

          {/* Mobile Brand Logo */}
          <Link href="/home" className="flex items-center shrink-0 md:hidden py-0.5" title="GI BOOK">
            <img
              src="/logo.png"
              alt="GiBook Logo"
              className="h-7 w-auto object-contain max-h-7"
            />
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden md:block w-full max-w-xs sm:max-w-sm">
            <SearchBar placeholder="Search anything..." />
          </div>
        </div>

        {/* ── Right: Action Controls ── */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {/* Mobile Search Icon Button */}
          <div className="relative md:hidden" ref={mobileSearchRef}>
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="h-9 w-9 rounded-lg gi-surface-secondary gi-text-secondary hover:bg-[var(--gi-hover)] flex items-center justify-center transition cursor-pointer shrink-0"
              title="Search"
            >
              <IoSearchOutline className="text-lg" />
            </button>

            <AnimatePresence>
              {mobileSearchOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="fixed top-14 left-0 right-0 p-3 bg-white dark:bg-zinc-900 shadow-xl border-b gi-divider z-50 flex items-center gap-2"
                >
                  <div className="flex-1">
                    <SearchBar placeholder="Search anything..." autoFocus={true} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileSearchOpen(false)}
                    className="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center gi-text-muted shrink-0 cursor-pointer"
                    title="Close Search"
                  >
                    <IoClose className="text-xl" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Actions Button */}
          {quickActions.length > 0 && (
            <div className="relative" ref={quickAddRef}>
              <button
                type="button"
                onClick={() => setQuickAddOpen(!quickAddOpen)}
                className="h-9 px-2.5 sm:px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer justify-center"
                title="Quick Actions"
              >
                <IoAdd className="text-base shrink-0" />
                <span className="hidden sm:inline">Quick Actions</span>
              </button>

              <AnimatePresence>
                {quickAddOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="fixed sm:absolute top-14 sm:top-full right-3 sm:right-0 mt-1 sm:mt-2 z-50 w-64 sm:w-[360px] max-w-[calc(100vw-1.5rem)] rounded-2xl gi-card shadow-2xl p-3 border gi-divider"
                  >
                    <div className="px-2 py-1 text-[10px] font-bold gi-text-muted uppercase tracking-wider border-b gi-divider mb-2 sm:col-span-3">
                      Quick Actions
                    </div>
                    <div className="flex flex-col space-y-1 sm:grid sm:grid-cols-3 sm:gap-2 sm:space-y-0">
                      {quickActions.map((act) => {
                        const ActIcon = act.icon;
                        return (
                          <Link key={act.title} href={act.href} onClick={() => setQuickAddOpen(false)}>
                            <div className="flex items-center sm:flex-col sm:justify-center text-left sm:text-center gap-2.5 sm:gap-1.5 px-2.5 py-2 sm:py-2.5 sm:px-1 rounded-xl hover:bg-[var(--gi-hover)] gi-surface-secondary/60 border gi-divider text-xs font-medium gi-text-primary cursor-pointer transition active:scale-[0.97] h-full min-h-[44px] sm:min-h-[60px]">
                              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <ActIcon className="text-base sm:text-lg" />
                              </div>
                              <span className="truncate w-full text-[11px] sm:text-xs font-semibold leading-tight gi-text-primary">{act.title}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}



          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <Link
              href="/notifications"
              className="h-9 w-9 rounded-lg gi-surface-secondary gi-text-secondary hover:bg-[var(--gi-hover)] flex items-center justify-center relative transition cursor-pointer"
              title="Notifications">
              <button
                className="cursor-pointer"
                type="button"
              >
                <IoNotificationsOutline className="text-xl" />
              </button>
            </Link>
          </div>

          {/* User Avatar / Account Details */}
          {(currentUser || topbarProfile) && (
            <div className="relative" ref={userMenuRef}>
              {(() => {
                const displayUser = topbarProfile || currentUser;
                const userName = displayUser?.name || "User Account";
                const userContact = displayUser?.email || displayUser?.mobile_number || displayUser?.mobile || displayUser?.phone || "User Account";
                const userRole = displayUser?.user_type || displayUser?.role || (displayUser?.isStaff ? "Staff" : "Owner");

                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      title="Account Details"
                    >
                      <div className="h-9 w-9 rounded-md gi-btn-primary font-bold text-[11px] flex items-center justify-center shrink-0 uppercase">
                        {userName.charAt(0) || "U"}
                      </div>

                    </button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-11 z-50 w-60 rounded-xl gi-card shadow-xl p-2 space-y-2"
                        >
                          <div className="px-2.5 py-2 rounded-lg gi-surface-secondary border gi-divider">
                            <p className="text-xs font-bold gi-text-primary truncate">{userName}</p>
                            <p className="text-[11px] gi-text-muted truncate mt-0.5">{userContact}</p>
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase gi-badge-info">
                              {userRole}
                            </span>
                          </div>

                          <div className="pt-1 border-t gi-divider space-y-0.5">
                            <Link
                              href="/settings?tab=account"
                              onClick={() => setUserMenuOpen(false)}
                              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium gi-text-secondary hover:bg-[var(--gi-hover)] transition cursor-pointer"
                            >
                              <IoKeyOutline className="text-sm text-indigo-600 dark:text-indigo-400 shrink-0" />
                              <span>Account Settings</span>
                            </Link>
                            <Link
                              href="/settings"
                              onClick={() => setUserMenuOpen(false)}
                              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium gi-text-secondary hover:bg-[var(--gi-hover)] transition cursor-pointer"
                            >
                              <IoSettingsOutline className="text-sm shrink-0" />
                              <span>Business &amp; System Settings</span>
                            </Link>
                            <button
                              type="button"
                              onClick={logoutUser}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer bg-red-600 hover:bg-red-700 text-white shadow-xs mt-1"
                            >
                              <IoLogOutOutline className="text-sm shrink-0" />
                              <span>Log out</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </header>
    </>
  );
}
