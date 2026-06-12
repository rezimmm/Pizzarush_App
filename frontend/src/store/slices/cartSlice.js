import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/cart');
    return res.data.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const addToCart = createAsyncThunk('cart/add', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post('/cart/add', payload);
    return res.data.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to add to cart');
  }
});

export const updateCartItem = createAsyncThunk('cart/update', async ({ itemId, quantity }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/cart/item/${itemId}`, { quantity });
    return res.data.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const removeFromCart = createAsyncThunk('cart/remove', async (itemId, { rejectWithValue }) => {
  try {
    const res = await api.delete(`/cart/item/${itemId}`);
    return res.data.data.cart;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const clearCart = createAsyncThunk('cart/clear', async (_, { rejectWithValue }) => {
  try {
    await api.delete('/cart');
    return { items: [], totalAmount: 0 };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    totalAmount: 0,
    isLoading: false,
    isOpen: false,
    error: null,
  },
  reducers: {
    toggleCart(state) { state.isOpen = !state.isOpen; },
    openCart(state) { state.isOpen = true; },
    closeCart(state) { state.isOpen = false; },
  },
  extraReducers: (builder) => {
    const setCart = (state, action) => {
      state.isLoading = false;
      if (action.payload) {
        state.items = action.payload.items || [];
        state.totalAmount = action.payload.totalAmount || 0;
      }
    };

    builder
      .addCase(fetchCart.fulfilled, setCart)
      .addCase(addToCart.pending, (state) => { state.isLoading = true; })
      .addCase(addToCart.fulfilled, (state, action) => {
        setCart(state, action);
        toast.success('Added to cart! 🛒');
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        toast.error(action.payload || 'Failed to add item');
      })
      .addCase(updateCartItem.fulfilled, setCart)
      .addCase(removeFromCart.fulfilled, (state, action) => {
        setCart(state, action);
        toast.success('Item removed');
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
        state.totalAmount = 0;
      });
  },
});

export const { toggleCart, openCart, closeCart } = cartSlice.actions;
export default cartSlice.reducer;
