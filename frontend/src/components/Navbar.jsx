import { useContext } from "react";
import { UserContext } from "../UserContext";
import { Search, Bell, Zap } from "lucide-react";

export default function Navbar() {
  const { user } = useContext(UserContext);

  // Capitalize farm name
  const farmName = user?.farm?.name
    ? user.farm.name.charAt(0).toUpperCase() + user.farm.name.slice(1)
    : "Global";

  return (
    <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-40 shadow-sm">

      {/* LEFT SIDE */}
      <div className="flex items-center gap-5">

        {/* Logo */}
        <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200/40">
          <Zap size={20} fill="currentColor" />
        </div>

        {/* Brand */}
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic leading-none">
            {farmName} <span className="text-blue-600">HQ</span>
          </h2>

          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.35em] mt-1">
            Command Center • v3.0
          </p>
        </div>

      </div>


      {/* RIGHT SIDE */}
      <div className="flex items-center gap-8">

        {/* SEARCH */}
        <div className="relative hidden lg:block">

          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />

          <input
            type="text"
            placeholder="Search registry..."
            className="pl-12 pr-6 py-3 bg-slate-50 rounded-2xl text-[11px] font-black uppercase tracking-widest w-72
            focus:ring-2 focus:ring-blue-500/20 focus:bg-white
            outline-none transition-all
            border border-transparent focus:border-blue-200
            text-slate-700 placeholder:text-slate-300"
          />

        </div>


        {/* ACTIONS */}
        <div className="flex items-center gap-3 border-l border-slate-100 pl-8">

          {/* Notifications */}
          <button className="relative p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all group">

            <Bell size={20} />

            {/* Notification dot */}
            <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>

          </button>


          {/* USER PROFILE */}
          <div className="flex items-center gap-3 ml-2 p-1 pr-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-white hover:shadow-md transition-all">

            {/* Avatar */}
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-md">
              {user?.username?.charAt(0).toUpperCase() || "A"}
            </div>

            {/* User info */}
            <div className="hidden md:block">

              <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none">
                {user?.username || "Admin"}
              </p>

              <p className="text-[8px] font-bold text-blue-500 uppercase tracking-widest mt-0.5">
                {user?.role || "Operator"}
              </p>

            </div>

          </div>

        </div>

      </div>

    </header>
  );
}