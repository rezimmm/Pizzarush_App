import { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderById, updateOrderRealtime } from '../store/slices/orderSlice';
import { io } from 'socket.io-client';
import { MapPin, Clock, CreditCard, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

// Status keys must match backend Order model enum exactly
const STEPS = [
  { key: 'order_received',    label: 'Order Received',   icon: '📋', desc: 'We got your order!' },
  { key: 'in_kitchen',        label: 'Preparing',         icon: '👨‍🍳', desc: 'Kitchen is cooking your pizza' },
  { key: 'out_for_delivery',  label: 'Out for Delivery', icon: '🛵', desc: 'On the way to you' },
  { key: 'delivered',         label: 'Delivered',         icon: '✅', desc: 'Enjoy your pizza!' },
];

function getStepIndex(status) {
  return STEPS.findIndex((s) => s.key === status);
}

export default function OrderTrackingPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentOrder: order, isLoading } = useSelector((s) => s.order);
  const { accessToken } = useSelector((s) => s.auth);
  const socketRef = useRef(null);

  useEffect(() => {
    dispatch(fetchOrderById(id));
  }, [dispatch, id]);

  // Socket.io real-time updates
  useEffect(() => {
    if (!accessToken) return; // Don't connect if not authenticated

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      withCredentials: true,
      auth: { token: accessToken }, // Required by backend JWT middleware
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      // Use the correct event name that the backend listens for
      socket.emit('track_order', id);
    });

    // Event name matches what backend emits: 'order_status_update'
    socket.on('order_status_update', (payload) => {
      // Backend sends { orderId, orderStatus, updatedAt, note } not a full order
      // Dispatch with the info we have to update currentOrder in Redux
      if (String(payload.orderId) === String(id)) {
        dispatch(updateOrderRealtime({ _id: id, orderStatus: payload.orderStatus }));
      }
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [id, dispatch, accessToken]);

  if (isLoading || !order) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center pt-20">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentStepIdx = getStepIndex(order.orderStatus);
  const isCancelled = order.orderStatus === 'cancelled';

  return (
    <div className="min-h-screen bg-surface pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <Link to="/orders" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm font-medium">
          <ArrowLeft size={16} /> All Orders
        </Link>

        {/* Header */}
        <div className="card p-5 mb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-white mb-1">
                Order #{order._id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-gray-400 text-sm flex items-center gap-1.5">
                <Clock size={13} />
                {order.createdAt ? format(new Date(order.createdAt), 'MMM d, yyyy · h:mm a') : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-bold text-brand-400">₹{order.totalAmount?.toFixed(2)}</p>
              <p className="text-xs text-gray-400 capitalize mt-0.5">{order.paymentMethod}</p>
            </div>
          </div>
        </div>

        {/* Live Tracking */}
        {!isCancelled ? (
          <div className="card p-6 mb-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-lg text-white">Live Tracking</h2>
              <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Live
              </span>
            </div>

            <div className="relative">
              {/* Progress Line */}
              <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-surface-elevated" />
              <div
                className="absolute left-5 top-5 w-0.5 bg-gradient-to-b from-brand-500 to-brand-400 transition-all duration-1000"
                style={{ height: `${currentStepIdx > 0 ? (currentStepIdx / (STEPS.length - 1)) * 100 : 0}%` }}
              />

              <div className="space-y-6">
                {STEPS.map((step, idx) => {
                  const done = idx <= currentStepIdx;
                  const active = idx === currentStepIdx;
                  return (
                    <motion.div
                      key={step.key}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative flex items-start gap-4 pl-2"
                    >
                      {/* Step circle */}
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg transition-all duration-500 ${
                        active ? 'step-active ring-4 ring-brand-500/30 animate-pulse-slow' :
                        done ? 'step-done' : 'step-pending'
                      }`}>
                        {step.icon}
                      </div>

                      <div className="flex-1 min-w-0 pt-2">
                        <p className={`font-semibold text-sm ${done ? 'text-white' : 'text-gray-500'}`}>{step.label}</p>
                        <p className={`text-xs mt-0.5 ${active ? 'text-brand-400' : 'text-gray-500'}`}>{step.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-5 mb-5 border-red-500/30 bg-red-500/5 text-center">
            <div className="text-4xl mb-3">❌</div>
            <h2 className="font-display font-bold text-lg text-red-400">Order Cancelled</h2>
            <p className="text-gray-400 text-sm mt-1">This order has been cancelled.</p>
          </div>
        )}

        {/* Order Items */}
        <div className="card p-5 mb-5">
          <h2 className="font-display font-bold text-lg text-white mb-4">Items Ordered</h2>
          <div className="space-y-3">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="text-2xl">🍕</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.pizza?.name || 'Custom Pizza'}</p>
                  <p className="text-xs text-gray-400">{item.size} · {item.crust} · qty {item.quantity}</p>
                </div>
                <span className="text-brand-400 font-bold text-sm">₹{item.itemTotal?.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Address & Payment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card p-4">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-2 text-sm">
              <MapPin size={14} className="text-brand-400" /> Delivery Address
            </h3>
            {order.deliveryAddress ? (
              <p className="text-gray-400 text-sm leading-relaxed">
                {order.deliveryAddress.street}<br />
                {order.deliveryAddress.city}, {order.deliveryAddress.state}<br />
                {order.deliveryAddress.pincode}
              </p>
            ) : <p className="text-gray-500 text-sm">No address provided</p>}
          </div>
          <div className="card p-4">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-2 text-sm">
              <CreditCard size={14} className="text-brand-400" /> Payment
            </h3>
            <p className="text-gray-400 text-sm capitalize">{order.paymentMethod}</p>
            <p className={`text-xs mt-1 font-medium ${
              order.paymentStatus === 'completed' ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {order.paymentStatus === 'completed' ? '✓ Paid' : '⏳ Pending'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
