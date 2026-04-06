// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { LockIcon } from '../icons/Icons';
import { useInferenceStore } from '../../stores/inferenceStore';
import { useServerStore } from '../../stores/serverStore';

interface TopBarProps {
  sidebarExpanded: boolean;
}

export function TopBar({ sidebarExpanded }: TopBarProps): React.JSX.Element {
  const { loadedModel, isLoading } = useInferenceStore();
  const { isRunning: serverRunning, port } = useServerStore();

  return (
    <header
      className="drag-region flex items-center justify-between px-4 border-b"
      style={{
        height: 'var(--topbar-height)',
        background: 'var(--bg-dark)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Left — Title */}
      <div className="flex items-center gap-3">
        {/* macOS traffic lights spacing */}
        {navigator.userAgent.includes('Mac') && !sidebarExpanded && (
          <div style={{ width: 68 }} />
        )}
        <h1
          className="text-sm font-bold tracking-wider uppercase no-drag"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--text-primary)',
            letterSpacing: '2px',
          }}
        >
          Freedom Studio
        </h1>
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{
            background: 'rgba(0, 255, 136, 0.1)',
            color: 'var(--accent-green)',
            border: '1px solid var(--border-accent)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          v0.3.2-dev
        </span>
      </div>

      {/* Center — Model status */}
      <div className="no-drag flex items-center">
        <span
          className="text-xs"
          style={{
            color: loadedModel ? 'var(--accent-green)' : 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {isLoading ? 'Loading model...' : loadedModel || 'No model loaded'}
        </span>
      </div>

      {/* Right — Status indicators */}
      <div className="no-drag flex items-center gap-3">
        {/* API Server status */}
        <div className="flex items-center gap-1.5" title={serverRunning ? `API Server: Running on :${port}` : 'API Server: Stopped'}>
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: serverRunning ? 'var(--accent-green)' : 'var(--text-muted)',
              boxShadow: serverRunning ? '0 0 6px var(--accent-green)' : 'none',
            }}
          />
          <span
            className="text-xs"
            style={{
              color: serverRunning ? 'var(--accent-green)' : 'var(--text-muted)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            API
          </span>
        </div>

        {/* Encryption status */}
        <div className="flex items-center gap-1.5" title="Encryption: Locked">
          <LockIcon size={14} style={{ color: 'var(--text-secondary)' }} />
        </div>
      </div>
    </header>
  );
}
