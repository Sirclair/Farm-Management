import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import MainLayout from "../layouts/MainLayout";
import BuyModal from "../components/BuyModal"; // Ensure the path matches your project

export default function FarmStore() {
  const { farmId } = useParams();
  const navigate = useNavigate();
  
  const [farm, setFarm] = useState(null);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Memoized fetch function to refresh data after a purchase
  const fetchStoreData = useCallback(async () => {
    try {
      setLoading(true);
      // 1. Get Farm metadata (Name, Currency, etc.)
      // 2. Get only ACTIVE batches belonging to this specific Farm
      const [farmRes, stockRes] = await Promise.all([
        api.get(`accounts/farms/${farmId}/`),
        api.get(`my-farm/flock/batches/?farm_id=${farmId}&status=active`)
      ]);

      setFarm(farmRes.data);
      setStock(stockRes.data);
    } catch (err) {
      console.error("Error loading store:", err);
      // If farm doesn't exist, send them back to marketplace
      if (err.response?.status === 404) navigate("/marketplace");
    } finally {
      setLoading(false);
    }
  }, [farmId, navigate]);

  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center font-black text-slate-400 italic animate-pulse tracking-widest uppercase">
        Entering Storefront...
      </div>
    </div>
  );

  return (
    <MainLayout>
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
        <div>
          <button 
            onClick={() => navigate("/marketplace")}
            className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 hover:underline"
          >
            ← Back to Marketplace
          </button>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase">
            {farm?.name || "The Farm"} <span className="text-blue-600">Store</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
            Official Supplier • {farm?.address}
          </p>
        </div>
        
        <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pricing Policy</p>
           <p className="text-sm font-black text-slate-800">Direct Farm Rates ({farm?.currency_code || 'ZAR'})</p>
        </div>
      </div>

      {/* STOCK GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {stock.length > 0 ? (
          stock.map((batch) => (
            <div 
              key={batch.id} 
              className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row justify-between items-center group hover:scale-[1.01] transition-all"
            >
              <div className="mb-6 md:mb-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg uppercase">
                    {batch.breed || "Standard Broiler"}
                  </span>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    #{batch.batch_number}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-1">Grade-A Poultry</h3>
                <p className="text-sm font-bold text-slate-500 italic">
                   {batch.age_in_weeks} Weeks Growth Cycle
                </p>
              </div>

              <div className="text-center md:text-right w-full md:w-auto">
                <div className="mb-4">
                    <p className="text-3xl font-black text-slate-900 leading-none">
                        {batch.current_stock}
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Birds in Stock
                    </p>
                </div>
                
                <button 
                  disabled={batch.current_stock <= 0}
                  onClick={() => setSelectedBatch(batch)}
                  className={`w-full md:w-auto px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 ${
                    batch.current_stock > 0 
                    ? "bg-slate-900 text-white hover:bg-blue-600 shadow-blue-200" 
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {batch.current_stock > 0 ? "Buy Now" : "Out of Stock"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="lg:col-span-2 py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 text-center">
             <p className="text-slate-400 font-black uppercase tracking-widest italic text-sm">
                No active stock available from this farm currently.
             </p>
          </div>
        )}
      </div>

      {/* PURCHASE OVERLAY */}
      {selectedBatch && (
        <BuyModal 
          batch={selectedBatch} 
          isOpen={!!selectedBatch} 
          onClose={() => setSelectedBatch(null)} 
          onRefresh={fetchStoreData} 
          currency={farm?.currency_code || 'ZAR'}
        />
      )}
    </MainLayout>
  );
}