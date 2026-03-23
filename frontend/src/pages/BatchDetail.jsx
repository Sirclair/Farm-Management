import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import MainLayout from "../layouts/MainLayout";
import { ChevronLeft, Skull, Wheat, Calendar, Activity } from "lucide-react";

export default function BatchDetail() {
  const { id } = useParams();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBatchData = async () => {
    try {
      // Django detail view: /api/my-farm/flock/batches/1/
      const res = await api.get(`api/my-farm/flock/batches/${id}/`);
      setBatch(res.data);
    } catch (err) {
      console.error("Error fetching batch details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchData();
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center font-black uppercase italic text-slate-400">Loading History...</div>;
  if (!batch) return <div className="p-20 text-center font-black uppercase text-rose-500">Batch Not Found</div>;

  return (
    <MainLayout>
      <div className="mb-8 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-blue-600 transition-colors">
          <ChevronLeft size={14} /> Back to Command Center
        </Link>
        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${batch.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
          {batch.status}
        </span>
      </div>

      <div className="mb-10">
        <h1 className="text-6xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
          {batch.name} <span className="text-blue-600">#{batch.batch_number}</span>
        </h1>
        <p className="text-slate-400 font-bold uppercase text-[10px] mt-4 tracking-[0.2em]">
          {batch.breed} • Acquired {new Date(batch.acquisition_date).toLocaleDateString()}
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-blue-600">
            <Activity size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Surviving Stock</span>
          </div>
          <div className="text-4xl font-black text-slate-900 italic">{batch.current_stock}</div>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Birds remaining in house</p>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-rose-500">
            <Skull size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Total Mortality</span>
          </div>
          <div className="text-4xl font-black text-slate-900 italic">{batch.total_mortality_count}</div>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">{batch.mortality_percentage}% Loss Rate</p>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-amber-500">
            <Wheat size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Total Feed</span>
          </div>
          <div className="text-4xl font-black text-slate-900 italic">{batch.feed_cost_total || 0}kg</div>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Cumulative consumption</p>
        </div>
      </div>

      {/* Daily Logs Table */}
      <div className="bg-slate-900 p-10 rounded-[50px] shadow-2xl overflow-hidden relative">
        <div className="flex items-center gap-2 mb-8">
            <Calendar className="text-blue-400" size={16} />
            <h3 className="font-black text-white uppercase tracking-widest text-xs italic">Daily Log Ledger</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase text-slate-500 border-b border-slate-800">
                <th className="pb-4">Date</th>
                <th className="pb-4">Mortality</th>
                <th className="pb-4">Feed (kg)</th>
                <th className="pb-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {batch.daily_records?.length > 0 ? (
                batch.daily_records.sort((a,b) => new Date(b.date) - new Date(a.date)).map((log) => (
                  <tr key={log.id} className="group hover:bg-white/5 transition-colors">
                    <td className="py-6 text-xs font-black text-white italic">{new Date(log.date).toDateString()}</td>
                    <td className="py-6 text-xs font-black text-rose-500">-{log.mortality}</td>
                    <td className="py-6 text-xs font-black text-blue-400">{log.feed_used_kg}kg</td>
                    <td className="py-6 text-right">
                      <span className="text-[9px] font-black uppercase px-3 py-1 bg-white/10 text-slate-400 rounded-full">Logged</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-20 text-center text-slate-600 font-black uppercase italic text-xs tracking-widest">
                    No records found for this cycle yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
