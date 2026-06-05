import React, { useState, useContext } from 'react';
import { UserContext } from '../UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="
          w-full
          max-w-md
          bg-white/95
          backdrop-blur-xl
          rounded-3xl
          shadow-[0_20px_60px_rgba(0,0,0,0.35)]
          border
          border-slate-200
          p-10
        "
      >
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🐔</div>

          <h1 className="text-4xl font-black text-slate-900">Zonke Farms</h1>

          <p className="text-slate-500 mt-2">Farm Management Made Simple</p>
        </div>

        <div className="flex mb-8 bg-slate-100 rounded-2xl p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              mode === 'login' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
            }`}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              mode === 'register' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            placeholder="Username"
            value={formData.username}
            onChange={(e) =>
              setFormData({
                ...formData,
                username: e.target.value,
              })
            }
            className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {mode === 'register' && (
            <>
              <input
                required
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value,
                  })
                }
                className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                required
                placeholder="Farm Name"
                value={formData.farm_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    farm_name: e.target.value,
                  })
                }
                className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                placeholder="First Name"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    first_name: e.target.value,
                  })
                }
                className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                placeholder="Last Name"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    last_name: e.target.value,
                  })
                }
                className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </>
          )}

          <input
            required
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({
                ...formData,
                password: e.target.value,
              })
            }
            className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-xl">
              {success}
            </div>
          )}

          <button
            disabled={loading}
            className="
              w-full
              bg-gradient-to-r
              from-blue-600
              to-blue-700
              text-white
              py-4
              rounded-2xl
              font-bold
              tracking-wide
              hover:scale-[1.02]
              transition-all
              duration-200
              shadow-lg
              disabled:opacity-50
            "
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Farm Account'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
