import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { AttackLogsPage } from './pages/AttackLogsPage';
import { AttackAnalysisPage } from './pages/AttackAnalysisPage';
import { ChargingNetworkPage } from './pages/ChargingNetworkPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { MlDetectionPage } from './pages/MlDetectionPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AlertsPage } from './pages/AlertsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PageTransition } from './components/ui/PageTransition';

/**
 * App routes — wrapped in PageTransition so every navigation
 * between sidebar pages produces a smooth fade + slight upward
 * slide (200 ms, respects prefers-reduced-motion via CSS).
 */
const App: React.FC = () => {
  const location = useLocation();

  return (
    <PageTransition key={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LandingPage />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageTransition>
  );
};

export default App;
