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
    farm_name: ""
  });

  const [error, setError] = useState("");
  const [loadingLocal, setLoadingLocal] = useState(false);


  const handleLogin = async (e) => {

    e.preventDefault();

    try {

      setLoading(true);
      setLoadingLocal(true);

      const res = await api.post("api/login/", {
        username: formData.username,
        password: formData.password
      });

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      const userRes = await api.get("my-farm/accounts/me/");

      setUser(userRes.data);

      routeUser(userRes.data);

    } catch {

      setError("Invalid credentials");

    } finally {

      setLoadingLocal(false);
      setLoading(false);

    }

  };


  const handleRegister = async (e) => {

    e.preventDefault();

    try {

      setLoadingLocal(true);

      await api.post("my-farm/accounts/register/", formData);

      setMode("login");

    } catch (err) {

      setError(err.response?.data?.error || "Registration failed");

    } finally {

      setLoadingLocal(false);

    }

  };


  const routeUser = (user) => {

    if (user.role === "farmer") {
      navigate("/dashboard");
      return;
    }

    if (user.role === "customer") {
      navigate("/marketplace");
      return;
    }

    if (user.is_staff) {
      navigate("/admin");
      return;
    }

    navigate("/dashboard");

  };


  return (
    <div className="min-h-screen flex">

      {/* LEFT BRAND PANEL */}

      <div className="hidden lg:flex w-1/2 bg-linear-to-br from-blue-700 to-indigo-900 text-white flex-col justify-center items-center p-16">

        <motion.h1
          initial={{opacity:0,y:-20}}
          animate={{opacity:1,y:0}}
          className="text-5xl font-black mb-6"
        >
          FarmOS
        </motion.h1>

        <motion.p
          initial={{opacity:0}}
          animate={{opacity:1}}
          transition={{delay:0.3}}
          className="text-lg text-center max-w-md opacity-80"
        >
          Intelligent poultry farm management platform for modern agriculture.
        </motion.p>

      </div>


      {/* FORM SIDE */}

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-8">

        <div className="w-full max-w-md bg-white shadow-2xl rounded-3xl p-10">

          {/* MODE SWITCH */}

          <div className="flex mb-8 bg-slate-100 rounded-xl p-1">

            <button
              onClick={()=>setMode("login")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg ${mode==="login"?"bg-white shadow":"text-slate-500"}`}
            >
              Login
            </button>

            <button
              onClick={()=>setMode("register")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg ${mode==="register"?"bg-white shadow":"text-slate-500"}`}
            >
              Register
            </button>

          </div>


          {error && (
            <div className="text-red-500 text-xs mb-4">{error}</div>
          )}


          <AnimatePresence mode="wait">


          {mode==="login" && (

            <motion.form
              key="login"
              initial={{opacity:0,x:-30}}
              animate={{opacity:1,x:0}}
              exit={{opacity:0,x:30}}
              onSubmit={handleLogin}
              className="space-y-4"
            >

              <input
                className="w-full px-4 py-3 rounded-xl bg-slate-50"
                placeholder="Username"
                onChange={(e)=>setFormData({...formData, username:e.target.value})}
                required
              />

              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl bg-slate-50"
                placeholder="Password"
                onChange={(e)=>setFormData({...formData, password:e.target.value})}
                required
              />

              <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">

                {loadingLocal ? <Spinner/> : "Login"}

              </button>

            </motion.form>

          )}


          {mode==="register" && (

            <motion.form
              key="register"
              initial={{opacity:0,x:30}}
              animate={{opacity:1,x:0}}
              exit={{opacity:0,x:-30}}
              onSubmit={handleRegister}
              className="space-y-4"
            >

              <input
                className="w-full px-4 py-3 rounded-xl bg-slate-50"
                placeholder="Username"
                onChange={(e)=>setFormData({...formData, username:e.target.value})}
                required
              />

              <input
                type="email"
                className="w-full px-4 py-3 rounded-xl bg-slate-50"
                placeholder="Email"
                onChange={(e)=>setFormData({...formData, email:e.target.value})}
                required
              />


              <div className="flex gap-2">

                <button
                  type="button"
                  onClick={()=>setFormData({...formData, role:"farmer"})}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold ${formData.role==="farmer"?"bg-blue-600 text-white":"bg-slate-100"}`}
                >
                  Farmer
                </button>

                <button
                  type="button"
                  onClick={()=>setFormData({...formData, role:"customer"})}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold ${formData.role==="customer"?"bg-blue-600 text-white":"bg-slate-100"}`}
                >
                  Customer
                </button>

              </div>


              {formData.role==="farmer" && (

                <input
                  className="w-full px-4 py-3 rounded-xl bg-blue-50"
                  placeholder="Farm Name"
                  onChange={(e)=>setFormData({...formData, farm_name:e.target.value})}
                  required
                />

              )}


              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl bg-slate-50"
                placeholder="Password"
                onChange={(e)=>setFormData({...formData, password:e.target.value})}
                required
              />


              <button className="w-full bg-green-600 text-white py-3 rounded-xl font-bold">

                {loadingLocal ? <Spinner/> : "Create Account"}

              </button>

            </motion.form>

          )}

          </AnimatePresence>

        </div>

      </div>

    </div>
  );

}