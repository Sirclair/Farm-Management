import React, { useState, useContext } from 'react';
import { UserContext } from '../UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useContext(UserContext);

  const queryParams = new URLSearchParams(location.search);
  const nextPath = queryParams.get('next');

  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    farm_name: '',
    first_name: '',
    last_name: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        const res = await api.post('/api/login/', {
          username: formData.username,
          password: formData.password,
        });

        localStorage.setItem('access', res.data.access);
        localStorage.setItem('refresh', res.data.refresh);

        const userRes = await api.get('/api/my-farm/accounts/me/');

        setUser(userRes.data);

        navigate(nextPath || '/dashboard');
      } else {
        await api.post('/api/my-farm/accounts/register/', formData);

        setSuccess('Account created successfully. Please sign in.');

        setMode('login');

        setFormData({
          username: '',
          password: '',
          email: '',
          farm_name: '',
          first_name: '',
          last_name: '',
        });
      }
    } catch (err) {
      const serverError = err.response?.data;

      const msg =
        typeof serverError === 'object'
          ? Object.values(serverError).flat()[0]
          : 'Action failed. Please try again.';

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 flex items-center justify-center px-4 py-8">
      {/* Background Glow */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-green-500/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-lg"
      >
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 md:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-xl shadow-green-500/30 mb-5">
              <span className="text-4xl">🌾</span>
            </div>

            <h1 className="text-3xl font-bold text-white">Farm Management Pro</h1>

            <p className="text-slate-400 mt-2">Poultry • Inventory • Sales • Finance</p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <FeatureCard title="Flock Tracking" value="Real-Time" />

            <FeatureCard title="Inventory" value="Smart Control" />

            <FeatureCard title="Sales" value="Track Revenue" />

            <FeatureCard title="Finance" value="Profit Analytics" />
          </div>

          {/* Tabs */}
          <div className="relative flex bg-black/30 p-1 rounded-xl border border-white/10 mb-8">
            <motion.div
              animate={{
                x: mode === 'login' ? '0%' : '100%',
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              className="absolute left-1 top-1 bottom-1 w-[calc(50%-4px)] bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg"
            />

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 z-10 py-3 text-sm font-semibold transition ${
                mode === 'login' ? 'text-white' : 'text-slate-400'
              }`}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 z-10 py-3 text-sm font-semibold transition ${
                mode === 'register' ? 'text-white' : 'text-slate-400'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              required
              placeholder="Username"
              value={formData.username}
              onChange={(val) => handleInputChange('username', val)}
            />

            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  initial={{
                    opacity: 0,
                    height: 0,
                  }}
                  animate={{
                    opacity: 1,
                    height: 'auto',
                  }}
                  exit={{
                    opacity: 0,
                    height: 0,
                  }}
                  className="space-y-4 overflow-hidden"
                >
                  <FormInput
                    required
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(val) => handleInputChange('email', val)}
                  />

                  <FormInput
                    required
                    placeholder="Farm Name"
                    value={formData.farm_name}
                    onChange={(val) => handleInputChange('farm_name', val)}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      placeholder="First Name"
                      value={formData.first_name}
                      onChange={(val) => handleInputChange('first_name', val)}
                    />

                    <FormInput
                      placeholder="Last Name"
                      value={formData.last_name}
                      onChange={(val) => handleInputChange('last_name', val)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <FormInput
              required
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(val) => handleInputChange('password', val)}
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm p-3 rounded-xl">
                {success}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white py-3.5 rounded-xl font-semibold transition-all shadow-xl shadow-green-500/20 disabled:opacity-50"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Farm Account'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">Trusted by poultry farmers across Africa</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function FeatureCard({ title, value }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
      <p className="text-xs text-slate-400">{title}</p>
      <p className="text-white font-semibold mt-1">{value}</p>
    </div>
  );
}

function FormInput({ type = 'text', placeholder, value, onChange, required = false }) {
  return (
    <input
      type={type}
      required={required}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
    />
  );
}
