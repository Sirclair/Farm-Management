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

  const { user, setUser } = useContext(UserContext);

  // ===================================================
  // MULTI USER → ONE FARM
  // ===================================================

  const farmName = user?.farm?.name || user?.farm_name || 'My Farm';

  const userName = user?.first_name || user?.username || 'User';

  const role = user?.role || 'staff';

  const roleMap = {
    owner: 'Farm Owner',
    manager: 'Manager',
    staff: 'Staff',
  };

  const roleLabel = roleMap[role] || 'Staff';

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = () => {
    localStorage.removeItem('token');

    setUser(null);

    window.location.replace('/login');
  };

  // ===================================================
  // MENU
  // ===================================================

  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
    },

    {
      name: 'Flock Registry',
      icon: Bird,
      path: '/flocks',
    },

    {
      name: 'Finance',
      icon: Wallet,
      path: '/finance',
    },

    {
      name: 'Sales Desk',
      icon: ShoppingCart,
      path: '/sales',
    },

    {
      name: 'Inventory',
      icon: Package,
      path: '/inventory',
    },

    {
      name: 'Pending Orders',
      icon: ClipboardList,
      path: '/pending-orders',
    },

    {
      name: 'Open Market',
      icon: Store,
      path: '/marketplace',
    },

    {
      name: 'Reports',
      icon: FileText,
      path: '/reports',
    },

    {
      name: 'Settings',
      icon: Settings,
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
            bg-black/70
            z-[60]
            lg:hidden
          "
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`
          fixed
          left-0
          top-0
          h-screen
          bg-[#121212]
          text-white
          z-[70]
          flex
          flex-col
          transition-all
          duration-300

          ${isOpen ? 'translate-x-0' : '-translate-x-full'}

          lg:translate-x-0

          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}

          w-[280px]
        `}
      >
        {/* MOBILE TOP */}

        <div className="lg:hidden p-5 flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Brain size={18} />
            </div>

            <div>
              <h2 className="font-black text-sm">{farmName}</h2>

              <p className="text-[10px] text-emerald-400">{roleLabel}</p>
            </div>
          </div>

          <button onClick={() => setIsOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* DESKTOP */}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="
            hidden
            lg:flex
            absolute
            -right-3
            top-10
            w-7
            h-7
            rounded-full
            bg-emerald-500
            items-center
            justify-center
            text-black
          "
        >
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>

        {/* HEADER */}

        <div
          className={`
            hidden
            lg:flex
            p-8
            items-center
            gap-3

            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center">
            <Brain size={20} />
          </div>

          {!isCollapsed && (
            <div>
              <h1 className="font-black">{farmName}</h1>

              <p className="text-xs text-emerald-400">{roleLabel}</p>
            </div>
          )}
        </div>

        {/* MENU */}

        <nav className="flex-1 px-3">
          {menuItems.map((item) => {
            const Active = location.pathname === item.path;

            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`
                    flex
                    items-center
                    rounded-xl
                    mb-2
                    transition

                    ${
                      Active
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'text-zinc-400 hover:bg-white/5'
                    }

                    ${isCollapsed ? 'justify-center p-4' : 'gap-4 p-4'}
                  `}
              >
                <Icon size={18} />

                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* USER */}

        <div
          className="
            m-4
            p-4
            rounded-2xl
            bg-[#181818]
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-emerald-500
                text-black
                flex
                items-center
                justify-center
                font-black
              "
            >
              {userName.charAt(0).toUpperCase()}
            </div>

            {!isCollapsed && (
              <div>
                <div className="font-bold">{userName}</div>

                <div className="text-xs text-emerald-400">{roleLabel}</div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="
                mt-4
                w-full
                flex
                items-center
                gap-3
                text-red-400
              "
            >
              <LogOut size={16} />
              Logout
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
