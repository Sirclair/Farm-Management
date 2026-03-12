import { useEffect, useState } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

export default function Marketplace() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("accounts/explore/") // The endpoint we created in views.py
      .then(res => setFarms(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-center font-black animate-pulse">SCANNING LOCAL FARMS...</div>;

  return (
    <MainLayout>
      <h1 className="text-4xl font-black text-slate-900 mb-2 italic uppercase">
        Farm <span className="text-blue-600">Market</span>
      </h1>
      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-10">Direct from the source</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {farms.map(farm => (
          <div key={farm.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 group hover:-translate-y-2 transition-all">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-xl mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              🚜
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-1">{farm.name}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-6">
              {farm.address}, {farm.country}
            </p>
            
            <Link 
              to={`/store/${farm.id}`} 
              className="block w-full py-4 bg-slate-100 text-slate-900 rounded-2xl text-center font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
            >
              Enter Storefront
            </Link>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}