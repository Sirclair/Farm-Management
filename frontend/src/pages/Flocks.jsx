import React, { useState, useEffect, useContext, useMemo } from 'react';
import api from '../api/axios';
import { UserContext } from '../UserContext';
import MainLayout from '../layouts/MainLayout';

import LogMortalityModal from '../components/LogMortalityModal';
import CreateBatchModal from '../components/CreateBatchModal';
import AdjustStockModal from '../components/AdjustStockModal';

import {
  Bird,
  Plus,
  Activity,
  AlertTriangle,
  Siren,
  ShieldCheck,
  TrendingUp,
  Package,
  Skull,
} from 'lucide-react';

export default function Flocks() {
  const { user } = useContext(UserContext);

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isLogMortalityOpen, setIsLogMortalityOpen] = useState(false);
  const [isCreateBatchOpen, setIsCreateBatchOpen] = useState(false);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);

  // ======================================================
  // FETCH DATA
  // ======================================================
  const fetchData = async () => {
    try {
      const res = await api.get('/api/my-farm/flock/batches/');

      setBatches(res.data.results || res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // ======================================================
  // GLOBAL STATS
  // ======================================================
  const stats = useMemo(() => {
    const totalBatches = batches.length;

    const totalReceived = batches.reduce((sum, b) => sum + Number(b.quantity_received || 0), 0);

    const totalMortality = batches.reduce(
      (sum, b) => sum + Number(b.total_mortality_count || 0),
      0
    );

    const totalStock = batches.reduce((sum, b) => sum + Number(b.current_stock || 0), 0);

    const birdsInHouse = totalStock;

    const survivalRate =
      totalReceived > 0 ? ((totalReceived - totalMortality) / totalReceived) * 100 : 0;

    return {
      totalBatches,
      totalReceived,
      totalMortality,
      totalStock,
      birdsInHouse,
      survivalRate: survivalRate.toFixed(1),
    };
  }, [batches]);

  // ======================================================
  // HEALTH STATUS
  // ======================================================
  const getHealth = (rate) => {
    if (rate >= 98) {
      return {
        color: 'emerald',
        text: 'Excellent',
        icon: ShieldCheck,
      };
    }

    if (rate >= 95) {
      return {
        color: 'amber',
        text: 'Monitor',
        icon: AlertTriangle,
      };
    }

    return {
      color: 'rose',
      text: 'Critical',
      icon: Siren,
    };
  };

  // ======================================================
  // LOADING
  // ======================================================
  if (loading) {
    return (
      <div className="h-screen bg-[#070B14] flex items-center justify-center text-emerald-400 font-black uppercase">
        Loading Flock Intelligence...
      </div>
    );
  }

  const health = getHealth(Number(stats.survivalRate));

  return (
    <MainLayout>
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
        {/* ======================================================
            HEADER
        ====================================================== */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase leading-tight">
              Flock Intelligence
            </h1>

            <p className="text-zinc-500 uppercase tracking-widest text-[10px] mt-2">
              Real-time poultry operational dashboard
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIsCreateBatchOpen(true)}
              className="
                px-5 py-3
                bg-emerald-500
                hover:bg-emerald-400
                text-black
                font-black
                rounded-xl
                flex items-center gap-2
                transition-all
              "
            >
              <Plus size={16} />
              Batch
            </button>

            <button
              onClick={() => setIsLogMortalityOpen(true)}
              className="
                px-5 py-3
                bg-white/10
                hover:bg-white/20
                text-white
                font-black
                rounded-xl
                flex items-center gap-2
                transition-all
              "
            >
              <Activity size={16} />
              Mortality Log
            </button>

            <button
              onClick={() => setIsAdjustStockOpen(true)}
              className="
                px-5 py-3
                bg-amber-500
                hover:bg-amber-400
                text-black
                font-black
                rounded-xl
                flex items-center gap-2
                transition-all
              "
            >
              <Package size={16} />
              Adjust Stock
            </button>
          </div>
        </div>

        {/* ======================================================
            KPI DASHBOARD
        ====================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
          <KpiCard
            icon={Bird}
            label="Total Birds Received"
            value={stats.totalReceived}
            color="emerald"
          />

          <KpiCard icon={Package} label="Active Batches" value={stats.totalBatches} color="cyan" />

          <KpiCard icon={Skull} label="Total Mortality" value={stats.totalMortality} color="rose" />

          <KpiCard icon={Bird} label="Birds in House" value={stats.birdsInHouse} color="emerald" />
        </div>

        {/* ======================================================
            HEALTH OVERVIEW
        ====================================================== */}
        <div className="mb-10 p-6 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center gap-2 text-emerald-400 font-black uppercase text-xs mb-2">
            <TrendingUp size={14} />
            System Health Overview
          </div>

          <div className="text-white text-2xl font-black">
            {health.text} ({stats.survivalRate}% survival)
          </div>

          <div className="text-zinc-500 text-sm mt-2">
            Birds in house represent your real-time live inventory across all active batches.
          </div>
        </div>

        {/* ======================================================
            MOBILE CARDS
        ====================================================== */}
        <div className="lg:hidden space-y-4">
          {batches.map((b) => {
            const received = Number(b.quantity_received || 0);

            const mortality = Number(b.total_mortality_count || 0);

            const stock = Number(b.current_stock || 0);

            const survival = received > 0 ? ((received - mortality) / received) * 100 : 0;

            return (
              <div key={b.id} className="bg-[#0F172A] border border-white/10 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h3 className="text-white font-black text-lg">{b.name}</h3>

                    <p className="text-zinc-500 text-xs uppercase tracking-widest">
                      #{b.batch_number}
                    </p>
                  </div>

                  <div className="text-emerald-400 font-black">{survival.toFixed(1)}%</div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-zinc-500 text-[10px] uppercase">Received</p>

                    <p className="text-white font-black text-lg">{received}</p>
                  </div>

                  <div>
                    <p className="text-zinc-500 text-[10px] uppercase">Mortality</p>

                    <p className="text-rose-400 font-black text-lg">{mortality}</p>
                  </div>

                  <div>
                    <p className="text-zinc-500 text-[10px] uppercase">Stock</p>

                    <p className="text-emerald-400 font-black text-lg">{stock}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ======================================================
            DESKTOP TABLE
        ====================================================== */}
        <div className="hidden lg:block bg-[#0F172A] rounded-2xl overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="text-zinc-500 text-xs uppercase bg-white/5">
                <tr>
                  <th className="p-5 text-left">Batch</th>
                  <th className="text-center">Health</th>
                  <th className="text-center">Received</th>
                  <th className="text-center">Mortality</th>
                  <th className="text-center">Current Stock</th>
                </tr>
              </thead>

              <tbody>
                {batches.map((b) => {
                  const received = Number(b.quantity_received || 0);

                  const mortality = Number(b.total_mortality_count || 0);

                  const stock = Number(b.current_stock || 0);

                  const survival = received > 0 ? ((received - mortality) / received) * 100 : 0;

                  return (
                    <tr
                      key={b.id}
                      className="border-t border-white/5 hover:bg-white/5 transition-all"
                    >
                      <td className="p-5">
                        <div>
                          <div className="text-white font-bold">{b.name}</div>

                          <div className="text-zinc-500 text-xs">#{b.batch_number}</div>
                        </div>
                      </td>

                      <td className="text-center text-emerald-400 font-bold">
                        {survival.toFixed(1)}%
                      </td>

                      <td className="text-center text-white font-bold">{received}</td>

                      <td className="text-center text-rose-400 font-bold">{mortality}</td>

                      <td className="text-center text-emerald-400 font-bold">{stock}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ======================================================
          MODALS
      ====================================================== */}

      <CreateBatchModal
        isOpen={isCreateBatchOpen}
        onClose={() => setIsCreateBatchOpen(false)}
        onSuccess={fetchData}
      />

      <LogMortalityModal
        isOpen={isLogMortalityOpen}
        onClose={() => setIsLogMortalityOpen(false)}
        onRefresh={fetchData}
      />

      <AdjustStockModal
        isOpen={isAdjustStockOpen}
        onClose={() => setIsAdjustStockOpen(false)}
        onSuccess={fetchData}
        batches={batches}
      />
    </MainLayout>
  );
}

// ======================================================
// KPI CARD
// ======================================================

function KpiCard({ icon: Icon, label, value, color }) {
  const colors = {
    emerald: 'text-emerald-400',
    cyan: 'text-cyan-400',
    rose: 'text-rose-400',
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex justify-between items-center">
        <Icon className={colors[color]} />
      </div>

      <div className="text-white text-3xl font-black mt-5">{value}</div>

      <div className="text-zinc-500 text-[10px] uppercase tracking-widest mt-2">{label}</div>
    </div>
  );
}
