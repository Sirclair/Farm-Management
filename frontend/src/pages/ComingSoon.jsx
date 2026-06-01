import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Construction,
  ArrowLeft,
  BrainCircuit,
  ThermometerSun,
  ShieldCheck,
  ShoppingCart,
  Cpu,
  BarChart3,
  BellRing,
  Globe2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

import MainLayout from '../layouts/MainLayout';

const FEATURE_DETAILS = {
  '/forecasting': {
    title: 'Predictive Analytics',
    desc: 'AI-driven harvest weight forecasting, feed optimization, mortality prediction, and smart production planning.',
    icon: <BrainCircuit size={52} />,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    progress: 75,
    comingSoon: [
      'AI flock growth predictions',
      'Feed consumption forecasting',
      'Mortality risk alerts',
      'Profit simulation engine',
    ],
  },

  '/iot': {
    title: 'IoT Live Link',
    desc: 'Real-time environmental monitoring for poultry houses using smart sensor integrations.',
    icon: <ThermometerSun size={52} />,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    progress: 68,
    comingSoon: [
      'Temperature monitoring',
      'Humidity tracking',
      'Ammonia gas alerts',
      'Live equipment diagnostics',
    ],
  },

  '/health': {
    title: 'Bio-Guard System',
    desc: 'Advanced poultry health protection and automated disease prevention workflows.',
    icon: <ShieldCheck size={52} />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    progress: 81,
    comingSoon: [
      'Vaccination scheduling',
      'Disease outbreak detection',
      'Medication reminders',
      'Mortality analytics',
    ],
  },

  '/marketplace': {
    title: 'Market Connect',
    desc: 'Direct farm-to-buyer commerce infrastructure with smart pricing intelligence.',
    icon: <ShoppingCart size={52} />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    progress: 72,
    comingSoon: [
      'Buyer marketplace',
      'Live poultry pricing',
      'Bulk order management',
      'Farmer trading network',
    ],
  },
};

export default function ComingSoon() {
  const location = useLocation();
  const navigate = useNavigate();

  const feature = FEATURE_DETAILS[location.pathname] || {
    title: 'Module Under Development',
    desc: 'We are currently engineering and calibrating this module for production deployment.',
    icon: <Construction size={52} />,
    color: 'text-slate-300',
    bg: 'bg-slate-500/10',
    border: 'border-white/10',
    progress: 60,
    comingSoon: [
      'Advanced reporting systems',
      'AI-powered automations',
      'Cloud synchronization',
      'Enterprise management tools',
    ],
  };

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-10">
        <div className="relative overflow-hidden w-full max-w-5xl rounded-[32px] border border-white/10 bg-[#0f172a] shadow-2xl">
          {/* BACKGROUND EFFECTS */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 blur-3xl rounded-full" />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2">
            {/* LEFT PANEL */}
            <div className="p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-white/5">
              <div
                className={`
                  inline-flex items-center justify-center
                  w-24 h-24 rounded-3xl mb-8
                  ${feature.bg}
                  ${feature.border}
                  border
                  ${feature.color}
                `}
              >
                {feature.icon}
              </div>

              <div className="space-y-5">
                <div>
                  <p className="text-emerald-400 font-black text-[11px] uppercase tracking-[0.3em] mb-3">
                    Coming Soon
                  </p>

                  <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
                    {feature.title}
                  </h1>
                </div>

                <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                  {feature.desc}
                </p>

                {/* STATUS */}
                <div className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-black">
                      Development Progress
                    </span>

                    <span className="text-sm font-black text-emerald-400">{feature.progress}%</span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700"
                      style={{ width: `${feature.progress}%` }}
                    />
                  </div>
                </div>

                {/* BADGES */}
                <div className="flex flex-wrap gap-3 pt-4">
                  <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Cpu size={14} />
                    AI Integrated
                  </div>

                  <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Globe2 size={14} />
                    Cloud Ready
                  </div>

                  <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Sparkles size={14} />
                    Smart Automation
                  </div>
                </div>

                {/* BUTTON */}
                <div className="pt-8">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="
                      w-full sm:w-auto
                      flex items-center justify-center gap-3
                      px-8 py-4
                      bg-emerald-500
                      hover:bg-emerald-400
                      text-black
                      rounded-2xl
                      font-black
                      uppercase
                      tracking-widest
                      text-[11px]
                      transition-all
                      active:scale-95
                      shadow-lg shadow-emerald-500/20
                    "
                  >
                    <ArrowLeft size={16} />
                    Back To Dashboard
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <BarChart3 size={22} className="text-emerald-400" />
                </div>

                <div>
                  <h2 className="text-xl font-black text-white">Planned System Features</h2>

                  <p className="text-slate-500 text-sm">
                    Upcoming platform capabilities currently in active development
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {feature.comingSoon.map((item, index) => (
                  <div
                    key={index}
                    className="
                      flex items-center gap-4
                      p-4 rounded-2xl
                      bg-white/[0.03]
                      border border-white/5
                      hover:border-emerald-500/20
                      transition-all
                    "
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    </div>

                    <div>
                      <p className="text-white font-bold text-sm">{item}</p>

                      <p className="text-slate-500 text-xs mt-1">
                        Scheduled for future deployment update
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ALERT */}
              <div className="mt-8 p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex gap-4">
                <div className="shrink-0">
                  <BellRing size={20} className="text-amber-400" />
                </div>

                <div>
                  <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider mb-1">
                    Development Notice
                  </h3>

                  <p className="text-xs text-amber-100/70 leading-relaxed">
                    This module is currently under active engineering and testing. New capabilities
                    and AI enhancements will be released in upcoming platform updates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
