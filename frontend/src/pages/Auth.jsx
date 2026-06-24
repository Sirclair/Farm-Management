import React, { useState, useContext } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';

import api from '../api/axios';

import { UserContext } from '../UserContext';

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
  });

  // ============================
  // INPUT
  // ============================

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,

      [field]: value,
    }));
  };

  // ============================
  // LOGIN / REGISTER
  // ============================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    setError('');

    setSuccess('');

    try {
      // ====================
      // LOGIN
      // ====================

      if (mode === 'login') {
        const res = await api.post(
          '/api/my-farm/accounts/login/',

          {
            username: formData.username,

            password: formData.password,
          }
        );

        const data = res.data;

        if (!data.token) {
          throw new Error('Token missing');
        }

        // TOKEN

        localStorage.setItem(
          'token',

          data.token
        );

        // USER

        localStorage.setItem(
          'user',

          JSON.stringify(data.user)
        );

        // FARMS

        localStorage.setItem(
          'farms',

          JSON.stringify(data.farms || [])
        );

        // ACTIVE FARM

        if (data.active_farm) {
          localStorage.setItem(
            'active_farm',

            String(data.active_farm)
          );
        }

        api.defaults.headers.common.Authorization = `Token ${data.token}`;

        setUser(data.user);

        navigate(
          nextPath || '/dashboard',

          {
            replace: true,
          }
        );
      }

      // ====================
      // REGISTER
      // ====================
      else {
        await api.post(
          '/api/my-farm/accounts/register/',

          {
            username: formData.username,

            password: formData.password,

            email: formData.email,

            farm_name: formData.farm_name,
          }
        );

        setSuccess('Farm account created. Please sign in.');

        setMode('login');

        setFormData({
          username: '',
          password: '',
          email: '',
          farm_name: '',
        });
      }
    } catch (err) {
      console.error(err);

      const msg = err?.response?.data?.error || err?.message || 'Request failed';

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
min-h-screen
bg-gradient-to-br
from-slate-950
via-emerald-950
to-black
flex
items-center
justify-center
px-6
"
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="
w-full
max-w-lg
"
      >
        <div
          className="
bg-white/5
border
border-white/10
rounded-3xl
p-10
backdrop-blur-xl
"
        >
          <div
            className="
text-center
mb-8
"
          >
            <div
              className="
text-5xl
mb-4
"
            >
              🌾
            </div>

            <h1
              className="
text-white
text-3xl
font-bold
"
            >
              Farm Management Pro
            </h1>

            <p
              className="
text-slate-400
mt-2
"
            >
              Poultry • Inventory • Finance
            </p>
          </div>

          <div
            className="
flex
mb-8
bg-black/20
rounded-xl
overflow-hidden
"
          >
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`
flex-1
p-3

${mode === 'login' ? 'bg-emerald-500 text-white' : 'text-slate-400'}
`}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => setMode('register')}
              className={`
flex-1
p-3

${mode === 'register' ? 'bg-emerald-500 text-white' : 'text-slate-400'}
`}
            >
              Create Farm
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="
space-y-4
"
          >
            <Input
              required
              placeholder="Username"
              value={formData.username}
              onChange={(v) => handleInputChange('username', v)}
            />

            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  className="
space-y-4
"
                >
                  <Input
                    required
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(v) => handleInputChange('email', v)}
                  />

                  <Input
                    required
                    placeholder="Farm Name"
                    value={formData.farm_name}
                    onChange={(v) => handleInputChange('farm_name', v)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Input
              required
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(v) => handleInputChange('password', v)}
            />

            {error && (
              <div
                className="
bg-red-500/10
text-red-400
p-3
rounded-xl
"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="
bg-green-500/10
text-green-400
p-3
rounded-xl
"
              >
                {success}
              </div>
            )}

            <button
              disabled={loading}
              className="
w-full
bg-emerald-500
py-3
rounded-xl
text-white
font-bold
"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Farm'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function Input({
  type = 'text',

  placeholder,

  value,

  onChange,

  required,
}) {
  return (
    <input
      required={required}
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="
w-full
p-4
rounded-xl
bg-black/20
border
border-white/10
text-white
"
    />
  );
}
