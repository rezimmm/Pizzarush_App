import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPizzas, createPizza, updatePizza, deletePizza } from '../../store/slices/pizzaSlice';
import { Plus, Edit2, Trash2, X, Check, Star } from 'lucide-react';
import { motion } from 'framer-motion';

// Must match Pizza model enum values exactly
const CATEGORIES = ['veg', 'non-veg', 'vegan'];
const CATEGORY_LABELS = { 'veg': '🥦 Veg', 'non-veg': '🍗 Non-Veg', 'vegan': '🌱 Vegan' };

const EMPTY_FORM = {
  name: '', description: '', category: 'veg', price: 199,
  tags: '', isFeatured: false, isAvailable: true,
};

export default function AdminPizzasPage() {
  const dispatch = useDispatch();
  const { pizzas, isLoading } = useSelector((s) => s.pizza);
  const [showForm, setShowForm] = useState(false);
  const [editPizza, setEditPizza] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    dispatch(fetchPizzas({ limit: 50 }));
  }, [dispatch]);

  const openCreate = () => {
    setEditPizza(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (pizza) => {
    setEditPizza(pizza);
    setForm({
      name: pizza.name || '',
      description: pizza.description || '',
      category: pizza.category || 'veg',
      price: pizza.price || 199,
      tags: pizza.tags?.join(', ') || '',
      isFeatured: pizza.isFeatured || false,
      isAvailable: pizza.isAvailable !== false,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      isFeatured: form.isFeatured,
      isAvailable: form.isAvailable,
    };
    if (editPizza) {
      await dispatch(updatePizza({ id: editPizza._id, data: payload }));
    } else {
      await dispatch(createPizza(payload));
    }
    setShowForm(false);
    setEditPizza(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this pizza?')) dispatch(deletePizza(id));
  };

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">🍕 Pizza Menu</h1>
          <p className="text-gray-400 mt-1 text-sm">{pizzas.length} pizzas on menu</p>
        </div>
        <button id="add-pizza-btn" onClick={openCreate} className="btn-primary text-sm">
          <Plus size={16} /> Add Pizza
        </button>
      </div>

      {/* Form Panel */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-lg text-white">
              {editPizza ? 'Edit Pizza' : 'New Pizza'}
            </h2>
            <button onClick={() => setShowForm(false)} className="btn-ghost p-1"><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="input-label">Pizza Name</label>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required className="input-field" placeholder="e.g. Margherita Classic" />
            </div>
            <div className="sm:col-span-2">
              <label className="input-label">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                required className="input-field resize-none" rows={2} placeholder="Short description..." />
            </div>
            <div>
              <label className="input-label">Category</label>
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="input-field">
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Price (₹)</label>
              <input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                required className="input-field" min="0" placeholder="199" />
            </div>
            <div className="sm:col-span-2">
              <label className="input-label">Tags (comma-separated)</label>
              <input value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                className="input-field" placeholder="Spicy, Bestseller, New, Cheesy" />
            </div>
            <div className="flex items-center gap-6 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((p) => ({ ...p, isFeatured: e.target.checked }))}
                  className="w-4 h-4 rounded accent-brand-500" />
                <span className="text-sm text-gray-300 flex items-center gap-1"><Star size={13} className="text-yellow-400" /> Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm((p) => ({ ...p, isAvailable: e.target.checked }))}
                  className="w-4 h-4 rounded accent-brand-500" />
                <span className="text-sm text-gray-300">Available</span>
              </label>
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" className="btn-primary text-sm">
                <Check size={15} /> {editPizza ? 'Save Changes' : 'Create Pizza'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {pizzas.map((pizza, idx) => (
            <motion.div key={pizza._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
              className={`card p-4 ${!pizza.isAvailable ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="text-3xl">🍕</div>
                <div className="flex items-center gap-1.5">
                  {pizza.isSpicy && <span className="badge badge-danger gap-1 text-[10px]"><Flame size={8} /> Spicy</span>}
                  {pizza.isBestseller && <span className="badge bg-yellow-500/20 text-yellow-400 gap-1 text-[10px]"><Star size={8} fill="currentColor" /> Best</span>}
                </div>
              </div>
              <h3 className="font-display font-bold text-white">{pizza.name}</h3>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{pizza.description}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="font-bold text-brand-400">₹{pizza.price}</span>
                <span className="badge badge-brand text-[10px]">{pizza.category}</span>
              </div>
              {pizza.toppings?.length > 0 && (
                <p className="text-[11px] text-gray-500 mt-2 truncate">Toppings: {pizza.toppings.join(', ')}</p>
              )}
              <div className="flex items-center gap-2 mt-4">
                <button id={`edit-pizza-${pizza._id}`} onClick={() => openEdit(pizza)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-xs font-medium">
                  <Edit2 size={12} /> Edit
                </button>
                <button id={`delete-pizza-${pizza._id}`} onClick={() => handleDelete(pizza._id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-medium">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </motion.div>
          ))}
          {pizzas.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">🍕</div>
              <p>No pizzas yet. Create your first pizza!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
