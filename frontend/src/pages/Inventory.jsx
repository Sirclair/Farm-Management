import React, { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import MainLayout from '../layouts/MainLayout';
import AddStockModal from '../components/AddStockModal';
import UseStockModal from '../components/UseStockModal';
import {
  Plus,
  RefreshCw,
  AlertTriangle,
  Layers,
  CircleDollarSign,
  Gauge,
  ShoppingBag,
  Flame,
  Radio,
} from 'lucide-react';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUseOpen, setIsUseOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  /* =====================================================
      FETCH INVENTORY
  ===================================================== */
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/my-farm/inventory/items/');
      setItems(res.data?.results ?? res.data ?? []);
    } catch (err) {
      console.error('Inventory fetch failed', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  /* =====================================================
      DERIVED DATA & OPERATIONAL INTELLIGENCE
  ===================================================== */
  const feedReserve = useMemo(() => {
    return items
      .filter((i) => i.category?.toLowerCase() === 'feed')
      .reduce((acc, i) => acc + Number(i.current_level || 0), 0);
  }, [items]);

  const lowStockItems = useMemo(() => {
    return items.filter((i) => Number(i.current_level || 0) <= Number(i.min_stock_level || 0));
  }, [items]);

  const totalValue = useMemo(() => {
    return items.reduce(
      (acc, i) => acc + Number(i.current_level || 0) * Number(i.cost_per_unit || 0),
      0
    );
  }, [items]);

  /* =====================================================
      AUTO REORDER PIPELINE
  ===================================================== */
  const handleAutoReorder = async (item) => {
    try {
      const suggestedQty = Math.max(
        item.min_stock_level * 2 - item.current_level,
        item.min_stock_level
      );

      await api.post('/api/my-farm/inventory/reorder/', {
        itemId: item.id,
        quantity: suggestedQty,
      });

      fetchInventory();
    } catch (err) {
      console.error('Automated reorder execution failed:', err);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <div className="w-16 h-16 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin mb-6" />
          <p className="text-emerald-500 font-black uppercase tracking-[0.4em] text-[10px]">
            Analyzing Stock Reserves
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* BACKGROUND GRAPHICS */}
      <div className="fixed inset-0 bg-[#020617] -z-20" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] -z-10 bg-gradient-to-b from-emerald-500/5 to-transparent blur-[140px] rounded-full" />

      {/* MODAL COMPONENTS */}
      <AddStockModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={fetchInventory}
      />

      <UseStockModal
        isOpen={isUseOpen}
        onClose={() => setIsUseOpen(false)}
        onRefresh={fetchInventory}
        selectedItem={selectedItem}
      />

      <div className="max-w-[1600px] mx-auto px-10 py-12 text-white">
        {/* =====================================================
            HEADER SECTION
        ===================================================== */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <div className="flex items-center gap-3 text-emerald-500 font-black tracking-[0.4em] text-[10px] uppercase mb-4">
              <div className="h-[1px] w-12 bg-emerald-500" />
              Resource Stockpile Control
            </div>

            <h1 className="text-6xl font-black tracking-tighter italic uppercase text-white">
              Farm{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                Inventory
              </span>
            </h1>

            <p className="text-zinc-500 font-bold text-[11px] uppercase tracking-widest mt-4">
              Real-time Asset Allocation & Diagnostics
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAddOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-black px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-3"
            >
              <Plus size={18} />
              Add New Stock
            </button>

            <button
              onClick={fetchInventory}
              className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors"
            >
              <RefreshCw size={20} className="text-zinc-400" />
            </button>
          </div>
        </div>

        {/* =====================================================
            METRIC HERO CARDS
        ===================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard
            title="Feed Reserve"
            value={`${feedReserve.toLocaleString()} KG`}
            subtext="Aggregated across active batch houses"
            icon={<Layers size={20} />}
          />

          <StatCard
            title="Depleted Lines"
            value={lowStockItems.length}
            subtext="Items breaking minimum safety boundaries"
            danger={lowStockItems.length > 0}
            icon={<AlertTriangle size={20} />}
          />

          <StatCard
            title="Asset Evaluation"
            value={`R ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            subtext="Current stockpile cumulative book value"
            icon={<CircleDollarSign size={20} />}
          />
        </div>

        {/* =====================================================
            HIGH-FIDELITY NOTIFICATION SCREEN
        ===================================================== */}
        {lowStockItems.length > 0 && (
          <div className="mb-16 bg-gradient-to-b from-[#160707] to-[#0a0a0a] border border-red-500/20 rounded-[40px] p-10 shadow-[0_0_50px_rgba(239,68,68,0.05)] backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 blur-[100px] -z-10 rounded-full" />

            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                  <Flame size={18} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight italic">
                    Critical System Deficits & Action Required
                  </h2>
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-1 flex items-center gap-1.5">
                    <Radio size={10} className="text-red-500 animate-pulse" /> Status: Operational
                    Risk Found
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-black text-red-400 bg-red-500/10 px-3 py-1 rounded-md uppercase border border-red-500/20 font-mono tracking-widest">
                {lowStockItems.length} Warnings Active
              </span>
            </div>

            {/* Notification Table Core */}
            <div className="space-y-3">
              <div className="grid grid-cols-12 px-6 text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2 select-none">
                <div className="col-span-6">Label / Identifier</div>
                <div className="col-span-4">Alert Level / Status</div>
                <div className="col-span-2 text-right">Action Threshold</div>
              </div>

              {lowStockItems.map((item) => {
                const current = Number(item.current_level || 0);
                const minimum = Number(item.min_stock_level || 1);
                const percent = Math.min(100, (current / (minimum * 2)) * 100);
                const isCritical = current <= minimum / 2;

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 items-center px-6 py-5 bg-black/40 border border-white/5 hover:border-red-500/20 rounded-2xl transition-all duration-300 group"
                  >
                    <div className="col-span-6 pr-4">
                      <h4 className="text-base font-black text-white group-hover:text-red-400 transition-colors uppercase tracking-tight">
                        {item.name}{' '}
                        <span className="text-[10px] font-bold text-zinc-500 normal-case italic">
                          — Critically Low Stock
                        </span>
                      </h4>
                      <p className="text-[11px] font-mono font-bold text-zinc-400 mt-1">
                        Current Stock:{' '}
                        <span className="text-white font-black">
                          {current.toLocaleString()} {item.unit_of_measure || 'KG'}
                        </span>
                      </p>
                    </div>

                    <div className="col-span-4 pr-8">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-wider mb-2">
                        <span className={isCritical ? 'text-red-500' : 'text-orange-400'}>
                          {isCritical ? 'CRITICAL SYSTEM EXPIRY' : 'ALERT LEVEL'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden p-[1px]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCritical
                              ? 'bg-gradient-to-r from-red-600 to-rose-500 shadow-[0_0_10px_#f43f5e]'
                              : 'bg-gradient-to-r from-orange-500 to-red-500 shadow-[0_0_10px_#f97316]'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center justify-end gap-4">
                      <span className="text-[10px] font-black font-mono text-zinc-500 uppercase tracking-tight whitespace-nowrap">
                        MIN: {minimum} {item.unit_of_measure || 'KG'}
                      </span>
                      <button
                        onClick={() => handleAutoReorder(item)}
                        className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-black border border-red-500/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-lg flex items-center gap-1.5 shrink-0"
                      >
                        <ShoppingBag size={11} />
                        Reorder
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =====================================================
            MAIN INVENTORY CONTAINER MATRIX
        ===================================================== */}
        <h2 className="text-white text-xl font-black flex items-center gap-4 uppercase italic mb-8">
          <Gauge size={22} className="text-emerald-500" />
          Resource Matrix Logs
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item) => {
            const current = Number(item.current_level || 0);
            const minimum = Number(item.min_stock_level || 1);
            const isLow = current <= minimum;
            const percent = Math.min(100, (current / (minimum * 2)) * 100);

            return (
              <div
                key={item.id}
                className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:border-white/10 transition-all duration-300"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[9px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/10">
                        {item.category || 'General'}
                      </span>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight italic mt-3 group-hover:text-emerald-400 transition-colors">
                        {item.name}
                      </h3>
                    </div>

                    {isLow ? (
                      <span className="text-[9px] font-black tracking-wider text-red-400 bg-red-500/10 px-3 py-1 rounded-full uppercase border border-red-500/20 animate-pulse">
                        Deficit
                      </span>
                    ) : (
                      <span className="text-[9px] font-black tracking-wider text-zinc-500 bg-white/5 px-3 py-1 rounded-full uppercase">
                        Nominal
                      </span>
                    )}
                  </div>

                  <div className="my-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black tracking-tight font-mono text-white">
                        {current.toLocaleString()}
                      </span>
                      <span className="text-zinc-500 font-bold uppercase text-[11px] tracking-widest">
                        {item.unit_of_measure || 'Units'}
                      </span>
                    </div>
                    <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-wider mt-1">
                      Unit Cost: R {Number(item.cost_per_unit || 0).toFixed(2)} /{' '}
                      {item.unit_of_measure || 'Unit'}
                    </p>
                  </div>

                  <div className="space-y-2 mb-8">
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isLow
                            ? 'bg-gradient-to-r from-red-500 to-orange-500'
                            : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] uppercase tracking-wider font-bold text-zinc-500">
                      <span>Reserve Gauge</span>
                      <span>Min Safe Level: {minimum}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 pt-4 border-t border-white/5">
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setIsUseOpen(true);
                    }}
                    className="col-span-6 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    Log Allocation
                  </button>

                  {isLow ? (
                    <button
                      onClick={() => handleAutoReorder(item)}
                      className="col-span-6 bg-emerald-500 hover:bg-emerald-400 text-black py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                    >
                      <ShoppingBag size={12} />
                      Reorder
                    </button>
                  ) : (
                    <div className="col-span-6 flex items-center justify-center text-zinc-600 font-black text-[9px] uppercase tracking-widest bg-zinc-950/40 rounded-xl border border-white/5 select-none">
                      Secured
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}

function StatCard({ title, value, icon, danger, subtext }) {
  return (
    <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[32px] shadow-xl relative overflow-hidden group">
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div
          className={`p-3 rounded-2xl ${danger ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-zinc-400'}`}
        >
          {icon}
        </div>
        <div
          className={`text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded border ${
            danger
              ? 'border-red-500/20 bg-red-500/10 text-red-400'
              : 'border-emerald-500/10 bg-emerald-500/5 text-emerald-400'
          }`}
        >
          {danger ? 'Anomaly Alert' : 'System Sync'}
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-1">
          {title}
        </p>
        <h2
          className={`text-4xl font-black tracking-tight ${danger ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-600' : 'text-white'}`}
        >
          {value}
        </h2>
        <p className="text-zinc-600 font-medium text-[11px] mt-2 italic">{subtext}</p>
      </div>

      <div className="absolute -right-6 -bottom-6 text-white/[0.02] text-7xl font-black italic select-none group-hover:scale-105 transition-transform duration-500">
        CTRL
      </div>
    </div>
  );
}
