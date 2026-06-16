import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { X, Loader2, AlertCircle, CheckCircle2, Package2 } from 'lucide-react';

const UNIT_PRESETS = {
  feed: {
    inventory: 'KG',
    purchase: 'BAG',
    factor: '50',
  },

  medicine: {
    inventory: 'G',
    purchase: 'BOTTLE',
    factor: '500',
  },

  sawdust: {
    inventory: 'BAG',
    purchase: 'BAG',
    factor: '1',
  },
};

export default function AddStockModal({ isOpen, onClose, onSuccess }) {
  const initial = {
    name: '',
    category: 'feed',
    quantity: '',
    costPerUnit: '',
    minStockLevel: 10,
    notes: '',
  };

  const [formData, setFormData] = useState(initial);

  const [unitMode, setUnitMode] = useState('KG');

  const [purchaseMode, setPurchaseMode] = useState('BAG');

  const [conversionFactor, setConversionFactor] = useState('50');

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const [success, setSuccess] = useState('');

  useEffect(() => {
    const preset = UNIT_PRESETS[formData.category];

    if (!preset) return;

    setUnitMode(preset.inventory);

    setPurchaseMode(preset.purchase);

    setConversionFactor(preset.factor);
  }, [formData.category]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((p) => ({
      ...p,
      [e.target.name]: e.target.value,
    }));

    setError('');
  };

  const reset = () => {
    setFormData(initial);

    setSuccess('');
    setError('');
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.quantity || !formData.costPerUnit) {
      return setError('Fill all required fields');
    }

    try {
      setLoading(true);

      await api.post('/api/my-farm/inventory/items/purchase/', {
        name: formData.name,

        category: formData.category,

        quantity: Number(formData.quantity),

        unit_price: Number(formData.costPerUnit),

        inventory_unit: unitMode,

        purchase_unit: purchaseMode,

        conversion_factor: Number(conversionFactor),

        min_stock_level: Number(formData.minStockLevel),

        notes: formData.notes,
      });

      setSuccess('Stock recorded');

      onSuccess?.();

      setTimeout(() => {
        reset();
        onClose();
      }, 1000);
    } catch (e) {
      setError(e.response?.data?.error || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-[#0b0f14] rounded-3xl w-full max-w-2xl">
        <div className="p-6 border-b border-white/10 flex justify-between">
          <div className="flex gap-3">
            <Package2 className="text-emerald-400" />

            <h2 className="text-white font-black">Add Stock</h2>
          </div>

          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="text-red-400">
              <AlertCircle />
              {error}
            </div>
          )}

          {success && (
            <div className="text-emerald-400">
              <CheckCircle2 />
              {success}
            </div>
          )}

          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Item"
            className="w-full p-3 rounded-xl bg-black"
          />

          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-black"
          >
            <option value="feed">Feed</option>
            <option value="medicine">Medicine</option>
            <option value="sawdust">Sawdust</option>
          </select>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              name="quantity"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="p-3 bg-black rounded-xl"
            />

            <input
              type="number"
              name="costPerUnit"
              placeholder="Unit Price"
              value={formData.costPerUnit}
              onChange={handleChange}
              className="p-3 bg-black rounded-xl"
            />
          </div>

          <div className="p-4 border rounded-xl">
            Purchase:
            <strong> {purchaseMode}</strong>→<strong> {unitMode}</strong>
            <br />
            Factor:
            <input value={conversionFactor} onChange={(e) => setConversionFactor(e.target.value)} />
          </div>
        </div>

        <div className="p-4">
          <button
            disabled={loading}
            onClick={handleSubmit}
            className="bg-emerald-500 px-6 py-3 rounded-xl text-black"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
