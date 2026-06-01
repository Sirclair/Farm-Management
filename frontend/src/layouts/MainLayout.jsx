// MainLayout.jsx

import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { ShieldCheck, Menu } from 'lucide-react';

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#050816] text-white font-sans">
      {/* SIDEBAR */}
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* MAIN WRAPPER */}
      <div
        className={`
          flex-1 flex flex-col
          transition-all duration-300
          ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
        `}
      >
        {/* MOBILE HEADER */}
        <header className="lg:hidden h-16 bg-[#0a0f1f] border-b border-white/5 text-white flex items-center px-4 justify-between shrink-0 z-40">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
              <ShieldCheck size={18} className="text-emerald-400" />
            </div>

            <span className="font-black italic uppercase tracking-tighter text-white truncate">
              FarmOS
            </span>
          </div>

          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg"
          >
            <Menu size={20} className="text-emerald-300" />
          </button>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-10 bg-[#050816] relative z-0">
          <div className="max-w-[1600px] mx-auto w-full relative z-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
