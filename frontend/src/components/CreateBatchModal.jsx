import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import api from '../api/axios';

export default function CreateBatchModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    flock_type: 'broiler',
    breed: '',
    quantity_received: '',
    acquisition_date: new Date().toISOString().split('T')[0],
    chick_cost: '',
    selling_price_per_bird: '',
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...form,
        quantity_received: Number(form.quantity_received),
        chick_cost: Number(form.chick_cost || 0),
        selling_price_per_bird: Number(form.selling_price_per_bird || 0),
      };

      await api.post('/api/my-farm/flock/batches/', payload);

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md">
      {/* BACKDROP CLICK CLOSE */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-[#0F172A] border border-white/10 rounded-3xl p-6 z-10">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white font-black uppercase tracking-widest">Create Batch</h2>

          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X />
          </button>
        </div>

        {/* ERROR */}
        {error && <div className="mb-4 text-red-400 text-xs font-bold uppercase">{error}</div>}

        {/* FORM */}
        <div className="grid grid-cols-2 gap-4">
          <input
            name="name"
            placeholder="Batch Name"
            value={form.name}
            onChange={handleChange}
            className="col-span-2 p-3 bg-black border border-white/10 rounded-xl text-white"
          />

          <select
            name="flock_type"
            value={form.flock_type}
            onChange={handleChange}
            className="p-3 bg-black border border-white/10 rounded-xl text-white"
          >
            <option value="broiler">Broiler</option>
            <option value="layer">Layer</option>
          </select>

          <input
            name="breed"
            placeholder="Breed"
            value={form.breed}
            onChange={handleChange}
            className="p-3 bg-black border border-white/10 rounded-xl text-white"
          />

          <input
            name="quantity_received"
            type="number"
            placeholder="Quantity Received"
            value={form.quantity_received}
            onChange={handleChange}
            className="col-span-2 p-3 bg-black border border-white/10 rounded-xl text-white"
          />

          <input
            name="chick_cost"
            type="number"
            placeholder="Chick Cost"
            value={form.chick_cost}
            onChange={handleChange}
            className="p-3 bg-black border border-white/10 rounded-xl text-white"
          />

          <input
            name="selling_price_per_bird"
            type="number"
            placeholder="Selling Price"
            value={form.selling_price_per_bird}
            onChange={handleChange}
            className="p-3 bg-black border border-white/10 rounded-xl text-white"
          />

          <input
            name="acquisition_date"
            type="date"
            value={form.acquisition_date}
            onChange={handleChange}
            className="col-span-2 p-3 bg-black border border-white/10 rounded-xl text-white"
          />
        </div>

        {/* ACTIONS */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          {loading ? 'CREATING...' : 'CREATE BATCH'}
        </button>
      </div>
    </div>
  );
}
