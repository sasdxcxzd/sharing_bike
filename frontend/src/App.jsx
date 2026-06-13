import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/Layout/AdminLayout';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Login/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import BikeListPage from './pages/BikeManage/BikeListPage';
import BikeMapPage from './pages/BikeManage/BikeMapPage';
import BikeDetailPage from './pages/BikeManage/BikeDetailPage';
import UserListPage from './pages/UserManage/UserListPage';
import OrderListPage from './pages/OrderManage/OrderListPage';
import OrderDetailPage from './pages/OrderManage/OrderDetailPage';
import WorkOrderListPage from './pages/WorkOrder/WorkOrderListPage';
import WorkOrderDetailPage from './pages/WorkOrder/WorkOrderDetailPage';
import ZoneListPage from './pages/ZoneManage/ZoneListPage';
import ReportListPage from './pages/ReportManage/ReportListPage';
import NotificationPage from './pages/Notification/NotificationPage';
import useAuthStore from './store/useAuthStore';

function AuthGuard({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        element={
          <AuthGuard>
            <AdminLayout />
          </AuthGuard>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/bikes" element={<BikeListPage />} />
        <Route path="/bikes/map" element={<BikeMapPage />} />
        <Route path="/bikes/:id" element={<BikeDetailPage />} />
        <Route path="/users" element={<UserListPage />} />
        <Route path="/orders" element={<OrderListPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/work-orders" element={<WorkOrderListPage />} />
        <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />
        <Route path="/zones" element={<ZoneListPage />} />
        <Route path="/reports" element={<ReportListPage />} />
        <Route path="/notifications" element={<NotificationPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
