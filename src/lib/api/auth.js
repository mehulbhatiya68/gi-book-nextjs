import { apiClient, setAuthToken } from './client';

export const authApi = {
  // 1. Register: POST /auth/register
  register: async (payload) => {
    // payload: { name, email, password, mobile_number, country_code, user_type, parent_id, fcm_token, fcm_platform }
    const data = await apiClient('/auth/register', {
      method: 'POST',
      body: {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        mobile_number: payload.mobile_number || payload.mobile || '',
        country_code: payload.country_code ? parseInt(payload.country_code, 10) : 91,
        user_type: payload.user_type || 'user',
        ...(payload.parent_id ? { parent_id: payload.parent_id } : {}),
        ...(payload.fcm_token ? { fcm_token: payload.fcm_token } : {}),
        ...(payload.fcm_platform ? { fcm_platform: payload.fcm_platform } : {}),
      },
    });

    const token = data?.body?.token || data?.token;
    if (token) {
      setAuthToken(token);
    }
    return data;
  },

  // 2. Login: POST /auth/login
  login: async (credentials) => {
    // credentials: { email, password, fcm_token, fcm_platform }
    const data = await apiClient('/auth/login', {
      method: 'POST',
      body: {
        email: credentials.email,
        password: credentials.password,
        ...(credentials.fcm_token ? { fcm_token: credentials.fcm_token } : {}),
        ...(credentials.fcm_platform ? { fcm_platform: credentials.fcm_platform } : {}),
      },
    });

    const token = data?.body?.token || data?.token;
    if (token) {
      setAuthToken(token);
    }
    return data;
  },

  // 3. Forgot Password: POST /auth/forgot-password
  forgotPassword: async (identifier) => {
    return await apiClient('/auth/forgot-password', {
      method: 'POST',
      body: { identifier },
    });
  },

  // 4. Set New Password: POST /auth/forgot-password/set-password
  setPassword: async (payload) => {
    // payload: { identifier, otp, password, password_confirmation }
    const data = await apiClient('/auth/forgot-password/set-password', {
      method: 'POST',
      body: {
        identifier: payload.identifier,
        otp: payload.otp,
        password: payload.password,
        password_confirmation: payload.password_confirmation || payload.password,
      },
    });

    const token = data?.body?.token || data?.token;
    if (token) {
      setAuthToken(token);
    }
    return data;
  },

  // 5. Change Password: POST /auth/change-password
  changePassword: async (payload) => {
    // payload: { current_password, password, password_confirmation }
    return await apiClient('/auth/change-password', {
      method: 'POST',
      body: {
        current_password: payload.current_password,
        password: payload.password,
        password_confirmation: payload.password_confirmation || payload.password,
      },
    });
  },

  // 6. Logout: POST /auth/logout
  logout: async () => {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } finally {
      setAuthToken(null);
    }
  },

  // 7. Get Profile: GET /auth/profile
  getProfile: async () => {
    return await apiClient('/auth/profile', { method: 'GET' });
  },

  // 8. Update Profile: PUT /auth/profile
  updateProfile: async (payload) => {
    // payload: { name, mobile_number, country_code }
    return await apiClient('/auth/profile', {
      method: 'PUT',
      body: {
        name: payload.name,
        mobile_number: payload.mobile_number || payload.mobile,
        country_code: payload.country_code ? parseInt(payload.country_code, 10) : 91,
      },
    });
  },

  // 9. Delete Account: DELETE /auth/account
  deleteAccount: async (password) => {
    return await apiClient('/auth/account', {
      method: 'DELETE',
      body: { password },
    });
  },

  // 10. Splash: GET /splash
  getSplash: async () => {
    return await apiClient('/splash', { method: 'GET' });
  },
};
