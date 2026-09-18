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
} from "react-icons/io5";
import { useApp } from "@/context/AppContext";
import SearchBar from "./SearchBar";

const getPageTitle = (pathname) => {
  if (!pathname) return "Dashboard";
  if (pathname === "/home") return "Dashboard";
  if (pathname === "/invoice") return "Invoices & Billing";
  if (pathname.startsWith("/addInvoice/sales")) return "Create Sales Invoice";
  if (pathname.startsWith("/addInvoice/purchase")) return "Add Purchase Invoice";
  if (pathname.startsWith("/invoiceDetails")) return "Invoice Details";
  if (pathname === "/parties") return "Parties & Ledger";
  if (pathname.startsWith("/parties/")) return "Party Details";
  if (pathname === "/addParty") return "Add New Party";
  if (pathname === "/items") return "Items & Inventory";
  if (pathname.startsWith("/items/edit")) return "Edit Item";
  if (pathname.startsWith("/items/")) return "Item Details";
  if (pathname === "/addItem") return "Add New Item";
  if (pathname.startsWith("/adjustStock")) return "Adjust Stock";
  if (pathname === "/payments") return "Payments & Cash Flow";
  if (pathname.startsWith("/payment/receivedPayment")) return "Record Payment";
  if (pathname.startsWith("/paymentDetails")) return "Payment Details";
  if (pathname === "/paymentHistory") return "Payment History";
  if (pathname === "/ledgers") return "Ledgers & Accounts";
  if (pathname === "/addLedger") return "Add New Ledger";
  if (pathname === "/ledgerTransactions") return "Ledger Transfers";
  if (pathname === "/addLedgerTransaction") return "Record Transfer";
  if (pathname === "/siteProject") return "Sites & Projects";
  if (pathname.startsWith("/siteDetails")) return "Site Details";
  if (pathname.startsWith("/projectDetails")) return "Project Details";
  if (pathname === "/addSiteProject") return "Add Site / Project";
  if (pathname === "/staff") return "Staff Management";
  if (pathname === "/addStaff") return "Add Staff Member";
  if (pathname === "/reports") return "Reports & Analytics";
  if (pathname === "/settings") return "Settings & Profile";
  if (pathname === "/addBusiness") return "Add New Business";
  if (pathname === "/notifications") return "Notifications";
  return "Dashboard";
};

export default function Topbar({ onOpenMobileSidebar, sidebarWidth = 256, isDesktop = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = getPageTitle(pathname);
  const {
    currentUser,
    activeBusiness,
    businesses,
    switchActiveBusiness,
    logoutUser,
    hasPermission,
    t,
  } = useApp();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [businessMenuOpen, setBusinessMenuOpen] = useState(false);

  const userMenuRef = useRef(null);
  const quickAddRef = useRef(null);
  const notifRef = useRef(null);
  const businessMenuRef = useRef(null);

  // Close menus on route change
  useEffect(() => {
    startTransition(() => {
      setUserMenuOpen(false);
      setQuickAddOpen(false);
      setNotificationsOpen(false);
      setBusinessMenuOpen(false);
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
      title: "Received Payment",
      href: "/payment/receivedPayment?type=credit",
      icon: IoCardOutline,
      allowed: hasPermission("Payment", "Create"),
    },
    {
      title: "Payment Out",
      href: "/payment/receivedPayment?type=debit",
      icon: IoArrowUpOutline,
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
    {
      title: "Add New Business",
      href: "/addBusiness",
      icon: IoBusinessOutline,
      allowed: !currentUser?.isStaff || currentUser?.role === "Owner",
    },
  ].filter((a) => a.allowed);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 h-14 gi-topbar flex items-center justify-between px-3 sm:px-4 select-none gap-2"
      >

        {/* ── Left: Mobile Menu + Mobile Home + Active Business Selector + Page Heading ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="h-9 w-9 rounded-lg gi-surface-secondary gi-text-secondary hover:bg-[var(--gi-hover)] flex items-center justify-center transition cursor-pointer md:hidden shrink-0"
            title="Open Menu"
          >
            <IoMenu className="text-xl" />
          </button>

          {/* Mobile Home Button */}
          <Link
            href="/home"
            className="h-9 w-9 rounded-lg gi-surface-secondary gi-text-secondary hover:bg-[var(--gi-hover)] flex items-center justify-center transition cursor-pointer md:hidden shrink-0"
            title="Go to Home / Dashboard"
          >
            <IoHomeOutline className="text-lg" />
          </Link>

          <div className="relative" ref={businessMenuRef}>
            <button
              type="button"
              onClick={() => setBusinessMenuOpen(!businessMenuOpen)}
              className="h-10 px-2 rounded-lg flex items-center gap-2.5 transition cursor-pointer hover:bg-[var(--gi-hover)] group max-w-[220px] sm:max-w-[320px]"
              title="Click to switch active business"
            >
              {activeBusiness?.logo ? (
                <img
                  src={activeBusiness.logo}
                  alt={activeBusiness.name}
                  className="h-7 w-7 rounded-lg object-cover shrink-0 shadow-xs"
                />
              ) : (
                <div className="h-7 w-7 rounded-lg gi-btn-primary font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  <IoBusinessOutline className="text-base" />
                </div>
              )}
              <div className="min-w-0 text-left flex-1">
                <h1 className="text-sm sm:text-base font-bold gi-text-primary tracking-tight truncate leading-tight group-hover:opacity-90">
                  {activeBusiness?.name || "Select Business"}
                </h1>
                <p className="text-[10px] font-semibold gi-text-secondary leading-none mt-0.5 truncate">
                  {activeBusiness?.type ? `${activeBusiness.type} Business` : "Active Workspace"}
                </p>
              </div>
              <IoChevronDown className="text-xs gi-text-muted shrink-0 transition-transform duration-200" />
            </button>

            <AnimatePresence>
              {businessMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-11 z-50 w-64 rounded-xl gi-card shadow-xl p-2 space-y-1"
                >
                  <div className="px-2 py-1 flex items-center justify-between border-b gi-divider pb-2">
                    <span className="text-[10px] font-bold gi-text-muted uppercase tracking-wider">
                      Select Business
                    </span>
                    {(!currentUser?.isStaff || currentUser?.role === "Owner") && (
                      <Link
                        href="/addBusiness"
                        onClick={() => setBusinessMenuOpen(false)}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <IoAdd className="text-xs" />
                        <span>Add New</span>
                      </Link>
                    )}
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-0.5 pt-1">
                    {businesses && businesses.length > 0 ? (
                      businesses.map((bus) => (
                        <button
                          key={bus.id}
                          type="button"
                          onClick={() => {
                            switchActiveBusiness(bus);
                            setBusinessMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-left transition cursor-pointer ${
                            activeBusiness?.id === bus.id
                              ? "gi-filter-active font-bold"
                              : "gi-text-secondary hover:bg-[var(--gi-hover)] font-medium"
                          }`}
                        >
                          {bus.logo ? (
                            <img
                              src={bus.logo}
                              alt={bus.name}
                              className="h-6 w-6 rounded-md object-cover shrink-0"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-md gi-surface-secondary flex items-center justify-center font-bold text-xs shrink-0">
                              <IoBusinessOutline className="text-sm" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">{bus.name}</p>
                            <p className="text-[10px] gi-text-muted capitalize">{bus.type || "Business"}</p>
                          </div>
                          {activeBusiness?.id === bus.id && (
                            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs gi-text-muted">
                        No businesses found
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Right: Action Controls ── */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {/* Search Bar (placed to the left of Create button) */}
          <div className="hidden md:block w-64 lg:w-80">
            <SearchBar placeholder="Search invoices, parties, items, payments..." />
          </div>

          {/* Quick Add Button */}
          {quickActions.length > 0 && (
            <div className="relative" ref={quickAddRef}>
              <button type="button" onClick={() => setQuickAddOpen(!quickAddOpen)} className="h-9 w-9 sm:w-auto sm:px-3 rounded-lg gi-btn-primary text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer justify-center" title="Quick Create">
                <IoAdd className="text-base shrink-0" />
                <span className="hidden sm:inline">Create</span>
              </button>

              <AnimatePresence>
                {quickAddOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 z-50 w-52 rounded-xl gi-card shadow-xl p-1.5 space-y-0.5"
                  >
                    <div className="px-2 py-1 text-[10px] font-bold gi-text-muted uppercase tracking-wider">Quick Create</div>
                    {quickActions.map((act) => {
                      const ActIcon = act.icon;
                      return (
                        <Link key={act.title} href={act.href}>
                          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-[var(--gi-hover)] text-xs font-medium gi-text-secondary cursor-pointer transition">
                            <ActIcon className="text-sm shrink-0" style={{ color: "var(--gi-primary)" }} />
                            <span className="truncate">{act.title}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button type="button" onClick={() => setNotificationsOpen(!notificationsOpen)} className="h-9 w-9 rounded-lg gi-surface-secondary gi-text-secondary hover:bg-[var(--gi-hover)] flex items-center justify-center relative transition cursor-pointer" title="Notifications">
              <IoNotificationsOutline className="text-lg" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full" style={{ background: "var(--gi-primary)" }} />
            </button>

            <AnimatePresence>
              {notificationsOpen && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }} className="absolute right-0 top-11 z-50 w-72 rounded-xl gi-card shadow-xl p-3 space-y-2">
                  <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--gi-border)" }}>
                    <span className="text-xs font-bold gi-text-primary">Notifications</span>
                    <span className="text-[10px] font-semibold" style={{ color: "var(--gi-primary)" }}>Mark all as read</span>
                  </div>
                  <div className="p-2 rounded-lg gi-badge-info text-xs">
                    <p className="font-semibold gi-text-primary">System Ready</p>
                    <p className="text-[11px] gi-text-muted mt-0.5">GI Book accounting module is operational.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Avatar (Hidden on Mobile Portrait) */}
          {currentUser && (
            <div className="relative hidden sm:block" ref={userMenuRef}>
              <button type="button" onClick={() => setUserMenuOpen(!userMenuOpen)} className="h-9 px-1.5 rounded-lg gi-surface-secondary hover:bg-[var(--gi-hover)] gi-text-secondary flex items-center gap-1.5 transition cursor-pointer">
                <div className="h-6 w-6 rounded-md gi-btn-primary font-bold text-[11px] flex items-center justify-center shrink-0">
                  {currentUser.name?.charAt(0) || "U"}
                </div>
                <span className="hidden md:inline text-xs font-semibold truncate max-w-[100px] gi-text-primary">
                  {currentUser.name?.split(" ")[0] || "User"}
                </span>
                <IoChevronDown className="text-xs gi-text-muted hidden sm:block" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }} className="absolute right-0 top-11 z-50 w-60 rounded-xl gi-card shadow-xl p-2 space-y-2">
                    <div className="px-2.5 py-2 rounded-lg gi-surface-secondary" style={{ border: "1px solid var(--gi-border)" }}>
                      <p className="text-xs font-bold gi-text-primary truncate">{currentUser.name}</p>
                      <p className="text-[11px] gi-text-muted truncate mt-0.5">{currentUser.email || currentUser.mobile || "User Account"}</p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase gi-badge-info">{currentUser.role || "Owner"}</span>
                    </div>

                    <div className="space-y-1 pt-1 border-t" style={{ borderColor: "var(--gi-border)" }}>
                      <div className="flex items-center justify-between px-2">
                        <p className="text-[10px] font-bold gi-text-muted uppercase tracking-wider">Switch Business</p>
                        {(!currentUser?.isStaff || currentUser?.role === "Owner") && (
                          <Link href="/addBusiness" onClick={() => setUserMenuOpen(false)} className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5">
                            <IoAdd className="text-xs" />
                            <span>Add New</span>
                          </Link>
                        )}
                      </div>
                      {businesses && businesses.length > 0 ? (
                        <div className="max-h-36 overflow-y-auto space-y-0.5">
                          {businesses.map((biz) => {
                            const isCurrent = activeBusiness?.id === biz.id;
                            return (
                              <button key={biz.id} type="button" onClick={() => { if (typeof switchActiveBusiness === "function") { switchActiveBusiness(biz); } setUserMenuOpen(false); }} className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition cursor-pointer ${isCurrent ? "gi-filter-active" : "gi-text-secondary hover:bg-[var(--gi-hover)]"}`}>
                                <div className="flex items-center gap-2 min-w-0">
                                  <IoBusinessOutline className="text-sm shrink-0" />
                                  <span className="truncate">{biz.name}</span>
                                </div>
                                {isCurrent && <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "var(--gi-primary)" }} />}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-2 text-center">
                          <Link href="/addBusiness" onClick={() => setUserMenuOpen(false)} className="inline-flex items-center gap-1 text-xs font-semibold gi-btn-primary px-3 py-1.5 rounded-md">
                            <IoAdd className="text-sm" />
                            <span>Add Business</span>
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="pt-1 border-t" style={{ borderColor: "var(--gi-border)" }}>
                      <button type="button" onClick={logoutUser} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer" style={{ color: "var(--gi-danger)" }} onMouseEnter={e => e.currentTarget.style.background = "var(--gi-danger-bg)"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                        <IoLogOutOutline className="text-sm" />
                        <span>Log out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
