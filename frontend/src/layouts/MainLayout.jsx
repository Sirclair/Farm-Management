import React, { useState } from "react";
import Sidebar from "../components/Sidebar";

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />

      {/* Dynamic Margin based on Collapse State */}
      <div className={`
        flex-1 flex flex-col overflow-hidden transition-all duration-300
        ${isCollapsed ? "lg:ml-20" : "lg:ml-60"}
      `}>
        
        {/* Mobile Header (Only visible < 1024px) */}
        <header className="lg:hidden h-16 bg-[#0f172a] text-white flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center"><ShieldCheck size={14}/></div>
            <span className="font-black italic text-xs uppercase">FarmOS</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 bg-blue-600 rounded-lg">
            <div className="w-4 h-0.5 bg-white mb-1"></div>
            <div className="w-4 h-0.5 bg-white mb-1"></div>
            <div className="w-4 h-0.5 bg-white"></div>
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
