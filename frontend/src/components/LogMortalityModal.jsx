import { useState } from "react";
import api from "../api/axios";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function LogMortalityModal({ isOpen, onClose, onRefresh, batches }) {
  const [formData, setFormData] = useState({
    flock: "",
    mortality: 0,
    feed_used_kg: 0,
    date: new Date().toISOString().split('T')[0]
  });
  
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      // FULL PATH based on your config/urls.py
      await api.post("api/my-farm/flock/daily-records/", {
        flock: parseInt(formData.flock),
        mortality: parseInt(formData.mortality),
        feed_used_kg: parseFloat(formData.feed_used_kg),
        date: formData.date
      });
      
      setStatus("success");
      
      // Delay closure so user sees the success state
      setTimeout(() => {
        onRefresh();
        onClose();
        setStatus("idle");
        setFormData({ flock: "", mortality: 0, feed_used_kg: 0, date: new Date().toISOString().split('T')[0] });
      }, 1500);

    } catch (err) {
      console.error("Sync Error:", err.response);
      setStatus("error");
      setErrorMsg(err.response?.data?.error || "Check if record for today already exists.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl border border-slate-100 relative overflow-hidden">
        
        {/* Success Overlay */}
        {status === "success" && (
          <div className="absolute inset-0 bg-emerald-500 z-10 flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
            <CheckCircle2 size={60} className="mb-4 animate-bounce" />
            <h2 className="text-2xl font-black uppercase italic">Record Synced</h2>
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-2">Stock updated successfully</p>
          </div>
        )}

        <h2 className="text-3xl font-black mb-6 text-slate-900 italic uppercase tracking-tighter">
          Daily <span className="text-rose-600">Logging</span>
        </h2>

        {status === "error" && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600">
            <AlertCircle size={18} />
            <p className="text-[10px] font-black uppercase">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block tracking-widest">Select Batch</label>
            <select 
              className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-rose-500 transition-all appearance-none cursor-pointer"
              value={formData.flock}
              onChange={(e) => setFormData({...formData, flock: e.target.value})}
              required
            >
              <option value="">Choose Batch...</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.batch_number} - {b.name} ({b.current_stock} left)</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block tracking-widest">Mortality</label>
              <input 
                type="number"
                min="0"
                className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none focus:ring-2 ring-rose-500/20"
                value={formData.mortality}
                onChange={(e) => setFormData({...formData, mortality: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block tracking-widest">Feed (KG)</label>
              <input 
                type="number"
                step="0.01"
                min="0"
                className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none focus:ring-2 ring-blue-500/20"
                value={formData.feed_used_kg}
                onChange={(e) => setFormData({...formData, feed_used_kg: e.target.value})}
                required
              />
            </div>
          </div>

          <button 
            disabled={status === "loading" || status === "success"}
            className="w-full bg-slate-900 text-white p-6 rounded-3xl font-black uppercase tracking-widest hover:bg-rose-600 transition-all mt-4 shadow-xl active:scale-[0.98] disabled:opacity-50"
          >
            {status === "loading" ? "Syncing Logs..." : "Commit Daily Record"}
          </button>
          
          <button 
            type="button" 
            onClick={onClose} 
            className="w-full mt-2 text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
          >
            Dismiss
          </button>
        </form>
      </div>
    </div>
  );
}
