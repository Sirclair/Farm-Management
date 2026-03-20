import React, { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserContext } from "../UserContext";
import { 
  LayoutDashboard, Bird, Wallet, ShoppingCart, 
  Package, FileText, Settings, LogOut, ShieldCheck, ChevronLeft, ChevronRight 
} from "lucide-react";

export default function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) {
  const location = useLocation();
  const { user, setUser } = useContext(UserContext);

  const farmName = user?.farm?.name || "ClairChicks";
  const userName = user?.username || "User";

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    { name: "Flock Registry", icon: <Bird size={20} />, path: "/flocks" },
    { name: "Resource Stockpile", icon: <Package size={20} />, path: "/inventory" },
    { name: "Expense Ledger", icon: <Wallet size={20} />, path: "/expenses" },
    { name: "Sales Desk", icon: <ShoppingCart size={20} />, path: "/sales" },
    { name: "Performance", icon: <FileText size={20} />, path: "/reports" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/60 z-[60] lg:hidden" onClick={() => setIsOpen(false)} />}

      <div className={`
        fixed left-0 top-0 h-screen bg-[#0f172a] text-white flex flex-col z-[70] shadow-2xl transition-all duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${isCollapsed ? "w-20" : "w-60"}
      `}>
        
        {/* Toggle Button (Desktop Only) */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-10 w-6 h-6 bg-blue-600 rounded-full items-center justify-center border-2 border-[#0f172a] hover:scale-110 transition-transform"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Branding */}
        <div className={`flex items-center gap-3 p-6 mb-4 ${isCollapsed ? "justify-center px-0" : ""}`}>
          <div className="min-w-[40px] h-[40px] bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
            <ShieldCheck size={22} />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden animate-in fade-in duration-500">
              <h1 className="text-sm font-black italic uppercase tracking-tighter truncate">{farmName}</h1>
              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Farm Command</p>
            </div>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 px-3 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.name : ""}
                className={`flex items-center rounded-xl font-black text-[9px] uppercase tracking-widest transition-all group
                  ${isCollapsed ? "justify-center p-3" : "gap-4 px-4 py-4"}
                  ${isActive ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30" : "text-slate-400 hover:bg-white/5 hover:text-white"}
                `}
              >
                <div className="shrink-0">{item.icon}</div>
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800/50">
          <button 
            onClick={() => { localStorage.clear(); window.location.href = "/"; }}
            className={`flex items-center text-rose-500 font-black text-[9px] uppercase hover:bg-rose-500/10 rounded-xl transition-all w-full
              ${isCollapsed ? "justify-center p-3" : "gap-4 px-4 py-3"}
            `}
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
}
