import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { X, Loader2 } from 'lucide-react';

export default function UseStockModal({ isOpen, onClose, onRefresh, selectedItem }) {
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setQuantity('');
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen || !selectedItem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Endpoint matches the @action url_path in views.py
      await api.post(`/api/my-farm/inventory/items/${selectedItem.id}/log-usage/`, {
        quantity: quantity,
      });

      onRefresh(); // Reload inventory list
      onClose(); // Close modal
    } catch (err) {
      // Catch backend "Insufficient stock" or "Invalid quantity" errors
      const msg = err.response?.data?.error || 'Failed to log usage. Try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[40px] w-full max-w-md p-8 shadow-2xl border border-emerald-100 relative"
        onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside form
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X size={20} className="text-slate-400" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-black text-slate-900 italic uppercase">
            Log <span className="text-emerald-500">Usage</span>
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            {selectedItem.name} — Current: {selectedItem.currentLevel} {selectedItem.unitOfMeasure}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2">
              Quantity to Subtract ({selectedItem.unitOfMeasure})
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full p-5 rounded-2xl bg-slate-50 font-black text-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || !quantity}
            className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-tight hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              'Confirm Consumption'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
