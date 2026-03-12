export default function DashboardCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
      {/* Card Header */}
      <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-white">
        <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors capitalize">{title}</h3>
        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
          Active
        </span>
      </div>
      
      {/* Card Body */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}