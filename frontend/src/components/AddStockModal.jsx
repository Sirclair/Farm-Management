import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { X, Package, DollarSign, Layers, Database } from "lucide-react";

export default function AddStockModal({ isOpen, onClose, onRefresh }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "feed",
    quantity: "",
    unit_price: "",
    unit: "KG"
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // PRO TIP: To avoid the "returned more than one" error, 
      // your backend logic for POST should check if name exists.
      // On the frontend, we send the clean data:
      await api.post("my-farm/inventory/items/", {
        ...formData,
        quantity: Number(formData.quantity),
        unit_price: Number(formData.unit_price)
      });

      onRefresh();
      onClose();
      setFormData({ name: "", category: "feed", quantity: "", unit_price: "", unit: "KG" });
    } catch (error) {
      console.error("Critical failure during stock intake:", error);
      // Detailed alert so you know exactly what the server disliked
      alert(`Entry Denied: ${error.response?.data?.detail || "Check for duplicate item names"}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl border border-emerald-100">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 italic uppercase">
              Stock <span className="text-emerald-500">Injection</span>
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Resource Acquisition Entry</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Item Name - The unique identifier */}
          <div className="relative">
            <Package className="absolute left-5 top-5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="ITEM NAME (e.g. FINISHER)"
              className="w-full bg-slate-50 border-none p-5 pl-14 rounded-2xl font-black text-slate-700 uppercase placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500 transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category Select */}
            <div className="relative">
              <Layers className="absolute left-5 top-5 text-slate-400" size={18} />
              <select
                className="w-full bg-slate-50 border-none p-5 pl-14 rounded-2xl font-black text-slate-700 uppercase appearance-none focus:ring-2 focus:ring-emerald-500"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="feed">Feed</option>
                <option value="medicine">Medicine</option>
                <option value="equipment">Equipment</option>
              </select>
            </div>

            {/* Unit Select */}
            <div className="relative">
              <Database className="absolute left-5 top-5 text-slate-400" size={18} />
              <select
                className="w-full bg-slate-50 border-none p-5 pl-14 rounded-2xl font-black text-slate-700 uppercase appearance-none focus:ring-2 focus:ring-emerald-500"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                <option value="KG">Kilograms</option>
                <option value="BAGS">Bags</option>
                <option value="UNITS">Units</option>
                <option value="LITRES">Litres</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Quantity */}
            <input
              type="number"
              placeholder="QTY"
              className="w-full bg-emerald-50 border-none p-5 rounded-2xl font-black text-emerald-600 placeholder:text-emerald-300 focus:ring-2 focus:ring-emerald-500"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
            />
            {/* Price */}
            <div className="relative">
              <span className="absolute left-5 top-5 font-black text-slate-400">R</span>
              <input
                type="number"
                placeholder="UNIT PRICE"
                className="w-full bg-blue-50 border-none p-5 pl-10 rounded-2xl font-black text-blue-600 placeholder:text-blue-300 focus:ring-2 focus:ring-blue-500"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white p-6 rounded-[24px] font-black shadow-xl hover:bg-emerald-600 transition-all uppercase tracking-widest text-[11px] mt-4 flex items-center justify-center gap-3"
          >
            {loading ? "COMMITTING TO DATABASE..." : "AUTHORIZE STOCK ENTRY"}
          </button>
        </form>
      </div>
    </div>
  );
}