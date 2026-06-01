import { useEffect, useState } from 'react';
import api from '../api/axios';
import { X, Package, DollarSign, Layers, Warehouse, Tag } from 'lucide-react';

export default function AddProductModal({ isOpen, onClose, onSuccess }) {
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    product_type: 'inventory',
    live_type: '',
    selling_unit: 'unit',
    price: '',
    cost: '',
    stock_quantity: '',
    bulk_quantity: '',
    bulk_price: '',
    is_active: true,
  });

  const [loading, setLoading] = useState(false);

  // =====================================================
  // LOAD CATEGORIES
  // =====================================================

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/my-farm/products/categories/');

      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // =====================================================
  // HANDLE CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await api.post('/api/my-farm/products/items/', {
        ...form,
        price: Number(form.price || 0),
        cost: Number(form.cost || 0),
        stock_quantity: Number(form.stock_quantity || 0),
        bulk_quantity: form.bulk_quantity ? Number(form.bulk_quantity) : null,
        bulk_price: form.bulk_price ? Number(form.bulk_price) : null,
        category: form.category || null,
      });

      onSuccess?.();

      onClose();

      setForm({
        name: '',
        description: '',
        category: '',
        product_type: 'inventory',
        live_type: '',
        selling_unit: 'unit',
        price: '',
        cost: '',
        stock_quantity: '',
        bulk_quantity: '',
        bulk_price: '',
        is_active: true,
      });
    } catch (err) {
      console.error(err);
      alert('Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#08111f] border border-white/10 rounded-[36px] shadow-2xl overflow-hidden">
        {/* HEADER */}

        <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Package className="text-emerald-400" size={24} />
              Add Product
            </h2>

            <p className="text-zinc-500 mt-1 text-sm">Create a new farm product</p>
          </div>

          <button
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* GRID */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* NAME */}

            <InputField
              icon={<Tag size={18} />}
              label="Product Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter product name"
            />

            {/* CATEGORY */}

            <div>
              <label className="text-zinc-400 text-sm font-bold mb-2 block">Category</label>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full bg-[#0f172a] border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select Category</option>

                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* TYPE */}

            <div>
              <label className="text-zinc-400 text-sm font-bold mb-2 block">Product Type</label>

              <select
                name="product_type"
                value={form.product_type}
                onChange={handleChange}
                className="w-full bg-[#0f172a] border border-white/10 rounded-2xl px-4 py-4 text-white"
              >
                <option value="inventory">Inventory</option>
                <option value="live">Live Bird</option>
                <option value="processed">Processed Chicken</option>
              </select>
            </div>

            {/* LIVE TYPE */}

            {form.product_type === 'live' && (
              <div>
                <label className="text-zinc-400 text-sm font-bold mb-2 block">Live Type</label>

                <select
                  name="live_type"
                  value={form.live_type}
                  onChange={handleChange}
                  className="w-full bg-[#0f172a] border border-white/10 rounded-2xl px-4 py-4 text-white"
                >
                  <option value="">Select Type</option>
                  <option value="broiler">Broiler</option>
                  <option value="layer">Layer</option>
                </select>
              </div>
            )}

            {/* SELLING UNIT */}

            <div>
              <label className="text-zinc-400 text-sm font-bold mb-2 block">Selling Unit</label>

              <select
                name="selling_unit"
                value={form.selling_unit}
                onChange={handleChange}
                className="w-full bg-[#0f172a] border border-white/10 rounded-2xl px-4 py-4 text-white"
              >
                <option value="unit">Per Unit</option>
                <option value="kg">Per KG</option>
                <option value="tray">Per Tray</option>
              </select>
            </div>

            {/* PRICE */}

            <InputField
              icon={<DollarSign size={18} />}
              label="Selling Price"
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              placeholder="0.00"
            />

            {/* COST */}

            <InputField
              icon={<DollarSign size={18} />}
              label="Cost Price"
              name="cost"
              type="number"
              value={form.cost}
              onChange={handleChange}
              placeholder="0.00"
            />

            {/* STOCK */}

            <InputField
              icon={<Warehouse size={18} />}
              label="Stock Quantity"
              name="stock_quantity"
              type="number"
              value={form.stock_quantity}
              onChange={handleChange}
              placeholder="0"
            />

            {/* BULK QTY */}

            <InputField
              icon={<Layers size={18} />}
              label="Bulk Quantity"
              name="bulk_quantity"
              type="number"
              value={form.bulk_quantity}
              onChange={handleChange}
              placeholder="Optional"
            />

            {/* BULK PRICE */}

            <InputField
              icon={<DollarSign size={18} />}
              label="Bulk Price"
              name="bulk_price"
              type="number"
              value={form.bulk_price}
              onChange={handleChange}
              placeholder="Optional"
            />
          </div>

          {/* DESCRIPTION */}

          <div>
            <label className="text-zinc-400 text-sm font-bold mb-2 block">Description</label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Product description..."
              className="w-full bg-[#0f172a] border border-white/10 rounded-2xl px-4 py-4 text-white resize-none focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* ACTIVE */}

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              className="w-5 h-5"
            />

            <span className="text-zinc-300 font-medium">Product Active</span>
          </div>

          {/* ACTIONS */}

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black transition-all"
            >
              {loading ? 'CREATING...' : 'CREATE PRODUCT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================
// INPUT COMPONENT
// =====================================================

function InputField({ icon, label, name, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="text-zinc-400 text-sm font-bold mb-2 block">{label}</label>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">{icon}</div>

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-[#0f172a] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  );
}
