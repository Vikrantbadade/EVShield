import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { AttackLogsPage } from './pages/AttackLogsPage';
import { AttackAnalysisPage } from './pages/AttackAnalysisPage';
import { ChargingNetworkPage } from './pages/ChargingNetworkPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LandingPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/logs" element={<AttackLogsPage />} />
      <Route path="/analysis" element={<AttackAnalysisPage />} />
      <Route path="/analysis/:attackId" element={<AttackAnalysisPage />} />
      <Route path="/monitoring" element={<LiveMonitoringPage />} />
      <Route path="/charging-network" element={<ChargingNetworkPage />} />
      <Route
        path="/ml-detection"
        element={
          <PlaceholderPage
            title="ML Detection Engine"
            description="Machine learning model metadata, inference metrics, and feature weights."
          />
        }
      />
      <Route
        path="/analytics"
        element={
          <PlaceholderPage
            title="Analytics"
            description="System throughput, latency distributions, and security trend reports."
          />
        }
      />
      <Route
        path="/alerts"
        element={
          <PlaceholderPage
            title="Alerts & Rules"
            description="SOC notification thresholds and automated containment rules."
          />
        }
      />
      <Route
        path="/settings"
        element={
          <PlaceholderPage
            title="SOC Settings"
            description="Operator credentials, API keys, and environment options."
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
