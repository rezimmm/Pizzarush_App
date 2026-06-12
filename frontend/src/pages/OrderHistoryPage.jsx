import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyOrders } from '../store/slices/orderSlice';
import { Link } from 'react-router-dom';
import { ClipboardList, ChevronRight, MapPin, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  received:   { label: 'Order Received',   cls: 'status-received',  icon: '📋' },
  preparing:  { label: 'Preparing',        cls: 'status-kitchen',   icon: '👨‍🍳' },
  out_for_delivery: { label: 'Out for Delivery', cls: 'status-delivery', icon: '🛵' },
  delivered:  { label: 'Delivered',        cls: 'status-delivered', icon: '✅' },
  cancelled:  { label: 'Cancelled',        cls: 'status-cancelled', icon: '❌' },
};

export default function OrderHistoryPage() {
  const dispatch = useDispatch();
  const { orders, isLoading, pagination } = useSelector((s) => s.order);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-surface pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <h1 className="font-display text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <ClipboardList className="text-brand-400" size={28} />
            My Orders
          </h1>
          {isLoading && orders.length === 0 ? (
            <div className="h-4 bg-surface-elevated rounded w-32 mt-2 animate-pulse" />
          ) : (
            <p className="text-gray-400">{pagination.total} order{pagination.total !== 1 ? 's' : ''} placed</p>
          )}
        </div>

        {isLoading && orders.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5 animate-pulse space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 bg-surface-elevated rounded w-32" />
                  <div className="h-4 bg-surface-elevated rounded w-20" />
                </div>
                <div className="h-3 bg-surface-elevated rounded w-48" />
                <div className="h-3 bg-surface-elevated rounded w-full" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="font-display text-xl font-bold text-white mb-2">No orders yet</h3>
            <p className="text-gray-400 mb-6">Place your first order and it will appear here.</p>
            <Link to="/" className="btn-primary">Order Now 🍕</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => {
              const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.received;
              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link
                    to={`/orders/${order._id}/track`}
                    className="card p-5 block hover:border-brand-500/40 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-display font-bold text-white text-sm">
                            Order #{order._id.slice(-8).toUpperCase()}
                          </span>
                          <span className={statusCfg.cls}>
                            {statusCfg.icon} {statusCfg.label}
                          </span>
                        </div>

                        {/* Items summary */}
                        <p className="text-sm text-gray-400 truncate mb-2">
                          {order.items?.slice(0, 2).map((item) =>
                            `${item.pizza?.name || 'Custom Pizza'} x${item.quantity}`
                          ).join(', ')}
                          {order.items?.length > 2 && ` +${order.items.length - 2} more`}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {order.createdAt ? format(new Date(order.createdAt), 'MMM d, yyyy · h:mm a') : '—'}
                          </span>
                          {order.deliveryAddress?.city && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} />
                              {order.deliveryAddress.city}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className="font-display font-bold text-lg text-white">
                          ₹{order.totalAmount?.toFixed(2)}
                        </span>
                        <ChevronRight size={18} className="text-gray-500 group-hover:text-brand-400 transition-colors" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
