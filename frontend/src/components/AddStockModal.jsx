import React, { useState } from 'react';
import api from '../api/axios';

import { X, Loader2, AlertCircle, CheckCircle2, Package2, Info, ArrowRight } from 'lucide-react';

const UNITS = ['KG', 'G', 'MG', 'L', 'ML', 'BAG', 'BOTTLE', 'BOX', 'UNIT'];

const CATEGORIES = [
  'feed',
  'medicine',
  'sawdust',
  'cleaning',
  'equipment',
  'packaging',
  'fuel',
  'chemicals',
  'water',
  'other',
];

export default function AddStockModal({ isOpen, onClose, onSuccess }) {
  const initial = {
    name: '',
    category: 'feed',

    quantity: '',
    costPerUnit: '',

    inventoryUnit: 'KG',
    purchaseUnit: 'BAG',

    conversionFactor: 1,

    minStockLevel: 10,

    notes: '',
  };

  const [formData, setFormData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const update = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setError('');
  };

  const quantity = Number(formData.quantity || 0);
  const factor = Number(formData.conversionFactor || 1);
  const preview = quantity * factor;

  const submit = async () => {
    if (!formData.name || !formData.quantity || !formData.costPerUnit) {
      return setError('Complete required fields');
    }

    try {
      setLoading(true);
      setError('');

      const unitPrice = Number(formData.costPerUnit);
      const totalCalculatedCost = quantity * unitPrice;

      // 1. Record stock item inside inventory architecture
      await api.post('/api/my-farm/inventory/items/purchase/', {
        name: formData.name,
        category: formData.category,
        quantity: quantity,
        unit_price: unitPrice,
        inventory_unit: formData.inventoryUnit,
        purchase_unit: formData.purchaseUnit,
        conversion_factor: factor,
        min_stock_level: Number(formData.minStockLevel),
        notes: formData.notes,
      });

      // 2. SUCCESS AUTOMATION HOOK: Record this purchase directly to your Expenses endpoint
      if (totalCalculatedCost > 0) {
        // Fallback array representing valid choices on the backend Expense model
        const validExpenseCategories = [
          'feed',
          'medicine',
          'equipment',
          'labor',
          'utilities',
          'fuel',
          'other',
        ];
        const expenseCategory = validExpenseCategories.includes(formData.category)
          ? formData.category
          : 'other';

        await api.post('/api/my-farm/finance/expenses/', {
          amount: totalCalculatedCost,
          category: expenseCategory,
          description: `Inventory Purchase: ${formData.name.toUpperCase()} (${quantity} ${formData.purchaseUnit})`,
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        });
      }

      setSuccess('Stock recorded & logged as expense');
      onSuccess?.();

      setTimeout(() => {
        setFormData(initial);
        setSuccess('');
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-3xl rounded-2xl bg-[#090d12] border border-zinc-800/80 shadow-2xl flex flex-col max-h-[90vh] my-auto overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-zinc-800/60 flex items-center justify-between bg-zinc-900/10">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Package2 size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Add Inventory</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Record stock purchase and unit conversion
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg bg-zinc-900/40 hover:bg-zinc-800 border border-zinc-800/50 transition-all"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* SCROLLABLE FORM BODY */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 flex items-start gap-3 text-sm animate-in fade-in zoom-in-95 duration-150">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-400 flex items-start gap-3 text-sm animate-in fade-in zoom-in-95 duration-150">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* ROW 1: Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                Item Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Premium Layer Feed"
                value={formData.name}
                onChange={(e) => update('name', e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800/80 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                Category
              </label>
              <div className="relative">
                <select
                  value={formData.category}
                  onChange={(e) => update('category', e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800/80 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all appearance-none capitalize cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#090d12] text-white capitalize">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ROW 2: Quantity & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                Quantity Purchased *
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={formData.quantity}
                onChange={(e) => update('quantity', e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800/80 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                Purchase Price per Unit *
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={formData.costPerUnit}
                onChange={(e) => update('costPerUnit', e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800/80 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all shadow-inner"
              />
            </div>
          </div>

          {/* ROW 3: Units & Conversion */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-900/20 p-4 rounded-xl border border-zinc-800/40">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                Purchase Unit
              </label>
              <select
                value={formData.purchaseUnit}
                onChange={(e) => update('purchaseUnit', e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800/80 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all cursor-pointer"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u} className="bg-[#090d12]">
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                Stock Tracking Unit
              </label>
              <select
                value={formData.inventoryUnit}
                onChange={(e) => update('inventoryUnit', e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800/80 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all cursor-pointer"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u} className="bg-[#090d12]">
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                Conversion Factor
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="1"
                value={formData.conversionFactor}
                onChange={(e) => update('conversionFactor', e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800/80 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all shadow-inner"
              />
            </div>
          </div>

          {/* ROW 4: Minimum Stock Alert */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
              Minimum Stock Alert Level
            </label>
            <input
              type="number"
              placeholder="10"
              value={formData.minStockLevel}
              onChange={(e) => update('minStockLevel', e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800/80 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all shadow-inner"
            />
          </div>

          {/* ROW 5: Notes */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
              Additional Notes
            </label>
            <textarea
              rows={3}
              placeholder="Optional details regarding vendor, batch numbers or receipt numbers..."
              value={formData.notes}
              onChange={(e) => update('notes', e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800/80 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all shadow-inner resize-none"
            />
          </div>

          {/* LIVE PREVIEW WIDGET */}
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-emerald-400/80 font-medium uppercase tracking-wider">
              <Info size={15} />
              Stock Intake Calculation
            </div>

            <div className="flex items-center gap-2.5 font-semibold text-zinc-200 text-sm sm:text-base">
              <span className="bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800/50">
                {quantity}{' '}
                <span className="text-xs font-normal text-zinc-500 ml-0.5">
                  {formData.purchaseUnit}
                </span>
              </span>
              <ArrowRight size={16} className="text-zinc-500" />
              <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                {preview}{' '}
                <span className="text-xs font-normal text-emerald-400/70 ml-0.5">
                  {formData.inventoryUnit}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-zinc-800/60 bg-zinc-900/10 flex items-center justify-end">
          <button
            disabled={loading}
            onClick={submit}
            className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-zinc-950 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wide shadow-md shadow-emerald-500/5"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              'Record Inventory & Expense'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
