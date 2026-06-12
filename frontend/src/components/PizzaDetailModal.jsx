import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Star, Clock, Flame } from 'lucide-react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, openCart } from '../store/slices/cartSlice';

const SIZES = [
  { label: 'Small', emoji: '🟡', surcharge: 0, diameter: '8"' },
  { label: 'Medium', emoji: '🟠', surcharge: 50, diameter: '10"' },
  { label: 'Large', emoji: '🔴', surcharge: 100, diameter: '12"' },
];

const CRUSTS = ['Thin', 'Classic', 'Stuffed'];

const TOPPINGS_EXTRA = [
  { label: 'Extra Cheese', price: 30 },
  { label: 'Jalapeños', price: 20 },
  { label: 'Olives', price: 20 },
  { label: 'Mushrooms', price: 25 },
];

export default function PizzaDetailModal({ pizza, onClose }) {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((s) => s.cart);
  const { isAuthenticated } = useSelector((s) => s.auth);
  const [selectedSize, setSelectedSize] = useState('Medium');
  const [selectedCrust, setSelectedCrust] = useState('Classic');
  const [quantity, setQuantity] = useState(1);
  const [extraToppings, setExtraToppings] = useState([]);

  const sizeObj = SIZES.find((s) => s.label === selectedSize);
  const toppingsTotal = extraToppings.reduce((sum, t) => sum + t.price, 0);
  const unitPrice = pizza.price + sizeObj.surcharge + toppingsTotal;
  const totalPrice = unitPrice * quantity;

  const toggleTopping = (topping) => {
    setExtraToppings((prev) =>
      prev.find((t) => t.label === topping.label)
        ? prev.filter((t) => t.label !== topping.label)
        : [...prev, topping]
    );
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) return;
    dispatch(addToCart({
      itemType: 'pizza',
      pizzaId: pizza._id,
      size: selectedSize,
      crust: selectedCrust,
      quantity,
      extraToppings,
    })).then((res) => {
      if (!res.error) {
        dispatch(openCart());
        onClose();
      }
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-surface border border-surface-border rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {}
          <div className="relative h-52 bg-gradient-to-br from-brand-900/40 to-surface-elevated flex items-center justify-center">
            <div className="text-8xl animate-float">🍕</div>
            <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-surface/80 backdrop-blur-sm flex items-center justify-center text-gray-300 hover:text-white hover:bg-surface-elevated transition-colors">
              <X size={18} />
            </button>
            {pizza.isBestseller && (
              <div className="absolute top-4 left-4 badge bg-yellow-500/90 text-yellow-950 gap-1">
                <Star size={10} fill="currentColor" /> Bestseller
              </div>
            )}
          </div>

          {}
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
            <div>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display font-bold text-2xl text-white">{pizza.name}</h2>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {pizza.isSpicy && <span className="badge badge-danger gap-1"><Flame size={10} /> Spicy</span>}
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-1.5 leading-relaxed">{pizza.description}</p>
              {pizza.prepTime && (
                <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-2">
                  <Clock size={14} /> <span>{pizza.prepTime} mins prep time</span>
                </div>
              )}
            </div>

            {}
            {pizza.toppings?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Included Toppings</p>
                <div className="flex flex-wrap gap-1.5">
                  {pizza.toppings.map((t) => (
                    <span key={t} className="badge badge-info text-xs">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Choose Size</p>
              <div className="grid grid-cols-3 gap-2">
                {SIZES.map((s) => (
                  <button key={s.label} onClick={() => setSelectedSize(s.label)}
                    className={`p-3 rounded-xl border text-center transition-all duration-150 ${
                      selectedSize === s.label
                        ? 'border-brand-500 bg-brand-500/15 text-white'
                        : 'border-surface-border bg-surface-elevated text-gray-400 hover:border-surface-border'
                    }`}
                  >
                    <div className="text-lg mb-0.5">{s.emoji}</div>
                    <div className="text-xs font-bold">{s.label}</div>
                    <div className="text-[10px] text-gray-500">{s.diameter}</div>
                    {s.surcharge > 0 && <div className="text-[10px] text-brand-400">+₹{s.surcharge}</div>}
                  </button>
                ))}
              </div>
            </div>

            {}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Choose Crust</p>
              <div className="flex gap-2">
                {CRUSTS.map((c) => (
                  <button key={c} onClick={() => setSelectedCrust(c)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all duration-150 ${
                      selectedCrust === c
                        ? 'border-brand-500 bg-brand-500/15 text-brand-400'
                        : 'border-surface-border bg-surface-elevated text-gray-400 hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Extra Toppings</p>
              <div className="grid grid-cols-2 gap-2">
                {TOPPINGS_EXTRA.map((t) => {
                  const selected = !!extraToppings.find((et) => et.label === t.label);
                  return (
                    <button key={t.label} onClick={() => toggleTopping(t)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition-all duration-150 ${
                        selected
                          ? 'border-brand-500 bg-brand-500/15 text-white'
                          : 'border-surface-border bg-surface-elevated text-gray-400 hover:text-white'
                      }`}
                    >
                      <span>{t.label}</span>
                      <span className={selected ? 'text-brand-400 font-bold' : 'text-gray-500'}>+₹{t.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {}
          <div className="border-t border-surface-border p-5 flex items-center justify-between gap-4">
            {}
            <div className="flex items-center gap-2 bg-surface-elevated rounded-xl p-1">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-border transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="w-6 text-center font-bold text-white">{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-border transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              id="modal-add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={isLoading || !isAuthenticated}
              className="btn-primary flex-1 text-sm"
            >
              {!isAuthenticated ? 'Login to Order' : `Add to Cart • ₹${totalPrice}`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
