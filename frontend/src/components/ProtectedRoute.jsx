import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface">
    <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isInitialized, isLoading } = useSelector((state) => state.auth);
  const location = useLocation();

  // Block while auth is being resolved (initial fetchMe in-flight)
  if (!isInitialized || isLoading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export function AdminRoute({ children }) {
  const { isAuthenticated, isInitialized, isLoading, user } = useSelector((state) => state.auth);
  const location = useLocation();

  // Block while auth is being resolved (initial fetchMe in-flight)
  if (!isInitialized || isLoading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
