import { Suspense } from "react";
import HomeContent from "@/components/HomeContent";
import { dashboardApi } from "@/lib/api/dashboard";
import { transactionApi } from "@/lib/api/transaction";
import { SkeletonHome } from "@/components/Skeleton";

export default async function HomePage() {
  let initialDashboardData: any = null;
  let initialPayments: any[] = [];

  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const compareMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;

    const [dashRes, txRes]: any = await Promise.all([
      dashboardApi.getDashboard({ month: currentMonth, compare_month: compareMonth }, { silentError: true }).catch(() => null),
      transactionApi.getTransactions({ per_page: "all", silentError: true }).catch(() => null),
    ]);

    initialDashboardData = dashRes?.body || dashRes || null;

    const txList = Array.isArray(txRes?.body)
      ? txRes.body
      : txRes?.body?.transactions || txRes?.body?.data || (Array.isArray(txRes) ? txRes : []);
    initialPayments = Array.isArray(txList) ? txList : [];
  } catch (err) {
    console.warn("[SSR HomePage] Pre-fetch warning:", err);
  }

  return (
    <Suspense fallback={<SkeletonHome />}>
      <HomeContent
        initialDashboardData={initialDashboardData}
        initialPayments={initialPayments}
      />
    </Suspense>
  );
}