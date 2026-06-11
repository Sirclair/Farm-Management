import { useEffect, useState } from 'react';
import api from '../api/axios';
import MainLayout from '../layouts/MainLayout';
import { Link } from 'react-router-dom';
import { Store, MapPin, Scan } from 'lucide-react';

export default function Marketplace() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Removed hardcoded localhost string to fix Vercel live environment CORS/Network Errors
    // 2. Pointed to the exact API endpoint structure registered in your Django setup
    const endpoint = '/api/explore-farms/';

    api
      .get(endpoint)
      .then((res) => {
        setFarms(res.data || []);
      })
      .catch((err) => {
        console.error('Marketplace Error:', err.response || err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <MainLayout>
      {/* ========================================================= */}
      {/* PAGE WRAPPER */}
      {/* ========================================================= */}
      <div className="max-w-[1600px] mx-auto px-6 py-10 text-white">
        {/* ========================================================= */}
        {/* HEADER (SYSTEM SCAN STYLE) */}
        {/* ========================================================= */}
        <div className="mb-12">
          <div className="flex items-center gap-3 text-emerald-400 text-[10px] uppercase tracking-[0.35em] font-black">
            <span className="h-[1px] w-10 bg-emerald-400" />
            MARKET NODE ACTIVE
          </div>

          <h1 className="text-5xl font-black italic uppercase tracking-tighter mt-4">
            FARM <span className="text-emerald-400">MARKET</span>
          </h1>

          <div className="flex items-center gap-3 mt-3 text-zinc-500 text-[11px] uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            SCANNING NETWORK • LIVE FEED
          </div>
        </div>

        {/* ========================================================= */}
        {/* CONTENT */}
        {/* ========================================================= */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
            <Scan className="animate-pulse mb-4" size={28} />
            <p className="uppercase tracking-[0.3em] text-[11px] font-black">
              SCANNING FARM NETWORK
            </p>
          </div>
        ) : farms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {farms.map((farm) => (
              <div
                key={farm.id}
                className="bg-white/5 backdrop-blur-xl rounded-[32px] p-8 shadow-2xl hover:bg-white/10 transition"
              >
                {/* FARM HEADER */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter">{farm.name}</h3>

                    <div className="flex items-center gap-2 text-zinc-500 text-[11px] mt-2">
                      <MapPin size={12} />
                      {farm.address || 'Unknown location'}
                    </div>
                  </div>

                  <div className="p-3 bg-white/5 rounded-2xl text-emerald-400">
                    <Store size={18} />
                  </div>
                </div>

                {/* ACTION */}
                <Link
                  to={`/store/${farm.id}`}
                  className="block w-full mt-6 bg-emerald-500 text-black py-4 rounded-2xl text-center font-black uppercase text-[11px] tracking-widest hover:bg-emerald-400 transition"
                >
                  ENTER STORE NODE
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/5 rounded-[32px] p-10 text-center text-zinc-500 uppercase tracking-widest font-black text-[11px]">
            NO FARMS DETECTED IN NETWORK
          </div>
        )}
      </div>
    </MainLayout>
  );
}
