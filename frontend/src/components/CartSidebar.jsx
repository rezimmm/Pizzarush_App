import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  closeCart, updateCartItem, removeFromCart
} from '../store/slices/cartSlice';

export default function CartSidebar() {
  const dispatch = useDispatch();
  const { isOpen, items, totalAmount, isLoading } = useSelector((s) => s.cart);

  // Prevent body scroll when cart is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleQty = (itemId, newQty) => {
    if (newQty < 1) return;
    dispatch(updateCartItem({ itemId, quantity: newQty }));
  };

  const handleRemove = (itemId) => {
    dispatch(removeFromCart(itemId));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => dispatch(closeCart())}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col bg-surface border-l border-surface-border shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-brand-400" />
                <h2 className="font-display font-bold text-lg text-white">Your Cart</h2>
                {items.length > 0 && (
                  <span className="badge badge-brand">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                )}
              </div>
              <button onClick={() => dispatch(closeCart())} className="btn-ghost p-2 rounded-lg" aria-label="Close cart">
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-20 h-20 rounded-full bg-surface-elevated flex items-center justify-center text-4xl">
                    🍕
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-1">Your cart is empty</p>
                    <p className="text-sm text-gray-400">Add some delicious pizzas to get started!</p>
                  </div>
                  <button onClick={() => dispatch(closeCart())} className="btn-primary mt-2">
                    Browse Menu
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item._id}
                      layout
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                      className="card p-3 flex items-center gap-3"
                    >
                      <div className="w-14 h-14 rounded-xl bg-surface-elevated flex items-center justify-center text-2xl flex-shrink-0">
                        🍕
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">
                          {item.pizza?.name || 'Custom Pizza'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.size} · {item.crust}
                        </p>
                        <p className="text-brand-400 font-bold text-sm mt-0.5">
                          ₹{item.itemTotal?.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleQty(item._id, item.quantity - 1)}
                          disabled={isLoading || item.quantity <= 1}
                          className="w-7 h-7 rounded-lg bg-surface-elevated flex items-center justify-center hover:bg-surface-border transition-colors disabled:opacity-40"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQty(item._id, item.quantity + 1)}
                          disabled={isLoading}
                          className="w-7 h-7 rounded-lg bg-surface-elevated flex items-center justify-center hover:bg-surface-border transition-colors disabled:opacity-40"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          onClick={() => handleRemove(item._id)}
                          disabled={isLoading}
                          className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors ml-1 disabled:opacity-40"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-surface-border px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-medium">Subtotal</span>
                  <span className="text-xl font-display font-bold text-white">₹{totalAmount?.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500">Taxes and delivery fee calculated at checkout</p>
                <Link
                  to="/checkout"
                  onClick={() => dispatch(closeCart())}
                  id="proceed-to-checkout-btn"
                  className="btn-primary w-full text-center"
                >
                  Proceed to Checkout
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
