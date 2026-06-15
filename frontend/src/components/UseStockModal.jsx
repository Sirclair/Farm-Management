import { useState, useEffect } from 'react';
import api from '../api/axios';
import { X, Loader2 } from 'lucide-react';

export default function UseStockModal({
  isOpen,
  onClose,
  onRefresh,
  selectedItem,
}) {
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      await api.post(
        `/api/my-farm/inventory/items/${selectedItem.id}/log-usage/`,
        { quantity }
      );

      onRefresh();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log usage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="
          w-full max-w-md
          bg-[#0b0f14]
          border border-white/10
          rounded-3xl
          p-6
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between">
          <div>
            <h2 className="text-2xl font-black text-white uppercase">
              Use Stock
            </h2>

            <p className="text-xs text-zinc-500 mt-1">
              {selectedItem.name}
            </p>

            <p className="text-xs text-zinc-600 mt-1">
              Current: {selectedItem.currentLevel} {selectedItem.unitOfMeasure}
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

          <input
            type="number"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Quantity to use"
            className="
              w-full p-4
              bg-black/40
              border border-white/10
              rounded-xl
              text-white font-black
              outline-none
              focus:border-emerald-500/40
            "
            required
          />

          <button
            disabled={loading || !quantity}
            className="
              w-full py-4
              rounded-xl
              bg-emerald-500 text-black
              font-black uppercase
              flex items-center justify-center gap-2
              disabled:opacity-40
            "
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