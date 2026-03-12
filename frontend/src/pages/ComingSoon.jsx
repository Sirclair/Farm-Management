import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Construction, ArrowLeft, BrainCircuit, ThermometerSun, ShieldCheck, ShoppingCart } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';

const FEATURE_DETAILS = {
  '/forecasting': {
    title: "Predictive Analytics",
    desc: "AI-driven harvest weight and feed consumption forecasting.",
    icon: <BrainCircuit size={48} />,
    color: "text-purple-600",
    bg: "bg-purple-100"
  },
  '/iot': {
    title: "IoT Live Link",
    desc: "Real-time temperature, humidity, and ammonia sensor integration.",
    icon: <ThermometerSun size={48} />,
    color: "text-amber-600",
    bg: "bg-amber-100"
  },
  '/health': {
    title: "Bio-Guard System",
    desc: "Automated vaccination scheduling and disease outbreak alerts.",
    icon: <ShieldCheck size={48} />,
    color: "text-emerald-600",
    bg: "bg-emerald-100"
  },
  '/marketplace': {
    title: "Market Connect",
    desc: "Direct-to-buyer portal for bulk liquidation and price tracking.",
    icon: <ShoppingCart size={48} />,
    color: "text-blue-600",
    bg: "bg-blue-100"
  }
};

export default function ComingSoon() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Fallback if the path isn't in our map
  const feature = FEATURE_DETAILS[location.pathname] || {
    title: "Module Under Development",
    desc: "We are currently calibrating this feature for production.",
    icon: <Construction size={48} />,
    color: "text-slate-600",
    bg: "bg-slate-100"
  };

  return (
    <MainLayout>
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[40px] shadow-xl border border-slate-100 max-w-md w-full text-center relative overflow-hidden">
          
          <div className="flex justify-center mb-6">
            <div className={`p-5 ${feature.bg} ${feature.color} rounded-3xl animate-pulse`}>
              {feature.icon}
            </div>
          </div>

          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic mb-3">
            {feature.title}
          </h1>
          
          <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest leading-relaxed mb-8">
            {feature.desc}
          </p>

          <div className="space-y-3 mb-10">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full w-3/4 animate-pulse"></div>
              </div>
              <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Status: Beta Testing</span>
                  <span>75% Complete</span>
              </div>
          </div>

          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-3 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
          >
            <ArrowLeft size={14} /> Back to Command
          </button>
        </div>
      </div>
    </MainLayout>
  );
}