import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import MainLayout from '../layouts/MainLayout';
import ExpenseModal from '../components/ExpenseModal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Archive,
  X,
  Plus,
  Minus,
  DollarSign,
} from 'lucide-react';

export default function Finance() {
  const [summary, setSummary] = useState({});
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [settlingSession, setSettlingSession] = useState(false);
  const [error, setError] = useState('');

  const [expenseOpen, setExpenseOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);

  const [incomeForm, setIncomeForm] = useState({
    amount: '',
    source: 'Egg Sales',
    description: '',
    payment_method: 'Cash',
    date: new Date().toISOString().split('T')[0],
  });

  const load = async () => {
    try {
      setLoading(true);
      setError('');

      // Step 1: Fetch active terminal profile summary details (Source of Truth)
      const summaryRes = await api.get('/api/my-farm/finance/summary/');
      const currentSummary = summaryRes.data || {};
      setSummary(currentSummary);

      const activePeriodId = currentSummary.period?.id;

      // Step 2: Target records explicitly matching this on-demand billing cycle
      const [incomeRes, expenseRes] = await Promise.allSettled([
        api.get(`/api/my-farm/finance/income/${activePeriodId ? `?period=${activePeriodId}` : ''}`),
        api.get(
          `/api/my-farm/finance/expenses/${activePeriodId ? `?period=${activePeriodId}` : ''}`
        ),
      ]);

      if (incomeRes.status === 'fulfilled')
        setIncome(
          Array.isArray(incomeRes.value.data)
            ? incomeRes.value.data
            : incomeRes.value.data?.results || []
        );
      if (expenseRes.status === 'fulfilled')
        setExpenses(
          Array.isArray(expenseRes.value.data)
            ? expenseRes.value.data
            : expenseRes.value.data?.results || []
        );

      if ([incomeRes, expenseRes].some((r) => r.status === 'rejected')) {
        setError('Some detailed transaction records failed to synchronize.');
      }
    } catch (err) {
      console.error('Core metrics loader exception:', err);
      setError('Unable to link active financial profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveIncome = async () => {
    try {
      const combinedSource = incomeForm.description
        ? `${incomeForm.source} (${incomeForm.description})`
        : incomeForm.source;

      await api.post('/api/my-farm/finance/income/', {
        ...incomeForm,
        amount: Number(incomeForm.amount),
        source: combinedSource,
      });

      setIncomeOpen(false);
      setIncomeForm({
        amount: '',
        source: 'Egg Sales',
        description: '',
        payment_method: 'Cash',
        date: new Date().toISOString().split('T')[0],
      });
      await load();
    } catch (err) {
      alert('Failed to save income entry');
    }
  };

  const closeWeek = async () => {
    const amount = window.prompt('Enter cash out amount (0 if none):', '0');
    if (amount === null) return;

    try {
      setSettlingSession(true);
      const response = await api.post('/api/my-farm/finance/close-week/', {
        cash_out: Number(amount || 0),
      });

      alert(response.data.message || 'Ledger settled and new balance cycle initialized.');
      await load();
    } catch (err) {
      console.error('Finalize session lifecycle failure:', err.response?.data || err);
      alert(
        err.response?.data?.detail || err.response?.data?.message || 'Failed to settle session'
      );
    } finally {
      setSettlingSession(false);
    }
  };

  // Compile the uniform ledger tracking array exclusively from true financial database records
  const ledger = useMemo(() => {
    return [
      ...income.map((i) => ({ ...i, type: 'Income' })),
      ...expenses.map((e) => ({ ...e, type: 'Expense' })),
    ].sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
  }, [income, expenses]);

  // Read backend aggregated values directly (Automatic sales entries are included here now)
  const totalIncome = Number(summary?.total_income || 0);
  const totalExpenses = Number(summary?.total_expenses || 0);
  const profit = Number(summary?.net_profit || 0);

  const allocationData = [
    { name: 'Income', value: totalIncome || 1, color: '#10b981' },
    { name: 'Expenses', value: totalExpenses || 0, color: '#f43f5e' },
  ];

  // FIXED: Resolves missing date indices by parsing read-only 'created_at' timestamp targets
  const weeklyTrendData = useMemo(() => {
    const dailyMap = {};

    ledger.forEach((item) => {
      const rawDate = item.date || item.created_at || new Date().toISOString();
      const cleanDate = rawDate.split('T')[0];

      if (!dailyMap[cleanDate]) {
        dailyMap[cleanDate] = { date: cleanDate, Income: 0, Expenses: 0 };
      }

      const numericalAmount = Number(item.amount || 0);
      if (item.type === 'Income') {
        dailyMap[cleanDate].Income += numericalAmount;
      } else {
        dailyMap[cleanDate].Expenses += numericalAmount;
      }
    });

    return Object.values(dailyMap)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7);
  }, [ledger]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-zinc-400 font-medium animate-pulse flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Synchronizing Terminal Workspace...
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="fixed inset-0 bg-[#020617] -z-10">
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,_#22c55e_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <div className="space-y-8 w-full px-4 sm:px-6 lg:px-10 py-6">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800/60 pb-6">
          <div>
            <div className="text-emerald-400 text-[10px] uppercase tracking-[0.35em] font-black mb-1">
              CURRENT SESSION: {summary.period?.name || 'LIVE ACTIVE RUN'}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase italic">
              Finance <span className="text-emerald-500">Terminal</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setIncomeOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition duration-200 text-xs uppercase tracking-wider"
            >
              <Plus className="w-3.5 h-3.5" /> <span>Income</span>
            </button>
            <button
              onClick={() => setExpenseOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition duration-200 text-xs uppercase tracking-wider"
            >
              <Minus className="w-3.5 h-3.5" /> <span>Expense</span>
            </button>
            <button
              onClick={closeWeek}
              disabled={settlingSession}
              className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 border border-zinc-700 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-xs uppercase tracking-wider transition"
            >
              {settlingSession ? 'Settling Session...' : 'Settle & Cash Out'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Financial Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <Card
            title="Session Income"
            value={`R ${totalIncome.toLocaleString('en-ZA')}`}
            icon={<TrendingUp className="text-emerald-400" />}
            variant="income"
          />
          <Card
            title="Session Expenses"
            value={`R ${totalExpenses.toLocaleString('en-ZA')}`}
            icon={<TrendingDown className="text-rose-400" />}
            variant="expense"
          />
          <Card
            title="Net Profit Margin"
            value={`R ${profit.toLocaleString('en-ZA')}`}
            icon={<Wallet className="text-sky-400" />}
            variant={profit >= 0 ? 'profit' : 'loss'}
          />
          <Card
            title="Session Cash Out"
            value={`R ${(summary.cash_out || 0).toLocaleString('en-ZA')}`}
            icon={<Archive className="text-zinc-400" />}
          />
        </div>

        {/* Visualization Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-zinc-900/40 border border-zinc-800/80 p-5 sm:p-6 rounded-3xl backdrop-blur-md">
            <h3 className="text-zinc-400 text-xs font-black uppercase tracking-widest mb-6">
              Current Session Cash Flows
            </h3>
            <div className="w-full h-60 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyTrendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#09090b',
                      borderColor: '#27272a',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/80 p-5 sm:p-6 rounded-3xl backdrop-blur-md flex flex-col justify-between min-h-[280px] lg:min-h-0">
            <div>
              <h3 className="text-zinc-400 text-xs font-black uppercase tracking-widest mb-1">
                Session Allocation
              </h3>
              <p className="text-[11px] text-zinc-500 font-bold tracking-tight mb-4">
                Active dynamic weight analysis
              </p>
            </div>
            <div className="h-36 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    innerRadius={48}
                    outerRadius={62}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="block text-[9px] uppercase font-black text-zinc-500 tracking-wider">
                  Margin
                </span>
                <span
                  className={`text-xs font-black ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                >
                  {totalIncome > 0 ? `${Math.round((profit / totalIncome) * 100)}%` : '0%'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-zinc-800/60 pt-4 text-[11px]">
              <div>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                <span className="text-zinc-400 font-medium">
                  Inflows ({ledger.filter((l) => l.type === 'Income').length})
                </span>
              </div>
              <div>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
                <span className="text-zinc-400 font-medium">
                  Outflows ({ledger.filter((l) => l.type === 'Expense').length})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ledger Log Section */}
        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-3xl overflow-hidden backdrop-blur-sm">
          <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/40 flex justify-between items-center">
            <h3 className="text-zinc-300 font-bold text-sm tracking-wide">
              Active Session Transactions Ledger
            </h3>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest hidden sm:inline">
              {ledger.length} operations logged
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/10 text-zinc-500 font-black text-[11px] tracking-wider uppercase border-b border-zinc-800/60">
                  <th className="py-4 px-6 sm:px-8">Date</th>
                  <th className="py-4 px-4">Source / Description</th>
                  <th className="py-4 px-4">Type</th>
                  <th className="py-4 px-6 sm:px-8 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center p-12">
                      <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-500 mx-auto mb-3 border border-zinc-700/30">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <p className="text-zinc-400 font-bold text-sm">
                        No transactions found for this session
                      </p>
                    </td>
                  </tr>
                ) : (
                  ledger.map((row, index) => {
                    const isIncome = row.type === 'Income';
                    return (
                      <tr
                        key={`${row.type}-${row.id || index}`}
                        className="hover:bg-white/[0.02] transition duration-150"
                      >
                        <td className="py-4 px-6 sm:px-8 text-zinc-400 text-sm whitespace-nowrap font-medium">
                          {(row.date || row.created_at || '').split('T')[0]}
                        </td>
                        <td className="py-4 px-4 text-zinc-200 text-sm font-semibold max-w-[180px] sm:max-w-none truncate sm:whitespace-normal">
                          {row.source || row.description || '-'}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}
                          >
                            {row.type}
                          </span>
                        </td>
                        <td
                          className={`py-4 px-6 sm:px-8 text-right text-sm font-black whitespace-nowrap tabular-nums ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}
                        >
                          {isIncome ? '+' : '-'} R {Number(row.amount).toLocaleString('en-ZA')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ExpenseModal isOpen={expenseOpen} onClose={() => setExpenseOpen(false)} onSuccess={load} />
      <IncomeModal
        open={incomeOpen}
        close={() => setIncomeOpen(false)}
        form={incomeForm}
        setForm={setIncomeForm}
        save={saveIncome}
      />
    </MainLayout>
  );
}

function Card({ title, value, icon, variant }) {
  const borderStyles = {
    income: 'border-t-2 border-emerald-500/50 shadow-emerald-950/5',
    expense: 'border-t-2 border-rose-500/50 shadow-rose-950/5',
    profit: 'border-t-2 border-sky-500/50 shadow-sky-950/5',
    loss: 'border-t-2 border-amber-500/50 shadow-amber-950/5',
  };

  return (
    <div
      className={`bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 p-5 sm:p-6 rounded-2xl shadow-xl flex flex-col justify-between hover:border-zinc-700/50 transition duration-200 ${borderStyles[variant] || ''}`}
    >
      <div className="flex justify-between items-center">
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{title}</p>
        <div className="p-2 rounded-xl bg-zinc-800/40 border border-zinc-700/20">{icon}</div>
      </div>
      <div className="mt-4">
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight break-all italic">
          {value}
        </h2>
      </div>
    </div>
  );
}

function IncomeModal({ open, close, form, setForm, save }) {
  if (!open) return null;

  const categories = [
    'Egg Sales',
    'Broiler Sales',
    'Cull / Live Bird Sales',
    'Manure / Fertilizer Sales',
    'Capital Injection',
    'Other Farm Income',
  ];

  const paymentMethods = ['Cash', 'EFT / Bank Transfer', 'Mobile Money / Card'];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={close}
    >
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-6 sm:p-8 rounded-3xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute top-5 right-5 text-zinc-500 hover:text-zinc-300 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="text-emerald-400 text-[9px] uppercase tracking-widest font-black mb-1">
            INFLOW REGISTER
          </div>
          <h2 className="text-white text-xl font-black uppercase italic tracking-tight">
            Record Cash In
          </h2>
          <p className="text-zinc-500 text-xs font-medium mt-1">
            Log farm revenues or terminal processing deposits.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-xs font-bold mb-1.5 uppercase tracking-wider">
              Amount (ZAR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-zinc-500 font-bold text-sm">R</span>
              <input
                type="number"
                value={form.amount}
                placeholder="0.00"
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full pl-8 pr-4 py-3.5 rounded-xl bg-black border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white font-medium text-sm transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 text-xs font-bold mb-1.5 uppercase tracking-wider">
              Revenue Stream
            </label>
            <div className="relative">
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full px-4 py-3.5 rounded-xl bg-black border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white font-medium text-sm transition cursor-pointer appearance-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-zinc-900 text-white">
                    {cat}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-zinc-500">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 text-xs font-bold mb-1.5 uppercase tracking-wider">
              Reference / Batch Details
            </label>
            <input
              type="text"
              value={form.description}
              placeholder="e.g. Batch 4 crates deposit (Optional)"
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3.5 rounded-xl bg-black border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white font-medium text-sm transition"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-xs font-bold mb-1.5 uppercase tracking-wider">
              Payment Channel
            </label>
            <div className="relative">
              <select
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                className="w-full px-4 py-3.5 rounded-xl bg-black border border-zinc-800 focus:border-emerald-500 focus:outline-none text-white font-medium text-sm transition cursor-pointer appearance-none"
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method} className="bg-zinc-900 text-white">
                    {method}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-zinc-500">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          <button
            onClick={save}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest mt-4 transition duration-200 shadow-lg shadow-emerald-950/20"
          >
            Save Income Entry
          </button>
        </div>
      </div>
    </div>
  );
}
