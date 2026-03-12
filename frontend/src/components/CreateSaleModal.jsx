import { useState, useEffect } from "react";
import api from "../api/axios";

export default function CreateSaleModal({ isOpen, onClose, onRefresh }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    batch_id: "",
    quantity: 1,
    price_per_unit: 0,
    payment_method: "cash"
  });

  useEffect(() => {
    if (isOpen) {
      api.get("my-farm/flock/batches/").then((res) => {
        const data = res.data.results || res.data || [];
        setBatches(data.filter(b => b.status?.toLowerCase() === "active" && b.current_stock > 0));
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // MATCHING YOUR VIEWSET: Flat structure, not nested in "items"
    const payload = {
      batch_id: parseInt(formData.batch_id),
      quantity: parseInt(formData.quantity),
      customer_name: formData.customer_name || "Walk-in",
      payment_method: formData.payment_method,
      price_per_unit: parseFloat(formData.price_per_unit),
      total_amount: Number(formData.quantity) * Number(formData.price_per_unit)
    };

    try {
      await api.post("my-farm/sales/orders/", payload);
      onRefresh();
      onClose();
      setFormData({ customer_name: "", batch_id: "", quantity: 1, price_per_unit: 0, payment_method: "cash" });
    } catch (err) {
      console.error("Sale Error:", err.response?.data);
      alert(err.response?.data?.error || "Transaction Failed. Check fields.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 text-slate-900">
      <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl border border-white/10">
        <h2 className="text-3xl font-black mb-2 italic uppercase tracking-tighter">
          Dispatch <span className="text-blue-600">Stock</span>
        </h2>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Direct Sale Transaction</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block">Customer Name</label>
            <input 
              className="w-full bg-slate-50 p-5 rounded-2xl font-black outline-none border-2 border-transparent focus:border-blue-500 transition-all"
              placeholder="Walk-in Customer"
              value={formData.customer_name}
              onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block">Source Batch</label>
              <select 
                className="w-full bg-slate-50 p-5 rounded-2xl font-black outline-none border-2 border-transparent focus:border-blue-500"
                value={formData.batch_id}
                onChange={(e) => setFormData({...formData, batch_id: e.target.value})}
                required
              >
                <option value="">Select...</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.batch_number} ({b.current_stock} birds)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block">Payment</label>
              <select 
                className="w-full bg-slate-50 p-5 rounded-2xl font-black outline-none"
                value={formData.payment_method}
                onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
              >
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block">Quantity</label>
              <input 
                type="number"
                className="w-full bg-slate-50 p-5 rounded-2xl font-black outline-none"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block">Unit Price (R)</label>
              <input 
                type="number"
                className="w-full bg-slate-50 p-5 rounded-2xl font-black outline-none"
                value={formData.price_per_unit}
                onChange={(e) => setFormData({...formData, price_per_unit: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-black text-slate-400 uppercase">Grand Total</span>
              <span className="text-2xl font-black text-blue-600 italic">R {(formData.quantity * formData.price_per_unit).toLocaleString()}</span>
            </div>
            <button 
              disabled={loading}
              className="w-full bg-slate-900 text-white p-6 rounded-[24px] font-black uppercase tracking-widest text-[11px] hover:bg-blue-600 transition-all shadow-xl"
            >
              {loading ? "Syncing Transaction..." : "Complete Sale"}
            </button>
            <button type="button" onClick={onClose} className="w-full mt-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}