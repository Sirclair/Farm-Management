import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/axios";

export default function VerifyLink() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // 'loading', 'success', 'error'

  useEffect(() => {
    const verifyAccount = async () => {
      try {
        // This matches the path("verify-magic/") we added to accounts/urls.py
        await api.post("api/accounts/verify-magic/", { uid, token });
        setStatus("success");
        
        // Auto-redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
      } catch (err) {
        console.error("Verification Error:", err);
        setStatus("error");
      }
    };

    if (uid && token) {
      verifyAccount();
    }
  }, [uid, token, navigate]);

  return (
    <div className="min-h-screen flex bg-slate-900 justify-center items-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-12 rounded-[48px] shadow-2xl"
      >
        {status === "loading" && (
          <>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
              Securing Your <span className="text-blue-600">Credentials</span>
            </h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4">
              Communicating with Zonke Farms HQ...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="bg-green-100 text-green-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 text-4xl">
              ✓
            </div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">
              Account <span className="text-green-600">Verified</span>
            </h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4 leading-relaxed">
              Success! Your farm is now fully active. <br/> Redirecting you to your flocks...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="bg-rose-100 text-rose-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 text-4xl">
              ✕
            </div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
              Link <span className="text-rose-600">Expired</span>
            </h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4 leading-relaxed">
              This verification link is invalid or has already been used.
            </p>
            <button 
              onClick={() => navigate("/login")}
              className="mt-8 w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest"
            >
              Back to Login
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}