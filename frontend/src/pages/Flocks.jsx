import React, { useState, useEffect, useContext } from "react";
import api from "../api/axios";
import { UserContext } from "../UserContext";
import MainLayout from "../layouts/MainLayout";
import LogMortalityModal from "../components/LogMortalityModal";

export default function Flocks() {

  const { user } = useContext(UserContext);

  const [batches, setBatches] = useState([]);
  const [sales, setSales] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isLogMortalityOpen, setIsLogMortalityOpen] = useState(false);

  const fetchData = async () => {

    try {

      const [batchRes, saleRes] = await Promise.all([
        api.get("my-farm/flock/batches/"),
        api.get("my-farm/sales/orders/")
      ]);

      setBatches(batchRes.data.results || batchRes.data || []);
      setSales(saleRes.data.results || saleRes.data || []);

    } catch (error) {

      console.error("Flock fetch error:", error);

    } finally {

      setLoading(false);
    }
  };

  useEffect(() => {

    if (user) fetchData();

  }, [user]);

  if (loading) return <div className="p-10">Syncing farm database...</div>;

  return (
    <MainLayout>

      <LogMortalityModal
        isOpen={isLogMortalityOpen}
        onClose={() => setIsLogMortalityOpen(false)}
        onRefresh={fetchData}
      />

      <div className="bg-white rounded-[48px] border border-slate-100 shadow-xl overflow-hidden mt-10">

        <table className="w-full text-left">

          <thead className="bg-slate-50">

            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">

              <th className="px-10 py-7">Batch</th>
              <th className="px-10 py-7 text-center">Initial</th>
              <th className="px-10 py-7 text-center">Sold</th>
              <th className="px-10 py-7 text-center">Dead</th>
              <th className="px-10 py-7 text-center">In House</th>

            </tr>

          </thead>

          <tbody className="divide-y divide-slate-50">

            {batches.map((batch) => {

              const batchSoldQty = sales.reduce((acc, sale) => {

                const qty =
                  sale.items
                    ?.filter((i) => i.batch === batch.id)
                    .reduce((sum, i) => sum + Number(i.quantity), 0) || 0;

                return acc + qty;

              }, 0);

              return (

                <tr
                  key={batch.id}
                  className="hover:bg-slate-50 transition-all font-black text-xs uppercase"
                >

                  <td className="px-10 py-6 italic text-slate-800">
                    {batch.batch_number}
                  </td>

                  <td className="px-10 py-6 text-center text-slate-400">
                    {batch.quantity_received}
                  </td>

                  <td className="px-10 py-6 text-center text-blue-500">
                    {batchSoldQty}
                  </td>

                  <td className="px-10 py-6 text-center text-rose-500">
                    {batch.total_mortality_count}
                  </td>

                  <td className="px-10 py-6 text-center">

                    <span className="bg-slate-900 text-white px-4 py-2 rounded-xl">
                      {batch.current_stock}
                    </span>

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