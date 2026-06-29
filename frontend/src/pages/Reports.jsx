import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import MainLayout from '../layouts/MainLayout';

import {
  FileText,
  Download,
  TrendingUp,
  BarChart3,
  Target,
  ChevronRight,
  Activity,
  DollarSign,
  Search,
  CheckSquare,
  Square,
  Clock,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export default function Reports() {
  const [data, setData] = useState({
    summary: {},
    batches: [],
    insights: [],
  });

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // NEW INTERACTIVE STATE ENGINES
  const [searchTerm, setSearchTerm] = useState('');
  const [timeframe, setTimeframe] = useState('all'); // 'all' | 'current' | '30'
  const [selectedBatches, setSelectedBatches] = useState([]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get('api/my-farm/reports/');
        setData(res.data);
      } catch (err) {
        console.error('REPORT ERROR', err?.response?.data || err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      // Custom Export: Pass selected batch IDs as query params if checkboxes are ticked
      const params = selectedBatches.length ? { batch_ids: selectedBatches.join(',') } : {};
      
      const response = await api.get('api/my-farm/ai/report/', {
        params,
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const farm = localStorage.getItem('farm_name') || 'Farm';
      const suffix = selectedBatches.length ? '_Custom_Audit' : '_Full_Audit';
      link.download = `${farm}_Report_${new Date().toISOString().split('T')[0]}${suffix}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to export report');
    } finally {
      setDownloading(false);
    }
  };

  const toggleSelectBatch = (id) => {
    setSelectedBatches(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (filteredList) => {
    if (selectedBatches.length === filteredList.length) {
      setSelectedBatches([]);
    } else {
      setSelectedBatches(filteredList.map(b => b.id));
    }
  };

  // Safe KPI Metric Mapping
  const metrics = {
    revenue: Number(data.summary?.revenue || 0),
    expenses: Number(data.summary?.expenses || 0),
    profit: Number(data.summary?.profit || 0),
    birds: Number(data.summary?.birds || 0),
    mortality: Number(data.summary?.mortality || 0),
  };

  const batchRecords = data.batches || [];

  // FILTER LOGIC: Search term + Timeframe filtering
  const filteredBatches = batchRecords.filter(batch => {
    const matchesSearch = batch.batch_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (timeframe === 'current') {
      // Logic assumes the highest/latest batch number or one within 42 days is active
      const isRecent = new Date(batch.acquisition_date) > new Date(Date.now() - 42 * 24 * 60 * 60 * 1000);
      return matchesSearch && isRecent;
    }
    if (timeframe === '30') {
      const isLast30Days = new Date(batch.acquisition_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return matchesSearch && isLast30Days;
    }
    return matchesSearch;
  });

  const maxFinancialValue = Math.max(...batchRecords.map(b => Math.max(b.revenue || 1, b.expenses || 1)), 1000);

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-slate-400 text-xs uppercase tracking-widest">
          Generating Performance Analytics...
        </p>
      </div>
    );
  }

  return (
    <MainLayout>
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between gap-5 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Performance{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent filter drop-shadow-[0_2px_10px_rgba(56,189,248,0.2)]">
              Intelligence
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Unified farm reporting, diagnostics, analytics & profitability command center
          </p>
        </div>

        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-semibold flex items-center gap-2 text-xs uppercase tracking-wider transition-all self-start md:self-center shadow-lg shadow-blue-600/20"
        >
          <Download size={16} />
          {downloading ? 'Generating PDF...' : selectedBatches.length ? `Export Audit (${selectedBatches.length})` : 'Export PDF Audit'}
        </button>
      </div>

      {/* NEW FEATURE: TIMEFRAME PILL FILTERS */}
      <div className="flex items-center justify-between mb-6 bg-slate-900 border border-slate-800/60 p-2.5 rounded-xl">
        <span className="text-xs text-slate-400 font-bold ml-1 uppercase tracking-wider">Metric Context</span>
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          {[
            { id: 'all', label: 'All History' },
            { id: 'current', label: 'Active Cycle' },
            { id: '30', label: 'Last 30 Days' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setTimeframe(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${timeframe === tab.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI HERO CARDS */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <ReportHeroCard
          title="Net Profit"
          value={metrics.profit < 0 ? `-R ${Math.abs(metrics.profit).toLocaleString()}` : `R ${metrics.profit.toLocaleString()}`}
          sub="Revenue minus expenses"
          icon={<TrendingUp />}
          color={metrics.profit >= 0 ? "emerald" : "rose"}
        />
        <ReportHeroCard
          title="Revenue"
          value={`R ${metrics.revenue.toLocaleString()}`}
          sub={`Expenses R ${metrics.expenses.toLocaleString()}`}
          icon={<BarChart3 />}
          color="blue"
        />
        <ReportHeroCard
          title="Bird Population"
          value={`${metrics.birds.toLocaleString()}`}
          sub={`${metrics.mortality} mortality instances`}
          icon={<Target />}
          color="amber"
        />
      </div>

      {/* VISUAL CHARTS MODULE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* CHART 1: FINANCIAL COMPARISON */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign size={16} className="text-blue-400" />
            <h3 className="text-white font-bold text-sm tracking-tight">Batch Capital Breakdown</h3>
          </div>
          
          {filteredBatches.length ? (
            <div className="h-48 flex items-end justify-between gap-3 pt-4 border-b border-slate-800 px-2">
              {filteredBatches.slice(0, 6).reverse().map((batch, index) => {
                const revHeight = ((batch.revenue || 0) / maxFinancialValue) * 100;
                const expHeight = ((batch.expenses || 0) / maxFinancialValue) * 100;
                return (
                  <div key={index} className="flex flex-col items-center flex-1 group h-full justify-end">
                    <div className="flex items-end gap-1.5 w-full justify-center h-full pb-1">
                      <div style={{ height: `${Math.max(expHeight, 6)}%` }} className="w-3 sm:w-4 bg-rose-500/80 rounded-t-sm relative" title={`Expenses: R${batch.expenses}`} />
                      <div style={{ height: `${Math.max(revHeight, 6)}%` }} className="w-3 sm:w-4 bg-emerald-500/80 rounded-t-sm relative" title={`Revenue: R${batch.revenue}`} />
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold mt-2 uppercase">B{batch.batch_number?.slice(-2)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-slate-500">No chart data available</div>
          )}
          <div className="flex gap-4 mt-3 text-[10px] text-slate-400 justify-center">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" /> Gross Income</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-rose-500 rounded-sm" /> Operation Burn</div>
          </div>
        </div>

        {/* CHART 2: FLOCK HEALTH SURVIVAL LINE TREND */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity size={16} className="text-emerald-400" />
            <h3 className="text-white font-bold text-sm tracking-tight">Flock Health & Survival Analytics</h3>
          </div>

          {filteredBatches.length ? (
            <div className="h-48 flex items-end justify-between gap-2 pt-4 border-b border-slate-800 px-4">
              {filteredBatches.slice(0, 8).reverse().map((batch, index) => {
                const rate = batch.survival_rate || 0;
                const heightPercentage = Math.max((rate - 60) * 2.5, 10); 
                return (
                  <div key={index} className="flex flex-col items-center flex-1 h-full justify-end group">
                    <div className="w-full flex flex-col items-center h-full justify-end relative pb-1">
                      <span className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 text-[9px] bg-slate-950 text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-slate-800 transition-opacity whitespace-nowrap z-10">
                        {rate}%
                      </span>
                      <div style={{ height: `${heightPercentage}%` }} className={`w-1 rounded-t-full relative transition-all ${rate >= 95 ? 'bg-gradient-to-t from-emerald-600/20 to-emerald-400' : 'bg-gradient-to-t from-amber-600/20 to-amber-400'}`}>
                        <div className={`w-2.5 h-2.5 -ml-0.5 rounded-full absolute top-0 shadow-lg ${rate >= 95 ? 'bg-emerald-400 shadow-emerald-500/50' : 'bg-amber-400 shadow-amber-500/50'}`} />
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold mt-2">B{batch.batch_number?.slice(-2)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-slate-500">No chart trends found</div>
          )}
          <p className="text-[10px] text-slate-500 mt-3 text-center">Live viability performance percentage mapping.</p>
        </div>
      </div>

      {/* AI INSIGHTS */}
      {data.insights?.length > 0 && (
        <div className="mb-8 bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
          <h3 className="text-white font-bold text-sm tracking-tight mb-4">AI Diagnostics Insights</h3>
          <div className="space-y-3">
            {data.insights.map((item, idx) => (
              <div key={idx} className="bg-slate-950/50 border border-slate-800/40 rounded-xl p-4 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                <span>{item.message || String(item)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BATCHES ARCHIVE CONTROLS & LOG FEED */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => toggleSelectAll(filteredBatches)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
              title="Toggle Select All"
            >
              {selectedBatches.length === filteredBatches.length && filteredBatches.length ? <CheckSquare size={18} className="text-blue-500" /> : <Square size={18} />}
            </button>
            <FileText className="text-blue-500" size={18} />
            <h3 className="text-white font-bold text-sm tracking-tight">Historical Performance Logs</h3>
          </div>

          {/* Inline Filtering Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Filter by batch number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 placeholder:text-slate-600 transition-colors"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-800/40">
          {filteredBatches.length ? (
            filteredBatches.map((batch) => {
              // CALCULATE PROGRESS BAR VALUES (Assuming standard 42-day cycle timeline limit)
              const totalDays = 42;
              const startDate = batch.acquisition_date ? new Date(batch.acquisition_date) : null;
              const daysElapsed = startDate ? Math.max(0, Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24))) : 0;
              const progressPercent = Math.min(100, (daysElapsed / totalDays) * 100);
              const isActive = daysElapsed <= totalDays && startDate;

              return (
                <div
                  key={batch.id}
                  className="flex flex-col sm:flex-row justify-between sm:items-center px-6 py-5 hover:bg-slate-800/30 transition-all cursor-pointer group gap-4"
                >
                  <div className="flex gap-4 items-center flex-1">
                    {/* Custom Batch Selection Checkbox */}
                    <div 
                      onClick={(e) => { e.stopPropagation(); toggleSelectBatch(batch.id); }}
                      className="text-slate-600 hover:text-slate-400 p-1"
                    >
                      {selectedBatches.includes(batch.id) ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} />}
                    </div>

                    <div className="w-11 h-11 rounded-xl bg-slate-950 flex items-center justify-center text-slate-400 group-hover:text-blue-400 font-bold border border-slate-800 text-sm shrink-0">
                      {batch.batch_number?.slice(-2) || '00'}
                    </div>

                    <div className="flex-1 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <h4 className="text-slate-200 group-hover:text-blue-400 font-bold text-sm transition-colors">
                          Batch {batch.batch_number}
                        </h4>
                        {/* THRESHOLD WARNING BADGES */}
                        {batch.survival_rate >= 95 ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded-md font-bold border border-emerald-900/40"><CheckCircle2 size={10}/> Optimal</span>
                        ) : batch.survival_rate < 90 ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] bg-rose-950 text-rose-400 px-1.5 py-0.5 rounded-md font-bold border border-rose-900/40"><AlertTriangle size={10}/> Attention</span>
                        ) : null}
                      </div>
                      
                      <p className="text-xs text-slate-500 mt-0.5">
                        Started: {batch.acquisition_date ? new Date(batch.acquisition_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* PROGRESS BAR SUB-LAYOUT FOR ACTIVE FLOCKS */}
                  {isActive && (
                    <div className="flex flex-col w-full sm:w-44 px-2 justify-center">
                      <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">
                        <span className="flex items-center gap-1"><Clock size={10} className="text-blue-400"/> Age Cycle</span>
                        <span>Day {daysElapsed}/{totalDays}</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                        <div style={{ width: `${progressPercent}%` }} className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full transition-all duration-500" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between sm:justify-end gap-8 shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Survival</p>
                      <p className={`font-bold text-sm mt-0.5 ${batch.survival_rate >= 95 ? 'text-emerald-400' : 'text-white'}`}>
                        {batch.survival_rate}%
                      </p>
                    </div>
                    <ChevronRight className="text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" size={16} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-14 text-center text-slate-500 text-xs">No matching historical records found</div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

function ReportHeroCard({ title, value, sub, icon, color }) {
  const styles = {
    emerald: 'border-emerald-500 shadow-emerald-950/10',
    rose: 'border-rose-500 shadow-rose-950/10',
    blue: 'border-blue-500 shadow-blue-950/10',
    amber: 'border-amber-500 shadow-amber-950/10',
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 border-l-4 ${styles[color]} rounded-2xl p-6 shadow-xl transition-all duration-300 hover:border-slate-700`}>
      <div className="flex justify-between items-start mb-4">
        <div className="text-slate-400 bg-slate-950 p-2 rounded-xl border border-slate-800/60">
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest bg-slate-950 px-2 py-0.5 rounded border border-slate-800/40">
          KPI
        </span>
      </div>

      <p className="text-xs font-bold uppercase text-slate-400 tracking-wide mb-1">
        {title}
      </p>
      <h2 className="text-white text-3xl font-extrabold tracking-tight">
        {value}
      </h2>
      <p className="text-slate-400 text-xs mt-2 font-medium">
        {sub}
      </p>
    </div>
  );
}