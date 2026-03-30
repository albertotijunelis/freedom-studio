// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { useEffect, useCallback, useState } from 'react';
import { useServerStore } from '../stores/serverStore';
import type { RequestLog } from '@freedom-studio/types';

/* ── Log Entry ── */
function LogEntry({ log }: { log: RequestLog }): React.JSX.Element {
  const statusColor =
    log.statusCode >= 500 ? 'var(--accent-red)' :
    log.statusCode >= 400 ? 'var(--accent-yellow)' :
    'var(--accent-green)';

  return (
    <div
      className="flex items-center gap-3 px-3 py-1.5 border-b text-xs"
      style={{
        borderColor: 'var(--border-subtle)',
        fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
      }}
    >
      <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
        {new Date(log.timestamp).toLocaleTimeString()}
      </span>
      <span
        className="font-bold uppercase"
        style={{ color: 'var(--accent-cyan)', minWidth: 40 }}
      >
        {log.method}
      </span>
      <span style={{ color: 'var(--text-primary)' }} className="flex-1 truncate">
        {log.endpoint}
      </span>
      <span style={{ color: statusColor }}>
        {log.statusCode}
      </span>
      <span style={{ color: 'var(--text-muted)' }}>
        {log.latencyMs}ms
      </span>
      {log.completionTokens > 0 && (
        <span style={{ color: 'var(--accent-green)' }}>
          {log.completionTokens}tok
        </span>
      )}
    </div>
  );
}

/* ── API Key Row ── */
function ApiKeyRow({ apiKey, onRemove }: { apiKey: string; onRemove: () => void }): React.JSX.Element {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const masked = apiKey.slice(0, 8) + '•'.repeat(24) + apiKey.slice(-4);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [apiKey]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded" style={{ background: 'var(--bg-surface)' }}>
      <span
        className="flex-1 text-xs truncate"
        style={{
          color: 'var(--text-code)',
          fontFamily: "'Fira Code', monospace",
        }}
      >
        {visible ? apiKey : masked}
      </span>
      <button
        onClick={() => setVisible(!visible)}
        className="text-xs px-2 py-0.5 cursor-pointer hover:bg-white/5 rounded transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        {visible ? 'Hide' : 'Show'}
      </button>
      <button
        onClick={handleCopy}
        className="text-xs px-2 py-0.5 cursor-pointer hover:bg-white/5 rounded transition-colors"
        style={{ color: copied ? 'var(--accent-green)' : 'var(--text-secondary)' }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <button
        onClick={onRemove}
        className="text-xs px-2 py-0.5 cursor-pointer hover:bg-red-500/10 rounded transition-colors"
        style={{ color: 'var(--accent-red)' }}
      >
        Remove
      </button>
    </div>
  );
}

/* ── Main API Server Page ── */
export function APIServerPage(): React.JSX.Element {
  const {
    isRunning, port, requestLogs, apiKeys, error,
    startServer, stopServer, fetchStatus, fetchLogs,
    generateApiKey, removeApiKey, setPort,
  } = useServerStore();

  useEffect(() => {
    fetchStatus();
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchLogs]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
              API Server
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              OpenAI-compatible local HTTPS server
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: isRunning ? 'var(--accent-green)' : 'var(--text-muted)',
                boxShadow: isRunning ? '0 0 6px var(--accent-green)' : 'none',
              }}
            />
            <span className="text-xs" style={{
              color: isRunning ? 'var(--accent-green)' : 'var(--text-muted)',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {isRunning ? `Running on :${port}` : 'Stopped'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {/* Error */}
        {error && (
          <div className="px-3 py-2 rounded text-xs" style={{ background: 'rgba(255, 51, 85, 0.1)', color: 'var(--accent-red)', border: '1px solid rgba(255, 51, 85, 0.3)' }}>
            {error}
          </div>
        )}

        {/* Server Controls */}
        <div className="glass-panel p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
            Server Controls
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                Port:
              </label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                disabled={isRunning}
                className="w-24 px-2 py-1.5 rounded text-xs outline-none"
                style={{
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              />
            </div>
            <button
              onClick={() => isRunning ? stopServer() : startServer()}
              className="px-4 py-1.5 rounded text-xs font-bold uppercase cursor-pointer transition-all"
              style={{
                background: isRunning ? 'rgba(255, 51, 85, 0.12)' : 'rgba(0, 255, 136, 0.12)',
                color: isRunning ? 'var(--accent-red)' : 'var(--accent-green)',
                border: `1px solid ${isRunning ? 'rgba(255, 51, 85, 0.3)' : 'var(--border-accent)'}`,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {isRunning ? 'Stop Server' : 'Start Server'}
            </button>
          </div>

          {isRunning && (
            <div className="mt-3 px-3 py-2 rounded" style={{ background: 'var(--bg-surface)' }}>
              <p className="text-xs" style={{ color: 'var(--text-code)', fontFamily: "'Fira Code', monospace" }}>
                Base URL: https://localhost:{port}/v1
              </p>
            </div>
          )}
        </div>

        {/* API Keys */}
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
              API Keys
            </h3>
            <button
              onClick={generateApiKey}
              className="text-xs px-3 py-1 rounded cursor-pointer transition-all hover:bg-white/5"
              style={{
                color: 'var(--accent-green)',
                border: '1px solid var(--border-accent)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              + Generate Key
            </button>
          </div>
          <div className="space-y-2">
            {apiKeys.length === 0 ? (
              <p className="text-xs py-2" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                No API keys generated. Generate one to authenticate requests.
              </p>
            ) : (
              apiKeys.map((key) => (
                <ApiKeyRow key={key} apiKey={key} onRemove={() => removeApiKey(key)} />
              ))
            )}
          </div>
        </div>

        {/* Request Logs */}
        <div className="glass-panel overflow-hidden">
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
              Request Log
            </h3>
          </div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar" style={{ background: 'var(--bg-void)' }}>
            {requestLogs.length === 0 ? (
              <p className="text-xs p-4 text-center" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                No requests yet
              </p>
            ) : (
              requestLogs.map((log, i) => <LogEntry key={i} log={log} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
