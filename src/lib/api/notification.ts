import { apiClient } from './client';

export interface TestPushPayload {
  title?: string;
  description?: string;
  image_url?: string;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
  fcm_token?: string;
}

export interface UpdatePreferencesPayload {
  business_id?: string;
  preferences: Record<string, { is_enabled: boolean; config?: Record<string, any> }>;
}

export const notificationApi = {
  // 1. List Notifications: GET /notifications
  getNotifications: async (params: { page?: number; per_page?: string | number; silentError?: boolean } = {}) => {
    const page = params.page || 1;
    const perPage = params.per_page || 15;
    const silentError = params.silentError;
    return apiClient(`/notifications?page=${page}&per_page=${perPage}`, {
      method: 'GET',
      ...(silentError && { silentError }),
    });
  },

  // 2. Test Push: POST /notifications/test-push
  testPush: async (payload: TestPushPayload) => {
    return apiClient('/notifications/test-push', {
      method: 'POST',
      body: payload,
    });
  },

  // 3. Get Preferences: GET /notification-preferences
  getPreferences: async (options: { silentError?: boolean } = {}) => {
    return apiClient('/notification-preferences', {
      method: 'GET',
      ...(options.silentError && { silentError: options.silentError }),
    });
  },

  // 4. Update Preferences: PUT /notification-preferences
  updatePreferences: async (payload: UpdatePreferencesPayload) => {
    return apiClient('/notification-preferences', {
      method: 'PUT',
      body: payload,
    });
  },
};

