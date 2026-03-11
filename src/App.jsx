import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Plans from './pages/Plans';
import Subscriptions from './pages/Subscriptions';
import CheckIn from './pages/CheckIn';
import TodayLog from './pages/TodayLog';
import AccountingShift from './pages/AccountingShift';
import AccountingLedger from './pages/AccountingLedger';
import AccountingHistory from './pages/AccountingHistory';
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import './index.css';

// Simple Auth Protection
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Platform Admin Auth Protection
const PlatformAdminRoute = ({ children }) => {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    return <Navigate to="/platform-admin/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/checkin"
          element={
            <PrivateRoute>
              <CheckIn />
            </PrivateRoute>
          }
        />
        <Route
          path="/today-log"
          element={
            <PrivateRoute>
              <TodayLog />
            </PrivateRoute>
          }
        />
        <Route
          path="/members"
          element={
            <PrivateRoute>
              <Members />
            </PrivateRoute>
          }
        />
        <Route
          path="/subscriptions"
          element={
            <PrivateRoute>
              <Subscriptions />
            </PrivateRoute>
          }
        />
        <Route
          path="/plans"
          element={
            <PrivateRoute>
              <Plans />
            </PrivateRoute>
          }
        />
        <Route
          path="/accounting/shift"
          element={
            <PrivateRoute>
              <AccountingShift />
            </PrivateRoute>
          }
        />
        <Route
          path="/accounting/ledger"
          element={
            <PrivateRoute>
              <AccountingLedger />
            </PrivateRoute>
          }
        />
        <Route
          path="/accounting/history"
          element={
            <PrivateRoute>
              <AccountingHistory />
            </PrivateRoute>
          }
        />

        {/* Platform Admin Routes — Completely Separate */}
        <Route path="/platform-admin/login" element={<SuperAdminLogin />} />
        <Route
          path="/platform-admin/dashboard"
          element={
            <PlatformAdminRoute>
              <SuperAdminDashboard />
            </PlatformAdminRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
