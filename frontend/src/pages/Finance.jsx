import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import MainLayout from '../layouts/MainLayout';
import ExpenseModal from '../components/ExpenseModal';

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Archive,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  X,
} from 'lucide-react';

export default function Finance() {
  const [summary, setSummary] = useState({});
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [expenseOpen, setExpenseOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);

  const [incomeForm, setIncomeForm] = useState({
    amount: '',
    source: 'Sales',
    date: new Date().toISOString().split('T')[0],
  });

  const load = async () => {
    try {
      setLoading(true);
      setError('');

      const results = await Promise.allSettled([
        api.get('/api/my-farm/finance/summary/'),
        api.get('/api/my-farm/finance/income/'),
        api.get('/api/my-farm/finance/expenses/'),
      ]);

      if (results[0].status === 'fulfilled') {
        setSummary(results[0].value.data || {});
      }

      if (results[1].status === 'fulfilled') {
        const data = results[1].value.data;
        setIncome(Array.isArray(data) ? data : data?.results || []);
      }

      if (results[2].status === 'fulfilled') {
        const data = results[2].value.data;
        setExpenses(Array.isArray(data) ? data : data?.results || []);
      }

      const failed = results.some((r) => r.status === 'rejected');

      if (failed) {
        setError('Some finance data failed to load.');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load finance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveIncome = async () => {
    try {
      await api.post('/api/my-farm/finance/income/', {
        ...incomeForm,
        amount: Number(incomeForm.amount),
      });

      setIncomeOpen(false);

      setIncomeForm({
        amount: '',
        source: 'Sales',
        date: new Date().toISOString().split('T')[0],
      });

      await load();
    } catch (err) {
      console.error(err);
      alert('Failed to save income');
    }
  };

  const closeWeek = async () => {
    const amount = prompt('Cash out amount');

    if (!amount) return;

    try {
      await api.post('/api/my-farm/finance/close-week/', {
        cash_out: Number(amount),
      });

      await load();
    } catch (err) {
      console.error(err);
      alert('Failed to close week');
    }
  };

  const totalIncome =
    Number(summary?.total_income) ||
    income.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalExpenses =
    Number(summary?.total_expenses) ||
    expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const profit = totalIncome - totalExpenses;

  const ledger = useMemo(() => {
    return [
      ...(income || []).map((i) => ({
        ...i,
        type: 'Income',
      })),
      ...(expenses || []).map((e) => ({
        ...e,
        type: 'Expense',
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [income, expenses]);

  if (loading) {
    return (
      <MainLayout>
        <div className="text-white p-8">Loading Finance...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-5xl font-black text-white">Finance</h1>

            <p className="text-zinc-500">Farm Financial Command</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIncomeOpen(true)}
              className="bg-emerald-500 px-5 py-3 rounded-xl"
            >
              <ArrowUpCircle />
            </button>

            <button
              onClick={() => setExpenseOpen(true)}
              className="bg-rose-500 px-5 py-3 rounded-xl"
            >
              <ArrowDownCircle />
            </button>

            <button onClick={closeWeek} className="bg-white text-black px-6 rounded-xl font-black">
              Close Week
            </button>
          </div>
        </div>

        {error && <div className="bg-yellow-500/20 text-yellow-300 p-4 rounded-xl">{error}</div>}

        <div className="grid md:grid-cols-5 gap-5">
          <Card title="Income" value={`R ${totalIncome}`} icon={<TrendingUp />} />
          <Card title="Expenses" value={`R ${totalExpenses}`} icon={<TrendingDown />} />
          <Card title="Profit" value={`R ${profit}`} icon={<Wallet />} />
          <Card title="Cash Out" value={`R ${summary.cash_out || 0}`} icon={<Archive />} />
          <Card title="Transactions" value={ledger.length} icon={<Calendar />} />
        </div>

        <div className="bg-zinc-900 rounded-3xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-6">Date</th>
                <th>Source</th>
                <th>Type</th>
                <th className="text-right pr-6">Amount</th>
              </tr>
            </thead>

            <tbody>
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center text-zinc-500 p-10">
                    No transactions found
                  </td>
                </tr>
              ) : (
                ledger.map((row, index) => (
                  <tr key={`${row.type}-${row.id || index}`} className="border-t border-white/5">
                    <td className="p-6 text-zinc-400">{row.date}</td>

                    <td className="text-white">{row.source || row.description || '-'}</td>

                    <td>
                      <span
                        className={row.type === 'Income' ? 'text-emerald-400' : 'text-rose-400'}
                      >
                        {row.type}
                      </span>
                    </td>

                    <td
                      className={`text-right pr-6 font-black ${
                        row.type === 'Income' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      R {row.amount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

function Card({ title, value, icon }) {
  return (
    <div className="bg-zinc-900 p-6 rounded-3xl">
      {icon}
      <p className="mt-3 text-zinc-500">{title}</p>
      <h2 className="text-3xl font-black text-white">{value}</h2>
    </div>
  );
}

function IncomeModal({ open, close, form, setForm, save }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center" onClick={close}>
      <div className="w-[420px] bg-zinc-900 p-8 rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between mb-6">
          <h2 className="text-white text-xl font-black">Cash In</h2>

          <button onClick={close}>
            <X />
          </button>
        </div>

        <input
          type="number"
          value={form.amount}
          placeholder="Amount"
          onChange={(e) =>
            setForm({
              ...form,
              amount: e.target.value,
            })
          }
          className="w-full mb-4 p-4 rounded-xl bg-black text-white"
        />

        <input
          value={form.source}
          placeholder="Source"
          onChange={(e) =>
            setForm({
              ...form,
              source: e.target.value,
            })
          }
          className="w-full mb-4 p-4 rounded-xl bg-black text-white"
        />

        <button onClick={save} className="w-full bg-emerald-500 p-4 rounded-xl font-black">
          Save Income
        </button>
      </div>
    </div>
  );
}
