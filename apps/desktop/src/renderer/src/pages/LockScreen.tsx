// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { useState, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';
import { LockIcon } from '../components/icons/Icons';

export function LockScreen(): React.JSX.Element {
  const { unlockApp, unlockError } = useAppStore();
  const [password, setPassword] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const handleUnlock = useCallback(async () => {
    if (!password || unlocking) return;
    setUnlocking(true);
    try {
      await unlockApp(password);
    } finally {
      setUnlocking(false);
    }
  }, [password, unlocking, unlockApp]);

  return (
    <div
      className="flex flex-col items-center justify-center h-full w-full"
      style={{ background: 'var(--bg-void)' }}
    >
      <div className="glass-panel p-8 w-full max-w-sm text-center">
        <LockIcon size={48} style={{ color: 'var(--accent-green)', margin: '0 auto 16px' }} />

        <pre
          className="text-xs leading-tight mb-4 select-none"
          style={{
            color: 'var(--accent-green)',
            textShadow: '0 0 8px var(--accent-green)',
            fontFamily: "'Fira Code', monospace",
          }}
        >
{` ███████╗░██████╗
 ██╔════╝██╔════╝
 █████╗░░╚█████╗░
 ██╔══╝░░░╚═══██╗
 ██║░░░░░██████╔╝
 ╚═╝░░░░░╚═════╝`}
        </pre>

        <h2
          className="text-sm font-bold mb-1"
          style={{
            color: 'var(--text-primary)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Freedom Studio is Locked
        </h2>
        <p
          className="text-xs mb-6"
          style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
        >
          Enter your master password to unlock
        </p>

        <div className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="Master password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            autoFocus
            className="w-full px-3 py-2 rounded text-sm outline-none"
            style={{
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: `1px solid ${unlockError ? 'rgba(255, 51, 85, 0.5)' : 'var(--border-subtle)'}`,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />

          {unlockError && (
            <p
              className="text-xs"
              style={{ color: 'var(--accent-red)', fontFamily: "'JetBrains Mono', monospace" }}
            >
              {unlockError}
            </p>
          )}

          <button
            onClick={handleUnlock}
            disabled={unlocking || !password}
            className="px-4 py-2 rounded text-xs font-bold uppercase cursor-pointer transition-all"
            style={{
              background: password ? 'rgba(0, 255, 136, 0.12)' : 'var(--bg-surface)',
              color: password ? 'var(--accent-green)' : 'var(--text-muted)',
              border: `1px solid ${password ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
              fontFamily: "'JetBrains Mono', monospace",
              opacity: unlocking ? 0.5 : 1,
            }}
          >
            {unlocking ? 'Unlocking...' : 'Unlock'}
          </button>
        </div>
      </div>
    </div>
  );
}
