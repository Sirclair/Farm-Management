export default function OrderCard({ order }) {
  const balance = Number(order.balance || 0);
  const total = Number(order.total_amount || 0);
  const paid = Number(order.paid_amount || 0);

  return (
    <div className="bg-white border rounded-2xl p-6 shadow-lg">
      <div className="flex justify-between">
        {/* LEFT */}
        <div>
          <h2 className="font-black text-xl">{order.customer_name || 'Walk-in'}</h2>

          <p className="text-xs text-slate-400">Order #{order.id}</p>
        </div>

        {/* RIGHT */}
        <div className="text-right">
          <p className="font-black">R {total}</p>
          <p className="text-sm text-emerald-500">Paid: R {paid}</p>
          <p className="text-sm text-orange-500">Balance: R {balance}</p>
        </div>
      </div>

      {/* ITEMS */}
      <div className="mt-4 space-y-2">
        {(order.items || []).map((item) => (
          <div key={item.id} className="flex justify-between bg-slate-50 p-3 rounded-xl">
            <div>
              <p className="font-bold uppercase">{item.product_name}</p>
              <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
            </div>

            <p className="font-black text-emerald-600">
              R {(item.quantity * item.price_per_unit).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* STATUS */}
      <div className="mt-4">
        {balance > 0 ? (
          <span className="text-xs px-3 py-1 bg-orange-500/20 text-orange-500 rounded-full">
            DEBT
          </span>
        ) : (
          <span className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-500 rounded-full">
            PAID
          </span>
        )}
      </div>
    </div>
  );
}
