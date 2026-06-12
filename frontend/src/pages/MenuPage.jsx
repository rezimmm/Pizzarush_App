import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPizzas, setFilters } from '../store/slices/pizzaSlice';
import { fetchCart } from '../store/slices/cartSlice';
import PizzaCard from '../components/PizzaCard';
import PizzaDetailModal from '../components/PizzaDetailModal';

const CATEGORIES = ['All', 'Veg', 'Non-Veg', 'Premium', 'Combo'];
const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: '-createdAt', label: 'Newest' },
  { value: 'basePrice', label: 'Price: Low → High' },
  { value: '-basePrice', label: 'Price: High → Low' },
];

export default function MenuPage() {
  const dispatch = useDispatch();
  const { pizzas, isLoading, filters, pagination } = useSelector((s) => s.pizza);
  const { isAuthenticated } = useSelector((s) => s.auth);
  const [selectedPizza, setSelectedPizza] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(fetchPizzas({
      category: filters.category || undefined,
      search: filters.search || undefined,
      sortBy: filters.sortBy || 'name',
      page: filters.page || 1,
    }));
  }, [dispatch, filters]);

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchCart());
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setFilters({ search: searchInput }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, dispatch]);

  const handleCategory = (cat) => {
    dispatch(setFilters({ category: cat === 'All' ? '' : cat }));
  };

  const handleSort = (sortBy) => {
    dispatch(setFilters({ sortBy }));
  };

  const activeCategory = filters.category || 'All';

  const skeletons = Array.from({ length: 6 });

  return (
    <div className="min-h-screen bg-surface pt-20">
      {}
      <section className="relative overflow-hidden bg-gradient-to-br from-surface-card via-surface to-surface pb-10 pt-14">
        <div className="absolute inset-0 hero-pattern opacity-50" />
        {}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-brand-400/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm font-medium mb-5">
              🔥 Hot &amp; Fresh Every Day
            </div>
            <h1 className="font-display text-5xl sm:text-6xl font-extrabold text-white leading-tight mb-4">
              Order the <span className="text-gradient">Perfect Pizza</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Handcrafted with love, baked to perfection. Choose from our wide selection of mouth-watering pizzas.
            </p>
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
            className="mt-8 max-w-xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="pizza-search-input"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search pizzas..."
                className="input-field pl-11 pr-10 py-3.5 text-base shadow-card"
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(''); dispatch(setFilters({ search: '' })); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {}
      <div className="sticky top-16 z-30 bg-surface/95 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategory(cat)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-brand-500 text-white shadow-brand'
                    : 'bg-surface-elevated text-gray-400 hover:text-white hover:bg-surface-border'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {}
          <div className="relative flex-shrink-0">
            <button
              id="sort-dropdown-btn"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-elevated border border-surface-border text-sm text-gray-300 hover:text-white hover:border-brand-500/40 transition-all duration-150"
            >
              <SlidersHorizontal size={14} />
              Sort
              <ChevronDown size={12} className={`transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            {showFilters && (
              <div className="absolute right-0 top-full mt-2 w-48 card border border-surface-border py-1 animate-fade-in z-40">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { handleSort(opt.value); setShowFilters(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      filters.sortBy === opt.value
                        ? 'text-brand-400 bg-brand-500/10'
                        : 'text-gray-300 hover:text-white hover:bg-surface-elevated'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
            {showFilters && <div className="fixed inset-0 z-[-1]" onClick={() => setShowFilters(false)} />}
          </div>
        </div>
      </div>

      {}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {skeletons.map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="h-44 bg-surface-elevated" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-surface-elevated rounded w-3/4" />
                  <div className="h-3 bg-surface-elevated rounded w-full" />
                  <div className="h-3 bg-surface-elevated rounded w-2/3" />
                  <div className="h-8 bg-surface-elevated rounded mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : pizzas.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🍕</div>
            <h3 className="font-display text-xl font-bold text-white mb-2">No pizzas found</h3>
            <p className="text-gray-400">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-400 text-sm">
                Showing <span className="text-white font-medium">{pizzas.length}</span> of{' '}
                <span className="text-white font-medium">{pagination.total}</span> pizzas
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {pizzas.map((pizza) => (
                  <PizzaCard key={pizza._id} pizza={pizza} onViewDetails={setSelectedPizza} />
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </main>

      {}
      {selectedPizza && (
        <PizzaDetailModal pizza={selectedPizza} onClose={() => setSelectedPizza(null)} />
      )}
    </div>
  );
}
