"use client";

// Main pages in the application (Page-1 destinations)
export const MAIN_PAGES = [
  "/home",
  "/invoice",
  "/payments",
  "/paymentHistory",
  "/ledgers",
  "/ledgerTransactions",
  "/siteProject",
  "/items",
  "/parties",
  "/staff",
  "/reports",
  "/settings",
  "/notifications",
];

const LAST_MAIN_PAGE_KEY = "gi_last_main_page";

/**
 * Call this when a user visits a main page to track it in sessionStorage.
 */
export function trackMainPage(pathname: string) {
  if (typeof window === "undefined" || !pathname) return;
  const cleanPath = pathname.split("?")[0].split("#")[0];

  // Check if cleanPath matches any main page
  const matched = MAIN_PAGES.find((mp) => {
    if (mp === "/home") return cleanPath === "/" || cleanPath === "/home";
    return cleanPath === mp || cleanPath.startsWith(mp + "/");
  });

  if (matched) {
    const target = cleanPath === "/" ? "/home" : cleanPath;
    sessionStorage.setItem(LAST_MAIN_PAGE_KEY, target);
  }
}

/**
 * Returns the target URL to navigate back to Page-1 from an inner page.
 */
export function getSmartBackUrl(
  currentPathname: string,
  searchFromParam?: string | null,
  explicitBackUrl?: string | null,
  fallbackRoute?: string
): string {
  // 1. Explicit search param `?from=...`
  if (searchFromParam && searchFromParam.startsWith("/")) {
    return searchFromParam;
  }

  // 2. Explicit `backUrl` prop passed to PageHeader / component
  if (explicitBackUrl && explicitBackUrl.startsWith("/")) {
    return explicitBackUrl;
  }

  // 3. Last tracked main page from sessionStorage
  if (typeof window !== "undefined") {
    const savedMainPage = sessionStorage.getItem(LAST_MAIN_PAGE_KEY);
    if (savedMainPage && savedMainPage.startsWith("/")) {
      return savedMainPage;
    }
  }

  // 4. Default fallback route based on current inner page
  if (fallbackRoute && fallbackRoute.startsWith("/")) {
    return fallbackRoute;
  }

  const path = (currentPathname || "").toLowerCase();
  if (path.includes("addledgertransaction")) {
    return "/ledgerTransactions";
  }
  if (path.includes("paymentdetails") || path.includes("receivedpayment")) {
    return "/paymentHistory";
  }
  if (path.includes("invoicedetails") || path.includes("invoice")) {
    return "/invoice";
  }
  if (path.includes("ledgerdetails") || path.includes("ledger")) {
    return "/ledgers";
  }
  if (path.includes("siteproject") || path.includes("site") || path.includes("project")) {
    return "/siteProject";
  }
  if (path.includes("item")) {
    return "/items";
  }
  if (path.includes("party") || path.includes("parties")) {
    return "/parties";
  }
  if (path.includes("staff")) {
    return "/staff";
  }
  if (path.includes("reports")) {
    return "/reports";
  }

  return "/home";
}

/**
 * Handles smart back navigation for inner pages.
 */
export function handleSmartBack(
  router: any,
  currentPathname: string,
  searchFromParam?: string | null,
  explicitBackUrl?: string | null,
  fallbackRoute?: string,
  onBackCustom?: () => void
) {
  if (onBackCustom) {
    onBackCustom();
    return;
  }

  // If explicitly provided a 'from' query param, navigate to it
  if (searchFromParam && searchFromParam.startsWith("/")) {
    router.push(searchFromParam);
    return;
  }

  // If explicit back URL is given
  if (explicitBackUrl && explicitBackUrl.startsWith("/")) {
    router.push(explicitBackUrl);
    return;
  }

  // Try browser history back if user navigated here in-app
  if (typeof window !== "undefined" && window.history.length > 1) {
    router.back();
    return;
  }

  const targetUrl = getSmartBackUrl(
    currentPathname,
    searchFromParam,
    explicitBackUrl,
    fallbackRoute
  );

  router.push(targetUrl);
}

