import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import MainLayout from "../layouts/MainLayout";

export default function FarmStore() {
  const { farmId } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Your actual Zonke Farms WhatsApp number
  const WHATSAPP_NUMBER = "27683952777"; 

  useEffect(() => {
    // Using backticks for template literals to ensure farmId is injected correctly
    const url = `/api/explore-farms/farms/${farmId}/products/`;
    api.get(url)
      .then(res => {
        console.log("Stock Data Loaded:", res.data);
        setProducts(res.data);
      })
      .catch(err => {
        console.error("API Error:", err);
        setErrorMsg("Unable to load the farm's inventory.");
      })
      .finally(() => setLoading(false));
  }, [farmId]);

  const handleWhatsAppOrder = (product) => {
    const message = `Hi! I saw your listing on FarmOS. I am interested in:
- Product: ${product.product_name}
- Age: ${product.age_in_weeks} Weeks
- Price: R${product.price}
Is this still available?`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const renderProductImage = (image, isSoldOut) => {
    if (image) {
      // Logic to ensure images work on both Localhost and Render
      const imageUrl = image.startsWith('http') ? image : `${api.defaults.baseURL}${image}`;
      
      return (
        <img 
          src={imageUrl} 
          alt="Poultry" 
          className={`w-full h-56 object-cover rounded-[2.5rem] mb-4 border border-slate-100 transition-all duration-500 ${isSoldOut ? 'grayscale contrast-75' : 'group-hover:scale-105'}`}
          onError={(e) => {
            // Fallback if the image path is broken
            e.target.onerror = null; 
            e.target.src = 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=400';
          }}
        />
      );
    }
    return (
      <div className="w-full h-56 bg-slate-100 rounded-[2.5rem] mb-4 flex flex-col items-center justify-center border-2 border-dashed border-slate-200">
        <svg className="w-12 h-12 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Image Available</p>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Marketplace</h1>
          <p className="text-blue-600 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Live Inventory Control</p>
        </div>
        <div className="text-right hidden md:block">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Farm Terminal ID</span>
            <p className="font-black text-slate-900 tracking-tighter">#00{farmId}</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse">
            <div className="w-12 h-12 bg-slate-200 rounded-full mx-auto mb-4"></div>
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Syncing Stock Ledger...</p>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {products.map((product) => {
            const isSoldOut = product.quantity <= 0;
            const isLowStock = product.quantity > 0 && product.quantity <= 10;

            return (
              <div 
                key={product.id} 
                className={`group bg-white p-6 rounded-[3.5rem] border border-slate-100 shadow-2xl transition-all duration-300 relative ${isSoldOut ? 'opacity-70' : 'hover:shadow-blue-200/50 hover:-translate-y-2'}`}
              >
                {/* Status Badges */}
                {isSoldOut ? (
                  <div className="absolute top-8 left-8 z-10 bg-slate-900 text-white px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl -rotate-6">
                    Sold Out
                  </div>
                ) : isLowStock ? (
                  <div className="absolute top-8 left-8 z-10 bg-orange-500 text-white px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl animate-bounce">
                    Running Low!
                  </div>
                ) : (
                  <div className="absolute top-8 left-8 z-10 bg-blue-600 text-white px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">
                    In Stock
                  </div>
                )}

                <div className="overflow-hidden rounded-[2.5rem]">
                    {renderProductImage(product.image, isSoldOut)}
                </div>

                <div className="flex justify-between items-start mb-4 px-4">
                  <div>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">
                        {product.breed || "Standard Broiler"}
                    </span>
                    <h3 className="font-black text-slate-800 text-2xl uppercase italic tracking-tight leading-none">
                        {product.product_name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-slate-900 leading-none">R{product.price}</p>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Per Head</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 px-2">
                  <div className="bg-slate-50 p-4 rounded-[1.5rem] text-center border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Batch Age</p>
                    <p className="font-black text-slate-800 tracking-tight">{product.age_in_weeks} Weeks</p>
                  </div>
                  <div className={`p-4 rounded-[1.5rem] text-center border ${isLowStock ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Stock Level</p>
                    <p className={`font-black tracking-tight ${isSoldOut ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-slate-800'}`}>
                      {product.quantity} Birds
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => !isSoldOut && handleWhatsAppOrder(product)}
                  disabled={isSoldOut}
                  className={`w-full py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                    isSoldOut 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-slate-200' 
                    : 'bg-[#25D366] text-white hover:bg-slate-900 shadow-lg active:scale-95'
                  }`}
                >
                  {isSoldOut ? 'Sold Out' : 'Order via WhatsApp'}
                </button>
                
                {product.last_updated && (
                  <p className="text-center text-[8px] font-bold text-slate-300 uppercase mt-4 tracking-widest">
                    Last Stock Check: {product.last_updated}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-32 bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-200 flex flex-col items-center">
          <div className="bg-white p-6 rounded-full shadow-lg mb-4">
            <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No batches currently listed for sale.</p>
        </div>
      )}
    </MainLayout>
  );
}