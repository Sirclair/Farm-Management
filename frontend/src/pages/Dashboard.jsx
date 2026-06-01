import { useEffect, useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../api/axios';
import { UserContext } from '../UserContext';

import MainLayout from '../layouts/MainLayout';
import DebtorsPanel from '../components/DebtorsPanel';
import TopBuyers from '../components/TopBuyers';

import {
  Brain,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Activity,
  RefreshCw,
  Zap,
  ArrowUpRight,
  Download,
  BrainCircuit,
  ThermometerSun,
  ShieldCheck,
  ShoppingCart,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useContext(UserContext);

  const navigate = useNavigate();

  const [ai, setAI] = useState({
    summary: {},
    insights: [],
  });

  const [loading, setLoading] = useState(true);

  // =====================================================
  // HEADER SYSTEM STATE
  // =====================================================
  const [booting, setBooting] = useState(true);
  const [typedName, setTypedName] = useState('');

  const fullName = user?.farm_name || user?.farm?.name || 'Zonke Farms';

  useEffect(() => {
    let i = 0;

    const bootTimer = setTimeout(() => {
      setBooting(false);

      const typing = setInterval(() => {
        i++;

        setTypedName(fullName.slice(0, i));

        if (i >= fullName.length) {
          clearInterval(typing);
        }
      }, 70);
    }, 1000);

    return () => clearTimeout(bootTimer);
  }, [fullName]);

  // =====================================================
  // FETCH AI
  // =====================================================
  const fetchAI = async () => {
    try {
      setLoading(true);

      const res = await api.get('/api/my-farm/ai/insights/');

      setAI({
        summary: res.data?.summary || {},
        insights: res.data?.insights || [],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // DOWNLOAD REPORT
  // =====================================================
  const downloadPDF = async () => {
    try {
      const res = await api.get('/api/my-farm/ai/report/', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));

      const link = document.createElement('a');

      link.href = url;

      link.download = `Farm_Report_${new Date().toISOString().split('T')[0]}.pdf`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAI();
    }
  }, [user]);

  // =====================================================
  // PRIORITY SORTING
  // =====================================================
  const prioritizedInsights = useMemo(() => {
    return [...(ai.insights || [])].sort((a, b) => (a.type === 'risk' ? -1 : 1));
  }, [ai.insights]);

  // =====================================================
  // LOADING
  // =====================================================
  if (loading || booting) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <div className="w-16 h-16 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin mb-6" />

          <p className="text-emerald-500 font-black uppercase tracking-[0.4em] text-[10px]">
            INITIALIZING FARM CORE...
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* BACKGROUND */}
      <div className="fixed inset-0 bg-[#020617] -z-20" />

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 xl:px-10 py-6 md:py-12 text-white">
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}
        <div className="flex flex-col xl:flex-row justify-between xl:items-end mb-12 md:mb-16 gap-8">
          <div>
            {/* SYSTEM STATUS */}
            <div className="flex flex-wrap items-center gap-3 text-emerald-500 font-black tracking-[0.25em] md:tracking-[0.4em] text-[9px] md:text-[10px] uppercase mb-4">
              <div className="h-[1px] w-8 md:w-12 bg-emerald-500" />
              Neural Farm System Online
              <span className="relative flex h-2 w-2 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>

                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 text-[9px] md:text-[10px]">LIVE</span>
            </div>

            {/* FARM NAME */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-black tracking-tighter italic uppercase text-white break-words">
              {typedName}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                COMMAND
              </span>
            </h1>

            {/* STATUS BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4">
              <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest w-fit">
                🛰️ SYNC ACTIVE
              </div>

              <div className="text-zinc-500 text-[10px] md:text-[11px] font-bold uppercase tracking-widest">
                System Stable • AI Monitoring Online
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-4">
            <button
              onClick={fetchAI}
              className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
            >
              <RefreshCw size={20} className="text-zinc-400" />
            </button>
          </div>
        </div>

        {/* ================================================= */}
        {/* STATS */}
        {/* ================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 md:gap-6 mb-12">
          <StatCard
            title="Gross Revenue"
            value={`R ${Number(ai.summary.total_revenue || 0).toLocaleString()}`}
            trend="+12.5%"
            up
            icon={<DollarSign size={20} />}
          />

          <StatCard
            title="Active Pipeline"
            value={ai.summary.total_orders || 0}
            trend="+3"
            up
            icon={<Activity size={20} />}
          />

          <StatCard
            title="7-Day Velocity"
            value={`R ${Number(ai.summary.last_7_revenue || 0).toLocaleString()}`}
            trend="-2.1%"
            icon={<TrendingDown size={20} />}
          />

          <StatCard
            title="Feed Overhead"
            value={`R ${Number(ai.summary.feed_cost || 0).toLocaleString()}`}
            warning
            icon={<AlertTriangle size={20} />}
          />
        </div>

        {/* ================================================= */}
        {/* COMING SOON MODULES */}
        {/* ================================================= */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-black uppercase italic text-white">
                Upcoming Neural Modules
              </h2>

              <p className="text-zinc-500 text-sm mt-1">
                Experimental systems currently under active development.
              </p>
            </div>

            <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest w-fit">
              Beta Pipeline
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* FORECASTING */}
            <button
              onClick={() => navigate('/forecasting')}
              className="
                group
                bg-[#0a0a0a]
                border border-white/5
                hover:border-purple-500/30
                rounded-[32px]
                p-7
                text-left
                transition-all
                duration-300
                hover:-translate-y-1
              "
            >
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-400">
                  <BrainCircuit size={24} />
                </div>

                <ArrowUpRight
                  size={18}
                  className="text-zinc-700 group-hover:text-purple-400 transition-all"
                />
              </div>

              <h3 className="text-lg font-black text-white uppercase italic mb-2">
                Predictive Analytics
              </h3>

              <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                AI-powered flock forecasting and feed optimization.
              </p>

              <div className="space-y-2">
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full w-[75%] bg-purple-500 rounded-full" />
                </div>

                <div className="flex justify-between text-[10px] uppercase tracking-widest font-black">
                  <span className="text-zinc-500">Development</span>

                  <span className="text-purple-400">75%</span>
                </div>
              </div>
            </button>

            {/* IOT */}
            <button
              onClick={() => navigate('/iot')}
              className="
                group
                bg-[#0a0a0a]
                border border-white/5
                hover:border-amber-500/30
                rounded-[32px]
                p-7
                text-left
                transition-all
                duration-300
                hover:-translate-y-1
              "
            >
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400">
                  <ThermometerSun size={24} />
                </div>

                <ArrowUpRight
                  size={18}
                  className="text-zinc-700 group-hover:text-amber-400 transition-all"
                />
              </div>

              <h3 className="text-lg font-black text-white uppercase italic mb-2">IoT Live Link</h3>

              <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                Smart environmental monitoring and real-time alerts.
              </p>

              <div className="space-y-2">
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full w-[60%] bg-amber-500 rounded-full" />
                </div>

                <div className="flex justify-between text-[10px] uppercase tracking-widest font-black">
                  <span className="text-zinc-500">Integration</span>

                  <span className="text-amber-400">60%</span>
                </div>
              </div>
            </button>

            {/* HEALTH */}
            <button
              onClick={() => navigate('/health')}
              className="
                group
                bg-[#0a0a0a]
                border border-white/5
                hover:border-emerald-500/30
                rounded-[32px]
                p-7
                text-left
                transition-all
                duration-300
                hover:-translate-y-1
              "
            >
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck size={24} />
                </div>

                <ArrowUpRight
                  size={18}
                  className="text-zinc-700 group-hover:text-emerald-400 transition-all"
                />
              </div>

              <h3 className="text-lg font-black text-white uppercase italic mb-2">
                Bio-Guard System
              </h3>

              <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                Vaccination scheduling and disease outbreak protection.
              </p>

              <div className="space-y-2">
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full w-[82%] bg-emerald-500 rounded-full" />
                </div>

                <div className="flex justify-between text-[10px] uppercase tracking-widest font-black">
                  <span className="text-zinc-500">Calibration</span>

                  <span className="text-emerald-400">82%</span>
                </div>
              </div>
            </button>

            {/* MARKETPLACE */}
            <button
              onClick={() => navigate('/marketplace')}
              className="
                group
                bg-[#0a0a0a]
                border border-white/5
                hover:border-cyan-500/30
                rounded-[32px]
                p-7
                text-left
                transition-all
                duration-300
                hover:-translate-y-1
              "
            >
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400">
                  <ShoppingCart size={24} />
                </div>

                <ArrowUpRight
                  size={18}
                  className="text-zinc-700 group-hover:text-cyan-400 transition-all"
                />
              </div>

              <h3 className="text-lg font-black text-white uppercase italic mb-2">
                Market Connect
              </h3>

              <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                Direct farm-to-buyer poultry marketplace ecosystem.
              </p>

              <div className="space-y-2">
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full w-[70%] bg-cyan-500 rounded-full" />
                </div>

                <div className="flex justify-between text-[10px] uppercase tracking-widest font-black">
                  <span className="text-zinc-500">Deployment</span>

                  <span className="text-cyan-400">70%</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* ================================================= */}
        {/* MAIN GRID */}
        {/* ================================================= */}
        <div className="grid grid-cols-12 gap-6 md:gap-8">
          {/* LEFT */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            {/* AI INSIGHTS */}
            <div className="bg-[#0a0a0a] rounded-[32px] md:rounded-[40px] p-6 md:p-10">
              <h2 className="text-white text-lg md:text-xl font-black flex items-center gap-4 uppercase italic mb-10">
                <Zap size={22} className="text-emerald-500" />
                Neural Insight Stream
              </h2>

              <div className="space-y-4">
                {prioritizedInsights.length === 0 ? (
                  <div className="text-zinc-500 text-sm">No AI insights available</div>
                ) : (
                  prioritizedInsights.map((insight, i) => (
                    <div
                      key={i}
                      className="
                        p-4 md:p-6
                        rounded-[24px]
                        flex flex-col md:flex-row
                        md:items-center
                        justify-between
                        gap-4
                        border border-emerald-500/20
                        bg-emerald-500/5
                      "
                    >
                      <div className="flex items-start gap-4 md:gap-6">
                        <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 shrink-0">
                          <Brain size={20} />
                        </div>

                        <div>
                          <p className="text-white font-black">{insight.message}</p>

                          <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-2">
                            {insight.type}
                          </p>
                        </div>
                      </div>

                      <ArrowUpRight className="text-zinc-700 shrink-0" size={22} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* DEBTORS */}
            <DebtorsPanel onRefresh={fetchAI} />
          </div>

          {/* RIGHT */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            {/* TOP BUYERS */}
            <TopBuyers />

            {/* HEALTH */}
            <div className="bg-[#0a0a0a] p-6 md:p-10 rounded-[32px] md:rounded-[40px]">
              <HealthBar label="Neural Logic Core" value={98} color="bg-emerald-500" />

              <HealthBar label="Database Sync" value={100} color="bg-cyan-500" />
            </div>

            {/* EXPORT */}
            <div className="bg-gradient-to-br from-emerald-500 to-cyan-600 p-1 rounded-[32px] md:rounded-[40px]">
              <div className="bg-[#0a0a0a] rounded-[30px] md:rounded-[38px] p-6 md:p-10">
                <h3 className="text-white text-xl md:text-2xl font-black uppercase italic mb-2">
                  Export Intelligence
                </h3>

                <p className="text-zinc-500 text-sm mb-6">
                  Generate AI operational reports for your farm.
                </p>

                <button
                  onClick={downloadPDF}
                  className="
                    w-full
                    bg-emerald-500
                    hover:bg-emerald-400
                    text-black
                    py-4 md:py-5
                    rounded-2xl
                    font-black
                    uppercase
                    flex items-center justify-center gap-3
                    transition-all
                    text-sm
                  "
                >
                  <Download size={16} />
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function StatCard({ title, value, trend, up, warning, icon }) {
  return (
    <div className="bg-[#0a0a0a] p-6 md:p-8 rounded-[28px] md:rounded-[32px]">
      <div className="flex justify-between mb-6">
        <div className="p-3 bg-white/5 rounded-2xl text-zinc-400">{icon}</div>

        <div
          className={`text-[10px] font-black px-3 py-1 rounded-full ${
            warning || !up ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
          }`}
        >
          {trend}
        </div>
      </div>

      <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{title}</p>

      <h2 className="text-2xl md:text-3xl font-black text-white mt-3 break-words">{value}</h2>
    </div>
  );
}

function HealthBar({ label, value, color }) {
  return (
    <div className="mb-6">
      <div className="flex justify-between text-[10px] text-zinc-500 uppercase mb-3">
        <span>{label}</span>

        <span className="text-white">{value}%</span>
      </div>

      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
