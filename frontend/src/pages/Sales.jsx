import { useEffect, useState } from "react";
import api from "../api/axios";
import MainLayout from "../layouts/MainLayout";

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = async () => {
    try {
      const res = await api.get("my-farm/sales/orders/");
      setSales(res.data.results || res.data || []);
    } catch (err) {
      console.error("Sales fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="p-10 text-center font-black text-slate-400">
          LOADING SALES DATA...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 italic uppercase">
            Sales <span className="text-blue-600">Ledger</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
            Order Transactions
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-50 text-slate-400 uppercase font-black">
              <th className="pb-4">Customer</th>
              <th className="pb-4">Birds</th>
              <th className="pb-4">Amount</th>
              <th className="pb-4">Date</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {sales.map((order) => {
              const quantity =
                order.items?.reduce(
                  (sum, item) => sum + Number(item.quantity),
                  0
                ) || 0;

              return (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="py-4 font-bold text-slate-700">
                    {order.customer_name || "Walk-in"}
                  </td>

                  <td className="py-4 text-blue-600 font-bold">
                    {quantity} Birds
                  </td>

                  <td className="py-4 font-black text-slate-900">
                    R {parseFloat(order.total_amount).toFixed(2)}
                  </td>

                  <td className="py-4 text-slate-400 font-bold">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}