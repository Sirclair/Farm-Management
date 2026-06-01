import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Package2,
  DollarSign,
  ShieldAlert,
  FileText,
  Info,
} from 'lucide-react';

export default function AddStockModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'feed',
    quantity: '',
    minStockLevel: 10,
    costPerUnit: '',
    unit: 'KG',
    notes: '',
  });

  const [kgPerBag, setKgPerBag] = useState('50');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Automatically update default units when the category changes
  useEffect(() => {
    if (formData.category === 'feed') {
      setFormData((prev) => ({ ...prev, unit: 'KG' }));
    } else if (formData.category === 'medicine') {
      setFormData((prev) => ({ ...prev, unit: 'G' }));
    } else {
      setFormData((prev) => ({ ...prev, unit: 'BAGS' }));
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

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'feed',
      quantity: '',
      minStockLevel: 10,
      costPerUnit: '',
      unit: 'KG',
      notes: '',
    });
    setKgPerBag('50');
    setError('');
    setSuccess('');
  };

  const handleCloseInternal = () => {
    resetForm();
    onClose();
  };

  const validate = () => {
    if (!formData.name.trim()) return 'Item name is required for identification.';
    if (!formData.quantity) return 'Intake quantity value is required.';
    if (Number(formData.quantity) <= 0) return 'Quantity metric must be greater than zero.';
    if (!formData.costPerUnit || Number(formData.costPerUnit) <= 0)
      return 'Price input value must be greater than zero.';
    if (formData.category === 'feed' && formData.unit === 'BAGS' && Number(kgPerBag) <= 0)
      return 'Commercial bag conversion factor is invalid for feed lines.';
    return null;
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      let finalQuantity = Number(formData.quantity);
      let finalUnitPrice = Number(formData.costPerUnit);
      let finalUnit = formData.unit;

      // FIX THE MATH CLASH:
      // Convert quantity to total kilograms, but dynamically reduce unit price
      // down to price-per-kilogram so Django's (quantity * unit_price) matches exactly.
      if (formData.category === 'feed' && formData.unit === 'BAGS') {
        const totalKgFactor = Number(kgPerBag);
        finalQuantity = Number(formData.quantity) * totalKgFactor;
        finalUnitPrice = Number(formData.costPerUnit) / totalKgFactor;
        finalUnit = 'KG';
      }

      const payload = {
        name: formData.name,
        category: formData.category,
        quantity: finalQuantity,
        unit_price: finalUnitPrice,
        min_stock_level: Number(formData.minStockLevel),
        unit: finalUnit,
        notes: formData.notes,
      };

      await api.post('/api/my-farm/inventory/items/purchase/', payload);

      setSuccess('Resource allocation logged into central stockpile registry successfully.');
      onSuccess?.();

      setTimeout(() => {
        handleCloseInternal();
      }, 1500);
    } catch (err) {
      console.error('Stock addition error:', err);
      setError(err.response?.data?.error || 'Database transaction failure. Verify parameters.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#090d16] border border-white/10 rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl relative">
        {/* BANNER ACCESS HIERARCHY */}
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-emerald-500 to-cyan-500" />

        {/* MODAL HEADER */}
        <div className="flex justify-between items-center px-8 pt-8 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Package2 size={16} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight italic">
                Log New Resource Purchase
              </h3>
              <p className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase mt-0.5">
                Central Stockpile Intake Pipeline
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseInternal}
            className="p-2 text-zinc-500 hover:text-white bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* CONTENT PACK FLOW */}
        <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto font-sans text-sm">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div className="text-[12px] font-bold uppercase tracking-tight">{error}</div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-emerald-400">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <div className="text-[12px] font-black uppercase tracking-tight">{success}</div>
            </div>
          )}

          {/* BASIC PROPERTIES SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                Item Identifier / Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="E.G., BROILER STARTER MASH"
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-zinc-700 uppercase"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                Inventory Category Type
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-emerald-500 transition-colors uppercase cursor-pointer"
              >
                <option value="feed">Poultry Feed Lines</option>
                <option value="medicine">Vaccines & Medication</option>
                <option value="sawdust">Bedding / Sawdust Material</option>
                <option value="general">General Operations Equipment</option>
              </select>
            </div>
          </div>

          {/* METRIC QUANTITY CAPTURE ROUTER */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-white/5 pt-6">
            <div>
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                Intake Purchase Unit
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-emerald-500 transition-colors uppercase cursor-pointer"
              >
                {formData.category === 'feed' && <option value="KG">Kilograms (KG)</option>}
                {formData.category === 'feed' && <option value="BAGS">Commercial Bags</option>}
                {formData.category === 'medicine' && <option value="G">Grams (G)</option>}
                {formData.category === 'medicine' && <option value="ML">Milliliters (ML)</option>}
                {formData.category !== 'feed' && formData.category !== 'medicine' && (
                  <>
                    <option value="BAGS">Bags</option>
                    <option value="UNITS">Individual Units</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                {formData.unit === 'BAGS'
                  ? 'Number of Bags Ordered'
                  : `Quantity Amount (${formData.unit})`}
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white font-mono font-bold focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-zinc-800"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                {formData.unit === 'BAGS'
                  ? 'Price Paid Per Bag (ZAR)'
                  : `Price per ${formData.unit} (ZAR)`}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-zinc-600 font-mono font-bold text-xs">
                  R
                </span>
                <input
                  type="number"
                  name="costPerUnit"
                  value={formData.costPerUnit}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full bg-black/40 border border-white/5 rounded-xl pl-8 pr-4 py-3 text-white font-mono font-bold focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-zinc-800"
                />
              </div>
            </div>
          </div>

          {/* DYNAMIC FEED METRIC CONVERTER WARNING SYSTEM */}
          {formData.category === 'feed' && formData.unit === 'BAGS' && (
            <div className="p-5 bg-gradient-to-r from-cyan-950/30 to-black/40 border border-cyan-500/20 rounded-2xl space-y-4">
              <div className="flex items-center gap-2.5 text-cyan-400">
                <Info size={16} />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Automated Mass Matrix Conversion Engine
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <p className="text-zinc-400 text-[11.5px] font-medium max-w-md leading-relaxed">
                  System maps commercial feed distributions back into unified Kilogram metrics.
                  Please verify the bulk capacity factor specified below:
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    value={kgPerBag}
                    onChange={(e) => setKgPerBag(e.target.value)}
                    className="w-16 bg-black border border-white/10 rounded-lg p-2 text-center text-white font-mono font-black focus:outline-none focus:border-cyan-500 text-xs"
                  />
                  <span className="text-zinc-500 font-black text-[10px] uppercase tracking-wider">
                    KG Per Bag
                  </span>
                </div>
              </div>
              {Number(formData.quantity) > 0 && Number(formData.costPerUnit) > 0 && (
                <div className="pt-3 border-t border-white/5 grid grid-cols-2 gap-4 text-xs font-mono text-zinc-500">
                  <div>
                    Stockpile Increment:{' '}
                    <span className="text-white font-black">
                      {(Number(formData.quantity) * Number(kgPerBag)).toLocaleString()} KG
                    </span>
                  </div>
                  <div className="text-right">
                    Total Finance Charge:{' '}
                    <span className="text-emerald-400 font-black">
                      R {(Number(formData.quantity) * Number(formData.costPerUnit)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CONTROL BOUNDS & NOTES */}
          <div className="grid grid-cols-1 gap-5 border-t border-white/5 pt-6">
            <div>
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                Minimum Stock Boundary Alert Level
              </label>
              <input
                type="number"
                name="minStockLevel"
                value={formData.minStockLevel}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white font-mono font-bold focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                Purchase Order / Delivery Notes
              </label>
              <textarea
                name="notes"
                rows={2}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Log vendor parameters or manufacturing batch codes..."
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-zinc-700 resize-none"
              />
            </div>
          </div>
        </div>

        {/* ACTIONS FOOTER */}
        <div className="px-8 py-6 bg-black/60 border-t border-white/5 flex justify-end gap-3 items-center">
          <button
            onClick={handleCloseInternal}
            disabled={loading}
            className="px-6 py-3.5 rounded-xl text-zinc-400 hover:text-white font-black text-[10px] uppercase tracking-widest transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-black disabled:text-zinc-600 px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Processing Log...
              </>
            ) : (
              'Commit Allocation'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
