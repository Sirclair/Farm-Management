import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import MainLayout from '../layouts/MainLayout';
import { Link } from 'react-router-dom';
import { Store, MapPin, Scan, Wifi, WifiOff } from 'lucide-react';

export default function Marketplace() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);

  const wsRef = useRef(null);
  const intervalRef = useRef(null);

  const endpoint = '/api/explore-farms/explore/';

  // =====================================================
  // NORMALIZE RESPONSE
  // =====================================================

  const normalize = (data) => {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.results)) return data.results;

    return [];
  };

  // =====================================================
  // FIX MEDIA URL
  // =====================================================

  const getImageUrl = (image) => {
    if (!image) return '/placeholder-farm.jpg';

    if (image.startsWith('http')) return image;

    const base = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

    return `${base}${image}`;
  };

  // =====================================================
  // FETCH FARMS
  // =====================================================

  const fetchFarms = async () => {
    try {
      const res = await api.get(endpoint);

      const farmsData = normalize(res.data);

      const enhanced = farmsData.map((farm) => ({
        ...farm,

        signal: Math.floor(Math.random() * 30) + 70,

        online: true,

        lastSeen: new Date().toISOString(),
      }));

      setFarms(enhanced);

      setError(null);
    } catch (err) {
      console.error('Marketplace error:', err.response || err);

      setError('Unable to scan farm network');
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchFarms();

    intervalRef.current = setInterval(fetchFarms, 15000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  // =====================================================
  // OPTIONAL WS
  // =====================================================

  useEffect(() => {
    try {
      const url = import.meta.env.VITE_WS_URL;

      if (!url) return;

      const ws = new WebSocket(url);

      wsRef.current = ws;

      ws.onopen = () => setIsLive(true);

      ws.onerror = () => setIsLive(false);

      ws.onclose = () => setIsLive(false);

      return () => ws.close();
    } catch {
      setIsLive(false);
    }
  }, []);

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-6 py-10 text-white">
        {/* HEADER */}

        <div className="mb-12">
          <div className="flex items-center gap-3 text-emerald-400 text-[10px] uppercase tracking-[0.35em] font-black">
            <span className="h-[1px] w-10 bg-emerald-400" />
            FARM NETWORK
          </div>

          <h1 className="text-5xl font-black mt-4">
            LIVE
            <span className="text-emerald-400"> FARM GRID</span>
          </h1>

          <div className="mt-4 flex items-center gap-2 text-[11px] uppercase text-zinc-500">
            {isLive ? (
              <>
                <Wifi size={14} className="text-emerald-400" />
                LIVE SIGNAL
              </>
            ) : (
              <>
                <WifiOff size={14} className="text-red-400" />
                SCAN MODE
              </>
            )}
          </div>
        </div>

        {/* ERROR */}

        {error && <div className="mb-8 text-red-400">{error}</div>}

        {/* LOADING */}

        {loading ? (
          <div className="py-32 text-center">
            <Scan size={30} className="animate-pulse mx-auto mb-4" />
            SCANNING FARMS...
          </div>
        ) : farms.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-8">
            {farms.map((farm) => (
              <div
                key={farm.id}
                className="
                  overflow-hidden
                  rounded-[32px]
                  bg-white/5
                  border
                  border-white/10
                  hover:border-emerald-500
                  transition
                "
              >
                {/* IMAGE */}

                <div className="h-60 bg-black">
                  <img
                    src={getImageUrl(farm.image)}
                    alt={farm.name}
                    className="
                      w-full
                      h-full
                      object-cover
                    "
                    onError={(e) => {
                      e.target.src = '/placeholder-farm.jpg';
                    }}
                  />
                </div>

                {/* CONTENT */}

                <div className="p-8">
                  <div className="flex justify-between mb-5">
                    <div>
                      <h3 className="text-xl font-black">{farm.name}</h3>

                      <div className="flex items-center gap-2 text-zinc-500 text-xs">
                        <MapPin size={12} />

                        {farm.address || 'Unknown location'}
                      </div>
                    </div>

                    <Store className="text-emerald-400" />
                  </div>

                  {/* SIGNAL */}

                  <div className="mb-4 flex justify-between text-xs">
                    <span className="text-emerald-400">ONLINE</span>

                    <span>{farm.signal}%</span>
                  </div>

                  <div className="h-2 bg-white/10 rounded mb-6">
                    <div
                      className="h-full bg-emerald-400 rounded"
                      style={{
                        width: `${farm.signal}%`,
                      }}
                    />
                  </div>

                  <Link
                    to={`/store/${farm.id}`}
                    className="
                      block
                      w-full
                      text-center
                      py-4
                      rounded-2xl
                      bg-emerald-500
                      text-black
                      font-black
                    "
                  >
                    ENTER FARM
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32">NO FARMS FOUND</div>
        )}
      </div>
    </MainLayout>
  );
}
