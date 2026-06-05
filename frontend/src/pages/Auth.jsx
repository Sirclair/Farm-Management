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
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-slate-950 flex items-center justify-center p-4 sm:p-6 antialiased selection:bg-indigo-500/30">
      {/* Decorative Background Elements for Depth */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-[440px] bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-800 p-8 sm:p-10 shadow-2xl shadow-black/40"
      >
        {/* Universal Multi-Tenant Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20 mb-4">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m2.828-9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">AgriOS</h1>
          <p className="text-sm text-slate-400 mt-1.5">The multi-tenant farming network</p>
        </div>

        {/* Segmented Control Toggle */}
        <div className="relative flex mb-8 bg-slate-950/60 rounded-xl p-1 border border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200 z-10 ${
              mode === 'login' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
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
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200 z-10 ${
              mode === 'register' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Get Started
          </button>
          {/* Animated background slider for the tabs */}
          <motion.div
            className="absolute top-1 bottom-1 left-1 bg-gradient-to-r from-slate-800 to-slate-800/80 rounded-lg shadow-md border border-slate-700/30"
            animate={{ x: mode === 'login' ? '0%' : '98%' }}
            style={{ width: '49%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3.5">
            <FormInput
              required
              placeholder="Username"
              value={formData.username}
              onChange={(val) => handleInputChange('username', val)}
            />

            <AnimatePresence mode="popLayout">
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-3.5 overflow-hidden"
                >
                  <FormInput
                    required
                    type="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={(val) => handleInputChange('email', val)}
                  />
                  <FormInput
                    required
                    placeholder="Farm enterprise name"
                    value={formData.farm_name}
                    onChange={(val) => handleInputChange('farm_name', val)}
                  />
                  <div className="grid grid-cols-2 gap-3.5">
                    <FormInput
                      placeholder="First name"
                      value={formData.first_name}
                      onChange={(val) => handleInputChange('first_name', val)}
                    />
                    <FormInput
                      placeholder="Last name"
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
          </div>

          {/* Feedback Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium p-3 rounded-xl flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0" />
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium p-3 rounded-xl flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
              {success}
            </motion.div>
          )}

          {/* Action Button */}
          <button
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-3.5 rounded-xl text-sm font-semibold tracking-wide hover:from-indigo-400 hover:to-indigo-500 active:scale-[0.99] transition-all duration-150 shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:pointer-events-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Syncing setup...
              </span>
            ) : mode === 'login' ? (
              'Sign In to Dashboard'
            ) : (
              'Deploy Farm Instance'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// Reusable Input Sub-component for better cleanliness and style uniformity
function FormInput({ type = 'text', placeholder, value, onChange, required = false }) {
  return (
    <input
      type={type}
      required={required}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3.5 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-100 placeholder-slate-500 text-sm outline-none transition-all duration-200 focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 focus:bg-slate-950/60"
    />
  );
}
