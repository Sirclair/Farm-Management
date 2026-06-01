import React, { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import MainLayout from '../layouts/MainLayout';
import { FileText, Download, TrendingUp, BarChart3, Target, ChevronRight } from 'lucide-react';

export default function Reports() {
  const [data, setData] = useState({
    batches: [],
    expenses: [],
    sales: [],
  });

  const [loading, setLoading] = useState(true);

  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        console.log('Fetching batches...');
        const b = await api.get('my-farm/flock/batches/');

        console.log('Fetching expenses...');
        const e = await api.get('my-farm/finance/expenses/');

        console.log('Fetching sales...');
        const s = await api.get('my-farm/sales/orders/');

        setData({
          batches: b.data.results || b.data || [],
          expenses: e.data.results || e.data || [],
          sales: s.data.results || s.data || [],
        });
      } catch (err) {
        console.error('FAILED:', err.config?.url);
        console.error(err.response?.status);
        console.error(err.response?.data);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // ======================================================
  // PDF DOWNLOAD
  // ======================================================

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);

      const response = await api.get('my-farm/ai/report/', {
        responseType: 'blob',
      });

      // Create PDF blob
      const blob = new Blob([response.data], {
        type: 'application/pdf',
      });

      // Create temporary browser URL
      const url = window.URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');

      link.href = url;

      link.download = `Zonke_Farms_Report_${new Date().toISOString().split('T')[0]}.pdf`;

      document.body.appendChild(link);

      // Trigger download
      link.click();

      // Cleanup
      document.body.removeChild(link);

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error('PDF DOWNLOAD ERROR:', err);

      alert('Failed to download PDF report');
    } finally {
      setDownloading(false);
    }
  };

  // ======================================================
  // METRICS
  // ======================================================

  const metrics = useMemo(() => {
    const totalSales = data.sales.reduce((acc, s) => acc + parseFloat(s.total_amount || 0), 0);

    const totalCosts = data.expenses.reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);

    const netProfit = totalSales - totalCosts;

    const roi = totalCosts > 0 ? ((netProfit / totalCosts) * 100).toFixed(1) : 0;

    return {
      totalSales,
      totalCosts,
      netProfit,
      roi,
    };
  }, [data]);

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center font-black text-slate-400 italic animate-pulse">
        GENERATING ANALYTICS...
      </div>
    );
  }

  // ======================================================
  // UI
  // ======================================================

  return (
    <MainLayout>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">
            Performance <span className="text-blue-600">Intelligence</span>
          </h1>

          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">
            Cycle ROI & Audit Logs
          </p>
        </div>

        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="px-8 py-4 bg-slate-900 text-white rounded-[24px] font-black text-xs shadow-2xl hover:bg-blue-600 disabled:bg-slate-400 transition-all flex items-center gap-2 uppercase"
        >
          <Download size={16} />

          {downloading ? 'Generating PDF...' : 'Export PDF Audit'}
        </button>
      </div>

      {/* METRICS */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <ReportHeroCard
          title="Net Profitability"
          value={`R ${metrics.netProfit.toLocaleString()}`}
          sub={`${metrics.roi}% Return on Investment`}
          color="emerald"
          icon={<TrendingUp />}
        />

        <ReportHeroCard
          title="Revenue vs Burn"
          value={`R ${metrics.totalSales.toLocaleString()}`}
          sub={`Against R${metrics.totalCosts.toLocaleString()} Cost`}
          color="blue"
          icon={<BarChart3 />}
        />

        <ReportHeroCard
          title="Cycle Status"
          value="Optimized"
          sub="Based on FCR Trends"
          color="amber"
          icon={<Target />}
        />
      </div>

      {/* BATCH HISTORY */}

      <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
        <h3 className="font-black text-slate-800 mb-8 uppercase tracking-widest text-[11px] flex items-center gap-2">
          <FileText size={16} className="text-blue-500" />
          Historical Performance Logs
        </h3>

        <div className="space-y-4">
          {data.batches.map((batch) => (
            <div
              key={batch.id}
              className="group flex items-center justify-between p-6 bg-slate-50 rounded-[32px] hover:bg-blue-600 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-blue-600 shadow-sm group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  {batch.batch_number?.slice(-2) || '00'}
                </div>

                <div>
                  <h4 className="font-black text-slate-800 uppercase tracking-tighter group-hover:text-white transition-colors">
                    Batch {batch.batch_number}
                  </h4>

                  <p className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-blue-200 transition-colors">
                    Started:{' '}
                    {batch.acquisition_date
                      ? new Date(batch.acquisition_date).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-300 uppercase group-hover:text-blue-200 transition-colors">
                    Survival Rate
                  </p>

                  <p className="font-black text-slate-700 group-hover:text-white transition-colors">
                    {batch.survival_rate || 0}%
                  </p>
                </div>

                <ChevronRight
                  className="text-slate-300 group-hover:text-white group-hover:translate-x-1 transition-all"
                  size={20}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

function ReportHeroCard({ title, value, sub, color, icon }) {
  const theme = {
    emerald: 'bg-emerald-600 text-white',
    blue: 'bg-blue-600 text-white',
    amber: 'bg-slate-900 text-white',
  };

  return (
    <div className={`${theme[color]} p-8 rounded-[40px] shadow-xl relative overflow-hidden group`}>
      <div className="relative z-10">
        <div className="mb-4 opacity-80">{icon}</div>

        <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">{title}</p>

        <h4 className="text-3xl font-black mt-1 tracking-tighter">{value}</h4>

        <p className="text-[11px] font-bold mt-2 opacity-80 italic">{sub}</p>
      </div>

      <div className="absolute -right-4 -bottom-4 text-white/10 text-8xl font-black italic select-none group-hover:scale-110 transition-transform">
        ROI
      </div>
    </div>
  );
}
