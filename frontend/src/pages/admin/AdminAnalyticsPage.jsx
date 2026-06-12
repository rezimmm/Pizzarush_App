import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllOrders } from '../../store/slices/orderSlice';
import { fetchPizzas } from '../../store/slices/pizzaSlice';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { format, subDays, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { TrendingUp, DollarSign, ShoppingBag, Star } from 'lucide-react';

const COLORS = ['#ff5a1f', '#ff8c42', '#ffd166', '#06d6a0', '#118ab2', '#e040fb'];

const tooltipStyle = {
  backgroundColor: '#1e1e2e',
  border: '1px solid #383850',
  borderRadius: '12px',
  color: '#f3f4f6',
  fontSize: '13px',
};

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colorMap = {
    brand:  'bg-brand-500/15 text-brand-400',
    green:  'bg-green-500/15 text-green-400',
    blue:   'bg-blue-500/15 text-blue-400',
    purple: 'bg-purple-500/15 text-purple-400',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5"
    >
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

/* ── helpers ─────────────────────────────────────────────────────────── */

function buildDailyData(orders, days = 30) {
  const map = {};
  for (let i = days - 1; i >= 0; i--) {
    const day = format(subDays(new Date(), i), 'MMM d');
    map[day] = { day, revenue: 0, orders: 0 };
  }
  orders.forEach((o) => {
    const day = format(new Date(o.createdAt), 'MMM d');
    if (map[day]) {
      map[day].revenue += o.totalAmount || 0;
      map[day].orders  += 1;
    }
  });
  return Object.values(map);
}

function buildWeeklyData(orders, weeks = 8) {
  const map = {};
  for (let i = weeks - 1; i >= 0; i--) {
    const d   = subWeeks(new Date(), i);
    const key = `W${format(startOfWeek(d), 'MMM d')}`;
    map[key]  = { week: key, revenue: 0, orders: 0 };
  }
  orders.forEach((o) => {
    const d   = new Date(o.createdAt);
    const key = `W${format(startOfWeek(d), 'MMM d')}`;
    if (map[key]) {
      map[key].revenue += o.totalAmount || 0;
      map[key].orders  += 1;
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

function buildTopPizzas(orders, limit = 6) {
  const counts = {};
  orders.forEach((o) => {
    (o.items || []).forEach((item) => {
      const name = item.pizza?.name || 'Unknown';
      counts[name] = (counts[name] || 0) + (item.quantity || 1);
    });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, qty]) => ({ name, qty }));
}

/* ── page ─────────────────────────────────────────────────────────────── */

export default function AdminAnalyticsPage() {
  const dispatch = useDispatch();
  const { orders } = useSelector((s) => s.order);

  useEffect(() => {
    dispatch(fetchAllOrders({ limit: 500 }));
    dispatch(fetchPizzas({ limit: 100 }));
  }, [dispatch]);

  const dailyData  = useMemo(() => buildDailyData(orders, 14), [orders]);
  const weeklyData = useMemo(() => buildWeeklyData(orders, 8),  [orders]);
  const statusData = useMemo(() => buildStatusData(orders),      [orders]);
  const topPizzas  = useMemo(() => buildTopPizzas(orders),       [orders]);

  const totalRevenue  = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const thisWeekOrders = orders.filter((o) => {
    const d = new Date(o.createdAt);
    return d >= startOfWeek(new Date()) && d <= endOfWeek(new Date());
  });
  const thisWeekRevenue = thisWeekOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 mt-1">Detailed insights into orders & revenue.</p>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={ShoppingBag} label="Total Orders"    value={orders.length}                 sub="All time"   color="brand"  />
        <StatCard icon={DollarSign}  label="Total Revenue"   value={`₹${totalRevenue.toFixed(0)}`}  sub="All time"   color="green"  />
        <StatCard icon={TrendingUp}  label="This Week Rev."  value={`₹${thisWeekRevenue.toFixed(0)}`} sub="Current week" color="blue" />
        <StatCard icon={Star}        label="Avg Order Value" value={`₹${avgOrderValue.toFixed(0)}`} sub="Per order"  color="purple" />
      </div>

      {/* daily revenue – 14 days */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
        <h2 className="font-display font-bold text-lg text-white mb-5">Revenue – Last 14 Days</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ff5a1f" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#ff5a1f" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#383850" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`₹${Number(v).toFixed(0)}`, 'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke="#ff5a1f" strokeWidth={2.5} fill="url(#aGrad)"
              dot={{ fill: '#ff5a1f', r: 3 }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* weekly orders bar chart */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-5">
        <h2 className="font-display font-bold text-lg text-white mb-5">Weekly Order Volume</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#383850" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="orders" fill="#ff8c42" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* order status pie */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
          <h2 className="font-display font-bold text-lg text-white mb-5">Order Status Breakdown</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-44 text-gray-500">No order data yet</div>
          )}
        </motion.div>

        {/* top pizzas */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-5">
          <h2 className="font-display font-bold text-lg text-white mb-5">Top Pizzas by Volume</h2>
          {topPizzas.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topPizzas} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#383850" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="qty" fill="#ffd166" radius={[0, 6, 6, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-44 text-gray-500">No pizza data yet</div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
