import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllOrders, updateOrderStatus } from '../../store/slices/orderSlice';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['received', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

const STATUS_CONFIG = {
  received:           { label: 'Received',        cls: 'status-received' },
  preparing:          { label: 'Preparing',        cls: 'status-kitchen' },
  out_for_delivery:   { label: 'Out for Delivery', cls: 'status-delivery' },
  delivered:          { label: 'Delivered',        cls: 'status-delivered' },
  cancelled:          { label: 'Cancelled',        cls: 'status-cancelled' },
};

export default function AdminOrdersPage() {
  const dispatch = useDispatch();
  const { orders, isLoading, pagination } = useSelector((s) => s.order);

  useEffect(() => {
    dispatch(fetchAllOrders({ limit: 30 }));
  }, [dispatch]);

  const handleStatusChange = (orderId, status) => {
    dispatch(updateOrderStatus({ orderId, status }));
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">Order Management</h1>
        <p className="text-gray-400 mt-1">{pagination.total} total orders</p>
      </div>

      {isLoading && orders.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Order ID</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Change Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {orders.map((order, idx) => {
                  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.received;
                  return (
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-surface-elevated/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-300">
                        #{order._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white font-medium truncate max-w-[120px]">{order.user?.name || '—'}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[120px]">{order.user?.email || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">
                        {order.createdAt ? format(new Date(order.createdAt), 'MMM d, h:mm a') : '—'}
                      </td>
                      <td className="px-4 py-3 font-bold text-white">₹{order.totalAmount?.toFixed(0)}</td>
                      <td className="px-4 py-3">
                        <span className={statusCfg.cls}>{statusCfg.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          id={`status-select-${order._id}`}
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          disabled={order.status === 'delivered' || order.status === 'cancelled'}
                          className="bg-surface-elevated border border-surface-border text-gray-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-500 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
                          ))}
                        </select>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>

            {orders.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">📋</div>
                <p>No orders yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
