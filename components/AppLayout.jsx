"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import LogoutConfirmModal from "./LogoutConfirmModal";

const Topbar = dynamic(() => import("./Topbar"), { ssr: false });
const Sidebar = dynamic(() => import("./Sidebar"), { ssr: false });

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const savedWidth = localStorage.getItem("gi_book_sidebar_width");
    const savedCollapsed = localStorage.getItem("gi_book_sidebar_collapsed");

    startTransition(() => {
      if (savedWidth) {
        const parsed = parseInt(savedWidth, 10);
        if (!isNaN(parsed) && parsed >= 190 && parsed <= 380) {
          setSidebarWidth(parsed);
        }
      }
      if (savedCollapsed !== null) {
        setIsCollapsed(savedCollapsed === "true");
      }
    });

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleWidthChange = (newWidth) => {
    const clamped = Math.max(190, Math.min(380, newWidth));
    setSidebarWidth(clamped);
    localStorage.setItem("gi_book_sidebar_width", clamped);
  };

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("gi_book_sidebar_collapsed", String(next));
      return next;
    });
  };

  const effectiveSidebarWidth = isCollapsed ? 64 : sidebarWidth;

  const isAuthPage =
    pathname === "/login" || pathname === "/sign-up" || pathname === "/";

  const handleOpenMobileSidebar = useCallback(() => {
    setMobileDrawerOpen(true);
  }, []);

  const handleCloseMobileSidebar = useCallback(() => {
    setMobileDrawerOpen(false);
  }, []);

  if (isAuthPage) {
    return (
      <>
        {children}
        <LogoutConfirmModal />
      </>
    );
  }

  return (
    <div className="min-h-screen gi-page flex flex-col font-sans antialiased overflow-x-hidden w-full max-w-full">
      <Topbar
        onOpenMobileSidebar={handleOpenMobileSidebar}
        sidebarWidth={effectiveSidebarWidth}
        isDesktop={isDesktop}
      />
      <Sidebar
        mobileDrawerOpen={mobileDrawerOpen}
        onCloseMobileSidebar={handleCloseMobileSidebar}
        sidebarWidth={effectiveSidebarWidth}
        onSidebarWidthChange={handleWidthChange}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <main
        className="flex-1 pt-14 pb-safe transition-[padding-left] duration-300 ease-in-out w-full max-w-full overflow-x-hidden"
        style={{ paddingLeft: isDesktop ? `${effectiveSidebarWidth}px` : undefined }}
      >
        <div className="w-full max-w-full p-3 sm:p-5 lg:p-8 overflow-x-hidden">
          {children}
        </div>
      </main>
      <LogoutConfirmModal />
    </div>
  );
}

