import { useEffect, useMemo, useState, useCallback } from 'react';
import api from '../api/axios';

import MainLayout from '../layouts/MainLayout';
import AddStockModal from '../components/AddStockModal';

import { Package, Plus, Database, Scale, ShieldAlert } from 'lucide-react';

/* =========================================================
   INVENTORY PAGE
========================================================= */
export default function Inventory() {
  const [items, setItems] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');

  /* =========================================================
     FETCH INVENTORY
  ========================================================= */
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [stockRes, historyRes] = await Promise.all([
        api.get('/api/my-farm/inventory/items/'),
        api.get('/api/my-farm/inventory/purchases/'),
      ]);

      const stock = stockRes.data?.results || stockRes.data || [];
      const purchases = historyRes.data?.results || historyRes.data || [];

      setItems(Array.isArray(stock) ? stock : []);
      setPurchaseHistory(Array.isArray(purchases) ? purchases : []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || 'Failed loading inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  /* =========================================================
     DASHBOARD METRICS
  ========================================================= */
  const metrics = useMemo(() => {
    const totalKg = items.reduce((sum, item) => sum + Number(item.current_level || 0), 0);

    const value = items.reduce(
      (sum, item) => sum + Number(item.current_level || 0) * Number(item.cost_per_unit || 0),
      0
    );

    return {
      totalKg,
      value,
      count: items.length,
    };
  }, [items]);

  /* =========================================================
     UI
  ========================================================= */
  return (
    <MainLayout>
      <div className="min-h-screen bg-[#05070a] text-white p-6">
        {/* HEADER */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-5xl font-black">Inventory</h1>
            <p className="text-zinc-500 uppercase text-xs tracking-[0.25em] mt-2">
              Central Stockpile Registry
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="
              bg-emerald-500
              hover:bg-emerald-400
              px-6 py-4
              rounded-2xl
              text-black
              font-black
              uppercase
              tracking-widest
              flex items-center gap-2
            "
          >
            <Plus size={18} />
            Add Stock
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-8 p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
            {error}
          </div>
        )}

        {/* METRICS */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <Metric
            title="Total Inventory"
            value={`${metrics.totalKg.toLocaleString()} KG`}
            icon={<Scale />}
          />
          <Metric
            title="Inventory Value"
            value={`R ${metrics.value.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}`}
            icon={<Package />}
          />
          <Metric title="Tracked Items" value={metrics.count} icon={<Database />} />
        </div>

        {/* ITEMS */}
        {loading ? (
          <div className="text-center py-20 text-zinc-500 font-black">Loading Inventory...</div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-white/10 p-20 text-center text-zinc-500">
            No inventory items found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {items.map((item) => {
              const stock = Number(item.current_level || 0);
              const unitCost = Number(item.cost_per_unit || 0);
              const min = Number(item.min_stock_level || 10);

              const assetValue = stock * unitCost;
              const ratio = Math.min((stock / Math.max(min * 3, 1)) * 100, 100);

              const low = stock <= min;

              return (
                <div
                  key={item.id}
                  className="
                    relative overflow-hidden
                    rounded-[36px]
                    bg-[#080b10]
                    border border-white/8
                    p-7
                    transition-all duration-300
                    hover:border-emerald-500/25
                    hover:-translate-y-1
                    hover:shadow-[0_20px_70px_rgba(16,185,129,.08)]
                  "
                >
                  {/* HEADER TAGS */}
                  <div className="flex justify-between">
                    <div className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[9px] font-black tracking-[0.2em] uppercase">
                      {item.category || 'Feed'}
                    </div>

                    <div
                      className={`
                        px-3 py-1 rounded-lg text-[9px] font-black tracking-[0.2em] uppercase
                        ${low ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-zinc-500'}
                      `}
                    >
                      {low ? 'Deficit' : 'Nominal'}
                    </div>
                  </div>

                  {/* NAME */}
                  <h2
                    className={`
                      mt-8 text-3xl font-black uppercase
                      ${low ? 'text-white' : 'text-emerald-400'}
                    `}
                  >
                    {item.name}
                  </h2>

                  {/* STOCK */}
                  <div className="mt-6 flex items-end gap-2">
                    <div className="text-5xl font-black">{stock.toLocaleString()}</div>
                    <div className="text-zinc-500 text-sm mb-2">KG</div>
                  </div>

                  {/* COST */}
                  <div className="mt-4 text-[10px] uppercase tracking-widest text-zinc-600">
                    Unit Cost:
                    <span className="text-zinc-300 ml-2">R {unitCost.toFixed(2)} / KG</span>
                  </div>

                  {/* PROGRESS BAR */}
                  <div className="mt-6">
                    <div className="h-[8px] rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`
                          h-full rounded-full
                          ${
                            low
                              ? 'bg-gradient-to-r from-red-500 to-orange-400'
                              : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                          }
                        `}
                        style={{ width: `${ratio}%` }}
                      />
                    </div>

                    <div className="mt-3 flex justify-between text-[9px] uppercase tracking-widest text-zinc-500">
                      <span>Reserve Gauge</span>
                      <span>Min Safe: {min}</span>
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div className="mt-8 rounded-2xl bg-black/30 border border-white/5 p-4 flex justify-between items-center">
                    <div>
                      <div className="text-[9px] uppercase text-zinc-500">Asset Value</div>

                      <div className="font-black text-white">
                        R{' '}
                        {assetValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </div>

                    <button
                      className={`
                        px-5 py-3 rounded-xl font-black uppercase text-[10px]
                        ${low ? 'bg-emerald-500 text-black' : 'bg-white/5 text-zinc-400'}
                      `}
                    >
                      {low ? 'Reorder' : 'Secured'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL */}
        <AddStockModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            fetchInventory();
            setModalOpen(false);
          }}
        />
      </div>
    </MainLayout>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */
function Metric({ title, value, icon }) {
  return (
    <div className="bg-[#0d0f12] rounded-[28px] border border-white/10 p-6">
      <div className="text-emerald-400 mb-4">{icon}</div>
      <div className="text-zinc-500 text-xs uppercase">{title}</div>
      <div className="text-3xl font-black mt-2">{value}</div>
    </div>
  );
}
