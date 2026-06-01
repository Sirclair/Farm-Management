import React from 'react';
import { X, Receipt, User, Calendar, CreditCard, Package, FileText, Hash } from 'lucide-react';

export default function OrderDetailsModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  // Standardize the metric parsing just in case keys vary across serializers
  const totalAmount = Number(order.total_amount || order.subtotal || 0);
  const paidAmount = Number(order.total_paid || order.paid_amount || order.amount_paid || 0);

  const balance =
    order.balance_due !== undefined && order.balance_due !== null
      ? Number(order.balance_due)
      : Math.max(0, totalAmount - paidAmount);

  // Safe extraction helper supporting both nested arrays or flat key mappings from the database
  const mainPayment = order.payments?.[0] || {};
  const explicitMethod = order.payment_method || mainPayment.method || 'N/A';
  const explicitReference = order.reference || mainPayment.reference || 'None Provided';

  // Helper to make payment methods look human-readable
  const formatPaymentMethod = (method) => {
    if (!method) return 'N/A';
    const lower = method.toLowerCase();
    if (lower === 'cash') return '💵 Cash Transaction';
    if (lower === 'card') return '💳 Card Payment';
    if (lower === 'transfer') return '🏦 Bank Wire Transfer';
    return method.toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="flex items-center justify-between p-8 border-b bg-slate-50">
          <div>
            <h2 className="text-3xl font-black uppercase italic text-slate-900 flex items-center gap-3">
              <Receipt className="text-emerald-500" />
              Order #{order.id}
            </h2>
            <p className="text-xs uppercase tracking-[0.3em] font-black text-slate-400 mt-2">
              Transaction Details
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-white border flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
          {/* META DATA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard
              icon={<User size={18} />}
              label="Customer"
              value={order.customer_name || order.customer?.full_name || 'Walk-in Customer'}
            />
            <InfoCard
              icon={<Calendar size={18} />}
              label="Date"
              value={order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
            />
            <InfoCard
              icon={<CreditCard size={18} />}
              label="Status"
              value={balance <= 0 ? 'PAID' : 'PENDING'}
            />
          </div>

          {/* PAYMENT METHOD & REFERENCE SECTION */}
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">
              Payment & Audit Logs
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-xl bg-slate-200/60 flex items-center justify-center text-slate-700">
                  <CreditCard size={18} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                    Method
                  </p>
                  <p className="font-bold text-slate-800 text-sm">
                    {formatPaymentMethod(explicitMethod)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-xl bg-slate-200/60 flex items-center justify-center text-slate-700">
                  <Hash size={18} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                    Reference / Notes
                  </p>
                  <p className="font-bold text-slate-800 text-sm truncate max-w-[220px]">
                    {explicitReference}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ITEMS LIST */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 mb-4">
              Order Items
            </h3>

            <div className="space-y-4">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border border-slate-100 rounded-2xl p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Package size={18} />
                    </div>

                    <div>
                      <h4 className="font-black text-slate-900">{item.product_name}</h4>
                      <p className="text-xs text-slate-400 font-bold">
                        {item.weight > 0 ? `Mass: ${item.weight} kg` : `Qty: ${item.quantity}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-black text-slate-900">
                      R {Number(item.price_per_unit || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400 font-bold">Each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PAYMENT SUMMARY BLOCK */}
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white space-y-4">
            <SummaryRow label="Total Amount" value={`R ${totalAmount.toFixed(2)}`} />
            <SummaryRow label="Paid Amount" value={`R ${paidAmount.toFixed(2)}`} />
            <SummaryRow label="Balance" value={`R ${balance.toFixed(2)}`} highlight={balance > 0} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-5">
      <div className="flex items-center gap-2 text-slate-500 mb-3">
        {icon}
        <span className="text-xs uppercase tracking-[0.2em] font-black">{label}</span>
      </div>
      <h3 className="font-black text-slate-900">{value}</h3>
    </div>
  );
}

// Fixed validation to ensure fallback strings don't crash
function SummaryRow({ label, value, highlight }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm uppercase tracking-[0.2em] font-black text-slate-400">{label}</span>
      <span className={`text-xl font-black ${highlight ? 'text-orange-400' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}
