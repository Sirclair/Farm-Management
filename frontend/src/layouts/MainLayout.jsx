import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Menu } from "lucide-react";

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Handles its own mobile/desktop visibility */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64 transition-all duration-300">
        
        {/* MOBILE TOP BAR (Hidden on desktop) */}
        <header className="lg:hidden h-16 bg-[#0f172a] text-white flex items-center px-6 justify-between shrink-0">
          <h1 className="font-black italic uppercase tracking-tighter">FarmOS</h1>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 bg-blue-600 rounded-lg"
          >
            <Menu size={20} />
          </button>
        </header>

        {/* Desktop Navbar */}
        <div className="hidden lg:block shrink-0">
          <Navbar />
        </div>

        {/* Main Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
