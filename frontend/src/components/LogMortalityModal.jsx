import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Skull, Utensils, ClipboardCheck, ArrowLeft } from 'lucide-react';
import api from '../api/axios';

export default function LogMortalityModal({ isOpen, onClose, onRefresh, onSuccess }) {
  const [view, setView] = useState('hub');
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    batch: '',
    mortality_count: '', // Changed from 0 to empty string for cleaner placeholder UX
    feed_consumed: '', // Changed from 0 to empty string for cleaner placeholder UX
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!isOpen) return;

    const fetchBatches = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/my-farm/flock/batches/');
        const list = res.data.results || res.data || [];
        setBatches(list);

        if (list.length > 0) {
          setFormData((p) => ({ ...p, batch: list[0].id }));
        }
      } catch {
        setError('SYNC FAILURE: batches unavailable');
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();

    return () => {
      setView('hub');
      setError('');
      // CLEAR form on close to avoid carrying numbers across separate views
      setFormData({
        batch: '',
        mortality_count: '',
        feed_consumed: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
      });
    };
  }, [isOpen]);

  const handleQuickSubmit = async (type) => {
    setSubmitting(true);
    setError('');

    try {
      const selectedId = parseInt(formData.batch);
      const activeBatch = batches.find((b) => b.id === selectedId);
      const flockId = activeBatch?.flock?.id || activeBatch?.flock || activeBatch?.id;

      if (!flockId) throw new Error('Invalid batch reference');

      // 1. Core structural components
      const payload = {
        flock: Number(flockId),
        date: formData.date,
        notes: formData.notes?.trim() || '',
      };

      // 2. STABILIZATION: Parse explicit integers/decimals.
      // If a specific module view is hidden, pass 'undefined' so Django's partial update (True)
      // completely ignores it, preserving your existing database data instead of wiping it to 0.
      if (type === 'mortality') {
        payload.mortality =
          formData.mortality_count !== '' ? parseInt(formData.mortality_count, 10) : 0;
      } else if (type === 'feed') {
        payload.feed_used_kg =
          formData.feed_consumed !== '' ? parseFloat(formData.feed_consumed) : 0.0;
      } else if (type === 'full') {
        payload.mortality =
          formData.mortality_count !== '' ? parseInt(formData.mortality_count, 10) : 0;
        payload.feed_used_kg =
          formData.feed_consumed !== '' ? parseFloat(formData.feed_consumed) : 0.0;
      }

      await api.post('/api/my-farm/flock/daily-records/', payload);

      if (typeof onRefresh === 'function') {
        onRefresh();
      } else if (typeof onSuccess === 'function') {
        onSuccess();
      }

      onClose();
    } catch (err) {
      const backendError = err.response?.data
        ? typeof err.response.data === 'object'
          ? JSON.stringify(err.response.data)
          : err.response.data
        : err.message;
      setError('SYNC ERROR: ' + backendError);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md rounded-[40px] bg-[#050505] border border-emerald-500/20 shadow-2xl p-8"
        >
          {/* HEADER */}
          <div className="flex items-center justify-between mb-8">
            {view !== 'hub' ? (
              <button
                onClick={() => setView('hub')}
                className="p-2 rounded-xl hover:bg-white/5 text-zinc-400"
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <div />
            )}

            <h2 className="text-white font-black uppercase tracking-widest text-sm">
              {view === 'hub' ? 'Daily Ops Core' : `${view.toUpperCase()} MODULE`}
            </h2>

            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400">
              <X size={18} />
            </button>
          </div>

          {/* ERROR DISPLAY */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] uppercase font-bold tracking-widest break-words">
              {error}
            </div>
          )}

          {/* NAVIGATION HUB */}
          {view === 'hub' && (
            <div className="space-y-4">
              <button
                onClick={() => setView('mortality')}
                className="w-full p-6 rounded-[28px] border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition flex items-center gap-4"
              >
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <Skull size={22} />
                </div>
                <div className="text-left">
                  <p className="text-white font-black uppercase text-sm">Mortality Log</p>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest">
                    Bird loss registry
                  </p>
                </div>
              </button>

              <button
                onClick={() => setView('feed')}
                className="w-full p-6 rounded-[28px] border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition flex items-center gap-4"
              >
                <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400">
                  <Utensils size={22} />
                </div>
                <div className="text-left">
                  <p className="text-white font-black uppercase text-sm">Feed Log</p>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest">
                    Consumption tracking
                  </p>
                </div>
              </button>

              <button
                onClick={() => setView('full')}
                className="w-full p-6 rounded-[28px] border border-white/10 bg-white/5 hover:bg-white/10 transition flex items-center gap-4"
              >
                <div className="p-3 rounded-2xl bg-white/10 text-white">
                  <ClipboardCheck size={22} />
                </div>
                <div className="text-left">
                  <p className="text-white font-black uppercase text-sm">Full Report</p>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest">
                    Complete record
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* WORKSPACE AREA */}
          {view !== 'hub' && (
            <div className="space-y-6">
              {/* Batch Selection */}
              <div>
                <label className="block text-zinc-500 text-[10px] uppercase tracking-widest mb-2 font-bold pl-2">
                  Target Flock Batch
                </label>
                <select
                  className="w-full p-4 rounded-2xl bg-black border border-white/10 text-white text-sm font-bold"
                  value={formData.batch}
                  onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name ? `${b.name} ` : ''}#{b.batch_number}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mortality Input */}
              {(view === 'mortality' || view === 'full') && (
                <div>
                  <label className="block text-zinc-500 text-[10px] uppercase tracking-widest mb-2 font-bold pl-2">
                    Mortality Count
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.mortality_count}
                    className="w-full p-6 rounded-2xl bg-black border border-red-500/20 text-red-400 font-black text-center text-3xl"
                    onChange={(e) => setFormData({ ...formData, mortality_count: e.target.value })}
                  />
                </div>
              )}

              {/* Feed Input */}
              {(view === 'feed' || view === 'full') && (
                <div>
                  <label className="block text-zinc-500 text-[10px] uppercase tracking-widest mb-2 font-bold pl-2">
                    Feed Dispatched (KG)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={formData.feed_consumed}
                    className="w-full p-6 rounded-2xl bg-black border border-cyan-500/20 text-cyan-400 font-black text-center text-3xl"
                    onChange={(e) => setFormData({ ...formData, feed_consumed: e.target.value })}
                  />
                </div>
              )}

              {/* Action Submit */}
              <button
                disabled={submitting}
                onClick={() => handleQuickSubmit(view)}
                className="w-full py-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest disabled:opacity-50"
              >
                {submitting ? 'SYNCING...' : 'EXECUTE LOG'}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
