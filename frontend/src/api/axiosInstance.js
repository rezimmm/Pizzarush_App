import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let _store = null;
export function injectStore(store) {
  _store = store;
}


let _refreshPromise = null;

export async function doRefresh() {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = axios
    .post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
    .then((res) => {
      const { accessToken } = res.data.data;
      if (_store) {

        _store.dispatch({ type: 'auth/setAccessToken', payload: accessToken });
      }
      return accessToken;
    })
    .finally(() => {
      _refreshPromise = null;
    });

  return _refreshPromise;
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

const AUTH_SKIP_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout', '/auth/forgot-password'];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const requestPath = originalRequest?.url || '';
    const isAuthRoute = AUTH_SKIP_PATHS.some((p) => requestPath.includes(p));

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      try {
        const accessToken = await doRefresh();
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {

        if (_store) {
          const currentState = _store.getState().auth;
          if (currentState.isAuthenticated) {
            _store.dispatch({ type: 'auth/logout' });
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
