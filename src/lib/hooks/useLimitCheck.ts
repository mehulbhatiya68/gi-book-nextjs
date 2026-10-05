"use client";

import { useState, useEffect } from "react";
import { subscriptionApi } from "@/lib/api/subscription";
import { itemApi } from "@/lib/api/item";
import { invoiceApi } from "@/lib/api/invoice";
import { ledgerApi } from "@/lib/api/ledger";
import { transactionApi } from "@/lib/api/transaction";
import { staffApi } from "@/lib/api/staff";
import { siteProjectApi } from "@/lib/api/siteProject";
import { businessApi } from "@/lib/api/business";

export interface LimitCheckResult {
  isLimitReached: boolean;
  used: number;
  quota: number | string;
  featureName: string;
  isLoading: boolean;
}

const FEATURE_NAME_MAP: Record<string, string> = {
  item: "Items",
  items: "Items",
  invoice: "Invoices",
  invoices: "Invoices",
  ledger: "Ledgers",
  ledgers: "Ledgers",
  party: "Parties",
  parties: "Parties",
  transaction: "Transactions",
  transactions: "Transactions",
  payment: "Transactions",
  payments: "Transactions",
  project: "Projects",
  projects: "Projects",
  site: "Sites",
  sites: "Sites",
  staff: "Staff",
  business: "Businesses",
  businesses: "Businesses",
};

const isPaymentInOutTransaction = (tx: any): boolean => {
  if (!tx || typeof tx !== "object") return false;
  const t = String(
    tx.type ||
    tx.transaction_type ||
    tx.transactionType ||
    tx.normalizedType ||
    tx.payment_type ||
    tx.type_name ||
    ""
  ).toLowerCase().trim();

  return (
    t === "payment_in" ||
    t === "payment_out" ||
    t === "payment-in" ||
    t === "payment-out" ||
    t === "payment_received" ||
    t === "payment_sent" ||
    t === "credit" ||
    t === "debit"
  );
};

const extractCount = (res: any, slug?: string): number => {
  if (!res) return 0;
  const body = res?.body || res?.data || res;

  const list =
    body?.items ||
    body?.invoices ||
    body?.ledgers ||
    body?.parties ||
    body?.projects ||
    body?.sites ||
    body?.staff ||
    body?.transactions ||
    body?.businesses ||
    body?.data ||
    (Array.isArray(body) ? body : Array.isArray(res) ? res : null);

  if (Array.isArray(list)) {
    const s = (slug || "").toLowerCase().trim();
    if (s.includes("transaction") || s.includes("payment") || s.includes("voucher") || s.includes("transfer")) {
      const paymentTxList = list.filter(isPaymentInOutTransaction);
      return paymentTxList.length;
    }
    return list.length;
  }

  if (typeof body?.total === "number") return body.total;
  if (typeof res?.total === "number") return res.total;
  if (typeof body?.pagination?.total === "number") return body.pagination.total;

  return 0;
};

const fetchLiveCount = async (slug: string): Promise<number> => {
  try {
    const s = slug.toLowerCase().trim();
    if (s.includes("item")) {
      const res = await itemApi.getItems({ per_page: "all", silentError: true });
      return extractCount(res, s);
    }
    if (s.includes("invoice")) {
      const res = await invoiceApi.getInvoices({ per_page: "all", silentError: true });
      return extractCount(res, s);
    }
    if (s.includes("ledger") || s.includes("party")) {
      const res = await ledgerApi.getLedgers({ per_page: "all", silentError: true });
      return extractCount(res, s);
    }
    if (s.includes("transaction") || s.includes("payment") || s.includes("voucher") || s.includes("transfer")) {
      const res = await transactionApi.getTransactions({ per_page: "all", silentError: true });
      return extractCount(res, s);
    }
    if (s.includes("staff")) {
      const res = await staffApi.getStaff({ per_page: "all", silentError: true });
      return extractCount(res, s);
    }
    if (s.includes("project")) {
      const res = await siteProjectApi.getProjects({ per_page: "all", silentError: true });
      return extractCount(res, s);
    }
    if (s.includes("site")) {
      const res = await siteProjectApi.getSites({ per_page: "all", silentError: true });
      return extractCount(res, s);
    }
    if (s.includes("business")) {
      const res = await businessApi.getBusinesses({ per_page: "all", silentError: true });
      return extractCount(res, s);
    }
  } catch (err) {
    console.warn("Live count fetch warning:", err);
  }
  return 0;
};

const isFeatureMatch = (uSlug: string, targetSlug: string): boolean => {
  const u = uSlug.toLowerCase().trim();
  const t = targetSlug.toLowerCase().trim();
  if (!u || !t) return false;
  if (u === t || u === t + "s" || t === u + "s") return true;
  if (u.startsWith(t) || t.startsWith(u)) return true;

  const isTxTarget = t.includes("transaction") || t.includes("payment") || t.includes("voucher") || t.includes("transfer");
  const isTxUsage = u.includes("transaction") || u.includes("payment") || u.includes("voucher") || u.includes("transfer");
  if (isTxTarget && isTxUsage) return true;

  if (t.includes("item") && u.includes("item")) return true;
  if (t.includes("invoice") && u.includes("invoice")) return true;

  const isLedgerTarget = t.includes("ledger") || t.includes("party") || t.includes("parties");
  const isLedgerUsage = u.includes("ledger") || u.includes("party") || u.includes("parties");
  if (isLedgerTarget && isLedgerUsage) return true;

  if ((t.includes("staff") || t.includes("employee")) && (u.includes("staff") || u.includes("employee"))) return true;
  if (t.includes("project") && u.includes("project")) return true;
  if (t.includes("site") && u.includes("site")) return true;
  if (t.includes("business") && u.includes("business")) return true;

  return false;
};

export function useLimitCheck(
  featureSlug: string,
  isEditMode: boolean = false
): LimitCheckResult {
  const [isLoading, setIsLoading] = useState(true);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [used, setUsed] = useState(0);
  const [quota, setQuota] = useState<number | string>(-1);

  const normalizedSlug = (featureSlug || "").toLowerCase().trim();
  const displayName = FEATURE_NAME_MAP[normalizedSlug] || featureSlug || "Feature";

  useEffect(() => {
    if (isEditMode) {
      setIsLimitReached(false);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function checkQuota() {
      try {
        setIsLoading(true);

        const [usageRes, liveCount] = await Promise.all([
          subscriptionApi.getUsage({ silentError: true }).catch(() => null),
          fetchLiveCount(normalizedSlug).catch(() => 0),
        ]);

        const usagesRaw =
          usageRes?.body?.usages ||
          usageRes?.body?.features ||
          usageRes?.body?.limits ||
          usageRes?.body?.data ||
          usageRes?.usages ||
          usageRes?.features ||
          usageRes?.limits ||
          usageRes?.data ||
          (Array.isArray(usageRes?.body) ? usageRes.body : Array.isArray(usageRes) ? usageRes : null);

        let usageList: any[] = [];
        if (Array.isArray(usagesRaw)) {
          usageList = usagesRaw;
        } else if (usagesRaw && typeof usagesRaw === "object") {
          usageList = Object.entries(usagesRaw).map(([key, val]: [string, any]) => {
            if (typeof val === "object" && val !== null) {
              return { slug: key, feature_slug: key, ...val };
            }
            return { slug: key, feature_slug: key, quota: val };
          });
        }

        let usageApiQuota: any = null;
        let usageApiUsed = 0;

        if (usageList.length > 0) {
          const matched = usageList.find((u: any) => {
            const slug = (u.feature_slug || u.slug || u.feature_name || u.name || u.key || u.code || "")
              .toString();
            return isFeatureMatch(slug, normalizedSlug);
          });

          if (matched) {
            usageApiQuota =
              matched.quota ??
              matched.quantity ??
              matched.limit ??
              matched.max_limit ??
              matched.total ??
              matched.allowed ??
              matched.max;
            usageApiUsed =
              Number(
                matched.used ??
                matched.count ??
                matched.used_count ??
                matched.current_usage ??
                matched.current ??
                matched.consumed ??
                0
              ) || 0;
          }
        }

        const isTxSlug =
          normalizedSlug.includes("transaction") ||
          normalizedSlug.includes("payment") ||
          normalizedSlug.includes("voucher") ||
          normalizedSlug.includes("transfer");

        const finalUsed = isTxSlug ? liveCount : Math.max(usageApiUsed, liveCount);
        const finalQuota = usageApiQuota !== null ? usageApiQuota : 10;

        const isUnlimited =
          finalQuota === -1 ||
          finalQuota === "-1" ||
          finalQuota === "unlimited" ||
          finalQuota === "Unlimited";

        if (!isMounted) return;

        setUsed(finalUsed);

        if (isUnlimited) {
          setQuota(-1);
          setIsLimitReached(false);
        } else {
          const parsedQuota = Number(finalQuota) || 10;
          setQuota(parsedQuota);

          const reached = parsedQuota > 0 && finalUsed >= parsedQuota;
          setIsLimitReached(reached);
        }
      } catch (err) {
        console.warn("Quota limit check error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    checkQuota();

    return () => {
      isMounted = false;
    };
  }, [normalizedSlug, isEditMode, displayName]);

  return {
    isLimitReached,
    used,
    quota,
    featureName: displayName,
    isLoading,
  };
}

