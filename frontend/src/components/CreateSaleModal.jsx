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

  // 💡 PAYMENT LOGIC FIX: supports partial payments cleanly
  const [amountPaid, setAmountPaid] = useState('');

  const [items, setItems] = useState([EMPTY_ITEM]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const notificationTimeoutRef = useRef(null);

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
      console.error(err);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await api.get('/api/my-farm/flock/batches/');
      setBatches(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const isDressedProduct = (p) =>
    p?.product_type === 'processed' || p?.name?.toLowerCase?.().includes('dressed');

  const getProduct = (id) => products.find((p) => String(p.id) === String(id));
  const getBatch = (id) => batches.find((b) => String(b.id) === String(id));

  const total = useMemo(() => {
    return items.reduce((acc, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.price) || 0;
      return acc + q * p;
    }, 0);
  }, [items]);

  const balancePreview = useMemo(() => {
    const paid = parseFloat(amountPaid || 0);
    return total - paid;
  }, [total, amountPaid]);

  const submit = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const paidAmount = amountPaid === '' || amountPaid === null ? total : parseFloat(amountPaid);

      const payload = {
        customer_name: customerName.trim() || 'Walk-in Customer',
        items: items.map((item) => {
          if (item.sale_type === 'live') {
            return {
              batch_id: parseInt(item.batch, 10),
              quantity: parseFloat(item.quantity),
              price_per_unit: parseFloat(item.price),
            };
          }

          return {
            product_id: parseInt(item.product, 10),
            quantity: parseFloat(item.quantity),
            price_per_unit: parseFloat(item.price),
          };
        }),

        // ✅ CRITICAL FIX: supports partial payments (65 - 50 = debt auto handled backend)
        payments: [
          {
            amount: parseFloat(paidAmount.toFixed(2)),
            method: paymentMethod,
            reference: reference.trim(),
          },
        ],
      };

      await api.post('/api/my-farm/sales/orders/', payload);

      showNotification(
        paidAmount < total
          ? `Sale recorded with outstanding balance R ${(total - paidAmount).toFixed(2)}`
          : 'Sale completed successfully!',
        'success'
      );

      refreshSales?.();
      setTimeout(onClose, 1000);
    } catch (err) {
      console.error(err);
      showNotification('Server error processing sale', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-5xl bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">Create Sale</h2>
          <button onClick={onClose}>
            <X className="text-slate-400" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* PAYMENT CONTROL (NEW IMPORTANT PART) */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
            <div className="flex justify-between text-white">
              <span>Total:</span>
              <span>R {total.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-amber-300 mt-2">
              <span>Outstanding:</span>
              <span>R {balancePreview.toFixed(2)}</span>
            </div>

            <input
              type="number"
              placeholder="Amount Paid (e.g. 50)"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="mt-3 w-full bg-slate-800 text-white p-2 rounded"
            />

            <div className="text-xs text-slate-400 mt-1">
              Leave blank = full payment. Enter partial amount to create debt.
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-slate-800 flex justify-end">
          <button
            onClick={submit}
            disabled={isSubmitting}
            className="bg-emerald-500 px-6 py-3 rounded-lg font-bold"
          >
            {isSubmitting ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>
    </div>
  );
}
