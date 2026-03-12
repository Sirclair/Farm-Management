import { useState } from "react";
import api from "../api/axios";

export default function AddStaffModal({ isOpen, onClose, onRefresh }) {
  const [formData, setFormData] = useState({ username: "", password: "", role: "staff" });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("my-farm/accounts/add-staff/", formData);
      onRefresh();
      onClose();
      setFormData({ username: "", password: "", role: "staff" });
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add staff");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl">
        <h2 className="text-2xl font-black text-slate-900 uppercase italic mb-6">
          Authorize <span className="text-blue-600">New Personnel</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Temporary Password"
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          
          <select 
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
            onChange={(e) => setFormData({...formData, role: e.target.value})}
          >
            <option value="staff">Farm Staff (Restricted View)</option>
            <option value="manager">Farm Manager (Financial Access)</option>
          </select>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-black text-xs uppercase text-slate-400 hover:text-slate-600">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg disabled:opacity-50"
            >
              {loading ? "PROCESSING..." : "CONFIRM ACCESS"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}