import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCart, clearCart, removeFromCart, updateCartItem } from '../store/slices/cartSlice';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

const DELIVERY_FEE = 49;
const TAX_RATE = 0.05;

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalAmount, isLoading } = useSelector((s) => s.cart);
  const { user } = useSelector((s) => s.auth);

  const defaultAddr = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0] || {};

  const [address, setAddress] = useState({
    street: defaultAddr.street || '',
    city: defaultAddr.city || '',
    state: defaultAddr.state || '',
    pincode: defaultAddr.pincode || '',
  });
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const tax = totalAmount * TAX_RATE;
  const grandTotal = totalAmount + DELIVERY_FEE + tax;

  const handleAddressChange = (e) => {
    setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    if (!address.street || !address.city || !address.pincode) {
      toast.error('Please fill in your delivery address');
      return;
    }
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsPlacingOrder(true);

    try {
      if (paymentMethod === 'cod') {

        const orderRes = await api.post('/orders', {
          deliveryAddress: address,
          paymentMethod: 'cod',
        });
        const orderId = orderRes.data.data.order._id;
        dispatch(clearCart());
        toast.success('Order placed! Pay on delivery.');
        navigate(`/orders/${orderId}/track`);
      } else {

        const loaded = await loadRazorpay();
        if (!loaded) {
          toast.error('Razorpay SDK failed to load. Check your internet.');
          setIsPlacingOrder(false);
          return;
        }

        const orderRes = await api.post('/orders', {
          deliveryAddress: address,
          paymentMethod: 'razorpay',
        });
        const order = orderRes.data.data.order;

        const payRes = await api.post('/payments/create-order', { orderId: order._id });
        const { razorpayOrderId, amount, currency, keyId } = payRes.data.data;

        const options = {

          key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount,
          currency: currency || 'INR',
          name: 'PizzaRush 🍕',
          description: `Order #${order.orderId || order._id.slice(-8).toUpperCase()}`,
          order_id: razorpayOrderId,
          prefill: { name: user?.name, email: user?.email, contact: user?.phone || '' },
          theme: { color: '#ff5a1f' },
          handler: async (response) => {

            try {
              await api.post('/payments/verify', {
                orderId: order._id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              dispatch(clearCart());
              toast.success('Payment successful! 🍕 Your order is confirmed.');
              navigate(`/orders/${order._id}/track`);
            } catch {
              toast.error('Payment verification failed. Please contact support.');
              setIsPlacingOrder(false);
            }
          },
          modal: {
            ondismiss: () => {
              toast('Payment cancelled.');
              setIsPlacingOrder(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', async (response) => {
          await api.post('/payments/failure', {
            razorpayOrderId: response.error.metadata?.order_id,
            errorCode: response.error.code,
            errorDescription: response.error.description,
          }).catch(() => {});
          toast.error(`Payment failed: ${response.error.description}`);
          setIsPlacingOrder(false);
        });
        rzp.open();
        setIsPlacingOrder(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-5 pt-20">
        <div className="text-6xl">🛒</div>
        <h2 className="font-display text-2xl font-bold text-white">Your cart is empty</h2>
        <p className="text-gray-400">Add some pizzas to get started!</p>
        <button onClick={() => navigate('/')} className="btn-primary">Browse Menu</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <ShoppingBag className="text-brand-400" size={28} />
          Checkout
        </h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Address + Payment */}
          <div className="lg:col-span-2 space-y-5">
            {/* Delivery Address */}
            <div className="card p-5 space-y-4">
              <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <Tag size={18} className="text-brand-400" /> Delivery Address
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="input-label">Street Address</label>
                  <input name="street" value={address.street} onChange={handleAddressChange}
                    className="input-field" placeholder="123 Main St, Apt 4B" />
                </div>
                <div>
                  <label className="input-label">City</label>
                  <input name="city" value={address.city} onChange={handleAddressChange}
                    className="input-field" placeholder="Mumbai" />
                </div>
                <div>
                  <label className="input-label">State</label>
                  <input name="state" value={address.state} onChange={handleAddressChange}
                    className="input-field" placeholder="Maharashtra" />
                </div>
                <div>
                  <label className="input-label">Pincode</label>
                  <input name="pincode" value={address.pincode} onChange={handleAddressChange}
                    className="input-field" placeholder="400001" />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card p-5 space-y-3">
              <h2 className="font-display font-bold text-lg text-white">Payment Method</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'razorpay', label: 'Pay Online', icon: '💳', desc: 'UPI, Cards, Netbanking' },
                  { id: 'cod', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when delivered' },
                ].map((m) => (
                  <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                      paymentMethod === m.id
                        ? 'border-brand-500 bg-brand-500/15'
                        : 'border-surface-border bg-surface-elevated hover:border-surface-border'
                    }`}
                  >
                    <div className="text-2xl mb-2">{m.icon}</div>
                    <p className="font-semibold text-white text-sm">{m.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Order Items */}
            <div className="card p-5 space-y-3">
              <h2 className="font-display font-bold text-lg text-white">Order Items ({items.length})</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin pr-1">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div key={item._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-3 py-2 border-b border-surface-border last:border-0"
                    >
                      <div className="text-2xl">🍕</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{item.pizza?.name || 'Custom Pizza'}</p>
                        <p className="text-xs text-gray-400">{item.size} · {item.crust}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => dispatch(updateCartItem({ itemId: item._id, quantity: item.quantity - 1 }))}
                          disabled={item.quantity <= 1 || isLoading}
                          className="w-6 h-6 rounded bg-surface-elevated flex items-center justify-center hover:bg-surface-border disabled:opacity-40"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-white text-sm w-4 text-center font-bold">{item.quantity}</span>
                        <button onClick={() => dispatch(updateCartItem({ itemId: item._id, quantity: item.quantity + 1 }))}
                          disabled={isLoading}
                          className="w-6 h-6 rounded bg-surface-elevated flex items-center justify-center hover:bg-surface-border disabled:opacity-40"
                        >
                          <Plus size={10} />
                        </button>
                        <button onClick={() => dispatch(removeFromCart(item._id))} disabled={isLoading}
                          className="w-6 h-6 rounded bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 ml-1 disabled:opacity-40"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                      <span className="text-brand-400 font-bold text-sm w-16 text-right">₹{item.itemTotal?.toFixed(0)}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div>
            <div className="card p-5 space-y-4 sticky top-24">
              <h2 className="font-display font-bold text-lg text-white">Order Summary</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span><span className="text-white">₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Delivery Fee</span><span className="text-white">₹{DELIVERY_FEE}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>GST (5%)</span><span className="text-white">₹{tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-surface-border pt-2.5 flex justify-between font-display font-bold text-base">
                  <span className="text-white">Total</span>
                  <span className="text-brand-400 text-xl">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                id="place-order-btn"
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || isLoading || items.length === 0}
                className="btn-primary w-full py-3.5 text-base"
              >
                {isPlacingOrder ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {paymentMethod === 'cod' ? '🛵 Place Order (COD)' : '💳 Pay & Order'}
                    <ArrowRight size={18} />
                  </span>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center">
                {paymentMethod === 'razorpay' ? '🔒 Secured by Razorpay' : '🛵 Pay on delivery'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
