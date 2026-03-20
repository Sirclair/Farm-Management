import { useState, useContext } from "react";
import { UserContext } from "../UserContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import Spinner from "../components/Spinner";

export default function Auth() {
  const navigate = useNavigate();
  const { setUser, setLoading } = useContext(UserContext);
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({ username: "", email: "", password: "", first_name: "", last_name: "", farm_name: "" });
  const [error, setError] = useState("");
  const [loadingLocal, setLoadingLocal] = useState(false);

  const handleAuthSuccess = async () => {
    const userRes = await api.get("api/my-farm/accounts/me/");
    setUser(userRes.data);
    navigate("/dashboard");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoadingLocal(true);
      setError("");
      // Using /api/login/ as per your current setup, change to /api/token/ if needed
      const res = await api.post("api/login/", { username: formData.username, password: formData.password });
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      await handleAuthSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || "Access Denied");
    } finally {
      setLoadingLocal(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setLoadingLocal(true);
      setError("");
      await api.post("api/my-farm/accounts/register/", formData);
      const loginRes = await api.post("api/login/", { username: formData.username, password: formData.password });
      localStorage.setItem("access", loginRes.data.access);
      localStorage.setItem("refresh", loginRes.data.refresh);
      await handleAuthSuccess();
    } catch (err) {
      setError("Registration failed. Data invalid or farm exists.");
    } finally {
      setLoadingLocal(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      <div className="hidden lg:flex w-1/2 bg-[#0f172a] text-white p-12 flex-col justify-center">
        <h1 className="text-7xl font-black italic tracking-tighter mb-4">Farm<span className="text-blue-500">OS</span></h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Cloud Command Center</p>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100">
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
            <button onClick={() => setMode("login")} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${mode === "login" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}>Login</button>
            <button onClick={() => setMode("register")} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${mode === "register" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}>Register</button>
          </div>
          <AnimatePresence mode="wait">
            <motion.form key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4">
              {mode === "register" && (
                <>
                  <div className="flex gap-2">
                    <input placeholder="First Name" className="w-1/2 p-4 bg-slate-50 rounded-2xl outline-none text-xs" onChange={e => setFormData({...formData, first_name: e.target.value})} required />
                    <input placeholder="Last Name" className="w-1/2 p-4 bg-slate-50 rounded-2xl outline-none text-xs" onChange={e => setFormData({...formData, last_name: e.target.value})} required />
                  </div>
                  <input placeholder="Farm Name" className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl outline-none font-black text-xs uppercase" onChange={e => setFormData({...formData, farm_name: e.target.value})} required />
                  <input type="email" placeholder="Email" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-xs" onChange={e => setFormData({...formData, email: e.target.value})} required />
                </>
              )}
              <input placeholder="Username" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-xs" onChange={e => setFormData({...formData, username: e.target.value})} required />
              <input type="password" placeholder="Password" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-xs" onChange={e => setFormData({...formData, password: e.target.value})} required />
              {error && <p className="text-rose-500 text-[9px] font-black uppercase text-center">{error}</p>}
              <button disabled={loadingLocal} className="w-full bg-[#0f172a] text-white py-5 rounded-[25px] font-black uppercase text-[10px] tracking-[0.2em] hover:bg-black transition-all">
                {loadingLocal ? <Spinner /> : (mode === "login" ? "Initialize Command" : "Establish Farm")}
              </button>
            </motion.form>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
