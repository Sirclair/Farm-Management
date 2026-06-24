import { Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './UserContext';

import Auth from './pages/Auth';
import VerifyLink from './pages/VerifyLink';
import Dashboard from './pages/Dashboard';
import Flocks from './pages/Flocks';

import Sales from './pages/Sales'; // This acts as your Orders/Sales Desk
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Settings from './pages/ProfileSettings';
import ComingSoon from './pages/ComingSoon';
import BatchDetail from './pages/BatchDetail';
import Marketplace from './pages/Marketplace';
import FarmStore from './pages/FarmStore';
import Checkout from './pages/Checkout'; // New Page
import PendingOrders from './pages/PendingOrders';
import Income from './pages/Finance';

import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <UserProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/store/:farmId" element={<FarmStore />} />
        <Route path="/verify/:uid/:token" element={<VerifyLink />} />

        {/* Protected Farm Management Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/flocks" element={<Flocks />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/finance" element={<Income />} />
          {/* Sales Desk / Orders Terminal */}
          <Route path="/sales" element={<Sales />} />
          <Route path="/pending-orders" element={<PendingOrders />} />
          {/* Checkout Redirect Logic */}
          <Route path="/checkout/:productId" element={<Checkout />} />

          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/forecasting" element={<ComingSoon />} />
          <Route path="/iot" element={<ComingSoon />} />
          <Route path="/health" element={<ComingSoon />} />

          <Route path="/batches/:id" element={<BatchDetail />} />
        </Route>

        {/* Root Handling */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </UserProvider>
  );
}

export default App;
