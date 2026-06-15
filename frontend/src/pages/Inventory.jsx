import { useEffect, useMemo, useState, useCallback } from 'react';
import api from '../api/axios';

import MainLayout from '../layouts/MainLayout';
import AddStockModal from '../components/AddStockModal';
import UseStockModal from '../components/UseStockModal';

import { Package, Plus, Database, Scale } from 'lucide-react';

/* =========================================================
   INVENTORY PAGE
========================================================= */
export default function Inventory() {
  const [items, setItems] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
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
     METRICS
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
     OPEN MODAL (SAFE MAPPING)
  ========================================================= */
  const openUseStockModal = (item) => {
    setSelectedItem({
      id: item.id,
      name: item.name,
      currentLevel: item.current_level,
      unitOfMeasure: item.unit_of_measure || 'KG',
    });
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#05070a] text-white p-4 sm:p-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-10">
          <div>
            <h1 className="text-3xl sm:text-5xl font-black">Inventory</h1>
            <p className="text-zinc-500 uppercase text-[10px] sm:text-xs tracking-[0.25em] mt-2">
              Central Stockpile Registry
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="
              bg-emerald-500 hover:bg-emerald-400
              px-5 py-3 sm:px-6 sm:py-4
              rounded-2xl
              text-black font-black uppercase tracking-widest
              flex items-center justify-center gap-2
              w-full sm:w-auto
            "
          >
            <Plus size={18} />
            Add Stock
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-8 p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          <Metric
            title="Total Inventory"
            value={`${metrics.totalKg.toLocaleString()} KG`}
            icon={<Scale />}
          />
          <Metric
            title="Inventory Value"
            value={`R ${metrics.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            icon={<Package />}
          />
          <Metric title="Tracked Items" value={metrics.count} icon={<Database />} />
        </div>

        {/* ITEMS */}
        {loading ? (
          <div className="text-center py-20 text-zinc-500 font-black">Loading Inventory...</div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-white/10 p-16 text-center text-zinc-500">
            No inventory items found
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map((item) => {
              const stock = Number(item.current_level || 0);
              const unitCost = Number(item.cost_per_unit || 0);
              const min = Number(item.min_stock_level || 10);

              const low = stock <= min;
              const ratio = Math.min((stock / Math.max(min * 3, 1)) * 100, 100);
              const assetValue = stock * unitCost;

              return (
                <div
                  key={item.id}
                  className="
                    bg-[#080b10]
                    border border-white/10
                    rounded-3xl
                    p-6
                    hover:border-emerald-500/20
                    transition-all
                  "
                >
                  {/* TOP */}
                  <div className="flex justify-between">
                    <div className="text-emerald-400 text-[10px] uppercase tracking-widest">
                      {item.category || 'Feed'}
                    </div>

                    <div
                      className={`text-[10px] uppercase tracking-widest ${low ? 'text-red-400' : 'text-zinc-500'}`}
                    >
                      {low ? 'Low Stock' : 'Stable'}
                    </div>
                  </div>

                  {/* NAME */}
                  <h2 className="mt-6 text-2xl font-black uppercase">{item.name}</h2>

                  {/* STOCK */}
                  <div className="mt-4 text-4xl font-black">{stock.toLocaleString()} KG</div>

                  {/* BAR */}
                  <div className="mt-5 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${low ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${ratio}%` }}
                    />
                  </div>

                  {/* VALUE */}
                  <div className="mt-6 text-sm text-zinc-400">
                    Value:{' '}
                    <span className="text-white font-bold">
                      R {assetValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* BUTTON (FIXED ON ALL CARDS) */}
                  <button
                    onClick={() => openUseStockModal(item)}
                    className="
                      mt-6 w-full
                      py-3 rounded-xl
                      font-black uppercase text-xs
                      bg-white/5 hover:bg-emerald-500 hover:text-black
                      transition-all
                    "
                  >
                    Use Stock
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ADD STOCK MODAL */}
        <AddStockModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            fetchInventory();
            setModalOpen(false);
          }}
        />

        {/* USE STOCK MODAL */}
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

/* =========================================================
   METRIC
========================================================= */
function Metric({ title, value, icon }) {
  return (
    <div className="bg-[#0d0f12] border border-white/10 rounded-2xl p-5">
      <div className="text-emerald-400 mb-2">{icon}</div>
      <div className="text-xs text-zinc-500 uppercase">{title}</div>
      <div className="text-2xl font-black mt-2">{value}</div>
    </div>
  );
}
