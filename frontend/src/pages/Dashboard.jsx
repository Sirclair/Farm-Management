import { useEffect, useState, useContext, useMemo } from "react";
import api from "../api/axios";
import { UserContext } from "../UserContext";
import MainLayout from "../layouts/MainLayout";
import LogMortalityModal from "../components/LogMortalityModal";
import CreateSaleModal from "../components/CreateSaleModal";
import { Zap, Droplets, BarChart3, TrendingUp, AlertCircle, PackageSearch } from "lucide-react";
import CountUp from "react-countup";

// --- SUB-COMPONENTS (Defined BEFORE Dashboard to prevent ReferenceErrors) ---

function StatCard({ title, value, sub, color }) {
  const colorStyles = { 
    blue: "text-blue-600 border-blue-50", 
    emerald: "text-emerald-600 border-emerald-50", 
    amber: "text-amber-600 border-amber-50", 
    rose: "text-rose-600 border-rose-100 bg-rose-50/30" 
  };
  return (
    <div className={`bg-white p-6 rounded-[32px] border shadow-sm transition-transform hover:scale-[1.02] ${colorStyles[color] || colorStyles.blue}`}>
      <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">{title}</p>
      <div className="text-3xl font-black tracking-tighter italic leading-none">{value}</div>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-2 flex items-center gap-1">
        {color === 'rose' && <AlertCircle size={10} />} {sub}
      </p>
    </div>
  );
}

function UtilityWidget({ icon, label, status, color }) {
  const bgStyles = { 
    amber: "bg-amber-50 text-amber-600", 
    blue: "bg-blue-50 text-blue-600" 
  };
  return (
    <div className="bg-white p-6 rounded-[35px] border border-slate-100 flex items-center gap-4 shadow-sm w-full">
        <div className={`p-4 rounded-2xl ${bgStyles[color] || bgStyles.blue}`}>{icon}</div>
        <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
            <h4 className="text-lg font-black text-slate-800 tracking-tighter uppercase italic leading-none">{status}</h4>
        </div>
    </div>
  );
}

function InventoryProgressBar({ batch }) {
  const widthPercent = Math.min((batch.current_stock / batch.quantity_received) * 100, 100);
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex justify-between text-[10px] font-black mb-2 uppercase tracking-tighter">
        <span>Batch {batch.batch_number}</span>
        <span className="text-blue-400">{batch.current_stock} Units</span>
      </div>
      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
        <div 
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000" 
            style={{ width: `${widthPercent}%` }}
        ></div>
      </div>
    </div>
  );
}

function CapitalBar({ height, colorClass, label }) {
    return (
      <div className="flex flex-col items-center w-full group">
        <div className="relative w-full flex flex-col items-center justify-end h-full">
            <div 
              className={`w-full max-w-[40px] rounded-2xl transition-all duration-1000 shadow-lg group-hover:brightness-110 ${colorClass}`} 
              style={{ height: `${Math.max(height, 5)}%` }}
            ></div>
        </div>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-3">{label}</span>
      </div>
    );
  }

function CapitalFlow({ revHeight, expHeight, profitHeight, stats }) {
  return (
    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm text-center relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
        <h3 className="font-black text-slate-800 mb-6 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
            <TrendingUp size={14} className="text-blue-600" /> Capital Flow
        </h3>
        
        <div className="flex items-end justify-center h-48 gap-6 mt-6 border-b border-slate-50 pb-6 relative z-10">
            <CapitalBar height={revHeight} colorClass="bg-gradient-to-t from-blue-600 to-blue-400 shadow-blue-100" label="Revenue" />
            <CapitalBar height={expHeight} colorClass="bg-gradient-to-t from-rose-600 to-rose-400 shadow-rose-100" label="Burn" />
            <CapitalBar 
                height={profitHeight} 
                colorClass={stats.profit >= 0 ? "bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-emerald-100" : "bg-gradient-to-t from-red-800 to-red-500 shadow-red-100"} 
                label="Net" 
            />
        </div>

        <div className="flex justify-between mt-6 px-2">
            <div className="text-left">
                <p className="text-[8px] font-black text-slate-300 uppercase">Margin</p>
                <p className={`text-sm font-black ${stats.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {stats.totalRevenue > 0 ? ((stats.profit / stats.totalRevenue) * 100).toFixed(1) : 0}%
                </p>
            </div>
            <div className="text-right">
                <p className="text-[8px] font-black text-slate-300 uppercase">Status</p>
                <p className={`text-sm font-black uppercase italic ${stats.profit >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                    {stats.profit >= 0 ? 'Surplus' : 'Deficit'}
                </p>
            </div>
        </div>
    </div>
  );
}

// --- MAIN DASHBOARD COMPONENT ---

export default function Dashboard() {
  const { user, loading: authLoading } = useContext(UserContext);
  const [data, setData] = useState({ batches: [], expenses: [], sales: [], inventory: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isSaleOpen, setIsSaleOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [batchRes, expRes, saleRes, invRes] = await Promise.all([
        api.get("my-farm/flock/batches/"),
        api.get("my-farm/finance/expenses/"),
        api.get("my-farm/sales/orders/"),
        api.get("my-farm/inventory/items/"),
      ]);
      const extract = (res) => res.data.results || res.data || [];
      setData({ 
        batches: extract(batchRes), 
        expenses: extract(expRes), 
        sales: extract(saleRes),
        inventory: extract(invRes)
      });
    } catch (error) { 
      console.error("Failed to fetch dashboard data:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const stats = useMemo(() => {
    const currentBirds = data.batches.reduce((acc, b) => acc + (Number(b.current_stock) || 0), 0);
    const totalRevenue = data.sales.reduce((acc, s) => acc + parseFloat(s.total_amount || 0), 0);
    const totalExpenses = data.expenses.reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);
    const feedInStore = data.inventory
        .filter(i => i.category?.toLowerCase() === "feed")
        .reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
    const lowStockItems = data.inventory.filter(i => i.is_low_stock === true);
    const actualMortalityCount = data.batches.reduce((acc, b) => acc + (Number(b.total_mortality_count) || 0), 0);
    const totalInitial = data.batches.reduce((acc, b) => acc + (Number(b.quantity_received) || 0), 0);
    
    return {
      currentBirds,
      feedInStore,
      isLowStock: lowStockItems.length > 0,
      lowStockItems,
      totalRevenue,
      totalExpenses,
      profit: totalRevenue - totalExpenses,
      mortality: totalInitial > 0 ? ((actualMortalityCount / totalInitial) * 100).toFixed(1) : "0.0",
      efficiency: currentBirds > 0 ? (feedInStore / currentBirds).toFixed(2) : "0.00"
    };
  }, [data]);

  const filteredBatches = data.batches.filter(b => b.batch_number?.toLowerCase().includes(searchQuery.toLowerCase()));
  const maxChartValue = Math.max(stats.totalRevenue, stats.totalExpenses, Math.abs(stats.profit), 1);
  const revHeight = (stats.totalRevenue / maxChartValue) * 100;
  const expHeight = (stats.totalExpenses / maxChartValue) * 100;
  const profitHeight = (Math.abs(stats.profit) / maxChartValue) * 100;

  if (loading || authLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-slate-400 uppercase italic tracking-widest text-[10px]">Syncing...</p>
    </div>
  );

  return (
    <MainLayout>
      <LogMortalityModal isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} onRefresh={fetchData} batches={data.batches} />
      <CreateSaleModal isOpen={isSaleOpen} onClose={() => setIsSaleOpen(false)} onRefresh={fetchData} batches={data.batches} />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Command <span className="text-blue-600">Center</span></h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] mt-2">{user?.farm?.name || "FARM"} • LIVE FEED</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsSaleOpen(true)} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 active:scale-95">Dispatch Units</button>
          <button onClick={() => setIsLogOpen(true)} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 active:scale-95">Daily Log</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard title="Live Stock" value={typeof CountUp === 'function' ? <CountUp end={stats.currentBirds} /> : stats.currentBirds} sub="Birds in House" color="blue" />
        <StatCard title="Mortality" value={`${stats.mortality}%`} sub="Health index" color={Number(stats.mortality) > 5 ? "rose" : "emerald"} />
        <StatCard title="Feed Stock" value={`${stats.feedInStore} KG`} sub={stats.isLowStock ? "REORDER" : "Store Level"} color={stats.isLowStock ? "rose" : "amber"} />
        <StatCard title="Efficiency" value={stats.efficiency} sub="Ratio" color="blue" />
        <StatCard title="Net Profit" value={`R${stats.profit.toLocaleString()}`} sub="Margin" color={stats.profit >= 0 ? "emerald" : "rose"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <UtilityWidget icon={<Zap size={20} />} label="Power Grid" status="Stable" color="amber" />
                <UtilityWidget icon={<Droplets size={20} />} label="Water Supply" status="Optimal" color="blue" />
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm min-h-[400px]">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-[11px] mb-8 flex items-center gap-2">
                    <BarChart3 size={16} className="text-blue-500" /> Recent Transactions
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <tbody className="divide-y divide-slate-50">
                            {data.sales.slice(0, 6).map((order, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="py-4 font-black text-slate-700 uppercase text-xs">{order.customer_name}</td>
                                    <td className="py-4 font-black text-emerald-600 text-xs text-right">R {parseFloat(order.total_amount).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div className="space-y-6">
            <div className="bg-[#0f172a] p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
              <h3 className="font-black text-blue-400 mb-6 uppercase tracking-widest text-[10px]">Inventory</h3>
              {filteredBatches.map(b => <InventoryProgressBar key={b.id} batch={b} />)}
            </div>
            <CapitalFlow revHeight={revHeight} expHeight={expHeight} profitHeight={profitHeight} stats={stats} />
        </div>
      </div>
    </MainLayout>
  );
}