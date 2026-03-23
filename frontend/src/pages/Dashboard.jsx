import { useEffect, useState, useContext, useMemo } from "react";
import { Link } from "react-router-dom"; // Essential for navigation
import api from "../api/axios";
import { UserContext } from "../UserContext";
import MainLayout from "../layouts/MainLayout";
import LogMortalityModal from "../components/LogMortalityModal";
import CreateSaleModal from "../components/CreateSaleModal";
import CreateBatchModal from "../components/CreateBatchModal";
import { Zap, Droplets, BarChart3, TrendingUp, AlertCircle, Plus, ChevronRight } from "lucide-react";

// --- SUB-COMPONENTS ---
function StatCard({ title, value, sub, color }) {
  const colorStyles = { 
    blue: "text-blue-600 border-blue-50 bg-white", 
    emerald: "text-emerald-600 border-emerald-50 bg-emerald-50/10", 
    amber: "text-amber-600 border-amber-50 bg-white", 
    rose: "text-rose-600 border-rose-100 bg-rose-50/40" 
  };
  return (
    <div className={`p-6 rounded-[32px] border shadow-sm transition-all hover:scale-[1.02] ${colorStyles[color] || colorStyles.blue}`}>
      <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">{title}</p>
      <div className="text-3xl font-black tracking-tighter italic leading-none">{value}</div>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-2 flex items-center gap-1">
        {color === 'rose' && <AlertCircle size={10} />} {sub}
      </p>
    </div>
  );
}

function UtilityWidget({ icon, label, status, color }) {
  const bgStyles = { amber: "bg-amber-50 text-amber-600", blue: "bg-blue-50 text-blue-600" };
  return (
    <div className="bg-white p-6 rounded-[35px] border border-slate-100 flex items-center gap-4 shadow-sm w-full transition-all hover:border-blue-100">
      <div className={`p-4 rounded-2xl ${bgStyles[color] || bgStyles.blue}`}>{icon}</div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <h4 className="text-lg font-black text-slate-800 tracking-tighter uppercase italic leading-none">{status}</h4>
      </div>
    </div>
  );
}

function InventoryProgressBar({ batch }) {
  const widthPercent = Math.max(0, Math.min((batch.current_stock / batch.quantity_received) * 100, 100));
  
  return (
    <Link to={`/batches/${batch.id}`} className="block mb-6 last:mb-0 group cursor-pointer">
      <div className="flex justify-between text-[10px] font-black mb-2 uppercase tracking-tighter text-slate-400 group-hover:text-blue-400 transition-colors">
        <span className="flex items-center gap-1">
            {batch.name} <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-5px] group-hover:translate-x-0" />
        </span>
        <span className={widthPercent < 20 ? "text-rose-500" : "text-blue-400"}>{batch.current_stock} Units</span>
      </div>
      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5 shadow-inner">
        <div 
          className={`h-full transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.2)] ${widthPercent < 20 ? 'bg-rose-500' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`} 
          style={{ width: `${widthPercent}%` }}
        ></div>
      </div>
    </Link>
  );
}

function CapitalBar({ height, colorClass, label }) {
  return (
    <div className="flex flex-col items-center w-full group">
      <div className="relative w-full flex flex-col items-center justify-end h-full">
        <div className={`w-full max-w-[30px] rounded-xl transition-all duration-1000 shadow-lg ${colorClass}`} style={{ height: `${Math.max(height, 5)}%` }}></div>
      </div>
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-3">{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useContext(UserContext);
  const [data, setData] = useState({ batches: [], expenses: [], sales: [], inventory: [] });
  const [loading, setLoading] = useState(true);
  
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isSaleOpen, setIsSaleOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);

const fetchData = async () => {
    try {
      // FIXED: Ensure leading slashes for all endpoints
      const [batchRes, expRes, saleRes, invRes] = await Promise.all([
        api.get("/api/my-farm/flock/batches/"),
        api.get("/api/my-farm/finance/expenses/"),
        api.get("/api/my-farm/sales/orders/"),
        api.get("/api/my-farm/inventory/items/"),
      ]);
      
      const extract = (res) => res.data.results || res.data || [];
      setData({ 
        batches: extract(batchRes), 
        expenses: extract(expRes), 
        sales: extract(saleRes), 
        inventory: extract(invRes) 
      });
    } catch (error) { 
        console.error("Dashboard Sync error:", error); 
    } finally { 
        setLoading(false); 
    }
  };
  
  useEffect(() => { if (user) fetchData(); }, [user]);

  const stats = useMemo(() => {
    const currentBirds = data.batches.reduce((acc, b) => acc + (Number(b.current_stock) || 0), 0);
    const totalRev = data.sales.reduce((acc, s) => acc + parseFloat(s.total_amount || 0), 0);
    const totalExp = data.expenses.reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);
    const totalInitial = data.batches.reduce((acc, b) => acc + (Number(b.quantity_received) || 0), 0);
    const totalMortality = data.batches.reduce((acc, b) => acc + (Number(b.total_mortality_count) || 0), 0);
    
    const mortRate = totalInitial > 0 ? ((totalMortality / totalInitial) * 100).toFixed(1) : "0.0";

    return {
      currentBirds,
      totalRev,
      totalExp,
      profit: totalRev - totalExp,
      mortality: mortRate
    };
  }, [data]);

  const maxChartValue = Math.max(stats.totalRev, stats.totalExp, 1);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
         <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
         <p className="font-black italic text-slate-400 uppercase text-[10px] tracking-[0.3em]">Syncing Station</p>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <LogMortalityModal isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} onRefresh={fetchData} batches={data.batches} />
      <CreateSaleModal isOpen={isSaleOpen} onClose={() => setIsSaleOpen(false)} onRefresh={fetchData} batches={data.batches} />
      <CreateBatchModal isOpen={isBatchOpen} onClose={() => setIsBatchOpen(false)} onRefresh={fetchData} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Command <span className="text-blue-600">Center</span></h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] mt-2 tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            {user?.farm?.name || "FARM"} • LIVE FEED
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setIsBatchOpen(true)} className="px-5 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-50 flex items-center gap-2 transition-all active:scale-95 shadow-sm">
            <Plus size={14} className="text-blue-600" /> New Batch
          </button>
          <button onClick={() => setIsSaleOpen(true)} className="px-5 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-95">Dispatch Units</button>
          <button onClick={() => setIsLogOpen(true)} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10">Daily Log</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Live Stock" value={stats.currentBirds.toLocaleString()} sub="Birds in House" color="blue" />
        <StatCard title="Mortality" value={`${stats.mortality}%`} sub="Health Index" color={Number(stats.mortality) > 5 ? "rose" : "emerald"} />
        <StatCard title="Net Profit" value={`R${stats.profit.toLocaleString()}`} sub="Current Cycle" color={stats.profit >= 0 ? "emerald" : "rose"} />
        <StatCard title="Revenue" value={`R${stats.totalRev.toLocaleString()}`} sub="Total Sales" color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UtilityWidget icon={<Zap size={20} />} label="Power Grid" status="Stable" color="amber" />
            <UtilityWidget icon={<Droplets size={20} />} label="Water Supply" status="Optimal" color="blue" />
          </div>
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm min-h-[350px]">
             <h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px] mb-8 flex items-center gap-2">
                <BarChart3 size={14} className="text-blue-600" /> Recent Activity
             </h3>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-50">
                     {data.sales.length > 0 ? data.sales.slice(0, 6).map((order, i) => (
                        <tr key={i} className="group hover:bg-slate-50 transition-colors">
                            <td className="py-4 font-black text-slate-700 uppercase text-xs">{order.customer_name}</td>
                            <td className="py-4 text-slate-400 text-[10px] font-bold uppercase">{new Date(order.created_at).toLocaleDateString()}</td>
                            <td className="py-4 font-black text-emerald-600 text-xs text-right italic">R{parseFloat(order.total_amount).toLocaleString()}</td>
                        </tr>
                     )) : (
                        <tr><td className="py-10 text-center text-slate-300 font-bold uppercase text-[10px] italic">No Recent Sales Data</td></tr>
                     )}
                  </tbody>
               </table>
             </div>
          </div>
        </div>
        
        <div className="space-y-6">
           <div className="bg-[#0f172a] p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10"><TrendingUp size={80} /></div>
              <h3 className="font-black text-blue-400 mb-8 uppercase tracking-widest text-[10px]">Active Batches</h3>
              <div className="space-y-2">
                {data.batches.length > 0 ? data.batches.map(b => (
                    <InventoryProgressBar key={b.id} batch={b} />
                )) : (
                    <p className="text-white/20 text-[10px] font-black uppercase italic py-4">No active flock batches found</p>
                )}
              </div>
           </div>
           
           <div className="bg-white p-8 rounded-[40px] border border-slate-100 text-center shadow-sm">
              <h3 className="font-black text-slate-800 mb-8 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                <TrendingUp size={14} className="text-blue-600" /> Capital Flow
              </h3>
              <div className="flex items-end justify-center h-44 gap-8 border-b border-slate-50 pb-8">
                 <CapitalBar height={(stats.totalRev/maxChartValue)*100} colorClass="bg-blue-600" label="Revenue" />
                 <CapitalBar height={(stats.totalExp/maxChartValue)*100} colorClass="bg-rose-500" label="Burn" />
              </div>
              <div className="mt-6 flex justify-between px-4">
                  <div className="text-left">
                    <p className="text-[8px] font-black text-slate-300 uppercase">Burn Rate</p>
                    <p className="text-xs font-black text-rose-500">R{stats.totalExp.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-300 uppercase">Gross Rev</p>
                    <p className="text-xs font-black text-blue-600">R{stats.totalRev.toLocaleString()}</p>
                  </div>
              </div>
           </div>
        </div>
      </div>
    </MainLayout>
  );
}
