import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send cookies (refresh token)
  headers: { 'Content-Type': 'application/json' },
});

let _store = null;
export function injectStore(store) {
  _store = store;
}

api.interceptors.request.use(
  (config) => {
    if (_store) {
      const { accessToken } = _store.getState().auth;
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let pendingRequests = [];

// Auth endpoints that should NEVER trigger a refresh retry
const AUTH_SKIP_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout', '/auth/forgot-password'];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh logic for auth endpoints and already-retried requests
    const requestPath = originalRequest?.url || '';
    const isAuthRoute = AUTH_SKIP_PATHS.some((p) => requestPath.includes(p));

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        // Queue request until refresh completes
        return new Promise((resolve, reject) => {
          pendingRequests.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data.data;
        if (_store) {
          const { setAccessToken } = await import('../store/slices/authSlice');
          _store.dispatch(setAccessToken(accessToken));
        }

        // Retry all pending requests
        pendingRequests.forEach(({ resolve }) => resolve(accessToken));
        pendingRequests = [];

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — log user out silently
        pendingRequests.forEach(({ reject }) => reject(refreshError));
        pendingRequests = [];
        if (_store) {
          const currentState = _store.getState().auth;
          // Only dispatch logout if user was actually authenticated
          if (currentState.isAuthenticated) {
            const { logout } = await import('../store/slices/authSlice');
            _store.dispatch(logout());
          }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
