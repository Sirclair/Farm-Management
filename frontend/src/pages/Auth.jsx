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

      routeUser(userRes.data);
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.detail || "Invalid username or password");
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

      // 1. Register - Path matched to your nested urls.py
      await api.post("api/my-farm/accounts/register/", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      // 2. Auto-login immediately to get the token needed for Farm creation
      const loginRes = await api.post("api/login/", {
        username: formData.username,
        password: formData.password,
      });

      localStorage.setItem("access", loginRes.data.access);
      localStorage.setItem("refresh", loginRes.data.refresh);

      // 3. Create farm - Path: api/my-farm/accounts/farms/ (based on your router)
      if (formData.role === "farmer") {
        await api.post("api/my-farm/accounts/farms/", { 
          name: formData.farm_name 
        });
      }

      // 4. Fetch full user object
      const userRes = await api.get("api/my-farm/accounts/me/");
      setUser(userRes.data);

      routeUser(userRes.data);
    } catch (err) {
      console.error("Registration error:", err);
      const backendError = err.response?.data?.error || err.response?.data?.detail;
      setError(backendError || "Registration failed. Please try again.");
    } finally {
      setLoadingLocal(false);
    }
  };

  const routeUser = (user) => {
    if (user.role === "farmer") return navigate("/dashboard");
    if (user.role === "customer") return navigate("/marketplace");
    if (user.is_staff) return navigate("/admin");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-700 to-indigo-900 text-white flex-col justify-center items-center p-16">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl font-black mb-6">
          FarmOS
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-lg text-center max-w-md opacity-80">
          Intelligent poultry farm management platform for modern agriculture.
        </motion.p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md bg-white shadow-2xl rounded-3xl p-10">
          <div className="flex mb-8 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === "login" ? "bg-white shadow text-blue-600" : "text-slate-500"}`}
            >
              Login
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === "register" ? "bg-white shadow text-blue-600" : "text-slate-500"}`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 text-xs mb-4 rounded">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {mode === "login" && (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <input
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all"
                  placeholder="Username"
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all"
                  placeholder="Password"
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button 
                   disabled={loadingLocal}
                   className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors flex justify-center items-center"
                >
                  {loadingLocal ? <Spinner /> : "Login"}
                </button>
              </motion.form>
            )}

            {mode === "register" && (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                <input
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all"
                  placeholder="Username"
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all"
                  placeholder="Email"
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: "farmer" })}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.role === "farmer" ? "bg-blue-600 text-white shadow-md" : "bg-slate-100 text-slate-500"}`}
                  >
                    Farmer
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: "customer" })}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.role === "customer" ? "bg-blue-600 text-white shadow-md" : "bg-slate-100 text-slate-500"}`}
                  >
                    Customer
                  </button>
                </div>

                {formData.role === "farmer" && (
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 focus:border-blue-500 outline-none transition-all"
                    placeholder="Farm Name"
                    onChange={(e) => setFormData({ ...formData, farm_name: e.target.value })}
                    required
                  />
                )}

                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all"
                  placeholder="Password"
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />

                <button 
                  disabled={loadingLocal}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-colors flex justify-center items-center"
                >
                  {loadingLocal ? <Spinner /> : "Create Account"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
