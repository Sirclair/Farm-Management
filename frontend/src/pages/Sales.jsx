import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  CheckCircle,
  Clock,
  Search,
  TrendingUp,
  Wallet,
  Eye,
  Box,
} from 'lucide-react';

import api from '../api/axios';
import MainLayout from '../layouts/MainLayout';
import CreateSaleModal from '../components/CreateSaleModal';
import OrderDetailsModal from '../components/OrderDetailsModal';
import AddProductModal from '../components/AddProductModal';

// =========================================================
// QUICK STAT (SYSTEM CARD)
// =========================================================
function QuickStat({ label, value, icon, sub, isWarning }) {
  return (
    <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[32px] shadow-2xl">
      <div className="flex justify-between items-start mb-4">
        <div className="p-4 bg-white/5 rounded-2xl text-zinc-400">{icon}</div>
      </div>

      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-1">
        {label}
      </p>

      <h2
        className={`text-4xl font-black tracking-tighter ${isWarning ? 'text-orange-400' : 'text-white'}`}
      >
        {value}
      </h2>

      <p className="text-[11px] text-zinc-500 font-bold mt-2 italic">{sub}</p>
    </div>
  );
}

// =========================================================
// SALES TERMINAL
// =========================================================
export default function Sales() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [openSaleModal, setOpenSaleModal] = useState(false);
  const [openProductModal, setOpenProductModal] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // FETCH
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/my-farm/sales/orders/');
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getMetrics = (order) => {
    const total = Number(order.total_amount || order.subtotal || 0);
    const paid = Number(order.total_paid || order.amount_paid || 0);
    const balance =
      order.balance_due != null ? Number(order.balance_due) : Math.max(0, total - paid);
    return { total, paid, balance };
  };

  const stats = orders.reduce(
    (acc, o) => {
      const { total, balance } = getMetrics(o);
      acc.total += total;
      acc.debt += balance;
      return acc;
    },
    { total: 0, debt: 0, count: orders.length }
  );

  const filtered = orders.filter((o) => {
    const name = o.customer_name || o.customer?.full_name || 'Walk-in';
    const q = searchTerm.toLowerCase();
    return name.toLowerCase().includes(q) || String(o.id).includes(q);
  });

  return (
    <MainLayout>
      {/* SYSTEM BACKGROUND GRID */}
      <div className="fixed inset-0 bg-[#020617] -z-10">
        <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle,_#22c55e_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-10 text-white">
        {/* ========================================================= */}
        {/* HEADER (COMMAND NODE STYLE) */}
        {/* ========================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14">
          <div>
            <div className="text-emerald-400 text-[10px] uppercase tracking-[0.35em] font-black flex items-center gap-3">
              <span className="h-[1px] w-10 bg-emerald-400" />
              SALES NODE ACTIVE
            </div>

            <h1 className="text-5xl font-black italic uppercase tracking-tighter mt-4">
              SALES <span className="text-emerald-400">TERMINAL</span>
            </h1>

            <div className="flex items-center gap-3 mt-3 text-zinc-500 text-[11px] uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              SYSTEM ONLINE • {new Date().toLocaleDateString()}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-4 flex-wrap">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                size={18}
              />
              <input
                className="bg-white/5 rounded-2xl py-4 pl-12 pr-6 w-80 outline-none text-white"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              onClick={() => setOpenProductModal(true)}
              className="bg-white/5 hover:bg-white/10 px-6 py-4 rounded-2xl font-black uppercase text-[11px]"
            >
              <Box size={18} className="inline mr-2" />
              Add Product
            </button>

            <button
              onClick={() => setOpenSaleModal(true)}
              className="bg-emerald-500 text-black px-6 py-4 rounded-2xl font-black uppercase text-[11px]"
            >
              <Plus size={18} className="inline mr-2" />
              New Sale
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* STATS */}
        {/* ========================================================= */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <QuickStat
            label="TOTAL VOLUME"
            value={`R ${stats.total.toLocaleString('en-ZA')}`}
            icon={<TrendingUp />}
            sub="Gross revenue"
          />

          <QuickStat
            label="OUTSTANDING"
            value={`R ${stats.debt.toLocaleString('en-ZA')}`}
            icon={<Wallet />}
            sub="Unpaid balances"
            isWarning={stats.debt > 0}
          />

          <QuickStat label="ORDERS" value={stats.count} icon={<Package />} sub="All transactions" />
        </div>

        {/* ========================================================= */}
        {/* TABLE (FULL BORDERLESS SYSTEM) */}
        {/* ========================================================= */}
        <div className="bg-white/5 backdrop-blur-xl rounded-[40px] overflow-hidden shadow-2xl">
          <div className="px-10 py-6 flex justify-between text-zinc-500 text-[11px] uppercase tracking-widest">
            <span>Transaction Ledger</span>
            <span>{filtered.length} results</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead className="text-zinc-500 text-[11px] uppercase">
                <tr>
                  <th className="p-6 text-left">Order</th>
                  <th className="text-left">Customer</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th className="text-right p-6">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((o) => {
                  const { total, paid, balance } = getMetrics(o);
                  const customer = o.customer_name || 'Walk-in';

                  return (
                    <tr key={o.id} className="hover:bg-white/5 transition-all">
                      <td className="p-6 font-black">#{o.id}</td>
                      <td>{customer}</td>
                      <td>R {total.toFixed(2)}</td>
                      <td>R {paid.toFixed(2)}</td>

                      <td className={balance > 0 ? 'text-orange-400' : 'text-zinc-400'}>
                        R {balance.toFixed(2)}
                      </td>

                      <td>
                        {balance <= 0 ? (
                          <span className="text-emerald-400 text-xs font-black uppercase">
                            Paid
                          </span>
                        ) : (
                          <span className="text-orange-400 text-xs font-black uppercase">Due</span>
                        )}
                      </td>

                      <td className="text-right p-6">
                        <button
                          onClick={() => {
                            setSelectedOrder(o);
                            setDetailsOpen(true);
                          }}
                          className="p-3 bg-white/5 rounded-xl hover:bg-emerald-500 hover:text-black transition"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <CreateSaleModal
        isOpen={openSaleModal}
        onClose={() => setOpenSaleModal(false)}
        refreshSales={fetchOrders}
      />
      <AddProductModal isOpen={openProductModal} onClose={() => setOpenProductModal(false)} />
      <OrderDetailsModal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        order={selectedOrder}
      />
    </MainLayout>
  );
}
