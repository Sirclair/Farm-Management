import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { X, Loader2, ArrowRight } from 'lucide-react';

export default function UseStockModal({ isOpen, onClose, onRefresh, selectedItem }) {
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('AUTO');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ---------------------------
     RESET STATE
  --------------------------- */
  useEffect(() => {
    if (!isOpen) {
      setQuantity('');
      setUnit('AUTO');
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen || !selectedItem) return null;

  /* ---------------------------
     UNIT OPTIONS BASED ON ITEM
  --------------------------- */
  const unitOptions = useMemo(() => {
    const base = selectedItem.unit?.toUpperCase();

    switch (selectedItem.category) {
      case 'medicine':
        return ['G', 'MG', 'ML'];
      case 'feed':
        return ['KG', 'BAG'];
      case 'sawdust':
        return ['BAG', 'KG'];
      default:
        return [base || 'UNIT'];
    }
  }, [selectedItem]);

  /* ---------------------------
     CONVERSION LOGIC
  --------------------------- */
  const conversion = Number(selectedItem.conversion || 1);

  const baseQuantity = useMemo(() => {
    const q = Number(quantity || 0);
    if (!q) return 0;

    // AUTO = use item's default unit
    if (unit === 'AUTO') return q * conversion;

    // MANUAL conversions
    if (unit === 'BAG') return q * conversion;
    if (unit === 'G') return q / 1000;
    if (unit === 'MG') return q / 1000000;
    if (unit === 'ML') return q / 1000;

    return q;
  }, [quantity, unit, conversion]);

  const preview = useMemo(() => {
    if (!quantity) return null;

    return {
      input: `${quantity} ${unit === 'AUTO' ? selectedItem.unit : unit}`,
      base: `${baseQuantity.toFixed(4)} KG (system)`,
    };
  }, [quantity, unit, baseQuantity, selectedItem]);

  /* ---------------------------
     SUBMIT
  --------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const q = Number(quantity);

      if (!q || q <= 0) {
        setError('Enter a valid quantity');
        setLoading(false);
        return;
      }

      await api.post(`/api/my-farm/inventory/items/${selectedItem.id}/log-usage/`, {
        quantity: baseQuantity, // ALWAYS BASE UNIT
      });

      onRefresh();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log usage');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------
     UI
  --------------------------- */
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0b0f14] border border-white/10 rounded-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between">
          <div>
            <h2 className="text-2xl font-black text-white uppercase">Use Stock</h2>

            <p className="text-xs text-zinc-500 mt-1">{selectedItem.name}</p>

            <p className="text-xs text-zinc-600 mt-1">
              Available: {selectedItem.currentLevel} {selectedItem.unit}
            </p>
          </div>

          <button onClick={onClose}>
            <X className="text-zinc-400" />
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* QUANTITY */}
          <input
            type="number"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Enter quantity"
            className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white font-black outline-none"
            required
          />

          {/* UNIT SELECTOR */}
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white font-bold"
          >
            <option value="AUTO">Auto ({selectedItem.unit})</option>
            {unitOptions.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          {/* LIVE CONVERSION PREVIEW */}
          {preview && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300 space-y-2">
              <div>
                Input: <span className="text-white font-bold">{preview.input}</span>
              </div>

              <div className="flex items-center gap-2 text-emerald-400">
                <ArrowRight size={14} />
                <span>{preview.base}</span>
              </div>
            </div>
          )}

          {/* SUBMIT */}
          <button
            disabled={loading || !quantity}
            className="w-full py-4 rounded-xl bg-emerald-500 text-black font-black uppercase flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Processing
              </>
            ) : (
              'Confirm Usage'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
