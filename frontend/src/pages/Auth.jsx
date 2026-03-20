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
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "farmer",
    farm_name: "",
  });
  const [error, setError] = useState("");
  const [loadingLocal, setLoadingLocal] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setLoadingLocal(true);
      setError("");

      const res = await api.post("api/login/", {
        username: formData.username,
        password: formData.password,
      });

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      const userRes = await api.get("api/my-farm/accounts/me/");
      setUser(userRes.data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoadingLocal(false);
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setLoadingLocal(true);
      setError("");

      // Hits your FarmRegistrationSerializer
      await api.post("api/my-farm/accounts/register/", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        farm_name: formData.farm_name,
      });

      // Auto-login
      const loginRes = await api.post("api/login/", {
        username: formData.username,
        password: formData.password,
      });

      localStorage.setItem("access", loginRes.data.access);
      localStorage.setItem("refresh", loginRes.data.refresh);

      const userRes = await api.get("api/my-farm/accounts/me/");
      setUser(userRes.data);
      navigate("/dashboard");
    } catch (err) {
      console.error("Registration error:", err.response?.data);
      const backendError = err.response?.data;
      setError(backendError?.username?.[0] || backendError?.farm_name?.[0] || "Registration failed.");
    } finally {
      setLoadingLocal(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:flex w-1/2 bg-[#0f172a] text-white p-12 flex-col justify-center">
        <h1 className="text-6xl font-black italic tracking-tighter mb-4">Farm<span className="text-blue-500">OS</span></h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Next-Gen Poultry Management</p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100">
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
            <button onClick={() => setMode("login")} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${mode === "login" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}>Login</button>
            <button onClick={() => setMode("register")} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${mode === "register" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}>Register</button>
          </div>

          <AnimatePresence mode="wait">
            <motion.form 
              key={mode}
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              onSubmit={mode === "login" ? handleLogin : handleRegister} 
              className="space-y-4"
            >
              {mode === "register" && (
                <>
                  <div className="flex gap-2">
                    <input placeholder="First Name" className="w-1/2 p-4 bg-slate-50 rounded-2xl outline-none" onChange={e => setFormData({...formData, first_name: e.target.value})} required />
                    <input placeholder="Last Name" className="w-1/2 p-4 bg-slate-50 rounded-2xl outline-none" onChange={e => setFormData({...formData, last_name: e.target.value})} required />
                  </div>
                  <input placeholder="Farm Name" className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl outline-none font-bold" onChange={e => setFormData({...formData, farm_name: e.target.value})} required />
                  <input type="email" placeholder="Email Address" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" onChange={e => setFormData({...formData, email: e.target.value})} required />
                </>
              )}
              <input placeholder="Username" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" onChange={e => setFormData({...formData, username: e.target.value})} required />
              <input type="password" placeholder="Password" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" onChange={e => setFormData({...formData, password: e.target.value})} required />
              
              {error && <p className="text-rose-500 text-[10px] font-bold uppercase text-center">{error}</p>}
              
              <button disabled={loadingLocal} className="w-full bg-[#0f172a] text-white py-5 rounded-[25px] font-black uppercase text-xs tracking-[0.2em] hover:bg-black transition-all">
                {loadingLocal ? <Spinner /> : (mode === "login" ? "Enter Station" : "Initialize Farm")}
              </button>
            </motion.form>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
