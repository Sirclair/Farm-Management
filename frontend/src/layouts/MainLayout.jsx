import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import { ShieldCheck, Menu } from "lucide-react";

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />

      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? "lg:ml-20" : "lg:ml-60"}`}>
        
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="lg:hidden h-16 bg-[#0f172a] text-white flex items-center px-6 justify-between shrink-0 z-40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShieldCheck size={18}/>
            </div>
            <span className="font-black italic uppercase tracking-tighter">FarmOS</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 bg-blue-600 rounded-lg">
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-[#f8fafc]">
          <div className="max-w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
