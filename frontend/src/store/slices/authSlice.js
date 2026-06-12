import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import api from '../../api/axiosInstance';
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
      await api.post('/auth/logout');
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const refreshRes = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const { accessToken } = refreshRes.data.data;

      const meRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return { user: meRes.data.data.user, accessToken };
    } catch (err) {
      // Only treat explicit 401 as a definitive auth failure.
      // Network errors (no response) or 5xx (server cold start) should
      // NOT wipe the session — the user may still be logged in.
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
