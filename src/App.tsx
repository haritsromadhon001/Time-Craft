import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ScreenTimePage } from './pages/ScreenTimePage';
import { FocusTimerPage } from './pages/FocusTimerPage';
import { TargetsPage } from './pages/TargetsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ReportPage } from './pages/ReportPage';

const AppRoutes: React.FC = () => {
  const { user, loadingAuth, theme } = useApp();

  if (loadingAuth) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          gap: '1rem',
          padding: '1.5rem',
        }}
      >
        <img
          src={theme === 'light' ? '/logo-blue.svg' : '/logo-red.svg'}
          alt="TimeCraft"
          width={52}
          height={52}
          style={{
            borderRadius: '12px',
            animation: 'clockPulse 2s infinite ease-in-out',
          }}
        />
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              marginBottom: '0.25rem',
            }}
          >
            Please wait...
          </div>
          <div
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
            }}
          >
            Memuat aplikasi TimeCraft
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <Routes>
      <Route path="/report" element={<ReportPage />} />
      <Route path="/" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="screen-time" element={<ScreenTimePage />} />
        <Route path="focus-timer" element={<FocusTimerPage />} />
        <Route path="targets" element={<TargetsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
