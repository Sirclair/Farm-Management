import { useState } from "react";
import api from "../api/axios";

export default function BuyModal({ batch, isOpen, onClose, onRefresh }) {
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      await api.post("sales/orders/", {
        batch_id: batch.id,
        quantity: qty
      });
      alert("Purchase Successful!");
      onRefresh(); // Refresh stock numbers on the page
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || "Purchase failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl">
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Secure Checkout</p>
        <h3 className="text-2xl font-black text-slate-900 mb-6 italic uppercase">Buy {batch.name}</h3>
        
        <div className="bg-slate-50 p-6 rounded-2xl mb-6">
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Quantity to Purchase</label>
            <div className="flex items-center justify-between">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 bg-white border border-slate-200 rounded-lg font-bold">-</button>
                <span className="text-xl font-black">{qty}</span>
                <button onClick={() => setQty(Math.min(batch.current_stock, qty + 1))} className="w-10 h-10 bg-white border border-slate-200 rounded-lg font-bold">+</button>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 text-center font-bold italic">Max Available: {batch.current_stock}</p>
        </div>

        <div className="flex flex-col gap-3">
            <button 
                onClick={handlePurchase}
                disabled={loading}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50"
            >
                {loading ? "PROCESSING..." : `CONFIRM PURCHASE (R${qty * 100})`}
            </button>
            <button onClick={onClose} className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Cancel</button>
        </div>
      </div>
    </div>
  );
}