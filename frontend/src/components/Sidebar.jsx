import React, { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { UserContext } from "../UserContext";

import {
  LayoutDashboard,
  Bird,
  Wallet,
  ShoppingCart,
  Package,
  FileText,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);

  const farmName = user?.farm?.name || "My Farm";
  const userName = user?.name || "User";
  const role = user?.role || "Owner";

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const handleLogout = () => {
    // 1. Clear the tokens from localStorage
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    // 2. Reset the user state in Context
    if (setUser) setUser(null);

    // 3. Force redirect to login page
    // Using window.location.href ensures a clean state wipe
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
    <div className="w-64 h-screen bg-[#0f172a] text-white flex flex-col p-6 fixed left-0 top-0 z-50 shadow-2xl">

      {/* FARM LOGO */}
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <ShieldCheck size={22} />
        </div>

        <div>
          <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">
            {farmName}
          </h1>
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
            Farm Command
          </p>
        </div>
      </div>

      {/* MENU */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${
                isActive
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
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

          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-black text-[10px]">
            {initials}
          </div>

          <div className="overflow-hidden">
            <p className="text-[10px] font-black truncate uppercase">
              {userName}
            </p>

            <p className="text-[8px] font-bold text-blue-500 uppercase">
              {role}
            </p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-rose-500 font-black text-[10px] uppercase hover:bg-rose-500/10 rounded-xl transition-all"
        >
          <LogOut size={16} /> Logout
        </button>

      </div>
    </div>
  );
}