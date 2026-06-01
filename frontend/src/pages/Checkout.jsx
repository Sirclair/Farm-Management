import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Truck } from "lucide-react";
import api from "../api/axios";

export default function Checkout() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch the single product details
    api.get(`/api/products/marketplace/${productId}/`)
      .then(res => setProduct(res.data))
      .catch(() => navigate("/marketplace"))
      .finally(() => setLoading(false));
  }, [productId]);

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    try {
      // This hits your 'sales' app in the backend
      await api.post("/api/my-farm/sales/orders/", {
        product: productId,
        quantity: quantity,
      });
      alert("Order Placed Successfully! The farm will contact you.");
      navigate("/orders");
    } catch (err) {
      alert("Order failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-black uppercase">Loading Order...</div>;

  const total = (product.price * quantity).toFixed(2);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-8 text-slate-400 font-bold uppercase text-[10px]">
          <ArrowLeft size={16} /> Back to Store
        </button>

        <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-8 text-slate-900">Secure Checkout</h1>

        <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100">
          {/* Product Summary */}
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-50">
            <img src={product.image} className="w-24 h-24 rounded-3xl object-cover" alt={product.name} />
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase">{product.farm_name}</p>
              <h2 className="text-xl font-black uppercase">{product.name}</h2>
              <p className="text-slate-400 font-bold text-sm">R{product.price} each</p>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="flex justify-between items-center mb-8">
            <p className="font-black uppercase text-xs">Quantity</p>
            <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 bg-white rounded-xl font-bold shadow-sm">-</button>
              <span className="font-black text-xl w-8 text-center">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 bg-white rounded-xl font-bold shadow-sm">+</button>
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-4 mb-8 bg-slate-900 p-8 rounded-[30px] text-white">
            <div className="flex justify-between text-xs font-bold uppercase text-slate-400">
              <span>Subtotal</span>
              <span>R{total}</span>
            </div>
            <div className="flex justify-between text-xs font-bold uppercase text-slate-400 pb-4 border-b border-white/10">
              <span>Collection Fee</span>
              <span className="text-emerald-400 italic">FREE</span>
            </div>
            <div className="flex justify-between text-2xl font-black">
              <span>TOTAL</span>
              <span>R{total}</span>
            </div>
          </div>

          <button 
            disabled={submitting}
            onClick={handlePlaceOrder}
            className="w-full py-6 bg-blue-600 text-white rounded-[30px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-blue-200"
          >
            {submitting ? "Processing..." : "Confirm Order"}
          </button>
        </div>
      </div>
    </div>
  );
}