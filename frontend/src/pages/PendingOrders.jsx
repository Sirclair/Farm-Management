import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  Plus,
  Calendar,
  MapPin,
  Layers,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Coins,
  X,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import api from '../api/axios';
import MainLayout from '../layouts/MainLayout';
import CreatePendingOrderModal from '../components/CreatePendingOrderModal';

export default function PendingOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState({});

  // Filtering & Searching States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Custom Toast State Engine
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4500);
  };

  // Fetch pending reservations
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/my-farm/sales/pending-orders/');
      setOrders(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (error) {
      console.error('FAILED TO FETCH RESERVATIONS:', error);
      showToast('Critical error fetching your reservations ledger database matrix.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Toggle dropdown section details
  const toggleExpand = (id) => {
    setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Quick Action State Mutators (FIXED: Handles transition payload requirement for fulfillment state changes)
  const updateOrderStatus = async (id, statusTarget) => {
    try {
      const payload =
        statusTarget === 'fulfilled'
          ? {
              status: 'fulfilled',
              fulfilled_at: new Date().toISOString(),
            }
          : {
              status: statusTarget,
            };

      await api.patch(`/api/my-farm/sales/pending-orders/${id}/`, payload);
      showToast(`Reservation moved to ${statusTarget.toUpperCase()} successfully.`, 'success');
      await fetchOrders();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to update order status metric.', 'error');
    }
  };

  const handleRecordDeposit = async (id, maxCollectible) => {
    const rawInput = window.prompt(
      `Enter deposit value collected (Max Remaining: R ${maxCollectible.toFixed(2)}):`
    );
    if (rawInput === null) return;

    const amount = parseFloat(rawInput);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please state a valid positive financial transaction amount.', 'error');
      return;
    }
    if (amount > maxCollectible) {
      showToast('Deposit submission cannot exceed total remaining balance amount.', 'error');
      return;
    }

    try {
      await api.patch(`/api/my-farm/sales/pending-orders/${id}/`, {
        deposit_paid: amount,
        status: 'partial',
      });
      showToast('Deposit register successfully tracked and applied.', 'success');
      await fetchOrders();
    } catch (error) {
      showToast('Error updating deposit register transaction payload.', 'error');
    }
  };

  // Helper utility to render status badges
  const getStatusBadge = (status) => {
    const base =
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border';
    switch (status?.toLowerCase()) {
      case 'fulfilled':
        return (
          <span className={`${base} bg-emerald-500/20 text-emerald-400 border-emerald-500/40`}>
            <CheckCircle2 size={12} /> Fulfilled
          </span>
        );
      case 'partial':
        return (
          <span className={`${base} bg-blue-500/10 text-blue-400 border-blue-500/20`}>
            <Layers size={12} /> Deposit Paid
          </span>
        );
      case 'cancelled':
        return (
          <span className={`${base} bg-rose-500/10 text-rose-400 border-rose-500/20`}>
            <XCircle size={12} /> Cancelled
          </span>
        );
      default:
        return (
          <span className={`${base} bg-amber-500/10 text-amber-400 border-amber-500/20`}>
            <Clock size={12} /> Pending
          </span>
        );
    }
  };

  // Filter Logic
  const filteredOrders = orders.filter((order) => {
    const orderNum = (order.order_number || `#PEND-${order.id}`).toLowerCase();
    const customerName = (order.customer_name || 'Walk-in Customer').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = orderNum.includes(query) || customerName.includes(query);

    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending')
        matchesStatus = order.status?.toLowerCase() === 'pending' || !order.status;
      else if (statusFilter === 'partial')
        matchesStatus = order.status?.toLowerCase() === 'partial';
      else if (statusFilter === 'fulfilled')
        matchesStatus = order.status?.toLowerCase() === 'fulfilled';
      else if (statusFilter === 'cancelled')
        matchesStatus = order.status?.toLowerCase() === 'cancelled';
    }

    return matchesSearch && matchesStatus;
  });

  // FIXED: Calculations exclude completed or aborted statuses to preserve active accounting validity
  const totalReservationsValue = filteredOrders.reduce((sum, order) => {
    if (order.status === 'fulfilled' || order.status === 'cancelled') {
      return sum;
    }
    return sum + Number(order.total_amount || order.subtotal || 0);
  }, 0);

  const totalDepositsCollected = filteredOrders.reduce((sum, order) => {
    if (order.status === 'fulfilled' || order.status === 'cancelled') {
      return sum;
    }
    return sum + Number(order.deposit_paid || 0);
  }, 0);

  const totalOutstandingBalance = filteredOrders.reduce((sum, order) => {
    if (order.status === 'fulfilled' || order.status === 'cancelled') {
      return sum;
    }
    return sum + Number(order.balance_due || 0);
  }, 0);

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-6 py-10 text-white min-h-screen relative">
        {/* TOAST CONTAINER */}
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center justify-between p-4 rounded-xl border shadow-2xl transition-all duration-300 pointer-events-auto backdrop-blur-md animate-[slideIn_0.25s_ease-out]
                ${
                  toast.type === 'success'
                    ? 'bg-slate-900/95 border-emerald-500 text-white shadow-emerald-950/40'
                    : toast.type === 'error'
                      ? 'bg-slate-900/95 border-rose-500 text-white shadow-rose-950/40'
                      : 'bg-slate-900/95 border-blue-500 text-white'
                }`}
            >
              <div className="flex items-center gap-3">
                {toast.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <p className="text-xs font-semibold tracking-wide text-zinc-100">{toast.message}</p>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-zinc-500 hover:text-white transition-colors ml-3 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ClipboardList size={20} className="text-emerald-400" />
              <h1 className="text-xs font-black tracking-[0.3em] uppercase text-emerald-400">
                Customer Reservations Log
              </h1>
            </div>
            <h2 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-100">
              Pending <span className="text-emerald-500">Orders</span>
            </h2>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-4 rounded-2xl font-black uppercase tracking-wider flex items-center gap-2 self-start sm:self-auto transition-colors duration-200 shadow-lg shadow-emerald-500/10 text-sm"
          >
            <Plus size={18} strokeWidth={3} />
            New Reservation
          </button>
        </div>

        {/* CONTROLS TOOLBAR */}
        <div className="bg-[#111827] border border-white/5 rounded-3xl p-5 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
          <div className="relative w-full md:max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search customer name or order sequence number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/30 border border-white/5 rounded-xl pl-11 pr-4 py-3 text-xs font-medium text-slate-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mr-2 flex items-center gap-1">
              <SlidersHorizontal size={12} /> Filter:
            </span>
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'pending', label: 'Pending' },
              { id: 'partial', label: 'Deposit Paid' },
              { id: 'fulfilled', label: 'Fulfilled' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                  statusFilter === tab.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                    : 'bg-black/20 hover:bg-zinc-800/50 text-zinc-400 border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ANALYTICS CARDS */}
        {!loading && filteredOrders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-[#111827] border border-white/5 rounded-3xl p-6 shadow-xl">
              <div className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">
                Total Value Reserved
              </div>
              <div className="text-3xl font-black text-emerald-400">
                R {totalReservationsValue.toFixed(2)}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">
                Gross worth of active outstanding pipeline allocations
              </div>
            </div>
            <div className="bg-[#111827] border border-white/5 rounded-3xl p-6 shadow-xl">
              <div className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">
                Deposits Collected
              </div>
              <div className="text-3xl font-black text-blue-400">
                R {totalDepositsCollected.toFixed(2)}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">
                Secured deposits held inside outstanding bookings
              </div>
            </div>
            <div className="bg-[#111827] border border-white/5 rounded-3xl p-6 shadow-xl">
              <div className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">
                Outstanding Balances
              </div>
              <div className="text-3xl font-black text-orange-400">
                R {totalOutstandingBalance.toFixed(2)}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">
                Collectible pipeline revenue remaining to clear
              </div>
            </div>
          </div>
        )}

        {/* LEDGER RENDER */}
        {loading ? (
          <div className="bg-[#111827] border border-white/5 rounded-[40px] p-20 text-center text-zinc-400 font-bold tracking-widest uppercase text-xs">
            Loading Reservations Ledger Matrix...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-[#111827] border border-white/5 rounded-[40px] p-20 text-center shadow-2xl">
            <h3 className="text-2xl font-black mb-2">No Matching Reservations</h3>
            <p className="text-zinc-400 text-sm max-w-sm mx-auto mb-4">
              There are currently no outstanding orders matching your search queries or status
              criteria filters.
            </p>
            {(searchQuery || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl border border-white/5 transition-colors"
              >
                Reset Search Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isExpanded = !!expandedOrders[order.id];
              const totalAmount = Number(order.subtotal || order.total_amount || 0);
              const depositPaid = Number(order.deposit_paid || 0);
              const balanceDue = Number(order.balance_due || 0);
              const orderNum = order.order_number || `#PEND-${order.id}`;
              const isFulfilled = order.status === 'fulfilled';
              const isCancelled = order.status === 'cancelled';

              return (
                <div
                  key={order.id}
                  className={`border transition-all duration-200 shadow-xl overflow-hidden rounded-[28px] ${
                    isFulfilled
                      ? 'bg-slate-950 border-emerald-500/40 shadow-emerald-950/20 shadow-lg'
                      : isCancelled
                        ? 'bg-zinc-900/20 border-white/5 opacity-40'
                        : 'bg-[#111827] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div
                    onClick={() => toggleExpand(order.id)}
                    className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1 hidden sm:block p-3 bg-zinc-800/40 rounded-xl border border-white/5 text-zinc-400">
                        <ClipboardList size={22} />
                      </div>
                      <div>
                        <div className="text-xs text-emerald-400 font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                          {orderNum}
                          {order.expected_delivery_date && (
                            <span className="text-zinc-500 font-bold tracking-normal normal-case flex items-center gap-1">
                              • <Calendar size={12} /> {order.expected_delivery_date}
                            </span>
                          )}
                        </div>

                        <h3
                          className={`text-2xl font-black tracking-tight ${isFulfilled ? 'text-zinc-100' : 'text-slate-100'}`}
                        >
                          {order.customer_name || 'Walk-in Customer'}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          {getStatusBadge(order.status)}
                          {order.items?.length > 0 && (
                            <span className="text-xs text-zinc-400 font-medium bg-zinc-800/40 px-2.5 py-0.5 rounded-md border border-white/5">
                              {order.items.length}{' '}
                              {order.items.length === 1 ? 'allocated item' : 'allocated items'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 sm:gap-10 lg:text-right">
                      <div>
                        <span className="text-[10px] uppercase text-zinc-500 font-black tracking-widest block mb-0.5">
                          Deposit Paid
                        </span>
                        <div
                          className={`text-lg font-black tracking-tight ${isFulfilled ? 'text-emerald-400' : 'text-blue-400'}`}
                        >
                          R {depositPaid.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-zinc-500 font-black tracking-widest block mb-0.5">
                          Balance Due
                        </span>
                        {/* FIXED: Replaced layout style state label to prevent users from thinking fulfilled orders remain outstanding */}
                        <div
                          className={`text-lg font-black tracking-tight ${
                            isFulfilled ? 'text-emerald-400' : 'text-orange-400'
                          }`}
                        >
                          {isFulfilled ? 'Transferred' : `R ${balanceDue.toFixed(2)}`}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-zinc-500 font-black tracking-widest block mb-0.5">
                          Reserved Total
                        </span>
                        <div className="text-2xl font-black text-emerald-400 tracking-tight">
                          R {totalAmount.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-zinc-500 pl-2">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-white/5 bg-zinc-950/40 p-6 sm:p-8 space-y-6 animate-[fadeIn_0.2s_ease-out]">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase text-zinc-500 font-black tracking-widest flex items-center gap-1.5">
                            <Calendar size={12} /> Target Delivery Schedule
                          </span>
                          <p className="text-sm font-semibold text-zinc-200">
                            {order.expected_delivery_date
                              ? `${order.expected_delivery_date} ${order.delivery_time || ''}`
                              : 'No logistics timeframe structured.'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase text-zinc-500 font-black tracking-widest flex items-center gap-1.5">
                            <MapPin size={12} /> Fulfillment / Logistics Drop
                          </span>
                          <p className="text-sm font-semibold text-zinc-200 truncate max-w-xs">
                            {order.delivery_address || 'Collection at Farm Depot'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase text-zinc-500 font-black tracking-widest flex items-center gap-1.5">
                            <FileText size={12} /> Allocation Audit Notes
                          </span>
                          <p className="text-sm font-medium italic text-zinc-400">
                            {order.notes || '"No transactional annotation notes recorded"'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase text-zinc-500 font-black tracking-widest mb-3">
                          Reserved Stock Allocation Breakdown
                        </div>
                        {order.items && order.items.length > 0 ? (
                          <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/20">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-zinc-900/50 text-zinc-400 border-b border-white/5 font-bold uppercase tracking-wider">
                                    <th className="p-4">Stock Description</th>
                                    <th className="p-4 text-center">Qty Booked</th>
                                    <th className="p-4 text-center">Qty Fulfilled</th>
                                    <th className="p-4 text-center">Remaining</th>
                                    <th className="p-4 text-right">Unit Price</th>
                                    <th className="p-4 text-right">Gross Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-zinc-300 font-semibold">
                                  {order.items.map((item) => {
                                    const qtyOrdered = Number(item.quantity_ordered || 0);
                                    const qtyFulfilled = Number(item.quantity_fulfilled || 0);
                                    const qtyRemaining = Number(
                                      item.quantity_remaining || qtyOrdered - qtyFulfilled
                                    );
                                    const lineTotal = Number(
                                      item.line_total || qtyOrdered * Number(item.unit_price || 0)
                                    );

                                    return (
                                      <tr
                                        key={item.id}
                                        className="hover:bg-white/[0.01] transition-colors"
                                      >
                                        <td className="p-4 font-black text-slate-100">
                                          {item.product_name ||
                                            (item.batch
                                              ? `Batch: ${item.batch}`
                                              : `Stock Item #${item.id}`)}
                                        </td>
                                        <td className="p-4 text-center text-sm font-black">
                                          {qtyOrdered}
                                        </td>
                                        <td className="p-4 text-center text-blue-400">
                                          {qtyFulfilled}
                                        </td>
                                        <td className="p-4 text-center text-orange-400">
                                          {qtyRemaining}
                                        </td>
                                        <td className="p-4 text-right">
                                          R {Number(item.unit_price || 0).toFixed(2)}
                                        </td>
                                        <td className="p-4 text-right text-emerald-400 font-black">
                                          R {lineTotal.toFixed(2)}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-zinc-900/40 border border-dashed border-white/5 text-zinc-500 rounded-xl text-center text-xs">
                            No detailed allocations map items tracked within this dynamic payload.
                          </div>
                        )}
                      </div>

                      {!isFulfilled && !isCancelled && (
                        <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
                          {balanceDue > 0 && (
                            <button
                              onClick={() => handleRecordDeposit(order.id, balanceDue)}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                            >
                              <Coins size={14} /> Record Deposit Paid
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  'Confirm overall delivery? This will deduct stock and compile a sales invoice.'
                                )
                              ) {
                                updateOrderStatus(order.id, 'fulfilled');
                              }
                            }}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                          >
                            <CheckCircle2 size={14} /> Mark As Delivered
                          </button>

                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  'Are you sure you want to cancel this reservation? All locked stock will be dropped.'
                                )
                              ) {
                                updateOrderStatus(order.id, 'cancelled');
                              }
                            }}
                            className="bg-zinc-850 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-white/5 hover:border-rose-500/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                          >
                            <XCircle size={14} /> Cancel Reservation
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL SYSTEM */}
        <CreatePendingOrderModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            fetchOrders();
            setShowCreateModal(false);
          }}
        />
      </div>
    </MainLayout>
  );
}
