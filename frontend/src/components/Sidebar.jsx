// Sidebar.jsx
import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserContext } from '../UserContext';

import {
  LayoutDashboard,
  Bird,
  Wallet,
  ShoppingCart,
  Package,
  FileText,
  Settings,
  LogOut,
  Brain,
  ChevronLeft,
  ChevronRight,
  Store,
  ClipboardList,
  X,
} from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) {
  const location = useLocation();
  const { user } = useContext(UserContext);

  const farmName = user?.farm_name || user?.farm?.name || 'Zonke Farms';
  const userName = user?.first_name ? `${user.first_name}` : user?.username || 'Operator';

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const menuItems = [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard size={18} />,
      path: '/dashboard',
    },
    {
      name: 'Flock Registry',
      icon: <Bird size={18} />,
      path: '/flocks',
    },
    {
      name: 'Resource Stockpile',
      icon: <Package size={18} />,
      path: '/inventory',
    },
    {
      name: 'Expense Ledger',
      icon: <Wallet size={18} />,
      path: '/expenses',
    },
    {
      name: 'Sales Desk',
      icon: <ShoppingCart size={18} />,
      path: '/sales',
    },
    {
      name: 'Pending Orders',
      icon: <ClipboardList size={18} />,
      path: '/pending-orders',
    },
    {
      name: 'Open Market',
      icon: <Store size={18} />,
      path: '/marketplace',
    },
    {
      name: 'Performance',
      icon: <FileText size={18} />,
      path: '/reports',
    },
    {
      name: 'Command Settings',
      icon: <Settings size={18} />,
      path: '/settings',
    },
  ];

  return (
    <>
      {/* MOBILE OVERLAY */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="
            fixed inset-0
            bg-black/60
            backdrop-blur-sm
            z-[60]
            lg:hidden
          "
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 h-screen
          bg-[#121212]
          text-white
          flex flex-col
          z-[70]
          transition-all duration-300 ease-in-out

          w-[280px]

          ${isOpen ? 'translate-x-0' : '-translate-x-full'}

          lg:translate-x-0
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        {/* TOP BAR MOBILE */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Brain size={20} className="text-black" />
            </div>

            <div>
              <h2 className="font-black text-sm uppercase tracking-wide">{farmName}</h2>
              <p className="text-[9px] uppercase tracking-[0.2em] text-emerald-400">AI Command</p>
            </div>
          </div>

          <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        {/* DESKTOP COLLAPSE BUTTON */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="
            hidden lg:flex
            absolute -right-3 top-12
            w-6 h-6
            bg-emerald-500
            text-black
            rounded-full
            items-center justify-center
            shadow-lg
            z-10
            hover:bg-emerald-400
          "
        >
          {isCollapsed ? (
            <ChevronRight size={12} strokeWidth={4} />
          ) : (
            <ChevronLeft size={12} strokeWidth={4} />
          )}
        </button>

        {/* BRANDING */}
        <div
          className={`
            hidden lg:flex
            items-center gap-3
            p-8 mb-4
            ${isCollapsed ? 'justify-center px-0' : ''}
          `}
        >
          <div
            className="
              min-w-[40px]
              h-[40px]
              bg-emerald-500
              rounded-xl
              flex items-center justify-center
              shrink-0
              shadow-[0_0_20px_rgba(16,185,129,0.2)]
            "
          >
            <Brain size={22} className="text-black" />
          </div>

          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-[15px] font-black uppercase tracking-tight text-white leading-none truncate">
                {farmName}
              </h1>
              <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-[0.2em] mt-1">
                AI Command
              </p>
            </div>
          )}
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center
                  rounded-xl
                  font-bold
                  text-[10px]
                  uppercase
                  tracking-widest
                  transition-all duration-200
                  group

                  ${isCollapsed ? 'lg:justify-center lg:h-12' : 'gap-4 px-4 py-3.5'}

                  ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <div
                  className={`
                    shrink-0
                    ${isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-white'}
                  `}
                >
                  {item.icon}
                </div>

                {(!isCollapsed || window.innerWidth < 1024) && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* USER CARD */}
        <div
          className={`p-4 m-4 rounded-2xl bg-[#1A1A1A] border border-white/5 shadow-xl transition-all ${isCollapsed ? 'lg:mx-2 lg:p-2' : ''}`}
        >
          <div
            className={`
              flex items-center
              ${isCollapsed ? 'lg:justify-center lg:mb-0' : 'gap-3 px-1 mb-4'}
            `}
          >
            <div
              className="
                w-10 h-10
                bg-emerald-900/30
                text-emerald-400
                border border-emerald-500/20
                rounded-lg
                flex items-center justify-center
                text-xs font-black
                shrink-0
              "
            >
              {userName.charAt(0).toUpperCase()}
            </div>

            {(!isCollapsed || window.innerWidth < 1024) && (
              <div className="overflow-hidden">
                <p className="text-[11px] font-black truncate text-white uppercase">{userName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
                  <p className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider">
                    Operator Active
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* LOGOUT */}
          {!isCollapsed || window.innerWidth < 1024 ? (
            <button
              onClick={handleLogout}
              className="
                flex items-center
                text-zinc-500
                hover:text-white
                font-bold
                text-[9px]
                uppercase
                transition-all
                w-full
                gap-4 px-2 py-2
                mt-2 border-t border-white/5 pt-3
              "
            >
              <LogOut size={16} />
              <span>Close Session</span>
            </button>
          ) : (
            <button
              onClick={handleLogout}
              title="Close Session"
              className="hidden lg:flex items-center justify-center text-zinc-500 hover:text-white transition-all w-full p-2 mt-2"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
