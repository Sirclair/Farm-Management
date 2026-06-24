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
} from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);

  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);

  const [expenseOpen, setExpenseOpen] = useState(false);

  const [incomeOpen, setIncomeOpen] = useState(false);

  const [cashOutLoading, setCashOutLoading] = useState(false);

  const [incomeForm, setIncomeForm] = useState({
    amount: '',
    source: '',
    date: new Date().toISOString().split('T')[0],
  });

  // ==================
  // LOAD DATA
  // ==================

  const fetchData = async () => {
    try {
      const [expenseRes, incomeRes, summaryRes] = await Promise.all([
        api.get('/api/my-farm/finance/expenses/'),

        api.get('/api/my-farm/finance/income/'),

        api.get('/api/my-farm/finance/finance/summary/'),
      ]);

      setExpenses(expenseRes.data.results || expenseRes.data || []);

      setIncome(incomeRes.data.results || incomeRes.data || []);

      setSummary(summaryRes.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==================
  // SAVE INCOME
  // ==================

  const saveIncome = async () => {
    try {
      await api.post('/api/my-farm/finance/income/', incomeForm);

      setIncomeOpen(false);

      setIncomeForm({
        amount: '',
        source: '',
        date: new Date().toISOString().split('T')[0],
      });

      fetchData();
    } catch (err) {
      console.log(err);
    }
  };

  // ==================
  // CLOSE WEEK
  // ==================

  const closeWeek = async () => {
    const value = prompt('Enter cash out amount');

    if (value === null) return;

    try {
      setCashOutLoading(true);

      await api.post('/api/my-farm/finance/finance/close-week/', {
        cash_out: Number(value),
      });

      fetchData();

      alert('Week closed');
    } catch (err) {
      console.log(err);
    } finally {
      setCashOutLoading(false);
    }
  };

  const transactionCount = expenses.length + income.length;

  const totalIncome = useMemo(() => income.reduce((a, b) => a + Number(b.amount), 0), [income]);

  if (loading) {
    return (
      <MainLayout>
        <div className="text-white">Loading Finance...</div>
      </MainLayout>
    );
  }

  const ledger = [
    ...income.map((i) => ({
      ...i,
      type: 'income',
    })),

    ...expenses.map((e) => ({
      ...e,
      type: 'expense',
    })),
  ];

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* HEADER */}

        <div className="flex justify-between">
          <div>
            <h1 className="text-5xl font-black text-white">Finance</h1>

            <p className="text-zinc-500">Farm Financial Control</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIncomeOpen(true)}
              className="
              bg-emerald-500
              px-5
              rounded-xl
              "
            >
              <ArrowUpCircle />
            </button>

            <button
              onClick={() => setExpenseOpen(true)}
              className="
              bg-rose-500
              px-5
              rounded-xl
              "
            >
              <ArrowDownCircle />
            </button>

            <button
              onClick={closeWeek}
              disabled={cashOutLoading}
              className="
              bg-white
              text-black
              px-6
              rounded-xl
              font-black
              "
            >
              Close Week
            </button>
          </div>
        </div>

        {/* CARDS */}

        <div className="grid md:grid-cols-5 gap-5">
          <Card icon={<TrendingUp />} title="Income" value={`R ${summary?.total_income || 0}`} />

          <Card
            icon={<TrendingDown />}
            title="Expenses"
            value={`R ${summary?.total_expenses || 0}`}
          />

          <Card icon={<Wallet />} title="Profit" value={`R ${summary?.net_profit || 0}`} />

          <Card icon={<Archive />} title="Cash Out" value={`R ${summary?.cash_out || 0}`} />

          <Card icon={<Calendar />} title="Transactions" value={transactionCount} />
        </div>

        {/* PERIOD */}

        <div className="bg-zinc-900 rounded-3xl p-6">
          <h2 className="text-white font-black">Current Period</h2>

          <div className="text-zinc-400 mt-2">{summary?.period?.name}</div>

          <div className="text-emerald-400 mt-1">Total Cash In: R {totalIncome}</div>
        </div>

        {/* LEDGER */}

        <div className="bg-zinc-900 rounded-3xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-5 text-left">Type</th>

                <th className="p-5 text-left">Description</th>

                <th className="p-5 text-right">Amount</th>
              </tr>
            </thead>

            <tbody>
              {ledger.map((row) => (
                <tr
                  key={row.type + row.id}
                  className="
                  border-b
                  border-white/5
                  "
                >
                  <td className="p-5">
                    {row.type === 'income' ? (
                      <span className="text-emerald-400">Income</span>
                    ) : (
                      <span className="text-rose-400">Expense</span>
                    )}
                  </td>

                  <td className="p-5 text-white">{row.source || row.description}</td>

                  <td
                    className={`
                    p-5
                    text-right
                    font-black

                    ${row.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}
                  `}
                  >
                    R {row.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EXPENSE */}

      <ExpenseModal
        isOpen={expenseOpen}
        onClose={() => setExpenseOpen(false)}
        onSuccess={fetchData}
      />

      {/* INCOME */}

      {incomeOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <div className="w-[420px] bg-zinc-900 rounded-3xl p-8">
            <h2 className="text-white text-xl font-black mb-6">Cash In</h2>

            <div className="space-y-4">
              <input
                type="number"
                placeholder="Amount"
                value={incomeForm.amount}
                onChange={(e) =>
                  setIncomeForm({
                    ...incomeForm,
                    amount: e.target.value,
                  })
                }
                className="w-full p-4 rounded-xl bg-black text-white"
              />

              <input
                placeholder="Source"
                value={incomeForm.source}
                onChange={(e) =>
                  setIncomeForm({
                    ...incomeForm,
                    source: e.target.value,
                  })
                }
                className="w-full p-4 rounded-xl bg-black text-white"
              />

              <button
                onClick={saveIncome}
                className="
                w-full
                bg-emerald-500
                p-4
                rounded-xl
                font-black
                "
              >
                Save Income
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

function Card({ title, value, icon }) {
  return (
    <div className="bg-zinc-900 rounded-3xl p-6">
      <div className="text-zinc-500">{icon}</div>

      <p className="text-zinc-500 mt-4">{title}</p>

      <h2 className="text-white text-3xl font-black">{value}</h2>
    </div>
  );
}
