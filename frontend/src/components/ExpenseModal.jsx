import React, { useState } from 'react';
import { X, CircleDollarSign } from 'lucide-react';
import api from '../api/axios';

export default function ExpenseModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    amount: '',
    category: 'labor',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submitExpense = async () => {
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/api/my-farm/finance/expenses/', {
        amount: Number(form.amount),
        category: form.category,
        description: form.description,
        date: form.date,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError('Failed to log expense');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100]">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8 text-white relative">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
            <CircleDollarSign size={18} className="text-emerald-400" />
            Log Expense
          </h2>

          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-4 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
            {error}
          </div>
        )}

        {/* AMOUNT */}
        <div className="mb-4">
          <label className="text-[10px] uppercase tracking-widest text-zinc-500">
            Amount (ZAR)
          </label>
          <input
            name="amount"
            type="number"
            value={form.amount}
            onChange={handleChange}
            className="w-full mt-2 bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-black text-xl outline-none focus:border-emerald-500"
            placeholder="0.00"
          />
        </div>

        {/* CATEGORY */}
        <div className="mb-4">
          <label className="text-[10px] uppercase tracking-widest text-zinc-500">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full mt-2 bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none"
          >
            <option value="feed">Feed</option>
            <option value="medicine">Medicine</option>
            <option value="equipment">Equipment</option>
            <option value="labor">Labor</option>
            <option value="utilities">Utilities</option>
            <option value="fuel">Fuel</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* DATE */}
        <div className="mb-4">
          <label className="text-[10px] uppercase tracking-widest text-zinc-500">Date</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="w-full mt-2 bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none"
          />
        </div>

        {/* DESCRIPTION */}
        <div className="mb-6">
          <label className="text-[10px] uppercase tracking-widest text-zinc-500">
            Description (optional)
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="3"
            className="w-full mt-2 bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none"
            placeholder="e.g. Diesel refill for truck..."
          />
        </div>

        {/* ACTION */}
        <button
          onClick={submitExpense}
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest py-4 rounded-2xl transition-all"
        >
          {loading ? 'Saving...' : 'Log Expense'}
        </button>
      </div>
    </div>
  );
}
