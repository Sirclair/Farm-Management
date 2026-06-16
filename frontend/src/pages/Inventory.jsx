import { useEffect, useMemo, useState, useCallback } from 'react';
import api from '../api/axios';

import MainLayout from '../layouts/MainLayout';
import AddStockModal from '../components/AddStockModal';
import UseStockModal from '../components/UseStockModal';

import { Package, Plus, Database, Scale } from 'lucide-react';

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
      <div className="min-h-screen bg-[#05070a] text-white p-6">
        <div className="flex justify-between mb-10">
          <div>
            <h1 className="text-5xl font-black">Inventory</h1>

            <p className="text-zinc-500">Central Stock Registry</p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="
            bg-emerald-500
            px-6
            py-4
            rounded-2xl
            text-black
            font-black
            flex
            gap-2
            "
          >
            <Plus size={18} />
            Add Stock
          </button>
        </div>

        {error && <div className="mb-6 p-4 rounded bg-red-500/10">{error}</div>}

        <div className="grid grid-cols-3 gap-5 mb-10">
          <Metric title="Total Stock" value={metrics.total} icon={<Scale />} />

          <Metric
            title="Inventory Value"
            value={`R ${metrics.value.toFixed(2)}`}
            icon={<Package />}
          />

          <Metric title="Tracked Items" value={metrics.count} icon={<Database />} />
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {items.map((item) => {
              const stock = Number(item.current_level);

              const cost = Number(item.cost_per_unit);

              const min = Number(item.min_stock_level);

              const low = stock <= min;

              return (
                <div
                  key={item.id}
                  className="
                  bg-[#0b0f14]
                  p-6
                  rounded-3xl
                  border
                  border-white/10
                  "
                >
                  <div className="flex justify-between">
                    <div>{item.category}</div>

                    <div>{low ? 'Low' : 'OK'}</div>
                  </div>

                  <h2 className="mt-5 text-2xl font-black">{item.name}</h2>

                  <div className="mt-5 text-5xl">
                    {stock}

                    <span className="text-lg text-zinc-400 ml-2">{item.inventory_unit}</span>
                  </div>

                  <div className="mt-5">Value: R {(stock * cost).toFixed(2)}</div>

                  <button
                    onClick={() => openUseStockModal(item)}
                    className="
                    mt-5
                    w-full
                    bg-emerald-500
                    text-black
                    rounded-xl
                    py-3
                    "
                  >
                    Use Stock
                  </button>
                </div>
              );
            })}
          </div>
        )}

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

function Metric({ title, value, icon }) {
  return (
    <div className="bg-[#0d0f12] p-5 rounded-2xl">
      <div>{icon}</div>

      <div className="text-zinc-500">{title}</div>

      <div className="text-3xl font-black">{value}</div>
    </div>
  );
}
