export default function DashboardCard({ title, children }) {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#08111f]/90 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-emerald-500/20 group">
      {/* Glow Effects */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500" />

      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500" />

      {/* Header */}
      <div className="relative z-10 px-7 py-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] font-black text-emerald-400 mb-2">
            Dashboard Module
          </p>

          <h3 className="text-2xl font-black text-white tracking-tight capitalize">{title}</h3>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />

            <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
          </div>

          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
            Active
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="relative z-10 p-7">{children}</div>
    </div>
  );
}
