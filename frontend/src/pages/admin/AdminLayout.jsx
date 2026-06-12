import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, Package, ShoppingBag, BarChart2, Pizza, LogOut, ChevronRight
} from 'lucide-react';
import { logoutUser } from '../../store/slices/authSlice';

const NAV_ITEMS = [
  { to: '/admin',            label: 'Dashboard',  icon: LayoutDashboard, end: true },
  { to: '/admin/orders',     label: 'Orders',     icon: ShoppingBag },
  { to: '/admin/inventory',  label: 'Inventory',  icon: Package },
  { to: '/admin/pizzas',     label: 'Pizzas',     icon: Pizza },
  { to: '/admin/analytics',  label: 'Analytics',  icon: BarChart2 },
];

export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {}
      <aside className="w-60 flex-shrink-0 bg-surface-card border-r border-surface-border flex flex-col fixed left-0 top-0 h-full z-40">
        {}
        <Link to="/" className="flex items-center gap-2.5 px-5 py-5 border-b border-surface-border hover:bg-surface-elevated/40 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-400 flex items-center justify-center shadow-brand">
            <Pizza size={18} className="text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-base text-gradient">PizzaRush</span>
            <p className="text-[10px] text-gray-500 -mt-0.5">Admin Panel</p>
          </div>
        </Link>

        {}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? 'nav-item-active' : 'nav-item'
              }
            >
              <Icon size={18} />
              {label}
              <ChevronRight size={14} className="ml-auto opacity-40" />
            </NavLink>
          ))}
        </nav>

        {}
        <div className="border-t border-surface-border px-3 py-4 space-y-2">
          <div className="flex items-center gap-2.5 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {}
      <main className="flex-1 ml-60 min-h-screen overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
