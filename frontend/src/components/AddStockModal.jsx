import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { X, Loader2, AlertCircle, CheckCircle2, Package2, Info } from 'lucide-react';

export default function AddStockModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'feed',
    quantity: '',
    minStockLevel: 10,
    costPerUnit: '',
    notes: '',
  });

  const [unitMode, setUnitMode] = useState('KG'); // inventory unit
  const [purchaseMode, setPurchaseMode] = useState('KG'); // purchase unit
  const [conversionFactor, setConversionFactor] = useState('1');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (formData.category === 'feed') {
      setUnitMode('KG');
      setPurchaseMode('BAG');
      setConversionFactor('50');
    }

    if (formData.category === 'medicine') {
      setUnitMode('G');
      setPurchaseMode('BOTTLE');
      setConversionFactor('500');
    }

    if (formData.category === 'sawdust') {
      setUnitMode('BAG');
      setPurchaseMode('BAG');
      setConversionFactor('1');
    }
  }, [formData.category]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError('');
  };

  const validate = () => {
    if (!formData.name.trim()) return 'Item name required';
    if (!formData.quantity || Number(formData.quantity) <= 0) return 'Invalid quantity';
    if (!formData.costPerUnit || Number(formData.costPerUnit) <= 0) return 'Invalid price';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) return setError(err);

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        category: formData.category,

        quantity: Number(formData.quantity),
        unit_price: Number(formData.costPerUnit),

        inventory_unit: unitMode,
        purchase_unit: purchaseMode,
        conversion_factor: Number(conversionFactor),

        min_stock_level: Number(formData.minStockLevel),
        notes: formData.notes,
      };

      await api.post('/api/my-farm/inventory/items/purchase/', payload);

      setSuccess('Stock successfully recorded');
      onSuccess?.();

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-[#0b0f14] border border-white/10 rounded-[28px] w-full max-w-2xl overflow-hidden">
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Package2 className="text-emerald-400" />
            <div>
              <h2 className="text-white font-black uppercase">Add Stock</h2>
              <p className="text-xs text-zinc-500">Inventory Intake</p>
            </div>
          </div>

          <button onClick={onClose}>
            <X className="text-zinc-400" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 text-red-400 p-3 rounded-xl text-sm flex gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl text-sm flex gap-2">
              <CheckCircle2 size={16} /> {success}
            </div>
          )}

          <input
            name="name"
            placeholder="Item name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white"
          />

          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white"
          >
            <option value="feed">Feed</option>
            <option value="medicine">Medicine</option>
            <option value="sawdust">Sawdust</option>
          </select>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={handleChange}
              name="quantity"
              className="p-3 bg-black/40 border border-white/10 rounded-xl text-white"
            />

            <input
              type="number"
              placeholder="Unit Price"
              value={formData.costPerUnit}
              onChange={handleChange}
              name="costPerUnit"
              className="p-3 bg-black/40 border border-white/10 rounded-xl text-white"
            />
          </div>

          {/* conversion */}
          <div className="p-4 border border-white/10 rounded-xl text-xs text-zinc-400">
            Conversion Factor:
            <input
              value={conversionFactor}
              onChange={(e) => setConversionFactor(e.target.value)}
              className="ml-2 w-20 bg-black border border-white/20 text-white px-2 py-1 rounded"
            />
            <span className="ml-2">
              {purchaseMode} → {unitMode}
            </span>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 flex justify-end gap-3 border-t border-white/10">
          <button onClick={onClose} className="text-zinc-400">
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-emerald-500 text-black px-5 py-2 rounded-xl font-black"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
