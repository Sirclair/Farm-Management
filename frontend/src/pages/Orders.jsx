import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import MainLayout from '../layouts/MainLayout';
import CreateSaleModal from './CreateSaleModal';
import OrderCard from './components/OrderCard';

import { Plus } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSale, setOpenSale] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/my-farm/sales/orders/');
      setOrders(res.data.results || res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-black uppercase">Sales Engine</h1>
            <p className="text-xs text-emerald-500 font-bold tracking-[0.3em]">
              Enterprise POS System
            </p>
          </div>

          <button
            onClick={() => setOpenSale(true)}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2"
          >
            <Plus size={16} />
            New Sale
          </button>
        </div>

        {/* LOADING */}
        {loading && <div className="text-center py-20 font-black">Loading Sales...</div>}

        {/* ORDERS */}
        <div className="space-y-6">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>

        {/* MODAL */}
        <CreateSaleModal
          isOpen={openSale}
          onClose={() => setOpenSale(false)}
          onSuccess={fetchOrders}
        />
      </div>
    </MainLayout>
  );
}
