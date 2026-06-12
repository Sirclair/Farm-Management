import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import {
  X,
  Plus,
  Trash2,
  Loader2,
  ShoppingBasket,
  UserPlus,
  CalendarDays,
  Clock3,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

const TIME_SLOTS = [
  { value: '06:00:00', label: '06:00 AM Run' },
  { value: '07:00:00', label: '07:00 AM Run' },
  { value: '08:00:00', label: '08:00 AM Run' },
  { value: '09:00:00', label: '09:00 AM Run' },
  { value: '10:00:00', label: '10:00 AM Run' },
  { value: '11:00:00', label: '11:00 AM Run' },
  { value: '12:00:00', label: '12:00 PM Run' },
  { value: '13:00:00', label: '01:00 PM Run' },
  { value: '14:00:00', label: '02:00 PM Run' },
  { value: '15:00:00', label: '03:00 PM Run' },
  { value: '16:00:00', label: '04:00 PM Run' },
  { value: '17:00:00', label: '05:00 PM Run' },
  { value: '18:00:00', label: '06:00 PM Run' },
];

const EMPTY_ITEM = {
  sale_type: 'product',
  product: '',
  batch: '',
  quantity_ordered: '',
  unit_price: '',
};

export default function CreatePendingOrderModal({ isOpen, onClose, onCreated }) {
  const [loading, setLoading] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);

  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);

  const [notification, setNotification] = useState({
    show: false,
    type: 'success',
    message: '',
  });

  const [newCustomer, setNewCustomer] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
  });

  const [formData, setFormData] = useState({
    customer: '',
    expected_delivery_date: null,
    delivery_time: '',
    delivery_address: '',
    notes: '',
    items: [{ ...EMPTY_ITEM }],
  });

  const showNotification = (type, message) => {
    setNotification({
      show: true,
      type,
      message,
    });

    setTimeout(() => {
      setNotification((prev) => ({
        ...prev,
        show: false,
      }));
    }, 3500);
  };

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      fetchProducts();
      fetchBatches();
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/my-farm/sales/customers/');
      setCustomers(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/marketplace/items/');
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching marketplace inventory:', error);
      setProducts([]);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await axios.get('/api/my-farm/flock/batches/');
      setBatches(response.data || []);
    } catch (error) {
      console.error('Error fetching flock batches:', error);
      setBatches([]);
    }
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { ...EMPTY_ITEM }],
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) return;

    const updated = formData.items.filter((_, i) => i !== index);

    setFormData((prev) => ({
      ...prev,
      items: updated,
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];

    updated[index][field] = value;

    if (field === 'sale_type') {
      updated[index] = {
        ...EMPTY_ITEM,
        sale_type: value,
      };
    }

    if (field === 'product' && value) {
      const selectedProduct = products.find((p) => String(p.id) === String(value));
      if (selectedProduct) {
        updated[index].unit_price = selectedProduct.price || 0;
      }
    }

    if (field === 'batch' && value) {
      const selectedBatch = batches.find((b) => String(b.id) === String(value));
      if (selectedBatch) {
        updated[index].unit_price = selectedBatch.selling_price_per_bird || 0;
      }
    }

    setFormData((prev) => ({
      ...prev,
      items: updated,
    }));
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();

    if (!newCustomer.full_name.trim()) {
      showNotification('error', 'Customer full name is required.');
      return;
    }

    try {
      setCustomerLoading(true);
      const response = await axios.post('/api/my-farm/sales/customers/', newCustomer);

      showNotification('success', 'Customer account created successfully.');

      setCustomers((prev) => [response.data, ...prev]);

      setFormData((prev) => ({
        ...prev,
        customer: response.data.id,
      }));

      setShowCustomerForm(false);

      setNewCustomer({
        full_name: '',
        phone: '',
        email: '',
        address: '',
      });
    } catch (error) {
      console.error(error);
      showNotification('error', 'Failed to create customer account.');
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!formData.customer) {
      showNotification('error', 'Please select a customer.');
      return;
    }

    if (formData.items.length === 0) {
      showNotification('error', 'Please add at least one item.');
      return;
    }

    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];

      if (item.sale_type === 'product' && !item.product) {
        showNotification('error', `Row ${i + 1}: Please select a product.`);
        return;
      }

      if (item.sale_type === 'live' && !item.batch) {
        showNotification('error', `Row ${i + 1}: Please select a flock batch.`);
        return;
      }

      if (!item.quantity_ordered || Number(item.quantity_ordered) <= 0) {
        showNotification('error', `Row ${i + 1}: Quantity must be greater than zero.`);
        return;
      }

      if (!item.unit_price || Number(item.unit_price) <= 0) {
        showNotification('error', `Row ${i + 1}: Unit price must be greater than zero.`);
        return;
      }
    }

    try {
      setLoading(true);

      const formattedDate = formData.expected_delivery_date
        ? formData.expected_delivery_date.toISOString().split('T')[0]
        : null;

      const payload = {
        customer: parseInt(formData.customer),
        expected_delivery_date: formattedDate,
        delivery_time: formData.delivery_time || null,
        delivery_address: formData.delivery_address || '',
        notes: formData.notes || '',
        items: formData.items.map((item) => ({
          sale_type: item.sale_type,
          product: item.sale_type === 'product' ? parseInt(item.product) : null,
          batch: item.sale_type === 'live' ? parseInt(item.batch) : null,
          quantity_ordered: parseFloat(item.quantity_ordered),
          unit_price: parseFloat(item.unit_price),
        })),
      };

      await axios.post('/api/my-farm/sales/pending-orders/', payload);

      showNotification('success', 'Pending order created successfully.');

      setFormData({
        customer: '',
        expected_delivery_date: null,
        delivery_time: '',
        delivery_address: '',
        notes: '',
        items: [{ ...EMPTY_ITEM }],
      });

      onCreated?.();

      setTimeout(() => {
        onClose?.();
      }, 1000);
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.error || 'Failed to create pending order.';
      showNotification('error', message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity_ordered) || 0;
      const price = parseFloat(item.unit_price) || 0;
      return sum + qty * price;
    }, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-[#0f172a] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-white">
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800 bg-[#1e293b]/40">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <ShoppingBasket className="text-emerald-400" size={24} />
            </div>

            <div>
              <h2 className="text-2xl font-bold">Create Pending Order</h2>
              <p className="text-sm text-slate-400 mt-1">
                Reserve products and live flock stock allocations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X size={22} />
          </button>
        </div>

        {/* NOTIFICATION */}
        {notification.show && (
          <div className="px-8 pt-5">
            <div
              className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${
                notification.type === 'error'
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}
            >
              {notification.type === 'error' ? (
                <AlertTriangle size={18} />
              ) : (
                <CheckCircle size={18} />
              )}
              <span className="text-sm font-semibold">{notification.message}</span>
            </div>
          </div>
        )}

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* CUSTOMER */}
          <div className="bg-[#1e293b]/20 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Customer Details
              </h3>

              <button
                type="button"
                onClick={() => setShowCustomerForm(!showCustomerForm)}
                className="text-emerald-400 text-sm font-semibold flex items-center gap-2"
              >
                <UserPlus size={15} />
                {showCustomerForm ? 'Select Existing Customer' : 'Create New Customer'}
              </button>
            </div>

            {showCustomerForm ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newCustomer.full_name}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      full_name: e.target.value,
                    })
                  }
                  className="bg-[#0b0f19] border border-slate-800 rounded-xl px-4 py-3"
                />

                <input
                  type="text"
                  placeholder="Phone Number"
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      phone: e.target.value,
                    })
                  }
                  className="bg-[#0b0f19] border border-slate-800 rounded-xl px-4 py-3"
                />

                <input
                  type="email"
                  placeholder="Email Address"
                  value={newCustomer.email}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      email: e.target.value,
                    })
                  }
                  className="bg-[#0b0f19] border border-slate-800 rounded-xl px-4 py-3"
                />

                <input
                  type="text"
                  placeholder="Physical Address"
                  value={newCustomer.address}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      address: e.target.value,
                    })
                  }
                  className="bg-[#0b0f19] border border-slate-800 rounded-xl px-4 py-3"
                />

                <button
                  type="button"
                  onClick={handleCreateCustomer}
                  disabled={customerLoading}
                  className="md:col-span-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl py-3 font-bold text-white transition"
                >
                  {customerLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </div>
                  ) : (
                    'Create Customer'
                  )}
                </button>
              </div>
            ) : (
              <select
                value={formData.customer}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customer: e.target.value,
                  })
                }
                className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl px-4 py-3"
              >
                <option value="">Select Customer...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.full_name}
                    {customer.phone ? ` (${customer.phone})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* DELIVERY */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#1e293b]/20 border border-slate-800 rounded-2xl p-5">
              <label className="text-sm text-slate-400 flex items-center gap-2 mb-3">
                <CalendarDays size={15} />
                Delivery Date
              </label>

              <DatePicker
                selected={formData.expected_delivery_date}
                onChange={(date) =>
                  setFormData({
                    ...formData,
                    expected_delivery_date: date,
                  })
                }
                dateFormat="yyyy-MM-dd"
                placeholderText="Select date"
                className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl px-4 py-3 text-white"
              />
            </div>

            <div className="bg-[#1e293b]/20 border border-slate-800 rounded-2xl p-5">
              <label className="text-sm text-slate-400 flex items-center gap-2 mb-3">
                <Clock3 size={15} />
                Delivery Time
              </label>

              <select
                value={formData.delivery_time}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    delivery_time: e.target.value,
                  })
                }
                className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl px-4 py-3"
              >
                <option value="">Select Time Slot...</option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-[#1e293b]/20 border border-slate-800 rounded-2xl p-5">
              <label className="text-sm text-slate-400 mb-3 block">Delivery Address</label>
              <input
                type="text"
                value={formData.delivery_address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    delivery_address: e.target.value,
                  })
                }
                placeholder="Optional delivery location"
                className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl px-4 py-3"
              />
            </div>
          </div>

          {/* ITEMS */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Reservation Items
              </h3>

              <button
                type="button"
                onClick={handleAddItem}
                className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold"
              >
                <Plus size={15} />
                Add Item
              </button>
            </div>

            {formData.items.map((item, index) => (
              <div key={index} className="bg-[#1e293b]/20 border border-slate-800 rounded-2xl p-5">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                  <div className="lg:col-span-2">
                    <label className="text-sm text-slate-400 block mb-2">Category</label>
                    <select
                      value={item.sale_type}
                      onChange={(e) => handleItemChange(index, 'sale_type', e.target.value)}
                      className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl px-3 py-3"
                    >
                      <option value="product">Product</option>
                      <option value="live">Live Broiler</option>
                    </select>
                  </div>

                  <div className="lg:col-span-4">
                    <label className="text-sm text-slate-400 block mb-2">Inventory Item</label>
                    {item.sale_type === 'product' ? (
                      <select
                        value={item.product}
                        onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                        className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl px-3 py-3"
                      >
                        <option value="">Select Product...</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={item.batch}
                        onChange={(e) => handleItemChange(index, 'batch', e.target.value)}
                        className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl px-3 py-3"
                      >
                        <option value="">Select Batch...</option>
                        {batches.map((batch) => (
                          <option key={batch.id} value={batch.id}>
                            Batch #{batch.batch_number} {batch.name ? `(${batch.name})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="lg:col-span-2">
                    <label className="text-sm text-slate-400 block mb-2">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity_ordered}
                      onChange={(e) => handleItemChange(index, 'quantity_ordered', e.target.value)}
                      className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl px-3 py-3"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="text-sm text-slate-400 block mb-2">Unit Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl px-3 py-3"
                    />
                  </div>

                  <div className="lg:col-span-1 text-right">
                    <div className="text-xs text-slate-500 mb-2">Total</div>
                    <div className="font-bold text-emerald-400">
                      R{' '}
                      {(
                        (parseFloat(item.quantity_ordered) || 0) *
                        (parseFloat(item.unit_price) || 0)
                      ).toFixed(2)}
                    </div>
                  </div>

                  <div className="lg:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={formData.items.length === 1}
                      className="h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition disabled:opacity-30"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* NOTES */}
          <div className="space-y-3">
            <label className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Notes
            </label>
            <textarea
              rows={4}
              value={formData.notes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  notes: e.target.value,
                })
              }
              placeholder="Add internal notes or delivery instructions..."
              className="w-full bg-[#0b0f19] border border-slate-800 rounded-2xl px-4 py-4 resize-none"
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-8 py-6 border-t border-slate-800 bg-[#1e293b]/40 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="bg-[#0b0f19] border border-slate-800 px-6 py-3 rounded-xl flex items-center gap-4">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
              Total Reserved Value
            </span>
            <span className="text-2xl font-black text-emerald-400">
              R {calculateTotal().toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmitOrder}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white transition disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </div>
              ) : (
                'Create Pending Order'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
