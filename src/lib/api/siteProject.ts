import { apiClient } from './client';

export const siteProjectApi = {
  // Projects
  getProjects: (params: any = {}) => {
    const { silentError, ...bodyParams } = params || {};
    const clientOptions = silentError !== undefined ? { silentError } : {};
    return apiClient('/projects', { method: 'POST', body: { per_page: 'all', ...bodyParams }, ...clientOptions });
  },
  createProject: (data: any, options: any = {}) => apiClient('/projects/store', { method: 'POST', body: data, ...options }),
  getProjectDetails: async (id: any, options: any = {}) => {
    try {
      return await apiClient(`/projects/${id}`, { method: 'GET', silentError: true, ...options });
    } catch (_) {
      const listRes: any = await siteProjectApi.getProjects({ per_page: 'all', silentError: true });
      const list = listRes?.body?.projects || listRes?.body?.data || (Array.isArray(listRes?.body) ? listRes.body : []);
      const found = (Array.isArray(list) ? list : []).find((p: any) => String(p.id) === String(id));
      return { body: { project: found || null } };
    }
  },
  updateProject: (id: any, data: any, options: any = {}) => apiClient(`/projects/${id}`, { method: 'PUT', body: data, ...options }),
  deleteProject: (id: any, options: any = {}) => apiClient(`/projects/${id}`, { method: 'DELETE', ...options }),

  getSiteProjects: async (businessId?: any, options: any = {}) => {
    const clientOptions = typeof options === 'object' && options?.silentError !== undefined ? { silentError: options.silentError } : { silentError: true };
    try {
      const [projectsRes, sitesRes] = await Promise.all([
        siteProjectApi.getProjects({ per_page: 'all', ...clientOptions }).catch(() => ({ body: [] })),
        siteProjectApi.getSites({ per_page: 'all', ...clientOptions }).catch(() => ({ body: [] }))
      ]);
      const parseList = (res: any, key: string) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.body)) return res.body;
        if (Array.isArray(res.data)) return res.data;
        if (res.body && typeof res.body === 'object') {
          if (Array.isArray(res.body[key])) return res.body[key];
          if (Array.isArray(res.body.data)) return res.body.data;
        }
        return [];
      };
      const pList = parseList(projectsRes, 'projects');
      const sList = parseList(sitesRes, 'sites');
      const projects = pList.map((p: any) => ({ ...p, type: 'Project' }));
      const sites = sList.map((s: any) => ({ ...s, type: 'Site' }));
      return { body: [...projects, ...sites] };
    } catch (error) {
      return { body: [] };
    }
  },

  // Sites
  getSites: (params: any = {}) => {
    const { silentError, ...bodyParams } = params || {};
    const clientOptions = silentError !== undefined ? { silentError } : {};
    return apiClient('/sites', { method: 'POST', body: { per_page: 'all', ...bodyParams }, ...clientOptions });
  },
  createSite: (data: any, options: any = {}) => apiClient('/sites/store', { method: 'POST', body: data, ...options }),
  getSiteDetails: async (id: any, options: any = {}) => {
    try {
      return await apiClient(`/sites/${id}`, { method: 'GET', silentError: true, ...options });
    } catch (_) {
      const listRes: any = await siteProjectApi.getSites({ per_page: 'all', silentError: true });
      const list = listRes?.body?.sites || listRes?.body?.data || (Array.isArray(listRes?.body) ? listRes.body : []);
      const found = (Array.isArray(list) ? list : []).find((s: any) => String(s.id) === String(id));
      return { body: { site: found || null } };
    }
  },
  updateSite: (id: any, data: any, options: any = {}) => apiClient(`/sites/${id}`, { method: 'PUT', body: data, ...options }),
  deleteSite: (id: any, options: any = {}) => apiClient(`/sites/${id}`, { method: 'DELETE', ...options }),

  // Transactions by Project/Site
  getTransactions: (params: any = {}) => {
    const { silentError, ...bodyParams } = params || {};
    const clientOptions = silentError !== undefined ? { silentError } : {};
    return apiClient('/transactions', { method: 'POST', body: bodyParams, ...clientOptions });
  },
};
