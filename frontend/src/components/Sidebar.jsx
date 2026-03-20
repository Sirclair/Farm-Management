import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserContext } from "../UserContext";
import { 
  LayoutDashboard, Bird, Wallet, ShoppingCart, 
  Package, FileText, Settings, LogOut, ShieldCheck, X 
} from "lucide-react";

export default function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const { user, setUser } = useContext(UserContext);

  const farmName = user?.farm?.name || "My Farm";
  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.username || "User";
  const role = user?.role || "Owner";

  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    if (setUser) setUser(null);
    window.location.href = "/"; 
  };

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    { name: "Flock Registry", icon: <Bird size={20} />, path: "/flocks" },
    { name: "Resource Stockpile", icon: <Package size={20} />, path: "/inventory" },
    { name: "Expense Ledger", icon: <Wallet size={20} />, path: "/expenses" },
    { name: "Sales Desk", icon: <ShoppingCart size={20} />, path: "/sales" },
    { name: "Performance", icon: <FileText size={20} />, path: "/reports" },
    { name: "System Settings", icon: <Settings size={20} />, path: "/settings" },
  ];

  return (
    <>
      {/* MOBILE OVERLAY: Dims the screen when sidebar is open on mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`
        fixed left-0 top-0 h-screen bg-[#0f172a] text-white flex flex-col p-6 z-[70] shadow-2xl transition-transform duration-300 ease-in-out w-64
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* CLOSE BUTTON (Mobile Only) */}
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-6 right-6 text-slate-400 hover:text-white"
        >
          <X size={24} />
        </button>

        {/* FARM LOGO */}
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">{farmName}</h1>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Farm Command</p>
          </div>
        </div>

        {/* MENU */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)} // Close on click for mobile
                className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${
                  isActive ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* USER PROFILE */}
        <div className="mt-auto pt-6 border-t border-slate-800/50">
          <div className="flex items-center gap-3 p-3 mb-4 bg-slate-900/80 rounded-2xl border border-white/5">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-black text-[10px] shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-black truncate uppercase">{userName}</p>
              <p className="text-[8px] font-bold text-blue-500 uppercase">{role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-rose-500 font-black text-[10px] uppercase hover:bg-rose-500/10 rounded-xl transition-all">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </>
  );
}
