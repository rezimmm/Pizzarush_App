import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const createOrder = createAsyncThunk(
  'order/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/orders', data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create order');
    }
  }
);

export const fetchMyOrders = createAsyncThunk(
  'order/fetchMine',
  async (params, { rejectWithValue }) => {
    try {
      const res = await api.get('/orders/my-orders', { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'order/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/orders/${id}`);
      return res.data.data.order;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch order');
    }
  }
);

export const fetchAllOrders = createAsyncThunk(
  'order/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const res = await api.get('/orders/admin/all', { params }); // correct backend route
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch all orders');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'order/updateStatus',
  async ({ orderId, status, note }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status, note });
      return res.data.data.order;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update status');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const orderSlice = createSlice({
  name: 'order',
  initialState: {
    orders: [],
    currentOrder: null,
    pagination: { currentPage: 1, totalPages: 1, total: 0 },
    isLoading: false,
    error: null,
  },
  reducers: {
    updateOrderRealtime(state, action) {
      // Called by Socket.io listener — payload may be partial {_id, orderStatus}
      // or a full order object. Merge to preserve all existing fields.
      const updated = action.payload;
      if (state.currentOrder?._id === updated._id) {
        state.currentOrder = { ...state.currentOrder, ...updated };
      }
      const idx = state.orders.findIndex(o => o._id === updated._id);
      if (idx !== -1) state.orders[idx] = { ...state.orders[idx], ...updated };
    },
    clearCurrentOrder(state) {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload.order;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

      .addCase(fetchMyOrders.pending, (state) => { state.isLoading = true; })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.orders || [];
        state.pagination = {
          currentPage: action.payload.currentPage || 1,
          totalPages: action.payload.totalPages || 1,
          total: action.payload.total || 0,
        };
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchOrderById.pending, (state) => { state.isLoading = true; })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchAllOrders.pending, (state) => { state.isLoading = true; })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.orders || [];
        state.pagination = {
          currentPage: action.payload.currentPage || 1,
          totalPages: action.payload.totalPages || 1,
          total: action.payload.total || 0,
        };
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const idx = state.orders.findIndex(o => o._id === action.payload._id);
        if (idx !== -1) state.orders[idx] = action.payload;
        if (state.currentOrder?._id === action.payload._id) {
          state.currentOrder = action.payload;
        }
        toast.success('Order status updated!');
      })
      .addCase(updateOrderStatus.rejected, (_, action) => {
        toast.error(action.payload);
      });
  },
});

export const { updateOrderRealtime, clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;
