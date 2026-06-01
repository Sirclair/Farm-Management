import { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import { Trophy, Users, ChevronDown, ChevronUp } from 'lucide-react';

export default function TopBuyers() {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  // =====================================================
  // SAFE CURRENCY FORMAT
  // =====================================================
  const formatZAR = (value) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 2,
    }).format(value || 0);

  // =====================================================
  // FETCH DATA
  // =====================================================
  const fetchTopBuyers = async () => {
    try {
      setLoading(true);

      const res = await api.get('/api/my-farm/sales/orders/');
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];

      const grouped = {};

      data.forEach((order) => {
        const name = order.customer_name || order.customer?.full_name || 'Walk-in';

        if (!grouped[name]) {
          grouped[name] = {
            total: 0,
            orders: 0,
            history: [],
          };
        }

        const value = Number(order.total_amount || order.subtotal || 0);

        grouped[name].total += value;
        grouped[name].orders += 1;

        // store history for sparkline
        grouped[name].history.push(value);
      });

      const sorted = Object.entries(grouped)
        .map(([name, stats]) => ({
          name,
          total: stats.total,
          orders: stats.orders,
          average: stats.orders ? stats.total / stats.orders : 0,
          history: stats.history.slice(-6), // last 6 orders
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      setBuyers(sorted);
    } catch (err) {
      console.error(err);
      setBuyers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopBuyers();
  }, []);

  const revenuePool = useMemo(() => buyers.reduce((a, b) => a + b.total, 0), [buyers]);

  // =====================================================
  // SIMPLE SPARKLINE (NO LIBRARY)
  // =====================================================
  const Sparkline = ({ data }) => {
    if (!data?.length) return null;

    const max = Math.max(...data);

    return (
      <div className="flex items-end gap-[2px] h-6">
        {data.map((v, i) => {
          const height = max ? (v / max) * 100 : 0;

          return (
            <div
              key={i}
              className="w-1 bg-emerald-400/60 rounded"
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>
    );
  };

  // =====================================================
  // UI
  // =====================================================
  return (
    <div className="bg-[#050505] border border-emerald-500/20 rounded-[32px] p-5 flex flex-col max-h-[75vh] overflow-hidden">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Trophy className="text-emerald-400" size={18} />
          </div>

          <div>
            <h2 className="text-white text-lg font-black uppercase">Top Buyers</h2>
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest">
              Banking Style Analytics
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[9px] text-emerald-400 uppercase font-black">Revenue Pool</p>
          <h3 className="text-emerald-300 text-lg font-black truncate max-w-[150px]">
            {formatZAR(revenuePool)}
          </h3>
        </div>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {loading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
          ))}

        {!loading &&
          buyers.map((buyer, index) => {
            const isOpen = expanded === buyer.name;

            return (
              <div
                key={buyer.name}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
              >
                {/* MAIN ROW */}
                <div
                  onClick={() => setExpanded(isOpen ? null : buyer.name)}
                  className="flex items-center justify-between p-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black">
                      {index + 1}
                    </div>

                    <div className="min-w-0">
                      <p className="text-white font-bold truncate">{buyer.name}</p>
                      <p className="text-zinc-500 text-[10px]">
                        {buyer.orders} orders • Avg {formatZAR(buyer.average)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* SPARKLINE */}
                    <div className="hidden sm:block">
                      <Sparkline data={buyer.history} />
                    </div>

                    <p className="text-emerald-400 font-black text-sm">{formatZAR(buyer.total)}</p>

                    {isOpen ? (
                      <ChevronUp size={18} className="text-zinc-400" />
                    ) : (
                      <ChevronDown size={18} className="text-zinc-400" />
                    )}
                  </div>
                </div>

                {/* EXPANDED PANEL */}
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-white/10">
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="bg-black/40 rounded-xl p-3">
                        <p className="text-[9px] text-zinc-500 uppercase">Lifetime Value</p>
                        <p className="text-emerald-400 font-black">{formatZAR(buyer.total)}</p>
                      </div>

                      <div className="bg-black/40 rounded-xl p-3">
                        <p className="text-[9px] text-zinc-500 uppercase">Order Count</p>
                        <p className="text-white font-black">{buyer.orders}</p>
                      </div>

                      <div className="bg-black/40 rounded-xl p-3">
                        <p className="text-[9px] text-zinc-500 uppercase">Avg Basket</p>
                        <p className="text-white font-black">{formatZAR(buyer.average)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

        {!loading && buyers.length === 0 && (
          <div className="text-center py-10">
            <Users size={40} className="mx-auto text-zinc-700 mb-2" />
            <p className="text-zinc-500">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
