import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Pizza, ShoppingCart, User, LogOut, LayoutDashboard, Menu, X, ChevronDown
} from 'lucide-react';
import { logoutUser } from '../store/slices/authSlice';
import { toggleCart } from '../store/slices/cartSlice';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const { items } = useSelector((s) => s.cart);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
    setUserMenuOpen(false);
  };

  const cartCount = items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  const navLinks = [
    { to: '/', label: 'Menu' },
    { to: '/orders', label: 'My Orders' },
  ];

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-surface/95 backdrop-blur-md shadow-card border-b border-surface-border' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-400 flex items-center justify-center shadow-brand group-hover:shadow-brand-lg transition-all duration-200">
              <Pizza size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-gradient">PizzaRush</span>
          </Link>

          {}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 ${
                  location.pathname === link.to
                    ? 'bg-brand-500/20 text-brand-400'
                    : 'text-gray-300 hover:text-white hover:bg-surface-elevated'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all duration-150 ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-brand-500/20 text-brand-400'
                    : 'text-gray-300 hover:text-white hover:bg-surface-elevated'
                }`}
              >
                <LayoutDashboard size={15} />
                Admin
              </Link>
            )}
          </div>

          {}
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                id="cart-toggle-btn"
                onClick={() => dispatch(toggleCart())}
                className="relative btn-ghost p-2.5"
                aria-label="Open cart"
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce-in">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  id="user-menu-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border hover:border-brand-500/40 transition-all duration-150"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-400 flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-200 max-w-[100px] truncate">
                    {user?.name}
                  </span>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 card border border-surface-border py-1 animate-fade-in">
                    <div className="px-4 py-2 border-b border-surface-border">
                      <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <Link to="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-surface-elevated transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <User size={15} /> Profile
                    </Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-surface-elevated transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <LayoutDashboard size={15} /> Admin Dashboard
                      </Link>
                    )}
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm px-4 py-2">Login</Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-2.5">Sign Up</Link>
              </div>
            )}

            {}
            <button
              className="md:hidden btn-ghost p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {}
      {mobileOpen && (
        <div className="md:hidden bg-surface/95 backdrop-blur-md border-t border-surface-border animate-slide-down">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-surface-elevated transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link to="/profile" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-surface-elevated transition-colors"
              >
                <User size={15} /> Profile
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-brand-400 hover:bg-brand-500/10 transition-colors"
              >
                <LayoutDashboard size={15} /> Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      )}

      {}
      {(userMenuOpen || mobileOpen) && (
        <div className="fixed inset-0 z-[-1]" onClick={() => { setUserMenuOpen(false); setMobileOpen(false); }} />
      )}
    </nav>
  );
}
