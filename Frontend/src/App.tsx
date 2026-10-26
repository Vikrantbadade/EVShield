import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AttackLogsPage } from './pages/AttackLogsPage';
import { AttackAnalysisPage } from './pages/AttackAnalysisPage';
import { ChargingNetworkPage } from './pages/ChargingNetworkPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { MlDetectionPage } from './pages/MlDetectionPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AlertsPage } from './pages/AlertsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ShaderBackground } from './components/layout/ShaderBackground';

/**
 * Shared Authenticated Shell
 * Houses the live WebGL ShaderBackground mounted ONCE for all authenticated pages.
 * Survives route changes without restarting or unmounting.
 */
const AuthenticatedShell: React.FC = () => {
  return (
    <div className="relative min-h-screen">
      <ShaderBackground />
      <Outlet />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing Page — completely separate, naturally scrollable marketing experience */}
      <Route path="/" element={<LandingPage />} />

      {/* Dedicated Login/Register portal — independent authentication with Kokonut Background Paths */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<LoginPage />} />

      {/* Protected Authenticated Routes with persistent live WebGL ShaderBackground */}
      <Route
        element={
          <ProtectedRoute>
            <AuthenticatedShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/logs" element={<AttackLogsPage />} />
        <Route path="/analysis" element={<AttackAnalysisPage />} />
        <Route path="/analysis/:attackId" element={<AttackAnalysisPage />} />
        <Route path="/monitoring" element={<LiveMonitoringPage />} />
        <Route path="/charging-network" element={<ChargingNetworkPage />} />
        <Route path="/ml-detection" element={<MlDetectionPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
