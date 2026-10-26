import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { PageTransition } from './components/ui/PageTransition';

const App: React.FC = () => {
  const location = useLocation();

  return (
    <PageTransition key={location.pathname}>
      <Routes location={location}>
        {/* Public Landing Page — completely separate, scrollable marketing experience */}
        <Route path="/" element={<LandingPage />} />

        {/* Dedicated Login/Signup page — independent authentication portal with Kokonut Background Paths */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Authenticated Sections */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/logs"
          element={
            <ProtectedRoute>
              <AttackLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analysis"
          element={
            <ProtectedRoute>
              <AttackAnalysisPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analysis/:attackId"
          element={
            <ProtectedRoute>
              <AttackAnalysisPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitoring"
          element={
            <ProtectedRoute>
              <LiveMonitoringPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/charging-network"
          element={
            <ProtectedRoute>
              <ChargingNetworkPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ml-detection"
          element={
            <ProtectedRoute>
              <MlDetectionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <AlertsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageTransition>
  );
};

export default App;
