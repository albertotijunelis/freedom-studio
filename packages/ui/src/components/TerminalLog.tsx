// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import React, { useRef, useEffect } from 'react';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  source?: string;
}

interface TerminalLogProps {
  entries: LogEntry[];
  maxHeight?: string;
  autoScroll?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const levelColors: Record<LogLevel, string> = {
  info: 'var(--accent-cyan)',
  warn: 'var(--accent-yellow)',
  error: 'var(--accent-red)',
  debug: 'var(--text-muted)',
  success: 'var(--accent-green)',
};

const levelLabels: Record<LogLevel, string> = {
  info: 'INF',
  warn: 'WRN',
  error: 'ERR',
  debug: 'DBG',
  success: ' OK',
};

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

export function TerminalLog({
  entries,
  maxHeight = '300px',
  autoScroll = true,
  className,
  style,
}: TerminalLogProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries, autoScroll]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        background: 'var(--bg-void)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        maxHeight,
        overflowY: 'auto',
        overflowX: 'hidden',
        fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
        fontSize: '12px',
        lineHeight: 1.8,
        padding: '8px 12px',
        ...style,
      }}
    >
      {entries.length === 0 ? (
        <div style={{ color: 'var(--text-muted)' }}>
          $ waiting for events...
        </div>
      ) : (
        entries.map((entry) => (
          <div key={entry.id} style={{ display: 'flex', gap: '8px', whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
              {formatTimestamp(entry.timestamp)}
            </span>
            <span style={{
              color: levelColors[entry.level],
              fontWeight: 600,
              flexShrink: 0,
              width: '24px',
            }}>
              {levelLabels[entry.level]}
            </span>
            {entry.source && (
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                [{entry.source}]
              </span>
            )}
            <span style={{
              color: entry.level === 'error' ? 'var(--accent-red)' : 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {entry.message}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
