import React, { useState } from 'react';
import api from '../api/axios';

export default function BuyModal({ batch, isOpen, onClose, onRefresh }) {
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePurchase = async () => {
    setLoading(true);
    setErrorMsg('');

    // Fallback static price calculation or dynamic calculation based on system batch price configuration
    const batchUnitPrice = batch.price || 100.0;

    const payload = {
      customer_name: 'Instant Batch Purchaser',
      items: [
        {
          product_id: Number(batch.product_id || batch.id), // Link back to original parent stock setup
          batch_id: Number(batch.id),
          quantity: Number(qty),
          price_per_unit: Number(batchUnitPrice),
        },
      ],
      payments: [
        {
          amount: Number(qty * batchUnitPrice),
          method: 'cash',
          reference: `Batch Order: ${batch.name}`,
        },
      ],
    };

    try {
      await api.post('api/my-farm/sales/orders/', payload);
      onRefresh();
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Purchase failed processing options';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const unitPrice = batch.price || 100.0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl border border-slate-100">
        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">
          Secure Live Stock Checkout
        </p>
        <h3 className="text-2xl font-black text-slate-900 mb-6 italic uppercase tracking-tight">
          Buy {batch.name}
        </h3>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-[11px] font-bold uppercase tracking-wide mb-4">
            {errorMsg}
          </div>
        )}

        <div className="bg-slate-50 p-6 rounded-2xl mb-6 border border-slate-100">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-3 tracking-wider">
            Quantity to Purchase
          </label>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="w-12 h-12 bg-white border border-slate-200 rounded-xl font-bold text-lg text-slate-700 shadow-sm active:scale-95 transition-all"
            >
              -
            </button>
            <span className="text-2xl font-black text-slate-900">{qty}</span>
            <button
              type="button"
              onClick={() => setQty(Math.min(batch.current_stock, qty + 1))}
              className="w-12 h-12 bg-white border border-slate-200 rounded-xl font-bold text-lg text-slate-700 shadow-sm active:scale-95 transition-all"
            >
              +
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 text-center font-black uppercase tracking-widest">
            Available In Flock: {batch.current_stock}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handlePurchase}
            disabled={loading || batch.current_stock === 0}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl disabled:opacity-40"
          >
            {loading ? 'PROCESSING...' : `CONFIRM PURCHASE (R ${(qty * unitPrice).toFixed(2)})`}
          </button>
          <button
            onClick={onClose}
            className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 hover:text-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
