import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import api from '../api/axios';
import {
  X,
  Plus,
  Trash2,
  ShoppingCart,
  User,
  Package,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';

const EMPTY_ITEM = {
  sale_type: 'product',
  product: '',
  batch: '',
  quantity: 1,
  weight: '',
  price: '',
  name: '',
};

export default function CreateSaleModal({ isOpen, onClose, refreshSales }) {
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);

  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [amountPaid, setAmountPaid] = useState('');

  const [items, setItems] = useState([EMPTY_ITEM]);

  // Guard states for network pipelines
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const notificationTimeoutRef = useRef(null);

  // Trigger custom toast alert notifications
  const showNotification = (message, type = 'success') => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification({ message, type });
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      fetchBatches();
      setNotification(null);
      setIsSubmitting(false);
      // Reset form states completely on open
      setCustomerName('');
      setPaymentMethod('cash');
      setReference('');
      setAmountPaid('');
      setItems([{ ...EMPTY_ITEM }]);
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/my-farm/products/items/');
      setProducts(res.data.results || res.data || []);
    } catch (err) {
      console.error('Error fetching marketplace inventory:', err);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await api.get('/api/my-farm/flock/batches/');
      setBatches(res.data.results || res.data || []);
    } catch (err) {
      console.error('Error fetching flock batches:', err);
    }
  };

  const isDressedProduct = (p) =>
    p?.product_type === 'processed' || p?.name?.toLowerCase?.().includes('dressed');

  const getProduct = (id) => products.find((p) => String(p.id) === String(id));
  const getBatch = (id) => batches.find((b) => String(b.id) === String(id));

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }, []);

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      return prev.map((item, i) => {
        if (i !== index) return item;

        let newItem = { ...item, [field]: value };

        // Handle Category Mode Toggles cleanly
        if (field === 'sale_type') {
          return {
            ...EMPTY_ITEM,
            sale_type: value,
            quantity: 1,
          };
        }

        if (field === 'product') {
          const selected = getProduct(value);
          if (selected) {
            newItem.name = selected.name;
            newItem.price = selected.price || '';
            newItem.quantity = 1;
            newItem.weight = '';

            if (isDressedProduct(selected)) {
              newItem.price = selected.price || 50;
            }
          }
        }

        if (field === 'batch') {
          const selectedBatch = getBatch(value);
          if (selectedBatch) {
            newItem.price = selectedBatch.selling_price_per_bird || 0;
            newItem.quantity = 1;
          }
        }

        // Keep weight and quantity synchronized explicitly for processed items
        if (newItem.sale_type === 'product') {
          const product = getProduct(newItem.product);
          if (product && isDressedProduct(product)) {
            if (field === 'weight') {
              const weightVal = parseFloat(value) || 0;
              newItem.quantity = weightVal;
            }
          }
        }

        return newItem;
      });
    });
  };

  // Live memoized value calculation for tracking form grand totals
  const total = useMemo(() => {
    return items.reduce((acc, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.price) || 0;
      return acc + q * p;
    }, 0);
  }, [items]);

  // Handle Form Submission Pipeline
  const submit = async () => {
    if (isSubmitting) return;

    if (!items || items.length === 0) {
      showNotification(
        'Cannot process order: Manifest line items are completely missing.',
        'warning'
      );
      return;
    }

    // Strict Line-by-Line Content Validation
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rowNum = i + 1;

      if (item.sale_type === 'live') {
        if (!item.batch) {
          showNotification(
            `Line Item #${rowNum}: Please select a flock batch allocation.`,
            'warning'
          );
          return;
        }
        const parsedLiveQty = parseInt(item.quantity, 10) || 0;
        if (parsedLiveQty <= 0) {
          showNotification(
            `Line Item #${rowNum}: Bird count must be an integer greater than 0.`,
            'warning'
          );
          return;
        }
      } else {
        if (!item.product) {
          showNotification(`Line Item #${rowNum}: Please select an inventory product.`, 'warning');
          return;
        }

        const selectedProd = getProduct(item.product);
        const isDressed = isDressedProduct(selectedProd);
        const rawQty = isDressed ? item.weight : item.quantity;
        const parsedProductQty = parseFloat(rawQty) || 0;

        if (parsedProductQty <= 0) {
          showNotification(
            `Line Item #${rowNum}: Order volume/quantity parameters must be greater than 0.`,
            'warning'
          );
          return;
        }
      }

      const parsedPrice = parseFloat(item.price) || 0;
      if (parsedPrice <= 0) {
        showNotification(
          `Line Item #${rowNum}: Unit transaction pricing must be greater than R 0.00.`,
          'warning'
        );
        return;
      }
    }

    if (total <= 0) {
      showNotification(
        'Cannot complete sale: Total order value must calculate above R 0.00',
        'warning'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('access');

      const payload = {
        customer_name: customerName.trim() || 'Walk-in Customer',
        items: items.map((item) => {
          if (item.sale_type === 'live') {
            return {
              batch_id: parseInt(item.batch, 10),
              quantity: parseInt(item.quantity, 10),
              price_per_unit: parseFloat(item.price),
            };
          }
          return {
            product_id: parseInt(item.product, 10),
            quantity: parseFloat(item.quantity),
            price_per_unit: parseFloat(item.price),
          };
        }),
        payments: [
          {
            amount:
              amountPaid === ''
                ? parseFloat(total.toFixed(2))
                : parseFloat(parseFloat(amountPaid).toFixed(2)),
            method: paymentMethod,
            reference: reference.trim(),
          },
        ],
      };

      await axios.post(`api/my-farm/sales/orders/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showNotification('Sale completed successfully! Syncing ledger metrics...', 'success');
      refreshSales?.();

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      let errorMessage = 'Network communication failure';
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          errorMessage = err.response.data.error || JSON.stringify(err.response.data);
        } else {
          errorMessage = err.response.data;
        }
      }
      showNotification(`Server Error: ${errorMessage}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300">
      <div className="relative w-full max-w-5xl bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* NOTIFICATION BANNER PIPELINE */}
        {notification && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl mx-auto px-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div
              className={`flex items-start gap-3.5 p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all ${
                notification.type === 'success'
                  ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200 shadow-emerald-950/30'
                  : notification.type === 'warning'
                    ? 'bg-amber-950/95 border-amber-500/40 text-amber-200 shadow-amber-950/30'
                    : 'bg-red-950/95 border-red-500/40 text-red-200 shadow-red-950/30'
              }`}
            >
              {notification.type === 'success' && (
                <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={20} />
              )}
              {notification.type === 'warning' && (
                <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={20} />
              )}
              {notification.type === 'error' && (
                <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
              )}

              <div className="flex-1 text-sm font-semibold tracking-wide leading-relaxed">
                {notification.message}
              </div>

              <button
                onClick={() => setNotification(null)}
                className="text-slate-400 hover:text-white transition-colors shrink-0 p-0.5 rounded-md hover:bg-slate-800/50"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800 bg-[#1e293b]/40">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <ShoppingCart className="text-emerald-400" size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Create New Sale</h2>
              <p className="text-sm text-slate-400 mt-1">
                Log custom marketplace transactions and live batch orders
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all disabled:opacity-30"
          >
            <X size={22} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
          {/* CUSTOMER INFO SECTION */}
          <div className="bg-[#1e293b]/20 border border-slate-800/80 rounded-xl p-6 space-y-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <User size={16} /> Customer Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm text-slate-300 font-medium">Customer Identity</label>
                <input
                  disabled={isSubmitting}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Walk-in Customer"
                  className="w-full bg-[#0b0f19] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-3.5 text-base text-white placeholder-slate-600 outline-none transition-all disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-300 font-medium">Payment Protocol</label>
                <select
                  disabled={isSubmitting}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-3.5 text-base text-white outline-none transition-all disabled:opacity-50"
                >
                  <option value="cash">💵 Cash Transaction</option>
                  <option value="card">💳 Card Payment</option>
                  <option value="transfer">🏦 Bank Wire Transfer</option>
                </select>
              </div>
            </div>
          </div>

          {/* LINE ITEMS SECTION */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Package size={16} /> Order Manifest Line Items
            </h3>

            <div className="space-y-4">
              {items.map((item, index) => {
                const product = getProduct(item.product);
                const isDressed = item.sale_type === 'product' && isDressedProduct(product);

                return (
                  <div
                    key={index}
                    className="bg-[#1e293b]/30 border border-slate-800 rounded-xl p-5 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                      {/* Sale Type Selector */}
                      <div className="w-full lg:w-1/4 space-y-2">
                        <label className="text-sm text-slate-300 font-medium">Category</label>
                        <select
                          disabled={isSubmitting}
                          value={item.sale_type}
                          onChange={(e) => updateItem(index, 'sale_type', e.target.value)}
                          className="w-full bg-[#0b0f19] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-3 text-sm font-semibold text-emerald-400 outline-none transition-all disabled:opacity-50"
                        >
                          <option value="product">📦 Inventory Item</option>
                          <option value="live">🐣 Live Broiler</option>
                        </select>
                      </div>

                      {/* Conditional Line Selection Layouts */}
                      {item.sale_type === 'live' ? (
                        <>
                          <div className="w-full lg:w-1/3 space-y-2">
                            <label className="text-sm text-slate-300 font-medium">
                              Flock Batch Origin
                            </label>
                            <select
                              disabled={isSubmitting}
                              value={item.batch}
                              onChange={(e) => updateItem(index, 'batch', e.target.value)}
                              className="w-full bg-[#0b0f19] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-3 text-base text-white outline-none transition-all"
                            >
                              <option value="">Choose Batch...</option>
                              {batches.map((b) => (
                                <option key={b.id} value={b.id}>
                                  Batch #{b.batch_number} {b.name ? `(${b.name})` : ''} — (
                                  {b.current_stock ?? 0} available)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="w-full lg:w-1/5 space-y-2">
                            <label className="text-sm text-slate-300 font-medium">Bird Count</label>
                            <input
                              disabled={isSubmitting}
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                              placeholder="1"
                              className="w-full bg-[#0b0f19] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-3 text-base text-white outline-none"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-full lg:w-1/3 space-y-2">
                            <label className="text-sm text-slate-300 font-medium">
                              Product Allocation
                            </label>
                            <select
                              disabled={isSubmitting}
                              value={item.product}
                              onChange={(e) => updateItem(index, 'product', e.target.value)}
                              className="w-full bg-[#0b0f19] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-3 text-base text-white outline-none"
                            >
                              <option value="">Choose Product...</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} — (R {p.price})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="w-full lg:w-1/5 space-y-2">
                            <label className="text-sm text-slate-300 font-medium">
                              {isDressed ? 'Total Mass (kg)' : 'Volume / Qty'}
                            </label>
                            <input
                              disabled={isSubmitting}
                              type="number"
                              step={isDressed ? '0.01' : '1'}
                              value={isDressed ? item.weight : item.quantity}
                              onChange={(e) =>
                                updateItem(index, isDressed ? 'weight' : 'quantity', e.target.value)
                              }
                              placeholder="0"
                              className="w-full bg-[#0b0f19] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-3 text-base text-white outline-none"
                            />
                          </div>
                        </>
                      )}

                      <div className="w-full lg:w-1/5 space-y-2">
                        <label className="text-sm text-slate-300 font-medium">
                          Price per Unit (R)
                        </label>
                        <input
                          disabled={isSubmitting}
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateItem(index, 'price', e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-[#0b0f19] border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-3 text-base text-white outline-none"
                        />
                      </div>

                      {items.length > 1 && (
                        <button
                          onClick={() => removeItem(index)}
                          className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-colors lg:mb-0.5"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <button
                onClick={addItem}
                className="w-full py-4 border border-dashed border-slate-700 hover:border-slate-500 bg-slate-900/20 hover:bg-slate-900/40 text-slate-400 hover:text-slate-300 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
              >
                <Plus size={16} /> Add Another Item Row
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER ACTION PANEL */}
        <div className="px-8 py-6 border-t border-slate-800 bg-[#1e293b]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl px-6 py-3 min-w-[200px] text-center sm:text-left">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              Total Value Due
            </span>
            <span className="text-2xl font-black text-emerald-400 tracking-tight">
              R {total.toFixed(2)}
            </span>
          </div>

          <button
            disabled={isSubmitting}
            onClick={submit}
            className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950/20 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Posting Order...' : 'Complete & Post Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
