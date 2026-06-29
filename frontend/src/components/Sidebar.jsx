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

  const farmName = user?.farm?.name || user?.farm_name || 'Zonke Farms';

  const userName = user?.first_name || user?.username || 'Operator';

  const role = user?.role || 'staff';

  const roleMap = {
    owner: 'Owner',
    manager: 'Manager',
    staff: 'Operator',
  };

  const roleLabel = roleMap[role] || 'Operator';

  const handleLogout = () => {
    localStorage.removeItem('token');

    setUser(null);

    window.location.replace('/login');
  };

  const menu = [
    ['Dashboard', LayoutDashboard, '/dashboard'],
    ['Flocks', Bird, '/flocks'],
    ['Finance', Wallet, '/finance'],
    ['Sales', ShoppingCart, '/sales'],
    ['Inventory', Package, '/inventory'],
    ['Orders', ClipboardList, '/pending-orders'],
    ['Marketplace', Store, '/marketplace'],
    ['Reports', FileText, '/reports'],
    ['Settings', Settings, '/settings'],
  ];

  return (
    <>
      {/* MOBILE BACKDROP */}

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="
          fixed inset-0
          bg-black/70
          backdrop-blur-md
          z-40
          lg:hidden
        "
        />
      )}

      <aside
        className={`
        fixed
        left-0
        top-0
        h-screen
        z-50

        bg-gradient-to-b
        from-slate-950
        via-slate-950
        to-slate-900

        border-r
        border-white/5

        backdrop-blur-xl

        flex
        flex-col

        transition-all
        duration-300

        ${isOpen ? 'translate-x-0' : '-translate-x-full'}

        lg:translate-x-0

        ${isCollapsed ? 'lg:w-[92px]' : 'lg:w-[290px]'}

        w-[300px]
      `}
      >
        {/* COLLAPSE */}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="
          hidden lg:flex
          absolute
          -right-4
          top-8

          w-8
          h-8

          rounded-2xl

          bg-slate-900
          border
          border-slate-800

          items-center
          justify-center

          text-slate-500

          hover:text-cyan-400
          hover:border-cyan-500

          transition
        "
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* HEADER */}

        <div
          className={`
          border-b
          border-white/5

          p-6

          ${isCollapsed ? 'items-center' : ''}

          flex
          gap-4
        `}
        >
          <div
            className="
            w-12
            h-12

            rounded-2xl

            bg-gradient-to-br
            from-cyan-400
            via-emerald-400
            to-blue-500

            flex
            items-center
            justify-center

            shadow-[0_0_50px_rgba(56,189,248,.2)]
          "
          >
            <Brain size={20} color="black" />
          </div>

          {!isCollapsed && (
            <div>
              <h1
                className="
                text-white
                font-black
                text-lg
                truncate
              "
              >
                {farmName}
              </h1>

              <p
                className="
                text-cyan-400
                text-xs
                uppercase
                tracking-[0.25em]
              "
              >
                {roleLabel}
              </p>
            </div>
          )}

          <button
            onClick={() => setIsOpen(false)}
            className="
            lg:hidden
            ml-auto
            text-slate-500
          "
          >
            <X />
          </button>
        </div>

        {/* NAV */}

        <div
          className="
          flex-1
          px-4
          py-6
          space-y-2
          overflow-y-auto
        "
        >
          {menu.map(([label, Icon, path]) => {
            const active = location.pathname === path;

            return (
              <Link
                key={path}
                to={path}
                onClick={() => setIsOpen(false)}
                className={`
                  relative

                  flex
                  items-center

                  rounded-2xl

                  transition

                  ${
                    active
                      ? `
                      bg-gradient-to-r
                      from-cyan-500/20
                      to-emerald-500/10

                      border
                      border-cyan-500/20

                      text-white
                    `
                      : `
                      text-slate-400

                      hover:text-white
                      hover:bg-white/5
                    `
                  }

                  ${isCollapsed ? 'justify-center p-4' : 'gap-4 px-5 py-4'}
                `}
              >
                {active && (
                  <div
                    className="
                      absolute
                      left-0
                      top-3
                      bottom-3

                      w-[3px]

                      rounded-r-full

                      bg-cyan-400
                    "
                  />
                )}

                <Icon size={18} />

                {!isCollapsed && (
                  <span
                    className="
                      font-semibold
                    "
                  >
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* FOOTER */}

        <div
          className="
          p-4
          border-t
          border-white/5
        "
        >
          <div
            className={`
            rounded-3xl

            bg-white/[0.03]

            border
            border-white/5

            ${isCollapsed ? 'p-3' : 'p-4'}

            flex
            items-center

            ${isCollapsed ? 'justify-center' : 'gap-3'}
          `}
          >
            <div
              className="
              w-10
              h-10

              rounded-2xl

              bg-gradient-to-br
              from-cyan-400
              to-emerald-400

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
              <>
                <div className="flex-1">
                  <div className="text-white font-semibold">{userName}</div>

                  <div className="text-xs text-slate-500">{roleLabel}</div>
                </div>

                <button
                  onClick={handleLogout}
                  className="
                  p-2

                  rounded-xl

                  text-slate-500

                  hover:text-red-400
                  hover:bg-red-500/10
                "
                >
                  <LogOut size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
