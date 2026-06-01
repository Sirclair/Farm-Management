import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/axios";

export default function BatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBatchData = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Hits your standardized Django path: api/my-farm/flock/batches/ID/
        const res = await api.get(`api/my-farm/flock/batches/${id}/`);
        
        // Debugging line: Check your browser console (F12) to see real data structure
        console.log("Batch Data Received:", res.data);
        
        setBatch(res.data);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Failed to sync with Command Center. Verify connection.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBatchData();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-blue-500 font-black tracking-widest uppercase text-xs">Accessing Secure Records...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="max-w-6xl mx-auto"
      >
        {/* TOP NAVIGATION BAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
              <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter">
                Batch #{batch?.batch_number || id}
              </h1>
            </div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-2">
              Operational History & Vital Metrics
            </p>
          </div>
          <button 
            onClick={() => navigate("/flocks")}
            className="bg-slate-800 text-slate-400 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-lg"
          >
            Return to Registry
          </button>
        </div>

        {/* VITAL SIGN CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { 
                label: "Initial Stock", 
                val: batch?.initial_stock || 0, 
                color: "text-blue-500", 
                sub: "Birds Placed" 
            },
            { 
                label: "In House", 
                val: batch?.current_stock || 0, 
                color: "text-emerald-500", 
                sub: "Live Inventory" 
            },
            { 
                label: "Health Index", 
                val: batch?.mortality_rate !== undefined ? `${batch.mortality_rate}%` : "0%", 
                color: "text-rose-500", 
                sub: "Mortality Rate" 
            },
            { 
                label: "Batch Age", 
                val: batch?.age_in_days || 0, 
                color: "text-amber-500", 
                sub: "Days in Cycle" 
            },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-4xl shadow-2xl border-b-4 border-slate-100">
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">{stat.label}</p>
              <p className={`text-4xl font-black italic ${stat.color} tracking-tighter`}>{stat.val}</p>
              <p className="text-[8px] font-bold uppercase text-slate-300 mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* LOG HISTORY TABLE */}
        <div className="bg-white rounded-[48px] shadow-2xl overflow-hidden border border-slate-100">
          <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-black italic uppercase text-slate-900 tracking-tight">Daily Production Logs</h3>
            {error && <span className="text-rose-500 text-[10px] font-bold animate-pulse uppercase">⚠️ Connection Error</span>}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase text-slate-400 bg-slate-50/30">
                  <th className="px-8 py-6">Timeline</th>
                  <th className="px-8 py-6">Activity</th>
                  <th className="px-8 py-6 text-center">Feed (KG)</th>
                  <th className="px-8 py-6 text-center text-rose-400">Mortality</th>
                  <th className="px-8 py-6">Observer Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold text-slate-600">
                {(batch?.logs || batch?.production_logs || []).length > 0 ? (
                  (batch.logs || batch.production_logs).map((log, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="px-8 py-6 text-slate-900">
                        {new Date(log.date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-8 py-6">
                        <span className="bg-slate-100 px-3 py-1 rounded-full text-[9px] uppercase tracking-tighter group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                          {log.activity_type || "Standard Entry"}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center font-black text-slate-800">{log.feed_qty || log.feed_consumed || 0}</td>
                      <td className="px-8 py-6 text-center font-black text-rose-500">-{log.mortality || log.mortality_count || 0}</td>
                      <td className="px-8 py-6 text-[11px] text-slate-400 italic font-medium max-w-xs truncate">
                        {log.notes || "No remarks recorded"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-20">
                        <div className="text-4xl">📄</div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Historical Data Found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}