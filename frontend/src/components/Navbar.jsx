import { useContext } from 'react';
import { UserContext } from '../UserContext';
import { Search, Bell, Zap, Radio } from 'lucide-react';

export default function Navbar() {
  const { user } = useContext(UserContext);

  // Dynamic naming lookup matched precisely with backend profile serialization
  const farmName = user?.farm_name || user?.farm?.name || 'Zonke Farms';
  const displayLetter = user?.first_name
    ? user.first_name.charAt(0).toUpperCase()
    : user?.username?.charAt(0).toUpperCase() || 'O';

  return (
    <header className="h-20 bg-[#0a0a0a]/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-10 sticky top-0 z-40 shadow-2xl transition-all">
      {/* LEFT SIDE: Operations Branding */}
      <div className="flex items-center gap-5">
        <div className="w-10 h-10 bg-gradient-to-tr from-emerald-400 via-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center text-[#020617] shadow-[0_0_25px_rgba(16,185,129,0.25)] animate-pulse">
          <Zap size={16} fill="currentColor" strokeWidth={0} />
        </div>

        <div>
          <h2 className="text-lg font-black text-white tracking-tighter uppercase italic leading-none flex items-center gap-2">
            {farmName}
            <span className="text-[10px] tracking-widest text-emerald-400 not-italic font-black bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              HQ
            </span>
          </h2>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Radio size={10} className="text-emerald-500" />
            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.3em]">
              CORE FREQUENCY: <span className="text-emerald-400 font-bold">ONLINE</span>
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Search & Global Actions */}
      <div className="flex items-center gap-8">
        {/* VIVID SEARCH BAR */}
        <div className="relative hidden lg:block group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors duration-300"
            size={13}
          />
          <input
            type="text"
            placeholder="Query Operational Intelligence..."
            className="pl-12 pr-6 py-2.5 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest w-80
            focus:ring-1 focus:ring-emerald-500/20 focus:bg-[#111111]
            outline-none transition-all duration-300 border border-white/5 focus:border-emerald-500/30
            text-white placeholder:text-zinc-600 font-mono"
          />
        </div>

        {/* ACTION CLUSTER */}
        <div className="flex items-center gap-5 border-l border-white/5 pl-8">
          {/* Notifications with Emerald Glow */}
          <button className="relative p-2.5 text-zinc-400 hover:text-emerald-400 hover:bg-white/5 rounded-xl transition-all group">
            <Bell size={18} className="group-hover:rotate-12 transition-transform" />
            <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
            </span>
          </button>

          {/* USER PROFILE CAPSULE */}
          <div className="flex items-center gap-3 p-1 pr-4 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:border-emerald-500/20 hover:bg-white/10 transition-all duration-300 group">
            {/* Avatar Profile Letter */}
            <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-cyan-600 rounded-lg flex items-center justify-center text-black text-[11px] font-black shadow-md group-hover:scale-105 transition-transform duration-300">
              {displayLetter}
            </div>

            <div className="hidden md:block">
              <p className="text-[10px] font-black text-white uppercase tracking-tight leading-none group-hover:text-emerald-400 transition-colors duration-300">
                {user?.first_name || user?.username || 'Operator'}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500 group-hover:bg-cyan-400 transition-colors" />
                <p className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
                  {user?.role || 'SYSTEM ROOT'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
