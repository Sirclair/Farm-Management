import { useEffect, useMemo, useState } from 'react';
import { X, ShieldAlert, Minus, Plus, Bird, AlertTriangle, Clock3, User2 } from 'lucide-react';

import api from '../api/axios';

export default function AdjustStockModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [batches, setBatches] = useState([]);
  const [adjustments, setAdjustments] = useState([]);

  const [selectedFlockId, setSelectedFlockId] = useState('');

  const [form, setForm] = useState({
    adjustment_type: 'remove',
    reason: 'buyer_change',
    quantity: '',
    note: '',
  });

  const [error, setError] = useState('');

  // =====================================================
  // FETCH BATCHES
  // =====================================================
  useEffect(() => {
    if (!isOpen) return;

    const fetchBatches = async () => {
      try {
        setLoadingBatches(true);

        const res = await api.get('/api/my-farm/flock/batches/');

        const list = res.data.results || res.data || [];

        setBatches(list);

        if (list.length > 0) {
          setSelectedFlockId(String(list[0].id));
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load flock batches');
      } finally {
        setLoadingBatches(false);
      }
    };

    fetchBatches();

    return () => {
      setError('');

      setForm({
        adjustment_type: 'remove',
        reason: 'buyer_change',
        quantity: '',
        note: '',
      });

      setAdjustments([]);
    };
  }, [isOpen]);

  // =====================================================
  // FETCH ADJUSTMENT HISTORY
  // =====================================================
  useEffect(() => {
    if (!selectedFlockId) return;

    const fetchHistory = async () => {
      try {
        setLoadingHistory(true);

        const res = await api.get(`/api/my-farm/flock/stock-adjustments/?flock=${selectedFlockId}`);

        setAdjustments(res.data.results || res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [selectedFlockId]);

  if (!isOpen) return null;

  // =====================================================
  // SELECTED FLOCK
  // =====================================================
  const selectedFlock = batches.find((f) => String(f.id) === String(selectedFlockId));

  const currentStock = Number(selectedFlock?.current_stock || 0);

  const receivedQty = Number(selectedFlock?.quantity_received || 0);

  const maxAllowedAdd = Math.max(receivedQty - currentStock, 0);

  // =====================================================
  // HANDLE INPUT
  // =====================================================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // =====================================================
  // SUBMIT
  // =====================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    if (!selectedFlock) {
      setError('Please select a batch');
      return;
    }

    const qty = Number(form.quantity);

    // =========================
    // VALIDATION
    // =========================

    if (!qty || qty <= 0) {
      setError('Enter a valid quantity');
      return;
    }

    // Prevent negative stock
    if (form.adjustment_type === 'remove' && qty > currentStock) {
      setError('Cannot remove more birds than available stock');
      return;
    }

    // Prevent fake stock inflation
    if (form.adjustment_type === 'add' && qty > maxAllowedAdd) {
      setError(
        `Cannot add more than ${maxAllowedAdd} birds. Stock cannot exceed originally received quantity (${receivedQty}).`
      );
      return;
    }

    try {
      setLoading(true);

      await api.post('/api/my-farm/flock/stock-adjustments/', {
        flock: selectedFlock.id,
        adjustment_type: form.adjustment_type,
        reason: form.reason,
        quantity: qty,
        note: form.note,
      });

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err) {
      console.error(err);

      setError(err?.response?.data?.error || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // HELPERS
  // =====================================================
  const reasonLabel = (reason) => {
    const map = {
      buyer_change: 'Buyer Quantity Changed',
      count_correction: 'Count Correction',
      death_transport: 'Transport Death',
      theft: 'Theft / Loss',
      donation: 'Donation',
      other: 'Other',
    };

    return map[reason] || reason;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div
        className="
          w-full
          max-w-2xl
          bg-[#0a0a0a]
          border
          border-white/10
          rounded-[28px]
          shadow-2xl
          overflow-hidden
          flex
          flex-col
          max-h-[95vh]
        "
      >
        {/* ===================================================== */}
        {/* HEADER */}
        {/* ===================================================== */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-5 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <ShieldAlert size={22} className="text-orange-400" />
            </div>

            <div>
              <h2 className="text-white text-lg sm:text-2xl font-black uppercase tracking-tight">
                Adjust Stock
              </h2>

              <p className="text-zinc-500 text-[10px] sm:text-[11px] uppercase tracking-widest">
                Secure Bird Inventory Correction
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center"
          >
            <X size={18} className="text-zinc-400" />
          </button>
        </div>

        {/* ===================================================== */}
        {/* SCROLL AREA */}
        {/* ===================================================== */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-6">
            {/* ===================================================== */}
            {/* BATCH SELECT */}
            {/* ===================================================== */}
            <div>
              <label className="block text-[11px] text-zinc-400 uppercase tracking-widest mb-3 font-bold">
                Select Batch
              </label>

              <select
                value={selectedFlockId}
                onChange={(e) => setSelectedFlockId(e.target.value)}
                className="
                  w-full
                  bg-[#111]
                  border border-white/10
                  rounded-2xl
                  px-5 py-4
                  text-white
                  outline-none
                  focus:border-emerald-500/30
                "
              >
                {loadingBatches ? (
                  <option>Loading batches...</option>
                ) : (
                  batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} #{b.batch_number} ({b.current_stock} birds)
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* ===================================================== */}
            {/* STOCK CARD */}
            {/* ===================================================== */}
            {selectedFlock && (
              <div className="rounded-3xl border border-emerald-500/10 bg-emerald-500/5 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-2">
                      Current Available Birds
                    </p>

                    <h3 className="text-4xl font-black text-white">{currentStock}</h3>

                    <p className="text-zinc-500 text-sm mt-2">
                      {selectedFlock.name} #{selectedFlock.batch_number}
                    </p>
                  </div>

                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <Bird size={30} className="text-emerald-400" />
                  </div>
                </div>

                {/* SECURITY */}
                <div className="mt-5 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={14} className="text-orange-400" />

                    <p className="text-[10px] uppercase tracking-widest text-orange-400 font-black">
                      Inventory Security Control
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Initial Received</span>

                      <span className="text-white font-bold">{receivedQty}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-zinc-400">Maximum Recoverable</span>

                      <span className="text-orange-400 font-bold">{maxAllowedAdd}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================== */}
            {/* TYPE */}
            {/* ===================================================== */}
            <div>
              <label className="block text-[11px] text-zinc-400 uppercase tracking-widest mb-3 font-bold">
                Adjustment Type
              </label>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      adjustment_type: 'remove',
                    })
                  }
                  className={`
                    rounded-2xl
                    p-5
                    border
                    transition-all
                    flex
                    flex-col
                    items-center
                    justify-center
                    gap-3
                    ${
                      form.adjustment_type === 'remove'
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : 'bg-white/5 border-white/5 text-zinc-500'
                    }
                  `}
                >
                  <Minus size={24} />

                  <span className="text-[11px] font-black uppercase tracking-widest">Remove</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      adjustment_type: 'add',
                    })
                  }
                  className={`
                    rounded-2xl
                    p-5
                    border
                    transition-all
                    flex
                    flex-col
                    items-center
                    justify-center
                    gap-3
                    ${
                      form.adjustment_type === 'add'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-white/5 border-white/5 text-zinc-500'
                    }
                  `}
                >
                  <Plus size={24} />

                  <span className="text-[11px] font-black uppercase tracking-widest">Add</span>
                </button>
              </div>
            </div>

            {/* ===================================================== */}
            {/* REASON */}
            {/* ===================================================== */}
            <div>
              <label className="block text-[11px] text-zinc-400 uppercase tracking-widest mb-3 font-bold">
                Reason
              </label>

              <select
                name="reason"
                value={form.reason}
                onChange={handleChange}
                className="
                  w-full
                  bg-[#111]
                  border border-white/10
                  rounded-2xl
                  px-5 py-4
                  text-white
                  outline-none
                  focus:border-emerald-500/30
                "
              >
                <option value="buyer_change">Buyer Quantity Changed</option>

                <option value="count_correction">Count Correction</option>

                <option value="death_transport">Transport Death</option>

                <option value="theft">Theft / Loss</option>

                <option value="donation">Donation</option>

                <option value="other">Other</option>
              </select>
            </div>

            {/* ===================================================== */}
            {/* QUANTITY */}
            {/* ===================================================== */}
            <div>
              <label className="block text-[11px] text-zinc-400 uppercase tracking-widest mb-3 font-bold">
                Quantity
              </label>

              <input
                type="number"
                min="1"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                placeholder="Enter quantity"
                className="
                  w-full
                  bg-[#111]
                  border border-white/10
                  rounded-2xl
                  px-5 py-4
                  text-white
                  placeholder:text-zinc-600
                  outline-none
                  focus:border-emerald-500/30
                "
              />
            </div>

            {/* ===================================================== */}
            {/* NOTE */}
            {/* ===================================================== */}
            <div>
              <label className="block text-[11px] text-zinc-400 uppercase tracking-widest mb-3 font-bold">
                Operational Note
              </label>

              <textarea
                rows={4}
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder="Mandatory explanation recommended..."
                className="
                  w-full
                  bg-[#111]
                  border border-white/10
                  rounded-2xl
                  px-5 py-4
                  text-white
                  placeholder:text-zinc-600
                  outline-none
                  focus:border-emerald-500/30
                  resize-none
                "
              />
            </div>

            {/* ===================================================== */}
            {/* HISTORY */}
            {/* ===================================================== */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock3 size={16} className="text-zinc-400" />

                <h3 className="text-white text-sm font-black uppercase tracking-widest">
                  Adjustment History
                </h3>
              </div>

              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {loadingHistory ? (
                  <div className="text-zinc-500 text-sm">Loading history...</div>
                ) : adjustments.length === 0 ? (
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-5 text-zinc-500 text-sm">
                    No adjustment history found
                  </div>
                ) : (
                  adjustments.map((item) => (
                    <div
                      key={item.id}
                      className="
                        rounded-2xl
                        border
                        border-white/5
                        bg-white/[0.03]
                        p-4
                      "
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`
                                text-xs
                                font-black
                                uppercase
                                tracking-widest
                                ${
                                  item.adjustment_type === 'add'
                                    ? 'text-emerald-400'
                                    : 'text-red-400'
                                }
                              `}
                            >
                              {item.adjustment_type === 'add' ? '+' : '-'}
                              {item.quantity} birds
                            </span>

                            {item.approved ? (
                              <span className="text-[10px] uppercase text-emerald-400 font-black">
                                Approved
                              </span>
                            ) : (
                              <span className="text-[10px] uppercase text-orange-400 font-black">
                                Pending
                              </span>
                            )}
                          </div>

                          <p className="text-white text-sm font-semibold">
                            {reasonLabel(item.reason)}
                          </p>

                          {item.note && <p className="text-zinc-500 text-xs mt-2">{item.note}</p>}
                        </div>

                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1 text-zinc-500 text-xs mb-1">
                            <User2 size={12} />

                            <span>{item.created_by_name || 'Unknown'}</span>
                          </div>

                          <p className="text-zinc-600 text-[11px]">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ===================================================== */}
            {/* ERROR */}
            {/* ===================================================== */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 text-red-400 text-sm font-semibold">
                {error}
              </div>
            )}

            {/* ===================================================== */}
            {/* ACTIONS */}
            {/* ===================================================== */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="
                  flex-1
                  py-4
                  rounded-2xl
                  bg-white/5
                  border border-white/10
                  text-zinc-400
                  font-black
                  uppercase
                  tracking-widest
                  text-[11px]
                  hover:bg-white/10
                  transition-all
                "
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="
                  flex-1
                  py-4
                  rounded-2xl
                  bg-emerald-500
                  hover:bg-emerald-400
                  text-black
                  font-black
                  uppercase
                  tracking-widest
                  text-[11px]
                  transition-all
                  disabled:opacity-50
                "
              >
                {loading ? 'Processing...' : 'Confirm Adjustment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
