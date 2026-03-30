// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { useAppStore } from '../../stores/appStore';
import { ChatPage } from '../../pages/ChatPage';
import { ModelManagerPage } from '../../pages/ModelManagerPage';
import { APIServerPage } from '../../pages/APIServerPage';
import { SettingsPage } from '../../pages/SettingsPage';

export function ContentArea(): React.JSX.Element {
  const { currentPage } = useAppStore();

  return (
    <main
      className="flex-1 flex flex-col overflow-hidden"
      style={{ background: 'var(--bg-void)' }}
    >
      {currentPage === 'chat' && <ChatPage />}
      {currentPage === 'models' && <ModelManagerPage />}
      {currentPage === 'server' && <APIServerPage />}
      {currentPage === 'settings' && <SettingsPage />}
    </main>
  );
}
