import { apiClient } from './client';

export interface DashboardParams {
  month?: string;
  compare_month?: string;
  compareMonth?: string;
}

export const dashboardApi = {
  // GET /dashboard
  getDashboard: async (params: DashboardParams = {}, options: any = {}) => {
    const month = params.month;
    const compareMonth = params.compare_month || params.compareMonth;
    const query = new URLSearchParams();
    if (month) query.append('month', month);
    if (compareMonth) query.append('compare_month', compareMonth);
    const queryString = query.toString();

    return apiClient(`/dashboard${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      ...options,
    });
  },
};
