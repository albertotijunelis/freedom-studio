// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { ContentArea } from './components/layout/ContentArea';
import { useAppStore } from './stores/appStore';
import { useSettingsStore } from './stores/settingsStore';
import { SetupWizard } from './pages/SetupWizard';
import { LockScreen } from './pages/LockScreen';

export function App(): React.JSX.Element {
  const { sidebarExpanded, isSetupComplete, isCheckingSetup, isLocked, checkSetupStatus } = useAppStore();
  const { scanlineEnabled, theme, loadSettings } = useSettingsStore();

  useEffect(() => {
    checkSetupStatus();
    loadSettings();
  }, [checkSetupStatus, loadSettings]);

  // Apply theme class to document root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-black', 'theme-darker', 'theme-dark');
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  // Show nothing while checking setup status from DB
  if (isCheckingSetup) {
    return (
      <div className="flex items-center justify-center h-full w-full" style={{ background: 'var(--bg-void)' }}>
        <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
          Loading...
        </span>
      </div>
    );
  }

  if (!isSetupComplete) {
    return <SetupWizard />;
  }

  if (isLocked) {
    return <LockScreen />;
  }

  return (
    <div className="flex h-full w-full" style={{ background: 'var(--bg-void)' }}>
      {/* CRT Scanline Overlay */}
      {scanlineEnabled && <div className="scanline-overlay" aria-hidden="true" />}

      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar sidebarExpanded={sidebarExpanded} />
        <ContentArea />
      </div>
    </div>
  );
}
