import React, { useEffect, useState, useMemo } from 'react';
import api from "../api/axios";
import MainLayout from "../layouts/MainLayout";
import AddStockModal from "../components/AddStockModal";
import { Plus, ShoppingCart, Activity, AlertCircle, Search, Zap, Filter } from 'lucide-react';

export default function Inventory() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    
    // Search & Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");

    const fetchInventory = async () => {
        try {
            const res = await api.get("my-farm/inventory/items/");
            setItems(res.data.results || res.data || []);
        } catch (error) {
            console.error("Inventory error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInventory(); }, []);

    // Memoized Filtering Logic
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [items, searchQuery, categoryFilter]);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-50 font-black text-emerald-500 italic animate-pulse tracking-[0.3em] uppercase text-xs">
            DECRYPTING ASSET MATRIX...
        </div>
    );

    return (
        <MainLayout>
            <AddStockModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onRefresh={fetchInventory} />

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 gap-6">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                        Resource <span className="text-emerald-500">Stockpile</span>
                    </h1>
                    <p className="text-emerald-600/60 font-black uppercase text-[11px] tracking-[0.2em] mt-2 flex items-center gap-2">
                        <Zap size={12} className="fill-emerald-500 text-emerald-500" />
                        Live Supply Chain Analytics
                    </p>
                </div>

                {/* Search & Action Bar */}
                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                    <div className="relative flex-grow lg:flex-grow-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text"
                            placeholder="FIND ASSET..."
                            className="pl-12 pr-6 py-4 bg-white border-none shadow-xl shadow-slate-200/50 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-emerald-500 w-full lg:w-64 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <select 
                        className="px-6 py-4 bg-white rounded-2xl border-none shadow-xl shadow-slate-200/50 text-[11px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        <option value="feed">Feed Stock</option>
                        <option value="medicine">Medicine</option>
                        <option value="equipment">Equipment</option>
                    </select>

                    <button 
                        onClick={() => setIsAddOpen(true)} 
                        className="px-8 py-4 bg-slate-900 hover:bg-emerald-500 text-white rounded-[24px] font-black text-[10px] tracking-widest shadow-2xl transition-all flex items-center gap-3 group"
                    >
                        <Plus size={18} /> 
                        ADD STOCK
                    </button>
                </div>
            </div>

            {/* Top Cards remain high-visibility */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <InventoryCard 
                    title="Feed Reserve" 
                    value={`${items.filter(i => i.category === 'feed').reduce((acc, i) => acc + Number(i.quantity), 0).toLocaleString()} KG`} 
                    icon={<ShoppingCart size={24} />} 
                    color="emerald" 
                />
                <InventoryCard 
                    title="Bio-Assets" 
                    value={`${items.filter(i => i.category === 'medicine').length} Types`} 
                    icon={<Activity size={24} />} 
                    color="violet" 
                />
                <InventoryCard 
                    title="Critical Alerts" 
                    value={items.filter(i => i.quantity < 5).length} 
                    icon={<AlertCircle size={24} />} 
                    color="orange" 
                />
            </div>

            <div className="bg-white rounded-[48px] border border-emerald-50 shadow-2xl shadow-emerald-100/20 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                            <th className="px-10 py-8">Item Identity</th>
                            <th className="px-10 py-8">Category</th>
                            <th className="px-10 py-8">Current Level</th>
                            <th className="px-10 py-8">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item) => (
                                <tr key={item.id} className="hover:bg-emerald-50/30 transition-all group">
                                    <td className="px-10 py-7">
                                        <span className="font-black text-slate-800 uppercase text-sm tracking-tighter italic">
                                            {item.name}
                                        </span>
                                    </td>
                                    <td className="px-10 py-7">
                                        <span className="font-black text-slate-500 uppercase text-[9px] tracking-widest bg-slate-100 px-3 py-1 rounded-lg group-hover:bg-white transition-colors">
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="px-10 py-7">
                                        <span className={`font-black text-lg italic tracking-tighter ${item.quantity < 5 ? 'text-orange-500' : 'text-emerald-600'}`}>
                                            {item.quantity} <span className="text-[10px] uppercase not-italic ml-1">{item.unit}</span>
                                        </span>
                                    </td>
                                    <td className="px-10 py-7">
                                        <span className={`px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all inline-block ${
                                            item.quantity > 10 
                                            ? 'bg-emerald-500 text-white' 
                                            : 'bg-orange-500 text-white animate-pulse'
                                        }`}>
                                            {item.quantity > 10 ? 'Optimal' : 'Low Stock'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="px-10 py-20 text-center font-black text-slate-300 italic uppercase tracking-widest">
                                    No assets matching search criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </MainLayout>
    );
}

function InventoryCard({ title, value, icon, color }) {
    const themes = {
        emerald: "bg-emerald-50 text-emerald-600",
        violet: "bg-violet-50 text-violet-600",
        orange: "bg-orange-50 text-orange-600"
    };

    return (
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 flex flex-col gap-4 shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 group">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${themes[color]}`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
                <h4 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">{value}</h4>
            </div>
        </div>
    );
}