import { useEffect, useMemo, useState, useCallback } from 'react';
import api from '../api/axios';

import MainLayout from '../layouts/MainLayout';
import AddStockModal from '../components/AddStockModal';
import UseStockModal from '../components/UseStockModal';

import { Package, Plus, Database, Scale, AlertTriangle, CheckCircle, Boxes } from 'lucide-react';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [error, setError] = useState('');

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [stockRes, historyRes] = await Promise.all([
        api.get('/api/my-farm/inventory/items/'),
        api.get('/api/my-farm/inventory/purchases/'),
      ]);

      setItems(stockRes.data?.results || stockRes.data || []);
      setPurchaseHistory(historyRes.data?.results || historyRes.data || []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed loading inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const metrics = useMemo(() => {
    const total = items.reduce((sum, i) => sum + Number(i.current_level || 0), 0);
    const currentValue = items.reduce(
      (sum, i) => sum + Number(i.current_level || 0) * Number(i.cost_per_unit || 0),
      0
    );

    const historicalCost =
      purchaseHistory.length > 0
        ? purchaseHistory.reduce((sum, p) => sum + Number(p.total_cost || 0), 0)
        : currentValue;

    return {
      total,
      currentValue,
      historicalCost,
      count: items.length,
    };
  }, [items, purchaseHistory]);

  const openUseStockModal = (item) => {
    setSelectedItem({
      id: item.id,
      name: item.name,
      currentLevel: item.current_level,
      unit: item.inventory_unit,
    });
  };

  return (
    <MainLayout>
      {/* SYSTEM BACKGROUND GRID */}
      <div className="fixed inset-0 bg-[#020617] -z-10">
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle,_#22c55e_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-10 text-white">
        {/* ========================================================= */}
        {/* HEADER SECTION */}
        {/* ========================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14">
          <div>
            <div className="text-emerald-400 text-[10px] uppercase tracking-[0.35em] font-black flex items-center gap-3">
              <span className="h-[1px] w-10 bg-emerald-400" />
              STOCK REGISTRY ACTIVE
            </div>

            <h1 className="text-5xl font-black italic uppercase tracking-tighter mt-4">
              CENTRAL <span className="text-emerald-400">INVENTORY</span>
            </h1>

            <div className="flex items-center gap-3 mt-3 text-zinc-500 text-[11px] uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              LOGISTICS ONLINE • {new Date().toLocaleDateString()}
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="bg-emerald-500 text-black hover:bg-emerald-400 px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-wider transition-all shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-2"
          >
            <Plus size={18} className="stroke-[3]" />
            Add Stock
          </button>
        </div>

        {/* ERROR DISPLAY */}
        {error && (
          <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-3 animate-in fade-in duration-200">
            <AlertTriangle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* TOP LEVEL ANALYTICS METRICS */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Metric
            title="Total Stock Volume"
            value={metrics.total.toLocaleString()}
            icon={<Scale size={20} />}
            variant="emerald"
            sub="Items on hand"
          />
          <Metric
            title="Current Stock Value"
            value={`R ${metrics.currentValue.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<Package size={20} />}
            variant="blue"
            sub="Live inventory valuation"
          />
          <Metric
            title="Total Capital Invested"
            value={`R ${metrics.historicalCost.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<Database size={20} />}
            variant="purple"
            sub="Historical batch spend"
          />
          <Metric
            title="Unique Tracked Items"
            value={metrics.count}
            icon={<Boxes size={20} />}
            variant="zinc"
            sub="Distinct stock definitions"
          />
        </div>

        {/* ========================================================= */}
        {/* DYNAMIC CARDS ENGINE */}
        {/* ========================================================= */}
        {loading ? (
          /* SKELETON LOADER */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white/5 backdrop-blur-xl p-8 rounded-[32px] border border-white/[0.02] space-y-4 animate-pulse"
              >
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
                  <div className="h-4 bg-zinc-800 rounded w-12"></div>
                </div>
                <div className="h-8 bg-zinc-800 rounded w-3/4 mt-4"></div>
                <div className="h-12 bg-zinc-800 rounded w-1/2 mt-4"></div>
                <div className="h-2 bg-zinc-800 rounded w-full mt-6"></div>
                <div className="h-12 bg-zinc-800/50 rounded-2xl w-full mt-6"></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          /* EMPTY STATE */
          <div className="bg-white/5 backdrop-blur-xl rounded-[40px] border border-white/5 p-16 text-center max-w-xl mx-auto mt-10 shadow-2xl">
            <div className="p-5 rounded-2xl bg-white/5 inline-block text-zinc-500 mb-6">
              <Package size={36} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">
              No Stock Available
            </h3>
            <p className="text-sm text-zinc-400 font-medium mb-8 max-w-sm mx-auto leading-relaxed">
              Get started by registering your very first core warehouse stock item architecture.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-white/5 hover:bg-white/10 text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors border border-white/5"
            >
              Add Initial Item
            </button>
          </div>
        ) : (
          /* MAIN GRID CARD RENDERING */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const stock = Number(item.current_level);
              const cost = Number(item.cost_per_unit);
              const min = Number(item.min_stock_level);
              const low = stock <= min;

              const visualUpperBound = Math.max(min * 3, stock);
              const percentageFilled = visualUpperBound > 0 ? (stock / visualUpperBound) * 100 : 0;
              const boundedFill = Math.min(Math.max(percentageFilled, 0), 100);

              let trackingBarColor = 'bg-emerald-500';
              if (low) {
                trackingBarColor = 'bg-red-500 shadow-lg shadow-red-500/20';
              } else if (stock <= min * 1.5) {
                trackingBarColor = 'bg-amber-500';
              }

              return (
                <div
                  key={item.id}
                  className="bg-white/5 backdrop-blur-xl p-8 rounded-[32px] border border-white/[0.02] hover:border-white/10 transition-all flex flex-col justify-between group shadow-2xl"
                >
                  <div>
                    {/* BADGE BAR */}
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-[10px] font-black tracking-[0.15em] uppercase text-zinc-400 bg-black/20 px-3 py-1 rounded-md border border-white/5 max-w-[160px] truncate">
                        {item.category || 'Unassigned'}
                      </span>

                      {low ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
                          <AlertTriangle size={12} /> Low
                        </span>
                      ) : stock <= min * 1.5 ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                          <AlertTriangle size={12} /> Buffer
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                          <CheckCircle size={12} /> Stable
                        </span>
                      )}
                    </div>

                    {/* CONTENT DETAILS */}
                    <h2 className="mt-6 text-2xl font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors truncate uppercase italic">
                      {item.name}
                    </h2>

                    {/* COUNT LEVEL UNIT */}
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-4xl font-black tracking-tighter text-white">
                        {stock.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-black/20 px-2 py-0.5 rounded border border-white/5">
                        {item.inventory_unit}
                      </span>
                    </div>

                    {/* VISUAL TRACKING BAR */}
                    <div className="mt-6">
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ease-out ${trackingBarColor}`}
                          style={{ width: `${boundedFill}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM ACTION LAYOUT BLOCK */}
                  <div className="mt-8 pt-5 border-t border-white/[0.02] flex flex-col gap-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                        Valuation
                      </span>
                      <span className="font-semibold text-zinc-300 text-sm">
                        R{' '}
                        {(stock * cost).toLocaleString('en-ZA', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <button
                      onClick={() => openUseStockModal(item)}
                      className="w-full bg-white/5 hover:bg-emerald-500 text-zinc-300 hover:text-black border border-white/5 hover:border-emerald-500 py-3.5 rounded-2xl font-black transition-all text-[11px] uppercase tracking-wider"
                    >
                      Use Stock Allocation
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SYSTEM OVERLAY MODALS */}
        <AddStockModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={fetchInventory}
        />

        <UseStockModal
          isOpen={!!selectedItem}
          selectedItem={selectedItem}
          onClose={() => setSelectedItem(null)}
          onRefresh={fetchInventory}
        />
      </div>
    </MainLayout>
  );
}

// =========================================================
// SYSTEM METRIC COMPONENT
// =========================================================
function Metric({ title, value, icon, variant, sub }) {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    zinc: 'text-zinc-400 bg-white/5 border-white/5',
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[24px] border border-white/[0.02] flex items-center gap-5 shadow-2xl">
      <div className={`p-4 rounded-2xl border ${colorMap[variant] || colorMap.zinc} shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 mb-0.5">
          {title}
        </p>
        <h2 className="text-3xl font-black tracking-tighter text-white truncate">{value}</h2>
        <p className="text-[11px] text-zinc-500 font-bold mt-1 italic truncate">{sub}</p>
      </div>
    </div>
  );
}
