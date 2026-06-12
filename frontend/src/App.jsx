import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { fetchMe } from './store/slices/authSlice';

import Navbar from './components/Navbar';
import CartSidebar from './components/CartSidebar';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import SplashScreen from './components/SplashScreen';

import MenuPage from './pages/MenuPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

import CheckoutPage from './pages/CheckoutPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import ProfilePage from './pages/ProfilePage';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminInventoryPage from './pages/admin/AdminInventoryPage';
import AdminPizzasPage from './pages/admin/AdminPizzasPage';

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <CartSidebar />
      {children}
    </>
  );
}

export default function App() {
  const dispatch = useDispatch();
  const { isInitialized } = useSelector((s) => s.auth);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('isLoggedIn') === 'true') {
      dispatch(fetchMe());
    } else {
      dispatch({ type: 'auth/setInitialized' });
    }
  }, [dispatch]);

  if (!isInitialized || showSplash) {
    return (
      <div className="min-h-screen bg-surface">
        {showSplash ? (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        ) : (
          <div className="min-h-screen flex items-center justify-center bg-surface">
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm font-medium">Loading PizzaRush…</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <BrowserRouter basename="/Pizzarush_App/">
      <Routes>
        {}
        <Route path="/" element={<PublicLayout><MenuPage /></PublicLayout>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {}
        <Route path="/checkout" element={
          <ProtectedRoute>
            <PublicLayout><CheckoutPage /></PublicLayout>
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute>
            <PublicLayout><OrderHistoryPage /></PublicLayout>
          </ProtectedRoute>
        } />
        <Route path="/orders/:id/track" element={
          <ProtectedRoute>
            <PublicLayout><OrderTrackingPage /></PublicLayout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <PublicLayout><ProfilePage /></PublicLayout>
          </ProtectedRoute>
        } />

        {}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="inventory" element={<AdminInventoryPage />} />
          <Route path="pizzas" element={<AdminPizzasPage />} />
        </Route>

        {}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
