import React, { useMemo, useState } from 'react';
import api from '../api/axios';
import { X } from 'lucide-react';

export default function PaymentModal({ order, onClose, onSuccess }) {
  // SAFE NUMERIC NORMALIZATION
  const subtotal = useMemo(() => {
    return Number(order?.subtotal ?? order?.total_amount ?? order?.total ?? 0);
  }, [order]);

  const paidAmount = useMemo(() => {
    return Number(order?.total_paid ?? order?.paid_amount ?? order?.paid ?? 0);
  }, [order]);

  const currentBalance = useMemo(() => {
    const rawBalance = order?.balance_due ?? order?.balance ?? subtotal - paidAmount;

    const parsed = Number(rawBalance);

    return Number.isNaN(parsed) ? 0 : parsed;
  }, [order, subtotal, paidAmount]);

  // FORM STATE
  const [amount, setAmount] = useState(currentBalance > 0 ? currentBalance.toFixed(2) : '');

  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // PAYMENT SUBMIT
  const pay = async (e) => {
    e.preventDefault();

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('Please enter a valid payment amount');
      return;
    }

    if (numericAmount > currentBalance) {
      setErrorMsg(`Payment cannot exceed outstanding balance of R ${currentBalance.toFixed(2)}`);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await api.post('/api/my-farm/sales/payments/', {
        order: order.id,
        amount: numericAmount,
        method,
        reference,
      });

      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error(err);

      const backendError =
        err.response?.data?.detail || err.response?.data?.error || 'Payment rejection by server';

      setErrorMsg(typeof backendError === 'object' ? JSON.stringify(backendError) : backendError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 italic">
            Process Debt Collection
          </h3>

          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all">
            <X size={16} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={pay} className="p-8 space-y-4">
          {/* ERROR */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-[11px] font-bold uppercase tracking-wide">
              {errorMsg}
            </div>
          )}

          {/* BALANCE CARD */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl text-center">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
              Remaining Outstanding Balance
            </p>

            <h4 className="text-2xl font-black text-orange-400 mt-1">
              R {currentBalance.toFixed(2)}
            </h4>
          </div>

          {/* PAYMENT AMOUNT */}
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
              Payment Amount (R)
            </label>

            <input
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-900 focus:outline-emerald-500"
              type="number"
              step="0.01"
              min="0"
              max={currentBalance}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* PAYMENT METHOD */}
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
              Collection Channel
            </label>

            <select
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-800 focus:outline-emerald-500"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="cash">Cash Payment</option>
              <option value="card">Card Machine</option>
              <option value="eft">EFT / Direct Deposit</option>
              <option value="transfer">Bank Transfer</option>
            </select>
          </div>

          {/* REFERENCE */}
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
              External Transaction Reference
            </label>

            <input
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium text-slate-900 focus:outline-emerald-500"
              placeholder="e.g. Bank slip reference, card transaction ID"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          {/* FOOTER */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? 'RECORDING PAYMENT...' : 'POST RECORDED PAYMENT'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center py-2 hover:text-slate-600 transition-all"
            >
              Cancel Process
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
