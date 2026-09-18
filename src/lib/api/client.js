const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || null;
};

export const setAuthToken = (token) => {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }
};

export async function apiClient(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  const token = getAuthToken();

  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    method: options.method || 'GET',
    headers,
    ...options,
  };

  if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
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
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    let msg = error.message;
    if (msg === 'Failed to fetch' || error.name === 'TypeError') {
      msg = 'Unable to connect to the backend server. Please verify NEXT_PUBLIC_API_BASE_URL in your .env file or check if your backend server is running.';
    }
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, msg);
    const err = new Error(msg);
    err.status = error.status || 0;
    err.data = error.data || null;
    throw err;
  }
}
