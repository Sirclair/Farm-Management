import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import PaymentModal from './PaymentModal';
import { Wallet, AlertTriangle, User, Receipt, CalendarDays, CreditCard } from 'lucide-react';

export default function DebtorsPanel({ onRefresh }) {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDebtors = async () => {
    try {
      setLoading(true);

      const res = await api.get('/api/my-farm/sales/orders/');

      const raw = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.results)
          ? res.data.results
          : [];

      // NORMALIZE SAFELY
      const normalized = raw
        .map((o) => {
          const subtotal = Number(o.subtotal ?? o.total_amount ?? o.total ?? 0);

          const totalPaid = Number(o.total_paid ?? o.amount_paid ?? o.paid ?? 0);

          const balance = Number(o.balance_due ?? o.balance ?? subtotal - totalPaid);

          return {
            ...o,
            subtotal,
            totalPaid,
            balance,
          };
        })
        .filter((o) => o.balance > 0);

      setOrders(normalized);
    } catch (err) {
      console.error('Debtors fetch error:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebtors();
  }, []);

  const totalDebt = useMemo(() => {
    return orders.reduce((acc, curr) => {
      return acc + Number(curr.balance || 0);
    }, 0);
  }, [orders]);

  return (
    <div className="bg-[#0a0a0a] border border-orange-500/20 rounded-[32px] p-8">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-white text-xl font-black uppercase flex items-center gap-3">
            <Wallet className="text-orange-400" size={22} />
            Debtors
          </h2>

          <p className="text-zinc-500 text-xs mt-2 uppercase tracking-widest">
            Outstanding customer balances
          </p>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 px-5 py-3 rounded-2xl">
          <div className="text-[10px] uppercase tracking-widest font-black opacity-70">
            Total Outstanding
          </div>

          <div className="text-lg font-black mt-1">R {Number(totalDebt || 0).toFixed(2)}</div>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="py-16 text-center">
          <p className="text-zinc-500 font-semibold">Loading debtor accounts...</p>
        </div>
      )}

      {/* EMPTY */}
      {!loading && orders.length === 0 && (
        <div className="text-center py-16">
          <AlertTriangle size={40} className="mx-auto text-zinc-700 mb-4" />

          <p className="text-zinc-500 font-bold">No outstanding debtors</p>
        </div>
      )}

      {/* LIST */}
      <div className="space-y-4">
        {orders.map((o) => {
          const customerName = o.customer_name || o.customer?.full_name || 'Walk-in Customer';

          return (
            <div
              key={o.id}
              className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6"
            >
              {/* LEFT */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <User size={20} className="text-orange-400" />
                  </div>

                  <div>
                    <h3 className="text-white font-black text-lg">{customerName}</h3>

                    <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">
                      Outstanding Payment
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
                  {/* ORDER */}
                  <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-zinc-500 text-[11px] uppercase tracking-widest font-black">
                      <Receipt size={14} />
                      Order
                    </div>

                    <div className="text-white font-black text-lg mt-2">#{o.id}</div>
                  </div>

                  {/* DATE */}
                  <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-zinc-500 text-[11px] uppercase tracking-widest font-black">
                      <CalendarDays size={14} />
                      Created
                    </div>

                    <div className="text-white font-bold text-sm mt-2">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString() : '--'}
                    </div>
                  </div>

                  {/* TOTAL */}
                  <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-zinc-500 text-[11px] uppercase tracking-widest font-black">
                      <CreditCard size={14} />
                      Invoice
                    </div>

                    <div className="text-white font-black text-lg mt-2">
                      R {Number(o.subtotal || 0).toFixed(2)}
                    </div>
                  </div>

                  {/* BALANCE */}
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
                    <div className="text-orange-300 text-[11px] uppercase tracking-widest font-black">
                      Balance Due
                    </div>

                    <div className="text-orange-400 font-black text-2xl mt-2">
                      R {Number(o.balance || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION */}
              <div className="flex items-center">
                <button
                  onClick={() => setSelected(o)}
                  className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 transition-all text-white font-black shadow-lg shadow-emerald-950/30"
                >
                  Receive Payment
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* PAYMENT MODAL */}
      {selected && (
        <PaymentModal
          order={selected}
          onClose={() => setSelected(null)}
          onSuccess={() => {
            setSelected(null);
            fetchDebtors();
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}
