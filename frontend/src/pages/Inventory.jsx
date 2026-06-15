import React, { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import MainLayout from '../layouts/MainLayout';
import { Package, Plus, Layers, ShieldAlert, Scale, X } from 'lucide-react';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // =========================
  // MATRICULATION INTAKE STATE
  // =========================
  const [form, setForm] = useState({
    name: '',
    quantity: '1',
    unit_price: '',
    intake_unit: 'BAGS',
    weight_per_pack: '50', // Default sizing for agricultural bags (e.g., Redpowder/Feed)
    notes: '',
  });

  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  // =========================
  // DATA ACTIONS
  // =========================
  const fetchInventory = async () => {
    try {
      const res = await api.get('/api/inventory/items/');
      setItems(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed fetching inventory data matrices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCommitAllocation = async () => {
    if (!form.name.trim()) {
      setError('Item identifier/name is required');
      return;
    }
    if (!form.unit_price || Number(form.unit_price) <= 0) {
      setError('Enter a valid allocation cost unit price');
      return;
    }

    setSubmitLoading(true);
    setError('');

    try {
      // Dynamic normalized calculation payload match with backend pipeline updates
      await api.post('/api/inventory/items/purchase/', {
        name: form.name,
        quantity: Number(form.quantity),
        unit_price: Number(form.unit_price),
        weight_per_pack: form.intake_unit === 'BAGS' ? Number(form.weight_per_pack) : 1,
        notes: form.notes,
      });

      setIsOpen(false);
      setForm({
        name: '',
        quantity: '1',
        unit_price: '',
        intake_unit: 'BAGS',
        weight_per_pack: '50',
        notes: '',
      });
      fetchInventory();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sync inventory transaction log entry');
    } finally {
      setSubmitLoading(false);
    }
  };

  // =========================
  // LAYOUT METRICS KANBAN AGGREGATION
  // =========================
  const inventoryMetrics = useMemo(() => {
    const totalStockQty = items.reduce((acc, curr) => acc + parseFloat(curr.current_level || 0), 0);
    const uniqueSKUs = items.length;
    const netAssetValue = items.reduce((acc, curr) => {
      const level = parseFloat(curr.current_level || 0);
      const wacCost = parseFloat(curr.cost_per_unit || 0);
      return acc + level * wacCost;
    }, 0);

    return { totalStockQty, uniqueSKUs, netAssetValue };
  }, [items]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white font-black tracking-widest animate-pulse">
        SYNCING REAL-TIME STOCK MATRIX...
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="fixed inset-0 -z-10 bg-[#05070a]" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[400px] -z-10 bg-emerald-500/5 blur-[140px] rounded-full" />

      {/* VIEWS PRESENTATION LAYER HEADER */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-5xl font-black text-white uppercase tracking-tight">
            Central <span className="text-emerald-400">Stockpile</span>
          </h1>
          <p className="text-zinc-500 font-bold uppercase text-xs tracking-[0.2em] mt-2">
            Resource Inventory Matrix
          </p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2 transition-all shadow-[0_0_24px_rgba(16,185,129,0.15)]"
        >
          <Plus size={16} />
          Intake Stock Allocation
        </button>
      </div>

      {/* METRIC GRAPH METRICS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <InventoryCard
          title="Total Resource Volume"
          value={`${inventoryMetrics.totalStockQty.toLocaleString(undefined, { maximumFractionDigits: 1 })} KG`}
          icon={<Layers size={22} />}
        />
        <InventoryCard
          title="Consolidated Asset Valuation"
          value={`R ${inventoryMetrics.netAssetValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<Package size={22} />}
        />
        <InventoryCard
          title="Active Stock Profiles (SKUs)"
          value={inventoryMetrics.uniqueSKUs}
          icon={<Scale size={22} />}
        />
      </div>

      {/* FUTURISTIC DATA MATRIX PRESENTATION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.length === 0 ? (
          <div className="col-span-full border border-white/5 bg-zinc-900/40 rounded-[32px] p-20 text-center text-zinc-500 font-black tracking-widest">
            NO ACTIVE ASSETS LOGGED IN CENTRAL PROFILE DATA.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="relative overflow-hidden bg-[#0d0f12]/80 border border-white/10 rounded-[32px] p-6 backdrop-blur-xl shadow-xl hover:border-emerald-500/30 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black tracking-widest text-[9px] px-3 py-1 rounded-xl uppercase">
                  {item.category || 'Resource Base'}
                </span>
                {parseFloat(item.current_level) <= 50 && (
                  <span className="flex items-center gap-1 text-amber-400 font-black text-[9px] tracking-widest uppercase bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-xl">
                    <ShieldAlert size={10} /> Low Volume
                  </span>
                )}
              </div>

              <h3 className="text-xl font-black text-white uppercase tracking-wide mb-1">
                {item.name}
              </h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                System Ident ID: #{item.id.toString().padStart(4, '0')}
              </p>

              <div className="my-6 border-y border-white/5 py-4 space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-zinc-500">Current Stock Level:</span>
                  <span className="text-white font-black">
                    {parseFloat(item.current_level).toLocaleString()} KG
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-zinc-500">WAC Metric Unit Cost:</span>
                  <span className="text-emerald-400 font-black">
                    R {parseFloat(item.cost_per_unit).toFixed(2)} / KG
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center bg-black/30 rounded-2xl p-4 border border-white/5">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">
                  Net Asset Holding Value
                </span>
                <span className="text-white font-black text-sm">
                  R{' '}
                  {(parseFloat(item.current_level) * parseFloat(item.cost_per_unit)).toLocaleString(
                    undefined,
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                  )}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* =========================================================
          FUTURISTIC INTAKE PIPELINE DATA ALLOCATION MODAL DOCKED UI
         ========================================================= */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <div className="w-full max-w-xl bg-[#0b0c0e] border border-white/10 rounded-[36px] p-8 text-white relative shadow-2xl">
            {/* HEADER COMPONENT */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <Package size={18} className="text-emerald-400" />
                  Intake Asset Allocation
                </h2>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                  Commit real physical inventory items into central pipeline matrices
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white bg-white/5 p-2 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* ERROR PRESENTATION STRIP */}
            {error && (
              <div className="mb-4 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                {error}
              </div>
            )}

            {/* INPUT CONTROLS FLOW */}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                  Resource / Item Name
                </label>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleInputChange}
                  className="w-full mt-2 bg-black border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-emerald-500 uppercase tracking-wider"
                  placeholder="e.g. REDPOWDER"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                    Intake Unit Profile
                  </label>
                  <select
                    name="intake_unit"
                    value={form.intake_unit}
                    onChange={handleInputChange}
                    className="w-full mt-2 bg-black border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-emerald-500"
                  >
                    <option value="BAGS">BAGS</option>
                    <option value="KG">DIRECT MASS (KG)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                    {form.intake_unit === 'BAGS' ? 'Bags Ordered' : 'Volume Unit Quantities'}
                  </label>
                  <input
                    name="quantity"
                    type="number"
                    value={form.quantity}
                    onChange={handleInputChange}
                    className="w-full mt-2 bg-black border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-emerald-500"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                    Price Paid Per {form.intake_unit === 'BAGS' ? 'Bag' : 'KG'}
                  </label>
                  <div className="relative flex items-center mt-2 bg-black border border-emerald-500/30 rounded-2xl focus-within:border-emerald-500 transition-colors">
                    <span className="pl-4 font-bold text-zinc-500 text-sm">R</span>
                    <input
                      name="unit_price"
                      type="number"
                      value={form.unit_price}
                      onChange={handleInputChange}
                      className="w-full bg-transparent p-4 pl-2 text-white font-black text-lg outline-none"
                      placeholder="500"
                    />
                  </div>
                </div>
              </div>

              {/* DYNAMIC METRIC DISCOVERY INPUT CONTAINER - TARGET WEIGHT LOGIC SYNC */}
              {form.intake_unit === 'BAGS' && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl">
                  <label className="text-[10px] uppercase tracking-widest text-emerald-400 font-black">
                    Pack / Bag Unit Mass Profile Configuration (KG per Bag)
                  </label>
                  <input
                    name="weight_per_pack"
                    type="number"
                    value={form.weight_per_pack}
                    onChange={handleInputChange}
                    className="w-full mt-2 bg-black/60 border border-white/10 rounded-xl p-3 text-emerald-300 font-bold outline-none focus:border-emerald-500 text-sm"
                    placeholder="50"
                  />
                  <p className="text-[9px] text-zinc-500 font-semibold mt-2 uppercase tracking-wide">
                    System will automatically compile mathematical WAC logic at:{' '}
                    {Number(form.quantity || 0) * Number(form.weight_per_pack || 0)} total systemic
                    KG inputs.
                  </p>
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                  Allocation Ledger Notes
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full mt-2 bg-black border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-emerald-500"
                  placeholder="Optional operational contextual logs..."
                />
              </div>
            </div>

            {/* ACTION CONTAINER GRID */}
            <div className="flex justify-end gap-4 border-t border-white/5 pt-5 mt-6">
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCommitAllocation}
                disabled={submitLoading}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest px-8 py-4 rounded-2xl transition-all disabled:opacity-40"
              >
                {submitLoading ? 'Syncing...' : 'Commit Allocation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

function InventoryCard({ title, value, icon }) {
  return (
    <div className="bg-[#0d0f12]/60 border border-white/10 rounded-[28px] p-6 backdrop-blur-md shadow-lg">
      <div className="text-emerald-400 mb-4">{icon}</div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black">{title}</p>
      <h2 className="text-3xl font-black text-white mt-3 tracking-tight">{value}</h2>
    </div>
  );
}
