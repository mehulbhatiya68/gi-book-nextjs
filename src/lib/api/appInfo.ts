import { apiClient } from './client';

export interface AppInfoPageItem {
  key: string;
  title: string;
  description: string;
}

export interface AppVersionInfo {
  version: string;
  description: string;
}

export interface AppVersionsData {
  android?: AppVersionInfo;
  ios?: AppVersionInfo;
}

export interface AppInfoPageDetail {
  key: string;
  title: string;
  description: string;
  html_content: string;
}

export const appInfoApi = {
  // GET /app-info (Returns pages list + app_version)
  getAppInfo: (options: Record<string, any> = {}) => apiClient('/app-info', options),

  // GET /app-info/{key} (Returns detailed page with html_content)
  getPageDetail: (key: string, options: Record<string, any> = {}) => apiClient(`/app-info/${key}`, options),

  // GET /app-info/app_version (Returns android and ios app version info)
  getAppVersion: (options: Record<string, any> = {}) => apiClient('/app-info/app_version', options),
};
