import { useEffect, useMemo, useState, useCallback } from 'react';
import api from '../api/axios';

import MainLayout from '../layouts/MainLayout';
import AddStockModal from '../components/AddStockModal';
import UseStockModal from '../components/UseStockModal';

import { Package, Plus, Database, Scale, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

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

    const value = items.reduce(
      (sum, i) => sum + Number(i.current_level || 0) * Number(i.cost_per_unit || 0),
      0
    );

    return {
      total,
      value,
      count: items.length,
    };
  }, [items]);

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
      <div className="min-h-screen bg-[#05070a] text-zinc-100 p-4 sm:p-6 lg:p-8">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-zinc-900">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Inventory
            </h1>
            <p className="text-sm text-zinc-400 mt-1">Central Stock Registry & Live Analytics</p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-zinc-950 px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10 text-sm uppercase tracking-wider"
          >
            <Plus size={18} className="stroke-[3]" />
            Add Stock
          </button>
        </div>

        {/* ERROR DISPLAY */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2 animate-in fade-in duration-200">
            <AlertTriangle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TOP LEVEL ANALYTICS METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-8">
          <Metric
            title="Total Stock Volume"
            value={metrics.total.toLocaleString()}
            icon={<Scale size={20} />}
            variant="emerald"
          />
          <Metric
            title="Estimated Total Value"
            value={`R ${metrics.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<Package size={20} />}
            variant="blue"
          />
          <Metric
            title="Unique Tracked Items"
            value={metrics.count}
            icon={<Database size={20} />}
            variant="purple"
          />
        </div>

        {/* DYNAMIC CARDS ENGINE */}
        {loading ? (
          /* SKELETON LOADER */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-[#0b0f14] p-6 rounded-2xl border border-zinc-900/60 space-y-4 animate-pulse"
              >
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
                  <div className="h-4 bg-zinc-800 rounded w-12"></div>
                </div>
                <div className="h-7 bg-zinc-800 rounded w-3/4 mt-2"></div>
                <div className="h-10 bg-zinc-800 rounded w-1/2 mt-4"></div>
                <div className="h-4 bg-zinc-800 rounded w-2/5 mt-2"></div>
                <div className="h-11 bg-zinc-800/50 rounded-xl w-full mt-4"></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          /* EMPTY STATE */
          <div className="bg-[#0b0f14] rounded-2xl border border-zinc-900 p-12 text-center max-w-xl mx-auto mt-10">
            <div className="p-4 rounded-full bg-zinc-900 inline-block text-zinc-500 mb-4">
              <Package size={32} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Stock Items Available</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Get started by creating your very first inventory stock record item.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border border-zinc-700/50"
            >
              Add Initial Item
            </button>
          </div>
        ) : (
          /* MAIN GRID CARD RENDERING */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {items.map((item) => {
              const stock = Number(item.current_level);
              const cost = Number(item.cost_per_unit);
              const min = Number(item.min_stock_level);
              const low = stock <= min;

              // -----------------------------------------------------------
              // NEW VISUAL TRACKING BAR LOGIC
              // Since the API doesn't provide a 'max_stock', we establish a meaningful upper bound
              // for visual comparison based logically on the user-defined min alert level.
              // We'll visualize the current stock relative to 3x the minimum alert level.
              // -----------------------------------------------------------
              const visualUpperBound = Math.max(min * 3, stock);
              const percentageFilled = visualUpperBound > 0 ? (stock / visualUpperBound) * 100 : 0;
              const boundedFill = Math.min(Math.max(percentageFilled, 0), 100); // Visual sanity clamp

              // Define tracking bar colors based on danger thresholds
              let trackingBarColor = 'bg-emerald-500'; // Default Healthy
              if (low) {
                trackingBarColor = 'bg-red-500 shadow-lg shadow-red-500/20'; // Critical
              } else if (stock <= min * 1.5) {
                trackingBarColor = 'bg-amber-500'; // Getting Low warning buffer (within 50% above min)
              }
              // -----------------------------------------------------------

              return (
                <div
                  key={item.id}
                  className="bg-[#0b0f14] hover:bg-[#0f141a] p-5 sm:p-6 rounded-2xl border border-zinc-900 hover:border-zinc-800/80 transition-all flex flex-col justify-between group shadow-xl relative overflow-hidden"
                >
                  <div>
                    {/* BADGE BAR */}
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[11px] font-bold tracking-widest uppercase text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800/50 max-w-[160px] truncate">
                        {item.category}
                      </span>

                      {low ? (
                        <span className="flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider animate-pulse">
                          <AlertTriangle size={11} /> Low Stock
                        </span>
                      ) : stock <= min * 1.5 ? (
                        <span className="flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                          <AlertTriangle size={11} /> Buffer
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                          <CheckCircle size={11} /> Status OK
                        </span>
                      )}
                    </div>

                    {/* CONTENT DETAILS */}
                    <h2 className="mt-5 text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors truncate">
                      {item.name}
                    </h2>

                    {/* COUNT LEVEL UNIT */}
                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {stock.toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-900/40 px-1.5 py-0.5 rounded border border-zinc-800/30">
                        {item.inventory_unit}
                      </span>
                    </div>

                    {/* --- NEW VISUAL TRACKING BAR INSERTION --- */}
                    <div className="mt-6">
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ease-out ${trackingBarColor}`}
                          style={{ width: `${boundedFill}%` }}
                        />
                      </div>
                    </div>
                    {/* ------------------------------------------- */}
                  </div>

                  {/* BOTTOM ACTION LAYOUT BLOCK */}
                  <div className="mt-6 pt-4 border-t border-zinc-900/80 flex flex-col gap-4">
                    <div className="flex justify-between items-center text-xs text-zinc-400">
                      <span>Valuation</span>
                      <span className="font-mono text-sm font-semibold text-zinc-300">
                        R{' '}
                        {(stock * cost).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <button
                      onClick={() => openUseStockModal(item)}
                      className="w-full bg-zinc-900 hover:bg-emerald-500 text-zinc-300 hover:text-zinc-950 border border-zinc-800 hover:border-emerald-500 py-2.5 rounded-xl font-bold transition-all text-xs uppercase tracking-wider active:scale-[0.99]"
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

function Metric({ title, value, icon, variant }) {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };

  return (
    <div className="bg-[#0b0f14] p-5 rounded-2xl border border-zinc-900 flex items-center gap-4 shadow-xl">
      <div
        className={`p-3 rounded-xl border ${colorMap[variant] || 'text-zinc-400 bg-zinc-900 border-zinc-800'} shrink-0`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 truncate">
          {title}
        </div>
        <div className="text-2xl font-black text-white tracking-tight mt-0.5 truncate">{value}</div>
      </div>
    </div>
  );
}
