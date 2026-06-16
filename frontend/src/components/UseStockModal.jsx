import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { X, Loader2, ArrowRight } from 'lucide-react';

export default function UseStockModal({ isOpen, onClose, onRefresh, selectedItem }) {
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('AUTO');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* RESET */
  useEffect(() => {
    if (!isOpen) {
      setQuantity('');
      setUnit('AUTO');
      setLoading(false);
      setError('');
    }
  }, [isOpen]);

  /* SAFE DEFAULTS */
  const item = selectedItem || {};

  const category = item.category || '';
  const inventoryUnit = item.unit || 'UNIT';
  const conversion = Number(item.conversion || 1);

  /* UNIT OPTIONS */
  const unitOptions = useMemo(() => {
    switch (category) {
      case 'medicine':
        return ['G', 'MG', 'ML'];

      case 'feed':
        return ['KG', 'BAG'];

      case 'sawdust':
        return ['BAG', 'KG'];

      default:
        return [inventoryUnit];
    }
  }, [category, inventoryUnit]);

  /* CONVERSION */
  const baseQuantity = useMemo(() => {
    const q = Number(quantity);

    if (!q) return 0;

    if (unit === 'AUTO') return q;

    if (unit === 'BAG') {
      return q * conversion;
    }

    if (unit === 'G') {
      return q / 1000;
    }

    if (unit === 'MG') {
      return q / 1000000;
    }

    if (unit === 'ML') {
      return q / 1000;
    }

    return q;
  }, [quantity, unit, conversion]);

  const preview = useMemo(() => {
    if (!quantity) return null;

    return {
      input: `${quantity} ${unit === 'AUTO' ? inventoryUnit : unit}`,
      base: `${baseQuantity.toFixed(2)} ${inventoryUnit}`,
    };
  }, [quantity, unit, baseQuantity, inventoryUnit]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      if (!baseQuantity || baseQuantity <= 0) {
        throw new Error('Invalid quantity');
      }

      await api.post(`/api/my-farm/inventory/items/${item.id}/log-usage/`, {
        quantity: baseQuantity,
      });

      onRefresh?.();
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  /* RETURN AFTER HOOKS */
  if (!isOpen || !selectedItem) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-[#0b0f14] border border-white/10 p-6"
      >
        <div className="flex justify-between">
          <div>
            <h2 className="text-white font-black text-2xl">Use Stock</h2>

            <div className="text-zinc-500 text-sm">{item.name}</div>

            <div className="text-zinc-400 text-xs">
              Available: {item.currentLevel} {inventoryUnit}
            </div>
          </div>

          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {error && <div className="mt-4 p-3 rounded-xl bg-red-500/10 text-red-300">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="number"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full p-4 rounded-xl bg-black/40 text-white"
            placeholder="Quantity"
          />

          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full p-4 rounded-xl bg-black/40 text-white"
          >
            <option value="AUTO">Default ({inventoryUnit})</option>

            {unitOptions.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          {preview && (
            <div className="p-3 rounded-xl bg-white/5">
              <div>Input: {preview.input}</div>

              <div className="text-emerald-400 flex gap-2">
                <ArrowRight size={14} />
                {preview.base}
              </div>
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl py-4 bg-emerald-500 text-black font-black"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Confirm Usage'}
          </button>
        </form>
      </div>
    </div>
  );
}
