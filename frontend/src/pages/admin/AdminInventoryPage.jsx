import { useEffect, useState } from 'react';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { Package, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminInventoryPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'Topping', quantity: 0, unit: 'grams', lowStockThreshold: 100 });

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/inventory');
      setItems(res.data.data?.items || []);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  const handleEdit = (item) => {
    setEditId(item._id);
    setEditValues({ quantity: item.quantity, lowStockThreshold: item.lowStockThreshold });
  };

  const handleSave = async (id) => {
    try {
      await api.put(`/inventory/${id}`, editValues);
      toast.success('Updated!');
      setEditId(null);
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this inventory item?')) return;
    try {
      await api.delete(`/inventory/${id}`);
      toast.success('Deleted');
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory', newItem);
      toast.success('Item added!');
      setShowAdd(false);
      setNewItem({ name: '', category: 'Topping', quantity: 0, unit: 'grams', lowStockThreshold: 100 });
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Add failed');
    }
  };

  const CATEGORIES = ['Dough', 'Topping', 'Cheese', 'Sauce', 'Packaging'];

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Package className="text-brand-400" size={24} /> Inventory
          </h1>
          <p className="text-gray-400 mt-1 text-sm">{items.length} items tracked</p>
        </div>
        <button id="add-inventory-btn" onClick={() => setShowAdd(true)} className="btn-primary text-sm">
          <Plus size={16} /> Add Item
        </button>
      </div>

      {}
      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-white">New Inventory Item</h2>
            <button onClick={() => setShowAdd(false)} className="btn-ghost p-1"><X size={16} /></button>
          </div>
          <form onSubmit={handleAddItem} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="input-label">Name</label>
              <input value={newItem.name} onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
                required className="input-field" placeholder="e.g. Mozzarella Cheese" />
            </div>
            <div>
              <label className="input-label">Category</label>
              <select value={newItem.category} onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value }))}
                className="input-field">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Quantity</label>
              <input type="number" value={newItem.quantity} onChange={(e) => setNewItem((p) => ({ ...p, quantity: +e.target.value }))}
                required className="input-field" min="0" />
            </div>
            <div>
              <label className="input-label">Unit</label>
              <select value={newItem.unit} onChange={(e) => setNewItem((p) => ({ ...p, unit: e.target.value }))}
                className="input-field">
                {['grams', 'kilograms', 'liters', 'pieces', 'packets'].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Low Stock Alert</label>
              <input type="number" value={newItem.lowStockThreshold} onChange={(e) => setNewItem((p) => ({ ...p, lowStockThreshold: +e.target.value }))}
                required className="input-field" min="0" />
            </div>
            <div className="sm:col-span-3 flex justify-end">
              <button type="submit" className="btn-primary text-sm">Add Item</button>
            </div>
          </form>
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left bg-surface-elevated/30">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Alert At</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {items.map((item, idx) => {
                  const isLow = item.quantity <= item.lowStockThreshold;
                  const isEditing = editId === item._id;
                  return (
                    <motion.tr key={item._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                      className="hover:bg-surface-elevated/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                      <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{item.category}</td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input type="number" value={editValues.quantity}
                            onChange={(e) => setEditValues((p) => ({ ...p, quantity: +e.target.value }))}
                            className="w-24 px-2 py-1 rounded-lg bg-surface-elevated border border-brand-500 text-white text-sm focus:outline-none"
                            min="0"
                          />
                        ) : (
                          <span className={`font-bold ${isLow ? 'text-red-400' : 'text-white'}`}>
                            {item.quantity} <span className="text-xs font-normal text-gray-400">{item.unit}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
                        {isEditing ? (
                          <input type="number" value={editValues.lowStockThreshold}
                            onChange={(e) => setEditValues((p) => ({ ...p, lowStockThreshold: +e.target.value }))}
                            className="w-24 px-2 py-1 rounded-lg bg-surface-elevated border border-surface-border text-white text-sm focus:outline-none"
                            min="0"
                          />
                        ) : (
                          <span>{item.lowStockThreshold} {item.unit}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isLow
                          ? <span className="badge badge-danger">⚠ Low Stock</span>
                          : <span className="badge badge-success">✓ In Stock</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => handleSave(item._id)}
                              className="w-7 h-7 rounded-lg bg-green-500/15 text-green-400 flex items-center justify-center hover:bg-green-500/30 transition-colors">
                              <Check size={13} />
                            </button>
                            <button onClick={() => setEditId(null)}
                              className="w-7 h-7 rounded-lg bg-surface-elevated text-gray-400 flex items-center justify-center hover:bg-surface-border transition-colors">
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button id={`edit-inv-${item._id}`} onClick={() => handleEdit(item)}
                              className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center hover:bg-blue-500/30 transition-colors">
                              <Edit2 size={13} />
                            </button>
                            <button id={`delete-inv-${item._id}`} onClick={() => handleDelete(item._id)}
                              className="w-7 h-7 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
            {items.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Package size={32} className="mx-auto mb-3 opacity-30" />
                <p>No inventory items. Add some above.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
