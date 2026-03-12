import React, { useEffect, useState, useMemo } from 'react';
import api from "../api/axios";
import MainLayout from "../layouts/MainLayout";
import { Wallet, TrendingDown, Receipt, PieChart, Plus } from 'lucide-react';

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const fetchExpenses = async () => {
        try {
            const res = await api.get("my-farm/finance/expenses/");
            setExpenses(res.data.results || res.data || []);
        } catch (error) {
            console.error("Finance error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchExpenses(); }, []);

    const totals = useMemo(() => {
        const total = expenses.reduce((acc, e) => acc + parseFloat(e.amount), 0);
        const feed = expenses.filter(e => e.category === 'feed').reduce((acc, e) => acc + parseFloat(e.amount), 0);
        const health = expenses.filter(e => e.category === 'medical').reduce((acc, e) => acc + parseFloat(e.amount), 0);
        return { total, feed, health, other: total - (feed + health) };
    }, [expenses]);

    const filteredExpenses = expenses.filter(e => filter === 'all' || e.category === filter);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-50 font-black text-slate-900 italic animate-pulse tracking-widest uppercase">
            ESTABLISHING FINANCIAL LEDGER...
        </div>
    );

    return (
        <MainLayout>
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                        Expense <span className="text-rose-600">Ledger</span>
                    </h1>
                    <p className="text-slate-500 font-black uppercase text-[11px] tracking-[0.2em] mt-2">Financial Outflow Tracking</p>
                </div>
                
                <div className="flex gap-4">
                    <select 
                        className="px-6 py-4 bg-white rounded-2xl border-none shadow-xl shadow-slate-200/50 text-[11px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer transition-all"
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        <option value="feed">Feed Stock</option>
                        <option value="medical">Health/Med</option>
                        <option value="utilities">Utilities</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <FinanceCard title="Total Burn" value={`R ${totals.total.toLocaleString()}`} icon={<Wallet size={24} />} color="rose" />
                <FinanceCard title="Feed Spend" value={`R ${totals.feed.toLocaleString()}`} icon={<TrendingDown size={24} />} color="amber" />
                <FinanceCard title="Medical Cost" value={`R ${totals.health.toLocaleString()}`} icon={<PieChart size={24} />} color="blue" />
                <FinanceCard title="Avg. Ticket" value={`R ${(totals.total / (expenses.length || 1)).toFixed(2)}`} icon={<Receipt size={24} />} color="slate" />
            </div>

            <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                            <th className="px-10 py-8 text-center">Date</th>
                            <th className="px-10 py-8">Identity / Title</th>
                            <th className="px-10 py-8">Category</th>
                            <th className="px-10 py-8 text-right">Value Out</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredExpenses.map((exp) => (
                            <tr key={exp.id} className="hover:bg-slate-50/80 transition-all group">
                                <td className="px-10 py-7 font-black text-slate-500 text-[12px] italic text-center">
                                    {new Date(exp.date).toLocaleDateString('en-GB')}
                                </td>
                                <td className="px-10 py-7">
                                    <p className="font-black text-slate-900 uppercase text-sm tracking-tighter">
                                        {exp.title || "Untitled Expense"}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                                        {exp.description || "No description provided"}
                                    </p>
                                </td>
                                <td className="px-10 py-7">
                                    <span className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest ${
                                        exp.category === 'feed' ? 'bg-amber-100 text-amber-700' : 
                                        exp.category === 'medical' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                                    }`}>
                                        {exp.category}
                                    </span>
                                </td>
                                <td className="px-10 py-7 text-right">
                                    <span className="font-black text-rose-600 text-lg italic tracking-tighter">
                                        - R {parseFloat(exp.amount).toLocaleString()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </MainLayout>
    );
}

function FinanceCard({ title, value, icon, color }) {
    const theme = {
        rose: "bg-rose-50 text-rose-600",
        amber: "bg-amber-50 text-amber-600",
        blue: "bg-blue-50 text-blue-600",
        slate: "bg-slate-50 text-slate-600"
    };

    return (
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 flex flex-col gap-4 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${theme[color]}`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
                <h4 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">{value}</h4>
            </div>
        </div>
    );
}