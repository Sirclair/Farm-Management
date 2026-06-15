import { useEffect, useMemo, useState, useCallback } from 'react';
import api from '../api/axios';
import MainLayout from '../layouts/MainLayout';

import { Package, Plus, AlertTriangle, X, Database, Scale } from 'lucide-react';

/* =========================================================
   DEFAULT PURCHASE FORM
========================================================= */
const EMPTY_FORM = {
  name: '',
  quantity: '1',
  unit_price: '',
  intake_unit: 'BAGS',
  weight_per_pack: '50',
  notes: '',
};

/* =========================================================
   INVENTORY PAGE
========================================================= */
export default function Inventory() {
  const [items, setItems] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);

  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  const [submitLoading, setSubmitLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /* =========================================================
     FETCH INVENTORY ONLY
  ========================================================= */
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);

      const [stockRes, historyRes] = await Promise.all([
        api.get('/api/inventory/items/'),
        api.get('/api/inventory/purchases/'),
      ]);

      const stock = stockRes.data?.results || stockRes.data || [];

      const purchases = historyRes.data?.results || historyRes.data || [];

      setItems(Array.isArray(stock) ? stock : []);
      setPurchaseHistory(Array.isArray(purchases) ? purchases : []);
    } catch (err) {
      console.error('Inventory load failed', err);

      setError(err?.response?.data?.error || 'Failed loading inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  /* =========================================================
     INPUT HANDLER
  ========================================================= */
  const updateForm = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /* =========================================================
     RESET
  ========================================================= */
  const resetForm = () => {
    setForm(EMPTY_FORM);
  };

  /* =========================================================
     PURCHASE STOCK
  ========================================================= */
  const submitPurchase = async () => {
    try {
      setError('');
      setSuccess('');

      if (!form.name.trim()) {
        throw new Error('Item name required');
      }

      if (Number(form.quantity) <= 0) {
        throw new Error('Quantity must be above zero');
      }

      if (Number(form.unit_price) <= 0) {
        throw new Error('Unit price required');
      }

      if (form.intake_unit === 'BAGS' && Number(form.weight_per_pack) <= 0) {
        throw new Error('Weight per bag must be greater than zero');
      }

      setSubmitLoading(true);

      const payload = {
        name: form.name,

        quantity: Number(form.quantity),

        unit_price: Number(form.unit_price),

        weight_per_pack: form.intake_unit === 'BAGS' ? Number(form.weight_per_pack) : 1,

        notes: form.notes,
      };

      console.log('PURCHASE PAYLOAD', payload);

      const res = await api.post('/api/inventory/items/purchase/', payload);

      console.log('PURCHASE RESPONSE', res.data);

      setSuccess(res.data.message);

      await fetchInventory();

      resetForm();

      setTimeout(() => {
        setModalOpen(false);
      }, 700);
    } catch (err) {
      console.error('Purchase failed', err);

      setError(err?.response?.data?.error || err.message || 'Inventory transaction failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  /* =========================================================
     METRICS
  ========================================================= */
  const metrics = useMemo(() => {
    const totalKg = items.reduce((a, b) => a + Number(b.current_level || 0), 0);

    const valuation = items.reduce(
      (a, b) => a + Number(b.current_level || 0) * Number(b.cost_per_unit || 0),
      0
    );

    return {
      stock: totalKg,
      value: valuation,
      count: items.length,
    };
  }, [items]);

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex justify-between">
          <div>
            <h1 className="text-4xl font-black text-white">Inventory</h1>

            <p className="text-zinc-500">Inventory only — isolated from finance</p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="bg-emerald-500 px-6 py-3 rounded-xl font-bold"
          >
            <Plus size={18} />
          </button>
        </div>

        {error && <div className="bg-red-900/30 p-4 rounded-xl">{error}</div>}

        <div className="grid grid-cols-3 gap-4">
          <Metric icon={<Scale />} title="Total KG" value={metrics.stock.toFixed(1)} />

          <Metric icon={<Database />} title="Items" value={metrics.count} />

          <Metric icon={<Package />} title="Asset Value" value={`R ${metrics.value.toFixed(2)}`} />
        </div>

        {loading ? (
          <div className="text-white">Loading inventory...</div>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => (
              <div key={item.id} className="border p-5 rounded-xl">
                <div className="font-black">{item.name}</div>

                <div>Stock: {item.current_level} KG</div>

                <div>
                  Cost: R{item.cost_per_unit}
                  /KG
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL */}

        {modalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
            <div className="bg-zinc-950 p-8 rounded-3xl w-[600px]">
              <div className="flex justify-between">
                <h2>Add Stock</h2>

                <button onClick={() => setModalOpen(false)}>
                  <X />
                </button>
              </div>

              <div className="space-y-4 mt-5">
                <input name="name" value={form.name} onChange={updateForm} placeholder="Item" />

                <input name="quantity" value={form.quantity} onChange={updateForm} type="number" />

                <input
                  name="unit_price"
                  value={form.unit_price}
                  onChange={updateForm}
                  type="number"
                />

                <button disabled={submitLoading} onClick={submitPurchase}>
                  {submitLoading ? 'Saving...' : 'Purchase'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function Metric({ title, value, icon }) {
  return (
    <div className="border rounded-xl p-5">
      {icon}

      <div>{title}</div>

      <div>{value}</div>
    </div>
  );
}
