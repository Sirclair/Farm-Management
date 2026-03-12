import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function MainLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Fixed width on the left */}
      <Sidebar />

      {/* Main Content Area - Pushed right by ml-64 (margin-left: 16rem) */}
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}