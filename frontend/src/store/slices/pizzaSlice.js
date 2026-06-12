import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchPizzas = createAsyncThunk(
  'pizza/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const res = await api.get('/pizzas', { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch pizzas');
    }
  }
);

export const fetchPizzaById = createAsyncThunk(
  'pizza/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/pizzas/${id}`);
      return res.data.data.pizza;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch pizza');
    }
  }
);

export const createPizza = createAsyncThunk(
  'pizza/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/pizzas', data);
      return res.data.data.pizza;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create pizza');
    }
  }
);

export const updatePizza = createAsyncThunk(
  'pizza/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/pizzas/${id}`, data);
      return res.data.data.pizza;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update pizza');
    }
  }
);

export const deletePizza = createAsyncThunk(
  'pizza/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/pizzas/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete pizza');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const pizzaSlice = createSlice({
  name: 'pizza',
  initialState: {
    pizzas: [],
    selectedPizza: null,
    pagination: { currentPage: 1, totalPages: 1, total: 0 },
    isLoading: false,
    error: null,
    filters: { category: '', search: '', sortBy: 'name', page: 1 },
  },
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload, page: 1 };
    },
    clearSelectedPizza(state) {
      state.selectedPizza = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPizzas.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchPizzas.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pizzas = action.payload.pizzas || [];
        state.pagination = {
          currentPage: action.payload.currentPage || 1,
          totalPages: action.payload.totalPages || 1,
          total: action.payload.total || 0,
        };
      })
      .addCase(fetchPizzas.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchPizzaById.pending, (state) => { state.isLoading = true; })
      .addCase(fetchPizzaById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedPizza = action.payload;
      })
      .addCase(fetchPizzaById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      .addCase(createPizza.fulfilled, (state, action) => {
        state.pizzas.unshift(action.payload);
        toast.success('Pizza created!');
      })
      .addCase(createPizza.rejected, (_, action) => {
        toast.error(action.payload);
      })

      .addCase(updatePizza.fulfilled, (state, action) => {
        const idx = state.pizzas.findIndex(p => p._id === action.payload._id);
        if (idx !== -1) state.pizzas[idx] = action.payload;
        toast.success('Pizza updated!');
      })
      .addCase(updatePizza.rejected, (_, action) => {
        toast.error(action.payload);
      })

      .addCase(deletePizza.fulfilled, (state, action) => {
        state.pizzas = state.pizzas.filter(p => p._id !== action.payload);
        toast.success('Pizza deleted!');
      })
      .addCase(deletePizza.rejected, (_, action) => {
        toast.error(action.payload);
      });
  },
});

export const { setFilters, clearSelectedPizza } = pizzaSlice.actions;
export default pizzaSlice.reducer;
