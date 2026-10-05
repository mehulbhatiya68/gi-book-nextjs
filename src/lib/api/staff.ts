import { apiClient } from './client';

export const staffApi = {
  getStaff: (params: any = {}) => {
    const { silentError, ...bodyParams } = typeof params === 'object' && params !== null ? params : {};
    const clientOptions = silentError !== undefined ? { silentError } : {};
    return apiClient('/staff', {
      method: 'POST',
      body: { per_page: 'all', ...bodyParams },
      ...clientOptions,
    });
  },
  createStaff: (data: any) => apiClient('/staff/store', {
    method: 'POST',
    body: data,
  }),
  getStaffDetail: async (id: string | number) => {
    const listRes: any = await staffApi.getStaff({ per_page: 'all', silentError: true });
    const list = listRes?.body?.staff || listRes?.body?.data || (Array.isArray(listRes?.body) ? listRes.body : []);
    const found = (Array.isArray(list) ? list : []).find((s: any) => String(s.id) === String(id));
    return { body: { staff: found || null } };
  },
  updateStaff: (id: string | number, data: any) => apiClient(`/staff/${id}`, {
    method: 'PUT',
    body: data,
  }),
  syncPermissions: (id: string | number, data: any) => apiClient(`/staff/${id}/permissions`, {
    method: 'PUT',
    body: data,
  }),
  getStaffPermissions: (id: string | number) => apiClient(`/staff/${id}/permissions`, {
    method: 'GET',
    silentError: true,
  }),
  deleteStaff: (id: string | number) => apiClient(`/staff/${id}`, {
    method: 'DELETE',
  }),
  getPermissions: () => apiClient('/permissions', {
    method: 'GET',
  }),
};
