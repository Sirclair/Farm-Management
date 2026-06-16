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

      await api.post('/api/my-farm/inventory/items/purchase/', {
        name: formData.name,

        category: formData.category,

        quantity: quantity,

        unit_price: Number(formData.costPerUnit),

        inventory_unit: formData.inventoryUnit,

        purchase_unit: formData.purchaseUnit,

        conversion_factor: factor,

        min_stock_level: Number(formData.minStockLevel),

        notes: formData.notes,
      });

      setSuccess('Stock recorded');

      onSuccess?.();

      setTimeout(() => {
        setFormData(initial);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-4xl rounded-3xl bg-[#090d12] border border-white/10">
          {/* HEADER */}

          <div className="p-7 border-b border-white/10 flex justify-between">
            <div className="flex gap-4">
              <Package2 className="text-emerald-400" />

              <div>
                <h2 className="text-3xl font-black text-white">Add Inventory</h2>

                <p className="text-zinc-500">Record stock purchase and conversion</p>
              </div>
            </div>

            <button onClick={onClose}>
              <X />
            </button>
          </div>

          <div className="p-7 space-y-6">
            {error && (
              <div className="bg-red-500/10 p-4 rounded-xl text-red-400 flex gap-2">
                <AlertCircle />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 p-4 rounded-xl text-emerald-400 flex gap-2">
                <CheckCircle2 />
                {success}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-5">
              <input
                placeholder="Item Name"
                value={formData.name}
                onChange={(e) => update('name', e.target.value)}
                className="p-4 rounded-xl bg-black"
              />

              <select
                value={formData.category}
                onChange={(e) => update('category', e.target.value)}
                className="p-4 rounded-xl bg-black"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <input
                type="number"
                placeholder="Quantity Purchased"
                value={formData.quantity}
                onChange={(e) => update('quantity', e.target.value)}
                className="p-4 rounded-xl bg-black"
              />

              <input
                type="number"
                placeholder="Purchase Price"
                value={formData.costPerUnit}
                onChange={(e) => update('costPerUnit', e.target.value)}
                className="p-4 rounded-xl bg-black"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              <select
                value={formData.purchaseUnit}
                onChange={(e) => update('purchaseUnit', e.target.value)}
                className="p-4 rounded-xl bg-black"
              >
                {UNITS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>

              <select
                value={formData.inventoryUnit}
                onChange={(e) => update('inventoryUnit', e.target.value)}
                className="p-4 rounded-xl bg-black"
              >
                {UNITS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>

              <input
                type="number"
                step="0.01"
                placeholder="Conversion Factor"
                value={formData.conversionFactor}
                onChange={(e) => update('conversionFactor', e.target.value)}
                className="p-4 rounded-xl bg-black"
              />
            </div>

            <input
              type="number"
              placeholder="Minimum Stock Alert"
              value={formData.minStockLevel}
              onChange={(e) => update('minStockLevel', e.target.value)}
              className="w-full p-4 rounded-xl bg-black"
            />

            <textarea
              rows={4}
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) => update('notes', e.target.value)}
              className="w-full p-4 rounded-xl bg-black"
            />

            <div className="bg-emerald-500/10 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <Info size={18} />
                Preview
              </div>

              <div className="mt-4 text-xl">
                {quantity} {formData.purchaseUnit}
                <ArrowRight />
                {preview} {formData.inventoryUnit}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/10">
            <button
              disabled={loading}
              onClick={submit}
              className="
w-full
bg-emerald-500
rounded-2xl
py-4
text-black
font-black
"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Record Inventory'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
