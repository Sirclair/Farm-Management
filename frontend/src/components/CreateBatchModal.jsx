import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
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
    image: null,
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(false);
      setError('');
      setLoading(true);

      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== '') {
          data.append(k, v);
        }
      });

      await api.post('/api/my-farm/flock/batches/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  // Shared classes for consistent input styling
  const inputClasses =
    'w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl transform transition-all">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white tracking-wide">Create Batch</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Form Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <input
              name="name"
              type="text"
              value={form.name}
              placeholder="Batch Name"
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          <div>
            <select
              name="flock_type"
              value={form.flock_type}
              onChange={handleChange}
              className={`${inputClasses} appearance-none`}
            >
              <option value="broiler">Broiler</option>
              <option value="layer">Layer</option>
            </select>
          </div>

          <div>
            <input
              name="breed"
              type="text"
              value={form.breed}
              placeholder="Breed (e.g., Cobb 500)"
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          <div>
            <input
              type="number"
              name="quantity_received"
              value={form.quantity_received}
              placeholder="Quantity Received"
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          <div>
            <input
              type="date"
              name="acquisition_date"
              value={form.acquisition_date}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          <div>
            <input
              type="number"
              name="chick_cost"
              value={form.chick_cost}
              placeholder="Cost per Chick"
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          <div>
            <input
              type="number"
              name="selling_price_per_bird"
              value={form.selling_price_per_bird}
              placeholder="Target Price / Bird"
              onChange={handleChange}
              className={inputClasses}
            />
          </div>

          {/* File Upload Styling */}
          <div className="col-span-2">
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-xl cursor-pointer bg-slate-800/30 hover:bg-slate-800/50 transition-all group">
              <div className="flex flex-col items-center justify-center pt-3 pb-3">
                <Upload
                  size={20}
                  className="text-slate-400 group-hover:text-emerald-400 mb-1 transition-colors"
                />
                <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                  {form.image ? form.image.name : 'Click to upload batch image'}
                </p>
              </div>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-slate-950 font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.99] transition-all duration-150 flex justify-center items-center"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            'Create Batch'
          )}
        </button>
      </div>
    </div>
  );
}
