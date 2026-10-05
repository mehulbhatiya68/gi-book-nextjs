import Cookies from 'js-cookie';
import { apiCache } from './cache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface ApiError extends Error {
  status?: number;
  data?: any;
  isEmailUnverified?: boolean;
  isSilent?: boolean;
  isConnectionError?: boolean;
}

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const cookieToken = Cookies.get('auth_token');
    if (cookieToken) return cookieToken;
    try {
      const localToken = localStorage.getItem('auth_token');
      if (localToken) {
        Cookies.set('auth_token', localToken, { expires: 7, path: '/' });
        return localToken;
      }
    } catch (_) { }
  }
  return null;
};

export const resolveAuthToken = async (): Promise<string | null> => {
  const clientToken = getAuthToken();
  if (clientToken) return clientToken;

  if (typeof window === 'undefined') {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const token = cookieStore.get('auth_token')?.value;
      if (token) return token;
    } catch (_) { }
  }
  return null;
};

export const setAuthToken = async (token: string | null) => {
  if (token) {
    Cookies.set('auth_token', token, { expires: 7, path: '/' });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('auth_token', token);
      } catch (_) { }
      try {
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      } catch (e) {
        console.warn('Sync session error:', e);
      }
    }
  } else {
    apiCache.clear();
    Cookies.remove('auth_token', { path: '/' });
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('auth_token');
      } catch (_) { }
      try {
        await fetch('/api/auth/session', {
          method: 'DELETE',
        });
      } catch (e) {
        console.warn('Clear session error:', e);
      }
    }
  }
};

export async function apiClient(endpoint: string, options: Record<string, any> = {}, retryCount = 0) {
  return apiCache.fetchWithCache(endpoint, options, async () => {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    const token = await resolveAuthToken();

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let isSilent = !!options.silentError;
    let bodyToSerialize = options.body;

    if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object' && !Array.isArray(options.body)) {
      if ('silentError' in options.body) {
        isSilent = isSilent || !!options.body.silentError;
        const { silentError, ...restBody } = options.body;
        bodyToSerialize = restBody;
      }
    }

    if (!(bodyToSerialize instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const { silentError: _, skipCache: __, forceFresh: ___, cacheTtl: ____, ...cleanOptions } = options;

    const config: RequestInit = {
      method: options.method || 'GET',
      headers,
      ...cleanOptions,
    };

    if (bodyToSerialize !== undefined) {
      if (bodyToSerialize instanceof FormData) {
        config.body = bodyToSerialize;
      } else if (typeof bodyToSerialize === 'object') {
        config.body = JSON.stringify(bodyToSerialize);
      } else {
        config.body = bodyToSerialize;
      }
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 401 || response.status === 403) {
        const clone = response.clone();
        try {
          const errorJson = await clone.json();
          if (errorJson?.code === 'account_inactive' || response.status === 401) {
            setAuthToken(null);
          }
        } catch (e) {
          if (response.status === 401) setAuthToken(null);
        }

        if (response.status === 401 && typeof window !== 'undefined') {
          const pathName = window.location.pathname;
          if (!pathName.startsWith('/login') && !pathName.startsWith('/sign-up')) {
            const nextPath = encodeURIComponent(pathName + window.location.search);
            window.location.replace(`/login?next=${nextPath}`);
          }
        }
      }

      const contentType = response.headers.get('content-type') || '';
      let data = null;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (!response.ok) {
        const errorMessage = data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`;
        const isDbTimeout = typeof errorMessage === 'string' && (
          errorMessage.includes('SQLSTATE[08006]') ||
          errorMessage.toLowerCase().includes('timeout expired') ||
          (errorMessage.toLowerCase().includes('connection') && errorMessage.toLowerCase().includes('timeout'))
        );

        // Auto-retry once for 5xx server errors or transient DB connection timeouts
        if ((response.status >= 500 || isDbTimeout) && retryCount < 1) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          return apiClient(endpoint, { ...options, forceFresh: true }, retryCount + 1);
        }

        const error: ApiError = new Error(
          isDbTimeout ? 'Database connection timed out on server. Retrying...' : errorMessage
        );
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error: any) {
      let msg = error.message;
      const isDbTimeout = typeof msg === 'string' && (
        msg.includes('SQLSTATE[08006]') ||
        msg.toLowerCase().includes('timeout expired') ||
        (msg.toLowerCase().includes('connection') && msg.toLowerCase().includes('timeout'))
      );

      // Auto-retry once for transient network / DB errors
      if (isDbTimeout && retryCount < 1) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return apiClient(endpoint, { ...options, forceFresh: true }, retryCount + 1);
      }

      const isNetworkError = msg === 'Failed to fetch' || error.name === 'TypeError' || (typeof msg === 'string' && msg.includes('Unable to connect'));
      if (msg === 'Failed to fetch' || error.name === 'TypeError') {
        msg = 'Unable to connect to the backend server. Please verify NEXT_PUBLIC_API_BASE_URL in your .env file or check if your backend server is running.';
      } else if (isDbTimeout) {
        msg = 'Database connection timed out on server (103.212.121.180). Please try again in a moment.';
      }

      const isEmailUnverified = typeof msg === 'string' && (
        msg.toLowerCase().includes('verify your email') ||
        msg.toLowerCase().includes('verify email') ||
        msg.toLowerCase().includes('email address to continue')
      );

      if (!isSilent && !isEmailUnverified && !isNetworkError) {
        console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, msg);
      }
      const err: ApiError = new Error(msg);
      err.status = error.status || 0;
      err.data = error.data || null;
      err.isEmailUnverified = isEmailUnverified;
      err.isSilent = isSilent;
      err.isConnectionError = isNetworkError || isDbTimeout;
      throw err;
    }
  });
}


