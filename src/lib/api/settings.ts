import { apiClient } from './client';

export const settingsApi = {
  getSettings: () => apiClient('settings'),
  updateSettings: (data: any) => apiClient('settings', { method: 'POST', body: data }),
};
