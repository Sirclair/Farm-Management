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
        api.get('/api/inventory/items/'),
        api.get('/api/inventory/purchases/'),
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

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#05070a] text-white">
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
              px-6
              py-4
              rounded-2xl
              text-black
              font-black
              uppercase
              tracking-widest
              flex
              items-center
              gap-2
            "
          >
            <Plus size={18} />
            Add Stock
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div
            className="
              mb-8
              p-4
              rounded-2xl
              border
              border-red-500/20
              bg-red-500/10
              text-red-300
            "
          >
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
          <div
            className="
              rounded-3xl
              border
              border-white/10
              p-20
              text-center
              text-zinc-500
            "
          >
            No inventory items found
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map((item) => {
              const level = Number(item.current_level);

              const cost = Number(item.cost_per_unit);

              const value = level * cost;

              const lowStock = level <= Number(item.min_stock_level || 50);

              return (
                <div
                  key={item.id}
                  className="
                    bg-[#0d0f12]
                    border
                    border-white/10
                    rounded-[32px]
                    p-6
                  "
                >
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-xl font-black">{item.name}</h3>

                      <div className="text-zinc-500 text-xs">SKU #{item.id}</div>
                    </div>

                    {lowStock && (
                      <div
                        className="
                          flex
                          items-center
                          gap-1
                          text-amber-400
                          text-xs
                        "
                      >
                        <ShieldAlert size={14} />
                        LOW
                      </div>
                    )}
                  </div>

                  <div className="mt-6 space-y-3">
                    <Row label="Stock" value={`${level.toLocaleString()} KG`} />

                    <Row label="Cost" value={`R ${cost.toFixed(2)}/KG`} />

                    <Row
                      label="Value"
                      value={`R ${value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}`}
                    />
                  </div>
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
      </div>
    </MainLayout>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function Metric({ title, value, icon }) {
  return (
    <div
      className="
        bg-[#0d0f12]
        rounded-[28px]
        border
        border-white/10
        p-6
      "
    >
      <div className="text-emerald-400 mb-4">{icon}</div>

      <div className="text-zinc-500 text-xs uppercase">{title}</div>

      <div className="text-3xl font-black mt-2">{value}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500 text-sm">{label}</span>

      <span className="font-black">{value}</span>
    </div>
  );
}
