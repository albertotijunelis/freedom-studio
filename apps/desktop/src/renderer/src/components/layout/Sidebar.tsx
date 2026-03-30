// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { ChatIcon, ModelIcon, ServerIcon, SettingsIcon, TorIcon, ChevronRightIcon, ChevronLeftIcon } from '../icons/Icons';
import { useAppStore } from '../../stores/appStore';
import type { PageId } from '../../stores/appStore';
import { useTorStore } from '../../stores/torStore';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.JSX.Element;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'chat', label: 'Chat', icon: <ChatIcon size={18} /> },
  { id: 'models', label: 'Models', icon: <ModelIcon size={18} /> },
  { id: 'server', label: 'API Server', icon: <ServerIcon size={18} /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon size={18} /> },
];

export function Sidebar(): React.JSX.Element {
  const { sidebarExpanded, currentPage, toggleSidebar, navigate } = useAppStore();
  const { isEnabled: torEnabled, connectionStatus: torStatus } = useTorStore();

  return (
    <aside
      className="glass-panel-accent flex flex-col h-full transition-all duration-300 ease-in-out"
      style={{
        width: sidebarExpanded
          ? 'var(--sidebar-width-expanded)'
          : 'var(--sidebar-width-collapsed)',
        borderRadius: 0,
        borderTop: 'none',
        borderBottom: 'none',
        borderLeft: 'none',
      }}
    >
      {/* Logo / Toggle */}
      <button
        onClick={toggleSidebar}
        className="no-drag flex items-center justify-center h-12 w-full border-b hover:bg-white/5 transition-colors cursor-pointer"
        style={{ borderColor: 'var(--border-subtle)' }}
        title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {sidebarExpanded ? (
          <div className="flex items-center gap-3">
            <pre
              className="select-none leading-none"
              style={{
                color: 'var(--accent-green)',
                textShadow: '0 0 8px var(--accent-green)',
                fontFamily: "'Fira Code', monospace",
                fontSize: '5px',
                lineHeight: '5px',
              }}
            >{`███████╗██████╗\n██╔════╝██╔═══╝\n█████╗░░╚████╗░\n██╔══╝░░░╚══██╗\n██║░░░░░█████╔╝\n╚═╝░░░░░╚════╝`}</pre>
            <ChevronLeftIcon size={14} style={{ color: 'var(--text-secondary)' }} />
          </div>
        ) : (
          <pre
            className="select-none leading-none"
            style={{
              color: 'var(--accent-green)',
              textShadow: '0 0 8px var(--accent-green)',
              fontFamily: "'Fira Code', monospace",
              fontSize: '4px',
              lineHeight: '4.5px',
            }}
          >{`███████╗██████╗\n██╔════╝██╔═══╝\n█████╗░░╚████╗░\n██╔══╝░░░╚══██╗\n██║░░░░░█████╔╝\n╚═╝░░░░░╚════╝`}</pre>
        )}
      </button>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col py-2 gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className="no-drag flex items-center gap-3 px-4 py-3 transition-all duration-150 cursor-pointer"
              style={{
                background: isActive ? 'rgba(0, 255, 136, 0.08)' : 'transparent',
                borderRight: isActive
                  ? '2px solid var(--accent-green)'
                  : '2px solid transparent',
                color: isActive ? 'var(--accent-green)' : 'var(--text-secondary)',
              }}
              title={item.label}
            >
              <span className="flex-shrink-0 w-5 flex items-center justify-center">
                {item.icon}
              </span>
              {sidebarExpanded && (
                <span
                  className="text-sm font-medium whitespace-nowrap overflow-hidden"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom section — Tor status indicator */}
      <div
        className="flex items-center justify-center gap-2 h-12 border-t"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <TorIcon size={14} style={{ color: torEnabled ? 'var(--accent-green)' : 'var(--accent-purple)' }} />
        {sidebarExpanded && (
          <span
            className="text-xs"
            style={{
              color: torEnabled ? 'var(--accent-green)' : 'var(--accent-purple)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Tor: {torStatus === 'connected' ? 'On' : 'Off'}
          </span>
        )}
      </div>
    </aside>
  );
}
