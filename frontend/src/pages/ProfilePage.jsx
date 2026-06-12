import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { updateProfile } from '../store/slices/authSlice';
import { User as UserIcon, Phone, MapPin, Plus, Trash2, CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((s) => s.auth);

  // Profile Form
  const { register, handleSubmit, reset } = useForm();
  
  // Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  
  const addressForm = useForm();

  useEffect(() => {
    if (user) {
      reset({ name: user.name, phone: user.phone || '' });
    }
  }, [user, reset]);

  const onProfileSubmit = async (data) => {
    // Retain existing addresses when updating personal info
    await dispatch(updateProfile({ ...data, addresses: user.addresses }));
  };

  const onAddressSubmit = async (data) => {
    let newAddresses = [...(user.addresses || [])];
    
    // If setting as default, clear others
    if (data.isDefault) {
      newAddresses = newAddresses.map(a => ({ ...a, isDefault: false }));
    }

    if (editingIndex !== null) {
      newAddresses[editingIndex] = data;
    } else {
      newAddresses.push(data);
    }

    await dispatch(updateProfile({ name: user.name, phone: user.phone, addresses: newAddresses }));
    setShowAddressForm(false);
    addressForm.reset();
  };

  const removeAddress = async (index) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    const newAddresses = user.addresses.filter((_, i) => i !== index);
    await dispatch(updateProfile({ name: user.name, phone: user.phone, addresses: newAddresses }));
  };

  const setAsDefault = async (index) => {
    const newAddresses = user.addresses.map((a, i) => ({
      ...a,
      isDefault: i === index,
    }));
    await dispatch(updateProfile({ name: user.name, phone: user.phone, addresses: newAddresses }));
  };

  const openEditAddress = (addr, index) => {
    addressForm.reset(addr);
    setEditingIndex(index);
    setShowAddressForm(true);
  };

  const openNewAddress = () => {
    addressForm.reset({ label: 'Home', street: '', city: '', state: '', pincode: '', isDefault: false });
    setEditingIndex(null);
    setShowAddressForm(true);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-surface pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-400 flex items-center justify-center text-white text-2xl font-bold shadow-brand">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-white">My Profile</h1>
            <p className="text-gray-400">{user.email}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column: Personal Info */}
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="font-display text-xl font-bold text-white mb-6 flex items-center gap-2">
                <UserIcon className="text-brand-400" size={20} /> Personal Information
              </h2>
              <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
                <div>
                  <label className="input-label">Full Name</label>
                  <input
                    {...register('name', { required: true })}
                    className="input-field"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="input-label">Email Address</label>
                  <input
                    value={user.email}
                    disabled
                    className="input-field opacity-60 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed.</p>
                </div>
                <div>
                  <label className="input-label">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      {...register('phone')}
                      className="input-field pl-10"
                      placeholder="e.g. +91 9876543210"
                    />
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5 mt-2">
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Address Book */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                <MapPin className="text-brand-400" size={20} /> Saved Addresses
              </h2>
              {!showAddressForm && (
                <button onClick={openNewAddress} className="btn-ghost text-sm px-3 py-1.5 flex items-center gap-1 text-brand-400">
                  <Plus size={16} /> Add New
                </button>
              )}
            </div>

            {showAddressForm ? (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card p-5 border border-brand-500/30">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-display font-bold text-white">{editingIndex !== null ? 'Edit Address' : 'New Address'}</h3>
                  <button onClick={() => setShowAddressForm(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
                </div>
                <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="input-label">Label (Home, Work, etc.)</label>
                      <input {...addressForm.register('label', { required: true })} className="input-field" placeholder="Home" />
                    </div>
                    <div className="col-span-2">
                      <label className="input-label">Street Address</label>
                      <input {...addressForm.register('street', { required: true })} className="input-field" placeholder="123 Main St, Apt 4" />
                    </div>
                    <div>
                      <label className="input-label">City</label>
                      <input {...addressForm.register('city', { required: true })} className="input-field" placeholder="Mumbai" />
                    </div>
                    <div>
                      <label className="input-label">State</label>
                      <input {...addressForm.register('state', { required: true })} className="input-field" placeholder="MH" />
                    </div>
                    <div className="col-span-2">
                      <label className="input-label">Pincode</label>
                      <input {...addressForm.register('pincode', { required: true })} className="input-field" placeholder="400001" />
                    </div>
                    <div className="col-span-2 flex items-center gap-2 mt-2">
                      <input type="checkbox" id="isDefault" {...addressForm.register('isDefault')} className="w-4 h-4 rounded border-surface-border bg-surface-elevated text-brand-500 focus:ring-brand-500/20" />
                      <label htmlFor="isDefault" className="text-sm text-gray-300 cursor-pointer">Set as default address</label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-surface-border">
                    <button type="button" onClick={() => setShowAddressForm(false)} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
                    <button type="submit" disabled={isLoading} className="btn-primary px-4 py-2 text-sm">Save Address</button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {(!user.addresses || user.addresses.length === 0) ? (
                    <div className="card p-8 text-center text-gray-400">
                      <MapPin size={32} className="mx-auto mb-3 opacity-20" />
                      <p>No addresses saved yet.</p>
                      <p className="text-sm mt-1">Save an address for faster checkout.</p>
                    </div>
                  ) : (
                    user.addresses.map((addr, idx) => (
                      <motion.div key={idx} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                        className={`card p-4 border transition-colors ${addr.isDefault ? 'border-brand-500/50 bg-brand-500/5' : 'border-surface-border'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white flex items-center gap-2">
                              {addr.label}
                              {addr.isDefault && <span className="text-[10px] uppercase bg-brand-500 text-white px-1.5 py-0.5 rounded font-bold">Default</span>}
                            </h4>
                          </div>
                          <div className="flex gap-2">
                            {!addr.isDefault && (
                              <button onClick={() => setAsDefault(idx)} className="text-xs text-gray-400 hover:text-brand-400 flex items-center gap-1" title="Set as default">
                                <CheckCircle2 size={14} />
                              </button>
                            )}
                            <button onClick={() => openEditAddress(addr, idx)} className="text-xs text-gray-400 hover:text-white">Edit</button>
                            <button onClick={() => removeAddress(idx)} className="text-xs text-red-400/70 hover:text-red-400"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-300">{addr.street}</p>
                        <p className="text-sm text-gray-400">{addr.city}, {addr.state} {addr.pincode}</p>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
