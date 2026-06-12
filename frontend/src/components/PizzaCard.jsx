import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Plus, Clock, Flame } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import { openCart } from '../store/slices/cartSlice';

const SIZE_PRICES = { Small: 0, Medium: 50, Large: 100 };
const SIZES = ['Small', 'Medium', 'Large'];
const CRUSTS = ['Thin', 'Classic', 'Stuffed'];

const categoryEmojis = {
  'Veg': '🥦',
  'Non-Veg': '🍗',
  'Premium': '👑',
  'Combo': '🎁',
};

export default function PizzaCard({ pizza, onViewDetails }) {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((s) => s.cart);
  const { isAuthenticated } = useSelector((s) => s.auth);
  const [selectedSize, setSelectedSize] = useState('Medium');
  const [selectedCrust, setSelectedCrust] = useState('Classic');

  const finalPrice = pizza.price + SIZE_PRICES[selectedSize];

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) return;
    dispatch(addToCart({
      itemType: 'pizza',
      pizzaId: pizza._id,
      size: selectedSize,
      crust: selectedCrust,
      quantity: 1,
    })).then((res) => {
      if (!res.error) dispatch(openCart());
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="card group cursor-pointer overflow-hidden"
      onClick={() => onViewDetails(pizza)}
    >
      {}
      <div className="relative h-44 bg-gradient-to-br from-surface-elevated to-surface-card overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-7xl group-hover:scale-110 transition-transform duration-500">
          🍕
        </div>
        {}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {pizza.category && (
            <span className="badge badge-brand text-[10px] px-2 py-0.5 gap-1">
              {categoryEmojis[pizza.category] || '🍕'} {pizza.category}
            </span>
          )}
          {pizza.isSpicy && (
            <span className="badge badge-danger text-[10px] px-2 py-0.5 gap-1">
              <Flame size={9} /> Spicy
            </span>
          )}
        </div>
        {pizza.isBestseller && (
          <div className="absolute top-3 right-3 badge bg-yellow-500/90 text-yellow-950 text-[10px] px-2 py-0.5 gap-1">
            <Star size={9} fill="currentColor" /> Bestseller
          </div>
        )}
        {}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-surface-card to-transparent" />
      </div>

      {}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-display font-bold text-white group-hover:text-brand-400 transition-colors truncate">{pizza.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{pizza.description}</p>
        </div>

        {}
        {pizza.prepTime && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={11} />
            <span>{pizza.prepTime} mins</span>
          </div>
        )}

        {}
        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSize(s)}
              className={`flex-1 py-1 text-xs rounded-lg font-medium transition-all duration-150 border ${
                selectedSize === s
                  ? 'bg-brand-500/20 border-brand-500/60 text-brand-400'
                  : 'border-surface-border text-gray-400 hover:border-surface-elevated'
              }`}
            >
              {s[0]}
            </button>
          ))}
        </div>

        {}
        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
          {CRUSTS.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCrust(c)}
              className={`flex-1 py-1 text-[10px] rounded-lg font-medium transition-all duration-150 border ${
                selectedCrust === c
                  ? 'bg-surface-elevated border-surface-border text-white'
                  : 'border-surface-border text-gray-500 hover:text-gray-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-xl font-display font-bold text-white">₹{finalPrice}</span>
            {SIZE_PRICES[selectedSize] > 0 && (
              <span className="text-xs text-gray-500 ml-1">+₹{SIZE_PRICES[selectedSize]} for {selectedSize}</span>
            )}
          </div>
          <button
            id={`add-to-cart-${pizza._id}`}
            onClick={handleAddToCart}
            disabled={isLoading || !isAuthenticated}
            className="btn-primary py-2 px-4 text-sm disabled:opacity-60"
            title={!isAuthenticated ? 'Login to add to cart' : 'Add to cart'}
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>
    </motion.div>
  );
}
