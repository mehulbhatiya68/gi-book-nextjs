"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

import LogoutConfirmModal from "@/components/LogoutConfirmModal";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../lib/i18n';

import { trackMainPage } from "@/lib/utils/smartNavigation";

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(210);

  // Lazily initialize layout state to prevent post-mount re-render layout shifts
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return true; // Default to desktop on server
  });

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("gi_book_sidebar_collapsed") === "true";
    }
    return false;
  });

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("gi_book_sidebar_collapsed", String(next));
      return next;
    });
  };

  const effectiveSidebarWidth = isCollapsed ? 64 : 210;

  // Automatically close mobile sidebar drawer and scroll to top on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      trackMainPage(pathname);
    }
  }, [pathname]);

  const isOuterPage =
    pathname === "/login" ||
    pathname === "/sign-up" ||
    pathname === "/" ||
    pathname === "/access-denied";

  const handleOpenMobileSidebar = useCallback(() => {
    setMobileDrawerOpen(true);
  }, []);

  const handleCloseMobileSidebar = useCallback(() => {
    setMobileDrawerOpen(false);
  }, []);

  if (isOuterPage) {
    return (
      <div className="min-h-screen gi-page flex flex-col font-sans antialiased w-full max-w-full">
        {children}
        <LogoutConfirmModal />
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gi-page flex flex-col font-sans antialiased overflow-x-hidden w-full max-w-full print:bg-white print:text-black">
      <div className="print:hidden">
        <Topbar
          onOpenMobileSidebar={handleOpenMobileSidebar}
          sidebarWidth={effectiveSidebarWidth}
          isDesktop={isDesktop}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
        <Sidebar
          mobileDrawerOpen={mobileDrawerOpen}
          onCloseMobileSidebar={handleCloseMobileSidebar}
          sidebarWidth={effectiveSidebarWidth}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>
      <main
        className="flex-1 pt-14 pb-safe w-full max-w-full overflow-x-hidden print:p-0 print:m-0 print:pt-0 print:w-full print:block"
        style={{ paddingLeft: isDesktop ? `${effectiveSidebarWidth}px` : undefined }}
        suppressHydrationWarning
      >
        <div className="w-full max-w-full p-3 sm:p-5 lg:p-8 overflow-x-hidden print:p-0 print:m-0 print:w-full">
          {children}
        </div>
      </main>
      <div className="print:hidden">
        <LogoutConfirmModal />
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
      </div>
    </div>
  );
}
