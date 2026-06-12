import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllOrders } from '../../store/slices/orderSlice';
import { fetchPizzas } from '../../store/slices/pizzaSlice';
import api from '../../api/axiosInstance';
import {
  ShoppingBag, TrendingUp, Package, Users,
  DollarSign, Clock
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { format, subDays } from 'date-fns';
import { motion } from 'framer-motion';

const COLORS = ['#ff5a1f', '#ff8c42', '#ffd166', '#06d6a0'];

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colorMap = {
    brand: 'bg-brand-500/15 text-brand-400',
    green: 'bg-green-500/15 text-green-400',
    blue: 'bg-blue-500/15 text-blue-400',
    purple: 'bg-purple-500/15 text-purple-400',
  };
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{label}</p>
          <p className="font-display text-3xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </motion.div>
  );
}

// Build last-7-days chart data from orders
function buildRevenueData(orders) {
  const map = {};
  for (let i = 6; i >= 0; i--) {
    const day = format(subDays(new Date(), i), 'MMM d');
    map[day] = { day, revenue: 0, orders: 0 };
  }
  orders.forEach((o) => {
    const day = format(new Date(o.createdAt), 'MMM d');
    if (map[day]) {
      map[day].revenue += o.totalAmount || 0;
      map[day].orders += 1;
    }
  });
  return Object.values(map);
}

function buildStatusData(orders) {
  const counts = {};
  orders.forEach((o) => {
    counts[o.orderStatus] = (counts[o.orderStatus] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export default function AdminDashboardPage() {
  const dispatch = useDispatch();
  const { orders } = useSelector((s) => s.order);
  const { pizzas } = useSelector((s) => s.pizza);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    dispatch(fetchAllOrders({ limit: 100 }));
    dispatch(fetchPizzas({ limit: 100 }));
    api.get('/admin/analytics/overview').then((res) => {
      setStats(res.data.data);
    }).catch(() => {});
  }, [dispatch]);

  const revenueData = buildRevenueData(orders);
  const statusData = buildStatusData(orders);
  const totalRevenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  const tooltipStyle = {
    backgroundColor: '#252535',
    border: '1px solid #383850',
    borderRadius: '12px',
    color: '#f3f4f6',
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-gray-400 mt-1">Welcome back! Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={ShoppingBag} label="Total Orders" value={orders.length} sub="All time" color="brand" />
        <StatCard icon={DollarSign} label="Total Revenue" value={`₹${totalRevenue.toFixed(0)}`} sub="All time" color="green" />
        <StatCard icon={Package} label="Menu Items" value={pizzas.length} sub="Active pizzas" color="blue" />
        <StatCard icon={TrendingUp} label="Avg Order Value" value={`₹${avgOrderValue.toFixed(0)}`} sub="Per order" color="purple" />
      </div>

      {/* Revenue Chart */}
      <div className="card p-5">
        <h2 className="font-display font-bold text-lg text-white mb-5">Revenue (Last 7 Days)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff5a1f" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ff5a1f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#383850" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`₹${v.toFixed(0)}`, 'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke="#ff5a1f" strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: '#ff5a1f', r: 4 }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Orders per day bar chart */}
        <div className="card p-5">
          <h2 className="font-display font-bold text-lg text-white mb-5">Daily Orders</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#383850" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="orders" fill="#ff5a1f" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Pie */}
        <div className="card p-5">
          <h2 className="font-display font-bold text-lg text-white mb-5">Order Status Breakdown</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-44 text-gray-500">No order data</div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-white">Recent Orders</h2>
          <span className="text-xs text-gray-400">Latest 5</span>
        </div>
        <div className="divide-y divide-surface-border">
          {orders.slice(0, 5).map((order) => (
            <div key={order._id} className="flex items-center justify-between px-5 py-3 hover:bg-surface-elevated/40 transition-colors">
              <div>
                <p className="text-white text-sm font-medium">#{order._id.slice(-8).toUpperCase()}</p>
                <p className="text-xs text-gray-400">{order.user?.name || '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-brand-400 font-bold text-sm">₹{order.totalAmount?.toFixed(0)}</p>
                <p className="text-xs text-gray-500 capitalize">{order.orderStatus}</p>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-500 text-sm">No orders yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
