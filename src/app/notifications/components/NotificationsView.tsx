"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IoArrowBack,
  IoChevronBack,
  IoNotificationsOutline,
  IoSettingsOutline,
  IoDocumentTextOutline,
  IoCubeOutline,
  IoPeopleOutline,
  IoWalletOutline,
  IoCardOutline,
  IoCheckmarkCircleOutline,

} from "react-icons/io5";
import { useAuth } from "@/context/AuthContext";
import { usePreferences } from "@/lib/hooks/usePreferences";
import PermissionGuard from "@/components/PermissionGuard";
import ToggleSwitch from "@/components/ToggleSwitch";
import { SkeletonList } from "@/components/Skeleton";
import { notificationApi } from "@/lib/api/notification";
import FilterTabs from "@/components/FilterTabs";
import { toast } from "react-toastify";
import { useMinimumLoading } from "@/lib/hooks/useMinimumLoading";
import SmoothTransition from "@/components/SmoothTransition";

export default function NotificationsView() {
  const router = useRouter();
  const { activeBusiness } = useAuth();
  const { t } = usePreferences();

  const [activeTab, setActiveTab] = useState<"notifications" | "preferences">("notifications");
  const [notifications, setNotifications] = useState<any[]>([]);
  const { isLoading, startLoading, stopLoading } = useMinimumLoading(true, 400);

  // Preferences state
  const [preferences, setPreferences] = useState<Record<string, { is_enabled: boolean; config?: any }>>({
    push_enabled: { is_enabled: true },
    staff_invoice: { is_enabled: true },
    staff_stock: { is_enabled: true },
    staff_transaction: { is_enabled: true },
    staff_ledger: { is_enabled: true },
    staff_delete: { is_enabled: true },
    stock_alerts: { is_enabled: true },
    large_payment: { is_enabled: true, config: { min_amount: 50000 } },
  });
  const [isSavingPref, setIsSavingPref] = useState(false);

  const fetchNotifications = async () => {
    startLoading();
    try {
      const res: any = await notificationApi.getNotifications({ page: 1, per_page: 50, silentError: true });
      const list = res?.body?.notifications || res?.body?.data || res?.data || (Array.isArray(res?.body) ? res.body : []);
      setNotifications(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      stopLoading();
    }
  };

  const fetchPreferences = async () => {
    try {
      const res: any = await notificationApi.getPreferences({ silentError: true });
      const prefs = res?.body?.preferences || res?.preferences || res?.body?.data || res?.data;
      if (prefs && typeof prefs === "object") {
        if (Array.isArray(prefs)) {
          const prefObj: Record<string, { is_enabled: boolean; config?: any }> = {};
          prefs.forEach((p: any) => {
            const k = p.key || p.name || p.id;
            if (k) {
              prefObj[k] = {
                is_enabled: Boolean(p.is_enabled ?? p.enabled ?? true),
                config: p.config,
              };
            }
          });
          setPreferences((prev) => ({ ...prev, ...prefObj }));
        } else {
          setPreferences((prev) => ({ ...prev, ...prefs }));
        }
      }
    } catch (err) {
      console.warn("Could not fetch notification preferences:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, [activeBusiness?.id]);

  const handleTogglePref = async (key: string, enabled: boolean) => {
    const updated = {
      ...preferences,
      [key]: {
        ...preferences[key],
        is_enabled: enabled,
      },
    };
    setPreferences(updated);

    setIsSavingPref(true);
    try {
      await notificationApi.updatePreferences({
        business_id: activeBusiness?.id,
        preferences: updated,
      });
      toast.success("Notification preferences updated!");
    } catch (err: any) {
      console.error("Failed to update preferences:", err);
      toast.error(err.message || "Failed to save preference setting.");
      // Revert switch on API error
      setPreferences((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          is_enabled: !enabled,
        },
      }));
    } finally {
      setIsSavingPref(false);
    }
  };

  const handleActionNavigate = (meta: any) => {
    if (!meta || typeof meta !== "object") return;
    const action = meta.action || "";

    if (action === "invoice.view" && meta.invoice_id) {
      router.push(`/invoiceDetails/${meta.invoice_id}`);
    } else if (action === "invoice.list") {
      router.push("/invoice");
    } else if (action === "staff.view" || action === "staff.list") {
      router.push("/staff");
    } else if ((action === "item.view" || action === "stock.alert") && meta.item_id) {
      router.push(`/items/${meta.item_id}`);
    } else if (action === "item.list") {
      router.push("/items");
    } else if (action === "ledger.view" && meta.ledger_id) {
      router.push(`/ledgers/${meta.ledger_id}`);
    } else if (action === "transaction.view") {
      router.push("/ledgerTransactions");
    } else if (action.startsWith("subscription")) {
      router.push("/settings");
    }
  };

  const getNotificationIcon = (actionStr: string) => {
    const act = (actionStr || "").toLowerCase();
    if (act.includes("invoice")) return <IoDocumentTextOutline className="text-indigo-500" />;
    if (act.includes("item") || act.includes("stock")) return <IoCubeOutline className="text-amber-500" />;
    if (act.includes("staff")) return <IoPeopleOutline className="text-sky-500" />;
    if (act.includes("ledger") || act.includes("transaction")) return <IoWalletOutline className="text-emerald-500" />;
    if (act.includes("subscription")) return <IoCardOutline className="text-purple-500" />;
    return <IoNotificationsOutline className="text-slate-500" />;
  };

  return (
    <PermissionGuard module="Setting">
      <div className="space-y-6 pb-12 gi-page">
        {/* Top Controls Header */}
        <div className="flex flex sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b gi-divider">
          <div className="flex items-center gap-2.5">
            <Link href="/home">
              <button
                type="button"
                className="gi-back-btn"
                title="Back to Dashboard"
              >
                <IoChevronBack />
                <span className="gi-back-label">Back</span>
              </button>
            </Link>

            <div>
              <h1
                className="text-2xl font-bold gi-text-primary tracking-tight cursor-pointer"
                onClick={() => setActiveTab('notifications')}>
                Notifications
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('preferences')}
              className="gi-btn gi-btn-outline text-xs font-semibold gap-1.5 cursor-pointer gi-text-secondary"
            >
              <IoSettingsOutline className="h-6 w-6 " />

            </button>
          </div>
        </div>

        {/* Tab Navigation Controls */}


        {/* TAB 1: In-App Notifications List */}
        {activeTab === "notifications" && (
          <div className="">

            {isLoading ? (
              <SkeletonList count={5} />
            ) : notifications.length === 0 ? (
              <div className="py-12 flex items-center justify-center text-center space-y-3">
                <div className="h-14 w-14 rounded-2xl gi-surface-secondary border gi-divider flex items-center justify-center text-2xl gi-text-muted">
                  <IoCheckmarkCircleOutline />
                </div>
                <div>
                  <h3 className="text-sm font-bold gi-text-primary">No Notifications Yet</h3>
                  <p className="text-xs gi-text-secondary mt-0.5 max-w-sm">
                    Automated activity logs, invoice payments, and stock alerts will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y gi-divider">
                {notifications.map((n: any, idx: number) => {
                  const meta = n.metadata || n.data || {};
                  const actionStr = meta.action || "general";
                  const dateStr = n.created_at ? new Date(n.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Recently";

                  return (
                    <div
                      key={n.id || idx}
                      className="py-4 flex sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--gi-hover)] px-3 rounded-xl transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl gi-surface-secondary border gi-divider text-lg shrink-0 mt-0.5">
                          {getNotificationIcon(actionStr)}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold gi-text-primary">{n.title || "Notification"}</h4>
                          </div>
                          <p className="text-xs gi-text-secondary leading-relaxed">{n.message || n.body || n.description || "No description provided."}</p>
                          <span className="text-[10px] gi-text-muted block pt-1">{dateStr}</span>
                        </div>
                      </div>

                      {meta.action && meta.action !== "general" && (
                        <button
                          type="button"
                          onClick={() => handleActionNavigate(meta)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border gi-surface-interactive gi-text-primary flex items-center gap-1 shrink-0 cursor-pointer self-start sm:self-center"
                        >
                          <span>View</span>

                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Notification Preferences & Toggles */}
        {activeTab === "preferences" && (
          <div>
            <div className="space-y-4">
              {[
                { key: "push_enabled", title: "Master Push Notifications", desc: "Enable or disable all push notifications for this device" },
                { key: "staff_invoice", title: "Staff Invoice Actions", desc: "Notify when staff members create or modify sales and purchase invoices" },
                { key: "staff_stock", title: "Staff Stock Adjustments", desc: "Notify when staff adjust item stock quantities" },
                { key: "staff_transaction", title: "Staff Ledger Transfers", desc: "Notify when staff record bank or cash ledger transfers" },
                { key: "staff_ledger", title: "Staff Ledger Changes", desc: "Notify when staff create or update financial ledgers" },
                { key: "staff_delete", title: "Staff Deletions", desc: "Notify when staff delete records from the system" },
                { key: "stock_alerts", title: "Inventory Stock Alerts", desc: "Trigger notifications when item inventory hits minimum or maximum thresholds" },
                { key: "large_payment", title: "High-Value Payment Alerts", desc: "Trigger notifications for high-value payments exceeding threshold limit" },
              ].map((item) => {
                const isEnabled = Boolean(preferences[item.key]?.is_enabled);

                return (
                  <div key={item.key} className="p-4 rounded-xl border gi-divider bg-[var(--gi-surface)] flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold gi-text-primary block">{item.title}</span>
                      <span className="text-[11px] gi-text-secondary leading-relaxed block">{item.desc}</span>
                    </div>

                    <ToggleSwitch
                      checked={isEnabled}
                      onChange={(val) => handleTogglePref(item.key, val)}
                      ariaLabel={item.title}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
