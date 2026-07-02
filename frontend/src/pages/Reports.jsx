import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import MainLayout from '../layouts/MainLayout';
import {
  FileText,
  Download,
  TrendingUp,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Search,
  CheckSquare,
  Square,
  PackageMinus,
  ShoppingBag,
  Percent,
  Wallet,
  ArrowRightLeft,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Layers,
  Sparkles,
  Calendar,
  Layers3,
} from 'lucide-react';

// =========================================================
// 1. KPI CARD COMPONENT
// =========================================================
function KPICard({ title, value, subtitle, tooltip, variant = 'default' }) {
  const variantStyles = {
    default: 'border-white/[0.04] bg-zinc-900/40 text-white',
    green: 'border-emerald-500/20 bg-emerald-950/10 text-emerald-400',
    red: 'border-rose-500/20 bg-rose-950/10 text-rose-400',
    blue: 'border-blue-500/20 bg-blue-950/10 text-blue-400',
    amber: 'border-amber-500/20 bg-amber-950/10 text-amber-400',
  };

  return (
    <div
      className={`group relative p-6 rounded-2xl border backdrop-blur-xl transition-all duration-300 hover:border-white/10 ${variantStyles[variant]}`}
    >
      <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="relative">
          <Info size={14} className="text-zinc-500 cursor-help" />
          <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black border border-white/10 rounded-lg text-[10px] text-zinc-300 pointer-events-none shadow-xl z-30">
            {tooltip}
          </div>
        </div>
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{title}</p>
      <h3 className="text-2xl font-black tracking-tight font-mono">{value}</h3>
      <p className="text-[11px] text-zinc-500 font-medium mt-1">{subtitle}</p>
    </div>
  );
}

// =========================================================
// 2. PROFIT WATERFALL NODE
// =========================================================
function WaterfallStep({ label, value, subLabel, isNeg = false, isTotal = false }) {
  return (
    <div
      className={`flex flex-col p-4 rounded-xl border ${isTotal ? 'bg-blue-600/10 border-blue-500/30' : 'bg-zinc-900/50 border-white/[0.04]'} flex-1 min-w-[160px]`}
    >
      <span className="text-[10px] uppercase font-black tracking-wider text-zinc-400 mb-1">
        {label}
      </span>
      <span
        className={`text-base font-black font-mono ${isNeg ? 'text-rose-400' : isTotal ? 'text-blue-400' : 'text-emerald-400'}`}
      >
        {isNeg ? '-' : ''}
        {value}
      </span>
      <span className="text-[9px] text-zinc-500 mt-1">{subLabel}</span>
    </div>
  );
}

// =========================================================
// 3. ADVANCED EXPANDABLE TABLE ROW
// =========================================================
function BatchTableRow({ batch, formatZAR, isSelected, onToggleSelect }) {
  const [expanded, setExpanded] = useState(false);
  const bRev = Number(batch.revenue || 0);
  const bExp = Number(batch.expenses || 0);
  const bGross = Number(batch.gross_profit || 0);
  const bNet = Number(batch.net_profit || 0);
  const bMargin = Number(batch.profit_margin || 0);
  const bBirds = Number(batch.birds_count || 0);

  // Advanced derived analysis rows
  const costPerBird = bBirds > 0 ? formatZAR(bExp / bBirds) : 'R 0';
  const revPerBird = bBirds > 0 ? formatZAR(bRev / bBirds) : 'R 0';
  const profitPerBird = bBirds > 0 ? formatZAR(bNet / bBirds) : 'R 0';

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        className={`hover:bg-white/[0.02] transition-all cursor-pointer border-b border-white/[0.02] ${expanded ? 'bg-white/[0.01]' : ''}`}
      >
        <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onToggleSelect(batch.id)}
            className="text-zinc-600 hover:text-zinc-400"
          >
            {isSelected ? (
              <CheckSquare size={16} className="text-blue-400" />
            ) : (
              <Square size={16} />
            )}
          </button>
        </td>
        <td className="py-4 px-3 font-bold text-zinc-200">Batch {batch.batch_number || 'N/A'}</td>
        <td className="py-4 px-3 font-medium text-zinc-400">{batch.acquisition_date || '—'}</td>
        <td className="py-4 px-3 font-mono text-zinc-300">{bBirds.toLocaleString()}</td>
        <td className="py-4 px-3 font-mono text-zinc-300">
          {Number(batch.stock || 0).toLocaleString()}
        </td>
        <td className="py-4 px-3 font-mono text-rose-400">
          {Number(batch.mortality || 0).toLocaleString()}
        </td>
        <td className="py-4 px-3 font-mono text-zinc-300">{formatZAR(bRev)}</td>
        <td className="py-4 px-3 font-mono text-zinc-500">{formatZAR(bExp)}</td>
        <td className="py-4 px-3 font-mono text-emerald-400">{formatZAR(bGross)}</td>
        <td
          className={`py-4 px-3 font-mono font-black ${bNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
        >
          {formatZAR(bNet)}
        </td>
        <td className="py-4 px-3">
          <div className="flex items-center gap-2">
            <span
              className={`font-mono font-bold ${bMargin >= 15 ? 'text-emerald-400' : bMargin >= 0 ? 'text-amber-400' : 'text-rose-400'}`}
            >
              {bMargin}%
            </span>
            <div className="w-12 bg-white/5 h-1.5 rounded-full overflow-hidden hidden sm:block">
              <div
                style={{ width: `${Math.max(0, Math.min(100, bMargin))}%` }}
                className={`h-full ${bMargin >= 15 ? 'bg-emerald-500' : bMargin >= 0 ? 'bg-amber-500' : 'bg-rose-500'}`}
              />
            </div>
          </div>
        </td>
        <td className="py-4 px-4 text-right text-zinc-500">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-black/30 border-b border-white/[0.04]">
          <td colSpan="12" className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-6 text-xs border-l-2 border-blue-500/40 pl-4">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                  Feed Cost
                </p>
                <p className="font-mono text-zinc-300 mt-0.5">{formatZAR(batch.feed_cost)}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                  Labour Cost
                </p>
                <p className="font-mono text-zinc-300 mt-0.5">{formatZAR(batch.labour_cost)}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                  Utility Cost
                </p>
                <p className="font-mono text-zinc-300 mt-0.5">{formatZAR(batch.utility_cost)}</p>
              </div>
              <div className="border-t border-white/5 md:border-t-0 pt-2 md:pt-0">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                  Cost / Bird
                </p>
                <p className="font-mono text-zinc-400 mt-0.5">{costPerBird}</p>
              </div>
              <div className="border-t border-white/5 md:border-t-0 pt-2 md:pt-0">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                  Revenue / Bird
                </p>
                <p className="font-mono text-zinc-400 mt-0.5">{revPerBird}</p>
              </div>
              <div className="border-t border-white/5 md:border-t-0 pt-2 md:pt-0">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                  Profit / Bird
                </p>
                <p
                  className={`font-mono font-bold mt-0.5 ${bNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                >
                  {profitPerBird}
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// =========================================================
// MAIN CORE REPORTS PAGE
// =========================================================
export default function Reports() {
  const [data, setData] = useState({
    summary: {},
    expense_breakdown: {},
    batches: [],
    weekly_inventory: { purchased_items: [], most_used_item: null, total_weekly_spend: 0 },
    insights: [],
  });

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatches, setSelectedBatches] = useState([]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get('api/my-farm/reports/');
        setData(res.data);
      } catch (err) {
        console.error('REPORT FETCH ERROR', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const formatZAR = (val) => {
    const numeric = Number(val || 0);
    const sign = numeric < 0 ? '-' : '';
    return `${sign}R ${Math.abs(numeric).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`;
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const params = selectedBatches.length ? { batch_ids: selectedBatches.join(',') } : {};
      const response = await api.get('api/my-farm/ai/report/', { params, responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const farm = localStorage.getItem('farm_name') || 'Farm';
      link.download = `${farm}_Performance_Audit_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export farm metrics reporting document.');
    } finally {
      setDownloading(false);
    }
  };

  const toggleSelectBatch = (id) => {
    setSelectedBatches((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredBatches = (data.batches || []).filter((b) =>
    b.batch_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Destructure direct metrics from backend architecture
  const { summary = {}, expense_breakdown = {}, weekly_inventory = {}, insights = [] } = data;

  // Derive highest tracking operational expenditure element
  const expenseEntries = [
    { label: 'Feed', value: Number(expense_breakdown.feed || 0) },
    { label: 'Labour', value: Number(expense_breakdown.labour || 0) },
    { label: 'Utilities', value: Number(expense_breakdown.utilities || 0) },
    { label: 'Medicine', value: Number(expense_breakdown.medicine || 0) },
    { label: 'Inventory Assets', value: Number(expense_breakdown.inventory || 0) },
  ];
  const totalExpensesComputed = expenseEntries.reduce((sum, item) => sum + item.value, 0);
  const highestExpenseItem = [...expenseEntries].sort((a, b) => b.value - a.value)[0];

  if (loading) {
    return (
      <div className="h-screen bg-[#020617] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
          Recompiling Ledger Architectures...
        </p>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="fixed inset-0 bg-[#020617] -z-10">
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle,_#3b82f6_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 text-white space-y-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/[0.04] pb-6">
          <div>
            <div className="text-blue-400 text-[10px] uppercase tracking-[0.3em] font-black flex items-center gap-2">
              <Layers3 size={12} /> SYSTEM FINANCIAL LEDGER
            </div>
            <h1 className="text-4xl font-black tracking-tight mt-2 uppercase">
              Farm Reports & Operating Analytics
            </h1>
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-zinc-500 font-bold uppercase text-xs tracking-wider transition-all shadow-lg shadow-blue-600/10"
          >
            <Download size={14} />
            {downloading
              ? 'Compiling Audit...'
              : selectedBatches.length
                ? `Export Selected (${selectedBatches.length})`
                : 'Export Executive PDF'}
          </button>
        </div>

        {/* 2. KPI GRID ROW */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Revenue"
              value={formatZAR(summary.revenue)}
              subtitle="Total gross invoiced metrics"
              tooltip="Total invoiced sales"
            />
            <KPICard
              title="Cash Collected"
              value={formatZAR(summary.paid)}
              subtitle="Liquid currency cleared"
              tooltip="Actual money received"
              variant="green"
            />
            <KPICard
              title="Outstanding Debt"
              value={formatZAR(summary.debt)}
              subtitle="Unsettled client ledger parameters"
              tooltip="Customer balances outstanding"
              variant={Number(summary.debt) > 0 ? 'amber' : 'default'}
            />
            <KPICard
              title="Operating Expenses"
              value={formatZAR(summary.expenses)}
              subtitle="Consolidated system run costs"
              tooltip="Total farm operating run rate overheads"
              variant="red"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Gross Profit"
              value={formatZAR(summary.gross_profit)}
              subtitle="Earnings post direct production input"
              tooltip="Revenue minus COGS"
              variant="green"
            />
            <KPICard
              title="Net Profit"
              value={formatZAR(summary.net_profit)}
              subtitle="Realized baseline farm income margin"
              tooltip="Profit after all expenses"
              variant={Number(summary.net_profit) >= 0 ? 'green' : 'red'}
            />
            <KPICard
              title="Profit Margin"
              value={`${summary.profit_margin || 0}%`}
              subtitle="Efficiency performance yield metric"
              tooltip="Net performance yield calculation profile"
              variant="blue"
            />
            <KPICard
              title="Cash Available"
              value={formatZAR(summary.cash_available)}
              subtitle="Instantly deployable liquid operational capital"
              tooltip="Liquid farm capital"
              variant="blue"
            />
          </div>
        </div>

        {/* 3. PROFIT WATERFALL VISUAL FLOW */}
        <div className="bg-zinc-950/40 border border-white/[0.04] p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3">
            <Layers size={14} className="text-blue-400" />
            <h3 className="text-xs uppercase tracking-widest font-black text-zinc-400">
              Profit Compression Waterfall Model
            </h3>
          </div>
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 overflow-x-auto pb-2">
            <WaterfallStep
              label="1. Revenue"
              value={formatZAR(summary.revenue)}
              subLabel="Invoiced Base"
            />
            <div className="hidden lg:block text-zinc-600 font-bold">→</div>
            <WaterfallStep
              label="2. Production Costs"
              value={formatZAR(
                Number(expense_breakdown.feed || 0) + Number(expense_breakdown.medicine || 0)
              )}
              subLabel="Chicks, Feed, Health Inputs"
              isNeg
            />
            <div className="hidden lg:block text-zinc-600 font-bold">→</div>
            <WaterfallStep
              label="3. Gross Profit"
              value={formatZAR(summary.gross_profit)}
              subLabel="Production Yield Margin"
            />
            <div className="hidden lg:block text-zinc-600 font-bold">→</div>
            <WaterfallStep
              label="4. Operating Costs"
              value={formatZAR(
                Number(expense_breakdown.labour || 0) +
                  Number(expense_breakdown.utilities || 0) +
                  Number(expense_breakdown.inventory || 0)
              )}
              subLabel="Labour, Utilities, Overhead"
              isNeg
            />
            <div className="hidden lg:block text-zinc-600 font-bold">→</div>
            <WaterfallStep
              label="5. Net Profit"
              value={formatZAR(summary.net_profit)}
              subLabel="Clear Performance Earnings"
              isTotal
            />
            <div className="hidden lg:block text-zinc-600 font-bold">→</div>
            <WaterfallStep
              label="6. Cash Available"
              value={formatZAR(summary.cash_available)}
              subLabel="Cleared Liquid Assets"
              isTotal
            />
          </div>
        </div>

        {/* MIDDLE SECTION: EXPENSES & INVENTORY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 5. EXPENSE ANALYTICS PANEL */}
          <div className="lg:col-span-2 bg-zinc-950/40 border border-white/[0.04] p-6 rounded-2xl flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <PackageMinus size={14} className="text-rose-400" />
                  <h3 className="text-xs uppercase tracking-widest font-black text-zinc-400">
                    Operating Expense Distribution
                  </h3>
                </div>
                <span className="font-mono text-[11px] font-bold text-zinc-500">
                  Sum: {formatZAR(summary.expenses)}
                </span>
              </div>

              {/* Progress-based Visual Distribution */}
              <div className="space-y-3">
                {expenseEntries.map((item, idx) => {
                  const pct =
                    totalExpensesComputed > 0
                      ? Math.round((item.value / totalExpensesComputed) * 100)
                      : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-zinc-300">
                        <span>{item.label} Allocation</span>
                        <span className="font-mono text-zinc-400">
                          {formatZAR(item.value)} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-cyan-500' : idx === 3 ? 'bg-rose-500' : 'bg-purple-500'}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* B & C: Top Expense Aggregations */}
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">
                  Primary System Cost Contributor
                </p>
                <p className="text-sm font-black text-zinc-200 mt-0.5">
                  {highestExpenseItem?.label || 'None'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">
                  Resource Allocation Burn
                </p>
                <p className="text-sm font-black font-mono text-rose-400 mt-0.5">
                  {formatZAR(highestExpenseItem?.value)}
                </p>
              </div>
            </div>
          </div>

          {/* 6. INVENTORY PERFORMANCE LAYER */}
          <div className="bg-zinc-950/40 border border-white/[0.04] p-6 rounded-2xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3 mb-4">
                <ShoppingBag size={14} className="text-cyan-400" />
                <h3 className="text-xs uppercase tracking-widest font-black text-zinc-400">
                  Inventory Stock Dynamics
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-black/30 p-3 rounded-xl border border-white/[0.02]">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">
                    Weekly Procurement Count
                  </p>
                  <p className="text-lg font-black font-mono text-zinc-200 mt-1">
                    {(weekly_inventory.purchased_items || []).length}
                  </p>
                </div>
                <div className="bg-black/30 p-3 rounded-xl border border-white/[0.02]">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">
                    Total Inventory Outflow
                  </p>
                  <p className="text-lg font-black font-mono text-cyan-400 mt-1">
                    {formatZAR(weekly_inventory.total_weekly_spend)}
                  </p>
                </div>
              </div>

              <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">
                  High Frequency Velocity Item
                </p>
                <p className="text-xs font-bold text-zinc-300 mt-1 truncate">
                  {weekly_inventory.most_used_item || 'No assets allocated'}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block mb-2">
                Weekly Activity Activity Log
              </span>
              <div className="max-h-[100px] overflow-y-auto space-y-2 pr-1">
                {(weekly_inventory.purchased_items || []).map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-[11px] border-b border-white/[0.02] pb-1"
                  >
                    <span className="text-zinc-400 truncate max-w-[140px] font-medium">
                      {item.item_name}
                    </span>
                    <span className="font-mono text-zinc-500">
                      {item.quantity}
                      {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. ADVANCED BATCH PERFORMANCE REGISTER */}
        <div className="bg-zinc-950/40 border border-white/[0.04] rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/20 border-b border-white/[0.04]">
            <div className="flex items-center gap-3">
              <FileText className="text-blue-400" size={16} />
              <h3 className="text-xs uppercase tracking-widest font-black text-zinc-400">
                Batch Financial & Operational Breakdown
              </h3>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-3 text-zinc-500" size={14} />
              <input
                type="text"
                placeholder="Filter specific batch identifier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-200 outline-none focus:ring-1 focus:ring-blue-500/30 font-semibold placeholder:text-zinc-600 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-white/[0.04] bg-white/[0.01] text-zinc-400 font-black uppercase tracking-wider">
                  <th className="py-3 px-4 w-10"></th>
                  <th className="py-3 px-3">Batch</th>
                  <th className="py-3 px-3">Acquisition</th>
                  <th className="py-3 px-3">Birds</th>
                  <th className="py-3 px-3">Current Stock</th>
                  <th className="py-3 px-3">Mortality</th>
                  <th className="py-3 px-3">Revenue</th>
                  <th className="py-3 px-3">Expenses</th>
                  <th className="py-3 px-3">Gross Profit</th>
                  <th className="py-3 px-3">Net Profit</th>
                  <th className="py-3 px-3">Margin Efficiency</th>
                  <th className="py-3 px-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {filteredBatches.length > 0 ? (
                  filteredBatches.map((batch) => (
                    <BatchTableRow
                      key={batch.id}
                      batch={batch}
                      formatZAR={formatZAR}
                      isSelected={selectedBatches.includes(batch.id)}
                      onToggleSelect={toggleSelectBatch}
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="12"
                      className="p-12 text-center text-zinc-500 uppercase font-bold tracking-widest"
                    >
                      Zero operational records mapped inside database arrays.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 7. INSIGHTS DIAGNOSTIC CONTROL PANEL */}
        <div className="bg-zinc-950/40 border border-white/[0.04] p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3">
            <Sparkles size={14} className="text-yellow-400" />
            <h3 className="text-xs uppercase tracking-widest font-black text-zinc-400">
              Automated Performance Diagnostics
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.length > 0 ? (
              insights.map((insight, idx) => {
                const text = insight.message || String(insight);
                const isRisk =
                  text.toLowerCase().includes('high') ||
                  text.toLowerCase().includes('mortality') ||
                  text.toLowerCase().includes('loss');
                const isWarning =
                  text.toLowerCase().includes('review') || text.toLowerCase().includes('check');
                const isSuccess =
                  text.toLowerCase().includes('optimal') || text.toLowerCase().includes('good');

                let cardStyle = 'border-blue-500/20 bg-blue-950/10 text-blue-300';
                let Icon = Info;

                if (isRisk) {
                  cardStyle = 'border-rose-500/20 bg-rose-950/10 text-rose-300';
                  Icon = AlertCircle;
                } else if (isWarning) {
                  cardStyle = 'border-amber-500/20 bg-amber-950/10 text-amber-300';
                  Icon = AlertTriangle;
                } else if (isSuccess) {
                  cardStyle = 'border-emerald-500/20 bg-emerald-950/10 text-emerald-300';
                  Icon = CheckCircle;
                }

                return (
                  <div
                    key={idx}
                    className={`border p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed transition-all duration-200 hover:bg-white/[0.01] ${cardStyle}`}
                  >
                    <Icon size={16} className="shrink-0 mt-0.5" />
                    <p className="font-medium">{text}</p>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 text-zinc-500 text-xs text-center py-4 uppercase tracking-wider font-bold">
                All production layers executing within target tolerances.
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
