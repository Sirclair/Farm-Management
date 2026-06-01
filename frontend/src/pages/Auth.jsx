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
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otp, setOtp] = useState('');

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

        if (!userRes.data.is_verified) {
          // Store email just in case they need to verify now
          localStorage.setItem('pending_email', userRes.data.email);
          setIsRegistered(true);
        } else {
          navigate(nextPath || '/dashboard');
        }
      } else {
        await api.post('/api/my-farm/accounts/register/', formData);
        // PERSISTENCE FIX: Save email for the next step
        localStorage.setItem('pending_email', formData.email);
        setIsRegistered(true);
      }
    } catch (err) {
      const serverError = err.response?.data;
      const msg =
        typeof serverError === 'object'
          ? Object.values(serverError).flat()[0]
          : 'Action Failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // PERSISTENCE FIX: Fallback to localStorage if state is wiped
    const emailToVerify = formData.email || localStorage.getItem('pending_email');

    try {
      await api.post('/api/my-farm/accounts/verify-otp/', {
        code: otp,
        email: emailToVerify,
      });

      localStorage.removeItem('pending_email'); // Cleanup
      setMode('login');
      setIsRegistered(false);
      setSuccess('Account verified! Please sign in to continue.');
      setOtp('');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid Verification Code.');
    } finally {
      setLoading(false);
    }
  };

  // --- OTP VERIFICATION UI ---
  if (isRegistered) {
    const displayEmail = formData.email || localStorage.getItem('pending_email');
    return (
      <div className="min-h-screen flex bg-slate-900 justify-center items-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white p-12 rounded-[48px] shadow-2xl"
        >
          <div className="bg-blue-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl animate-bounce">
            🔐
          </div>
          <h2 className="text-2xl font-black italic uppercase text-slate-900 mb-2">
            Verify Account
          </h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6">
            Code sent to: <span className="text-blue-600 font-black">{displayEmail}</span>
          </p>
          <form onSubmit={handleVerify}>
            <input
              id="otp_code"
              name="otp_code"
              required
              placeholder="000000"
              maxLength="6"
              className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-center text-3xl font-black tracking-[0.3em] outline-none mb-4 focus:border-blue-500"
              onChange={(e) => setOtp(e.target.value)}
            />
            {error && (
              <p className="text-rose-500 text-[9px] font-black uppercase mb-4 animate-pulse">
                ⚠️ {error}
              </p>
            )}
            <button
              disabled={loading}
              className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-900 transition-all"
            >
              {loading ? 'Verifying...' : 'Confirm & Unlock'}
            </button>
          </form>
          <button
            onClick={() => setIsRegistered(false)}
            className="mt-6 text-[9px] font-bold text-slate-400 uppercase tracking-tighter hover:text-slate-600"
          >
            Back to registration
          </button>
        </motion.div>
      </div>
    );
  }

  // --- LOGIN / REGISTER UI ---
  return (
    <div className="min-h-screen flex bg-slate-900 p-6 justify-center items-center">
      <motion.div layout className="w-full max-w-md bg-white p-10 rounded-[48px] shadow-2xl">
        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-center mb-10 text-slate-900">
          {mode === 'login' ? 'Welcome' : 'Create Farm'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            id="username"
            name="username"
            required
            placeholder="Username"
            className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-bold"
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
          {mode === 'register' && (
            <>
              <input
                id="email"
                name="email"
                required
                type="email"
                placeholder="Email Address"
                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-bold"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <input
                id="farm_name"
                name="farm_name"
                required
                placeholder="Farm Name"
                className="w-full p-5 bg-blue-50 border border-blue-100 rounded-3xl outline-none font-bold text-blue-900"
                onChange={(e) => setFormData({ ...formData, farm_name: e.target.value })}
              />
            </>
          )}
          <input
            id="password"
            name="password"
            required
            type="password"
            placeholder="Password"
            className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-bold"
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          {error && (
            <p className="text-rose-500 text-[9px] font-black uppercase text-center py-2 italic animate-pulse">
              {error}
            </p>
          )}

          {success && (
            <p className="text-emerald-600 text-[10px] font-black uppercase text-center py-3 italic border border-emerald-100 bg-emerald-50 rounded-2xl mb-2">
              ✅ {success}
            </p>
          )}

          <button
            disabled={loading}
            className="w-full bg-slate-900 text-white py-6 rounded-[30px] font-black uppercase text-[11px] tracking-widest hover:bg-blue-600 transition-all"
          >
            {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Start My Farm'}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
            setSuccess('');
          }}
          className="w-full mt-8 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-blue-500 text-center"
        >
          {mode === 'login' ? 'New here? Register a farm' : 'Already registered? Login'}
        </button>
      </motion.div>
    </div>
  );
}
