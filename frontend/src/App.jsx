import { Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "./UserContext";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Flocks from "./pages/Flocks";
import Expenses from "./pages/Expenses";
import Sales from "./pages/Sales";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Settings from "./pages/ProfileSettings";
import ComingSoon from "./pages/ComingSoon";

import ProtectedRoute from "./ProtectedRoute";

function App() {
  return (
    <UserProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />

        {/* Protected Farm Management Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/flocks" element={<Flocks />} />
          <Route path="/inventory" element={<Inventory />} /> 
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/forecasting" element={<ComingSoon />} />
          <Route path="/iot" element={<ComingSoon />} />
          <Route path="/health" element={<ComingSoon />} />
          <Route path="/marketplace" element={<ComingSoon />} />
        </Route>

        {/* Root Handling */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </UserProvider>
  );
}

export default App;