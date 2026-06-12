import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { doRefresh } from '../../api/axiosInstance';
import toast from 'react-hot-toast';

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/register', data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/login', data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken: storedRefreshToken });
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      // Step 1: Call the shared refresh function.
      // doRefresh() uses a single shared Promise — if the axios interceptor is
      // also trying to refresh at the same time, both will share the same HTTP
      // call and the refresh token cookie is only consumed once.
      const accessToken = await doRefresh();

      // Step 2: Fetch the current user with the fresh access token.
      const meRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return { user: meRes.data.data.user, accessToken };
    } catch (err) {
      // Only treat explicit 401/403 as a definitive auth failure.
      // Network errors or 5xx (Render cold start) should NOT clear the session.
      const status = err?.response?.status;
      const isAuthFailure = status === 401 || status === 403;
      return rejectWithValue({ isAuthFailure });
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.put('/auth/update-profile', data);
      return res.data.data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    error: null,
  },
  reducers: {
    setAccessToken(state, action) {
      state.accessToken = action.payload;
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('refreshToken');
    },
    clearError(state) {
      state.error = null;
    },
    setInitialized(state) {
      state.isInitialized = true;
    },
  },
  extraReducers: (builder) => {

    builder
      .addCase(registerUser.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state) => { state.isLoading = false; })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        toast.error(action.payload);
      });

    builder
      .addCase(loginUser.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.isInitialized = true;
        localStorage.setItem('isLoggedIn', 'true');
        if (action.payload.refreshToken) {
          localStorage.setItem('refreshToken', action.payload.refreshToken);
        }
        toast.success(`Welcome back, ${action.payload.user.name}! 🍕`);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        toast.error(action.payload);
      });

    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('refreshToken');
        toast.success('Logged out successfully');
      });

    builder
      .addCase(fetchMe.pending, (state) => { state.isLoading = true; })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.isInitialized = true;
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        const isAuthFailure = action.payload?.isAuthFailure ?? true;
        if (isAuthFailure) {
          // Definitive auth failure (401/403) — clear session
          state.isAuthenticated = false;
          state.user = null;
          state.accessToken = null;
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('refreshToken');
        }
        // For network/server errors, keep isAuthenticated as-is so the
        // user isn't falsely logged out on a transient failure.
      });

    builder
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        toast.success('Profile updated!');
      })
      .addCase(updateProfile.rejected, (state, action) => {
        toast.error(action.payload);
      });
  },
});

export const { setAccessToken, logout, clearError, setInitialized } = authSlice.actions;
export default authSlice.reducer;
