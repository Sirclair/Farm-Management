import React, { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import MainLayout from '../layouts/MainLayout';
import { Wallet, TrendingDown, Receipt, PieChart, Plus } from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // =========================
  // MODAL STATE
  // =========================
  const [isOpen, setIsOpen] = useState(false);

  const [form, setForm] = useState({
    amount: '',
    category: 'feed',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // =========================
  // FETCH
  // =========================
  const fetchExpenses = async () => {
    try {
      const res = await api.get('/api/my-farm/finance/expenses/');
      setExpenses(res.data.results || res.data || []);
    } catch (error) {
      console.error('Finance error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // =========================
  // SUBMIT EXPENSE
  // =========================
  const handleSubmit = async () => {
    try {
      await api.post('/api/my-farm/finance/expenses/', {
        amount: form.amount,
        category: form.category,
        description: form.description,
        date: form.date,
      });

      setIsOpen(false);
      setForm({
        amount: '',
        category: 'feed',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });

      fetchExpenses();
    } catch (err) {
      console.error('Failed to create expense:', err);
    }
  };

  // =========================
  // TOTALS
  // =========================
  const totals = useMemo(() => {
    const total = expenses.reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);

    const feed = expenses
      .filter((e) => e.category === 'feed')
      .reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);

    const medicine = expenses
      .filter((e) => e.category === 'medicine')
      .reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);

    return {
      total,
      feed,
      medicine,
      other: total - (feed + medicine),
    };
  }, [expenses]);

  // =========================
  // FILTER
  // =========================
  const filteredExpenses = expenses.filter((e) => {
    if (filter === 'all') return true;
    return e.category === filter;
  });

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white font-black tracking-widest animate-pulse">
        LOADING FINANCIAL LEDGER...
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="fixed inset-0 -z-10 bg-[#050505]" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[400px] -z-10 bg-rose-500/10 blur-[120px] rounded-full" />

      {/* HEADER */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-5xl font-black text-white uppercase">
            Expense <span className="text-rose-500">Ledger</span>
          </h1>

          <p className="text-zinc-500 font-bold uppercase text-xs tracking-[0.2em] mt-2">
            Financial Outflow Tracking
          </p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-zinc-900 border border-white/10 text-white px-5 py-3 rounded-2xl font-bold outline-none"
          >
            <option value="all">All</option>
            <option value="feed">Feed</option>
            <option value="medicine">Medicine</option>
            <option value="equipment">Equipment</option>
            <option value="labor">Labor</option>
            <option value="utilities">Utilities</option>
            <option value="other">Other</option>
          </select>

          {/* ADD BUTTON */}
          <button
            onClick={() => setIsOpen(true)}
            className="bg-rose-500 hover:bg-rose-400 text-black px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2"
          >
            <Plus size={16} />
            Add Expense
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <FinanceCard
          title="Total Expenses"
          value={`R ${totals.total.toLocaleString()}`}
          icon={<Wallet size={22} />}
        />
        <FinanceCard
          title="Feed Costs"
          value={`R ${totals.feed.toLocaleString()}`}
          icon={<TrendingDown size={22} />}
        />
        <FinanceCard
          title="Medical Costs"
          value={`R ${totals.medicine.toLocaleString()}`}
          icon={<PieChart size={22} />}
        />
        <FinanceCard title="Transactions" value={expenses.length} icon={<Receipt size={22} />} />
      </div>

      {/* TABLE */}
      <div className="bg-zinc-900 border border-white/10 rounded-[32px] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-zinc-500 uppercase text-[10px] tracking-[0.2em]">
              <th className="px-8 py-6 text-left">Date</th>
              <th className="px-8 py-6 text-left">Description</th>
              <th className="px-8 py-6 text-left">Category</th>
              <th className="px-8 py-6 text-right">Amount</th>
            </tr>
          </thead>

          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-16 text-zinc-500 font-bold">
                  No expenses recorded
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => (
                <tr key={exp.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-8 py-6 text-zinc-400">
                    {new Date(exp.date).toLocaleDateString()}
                  </td>

                  <td className="px-8 py-6 text-white font-semibold">
                    {exp.description || 'No description'}
                  </td>

                  <td className="px-8 py-6">
                    <span className="bg-white/10 px-3 py-1 rounded-xl text-xs uppercase font-bold">
                      {exp.category}
                    </span>
                  </td>

                  <td className="px-8 py-6 text-right text-rose-500 font-black">
                    R {parseFloat(exp.amount).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* =========================
          EXPENSE MODAL
      ========================= */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-[420px]">
            <h2 className="text-white text-xl font-black mb-6 uppercase">Add Expense</h2>

            <div className="space-y-4">
              <input
                type="number"
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full p-3 rounded-xl bg-black border border-white/10 text-white"
              />

              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full p-3 rounded-xl bg-black border border-white/10 text-white"
              >
                <option value="feed">Feed</option>
                <option value="medicine">Medicine</option>
                <option value="equipment">Equipment</option>
                <option value="labor">Labor</option>
                <option value="utilities">Utilities</option>
                <option value="other">Other</option>
              </select>

              <input
                type="text"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full p-3 rounded-xl bg-black border border-white/10 text-white"
              />

              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full p-3 rounded-xl bg-black border border-white/10 text-white"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsOpen(false)} className="px-4 py-2 text-white font-bold">
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                className="px-5 py-2 bg-rose-500 text-black font-black rounded-xl"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

// =========================
// CARD
// =========================
function FinanceCard({ title, value, icon }) {
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-[28px] p-6">
      <div className="text-zinc-500 mb-4">{icon}</div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black">{title}</p>
      <h2 className="text-3xl font-black text-white mt-3">{value}</h2>
    </div>
  );
}
