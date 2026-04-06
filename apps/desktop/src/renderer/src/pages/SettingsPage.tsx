// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { useEffect, useCallback, useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useTorStore } from '../stores/torStore';

/* ── Setting Row ── */
function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
      <div className="flex-1">
        <span className="text-sm" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
          {label}
        </span>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center">{children}</div>
    </div>
  );
}

/* ── Section Header ── */
function SectionHeader({ title }: { title: string }): React.JSX.Element {
  return (
    <h3
      className="text-xs font-bold uppercase tracking-wider mt-6 mb-3 pb-2 border-b"
      style={{
        color: 'var(--accent-green)',
        borderColor: 'var(--border-accent)',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {title}
    </h3>
  );
}

/* ── Number Input ── */
function NumberInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}): React.JSX.Element {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      className="w-24 px-2 py-1 rounded text-xs text-right outline-none"
      style={{
        background: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-subtle)',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    />
  );
}

/* ── Toggle Switch ── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }): React.JSX.Element {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative w-10 h-5 rounded-full transition-all cursor-pointer"
      style={{
        background: checked ? 'rgba(0, 255, 136, 0.3)' : 'var(--bg-surface)',
        border: `1px solid ${checked ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
      }}
    >
      <div
        className="absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all"
        style={{
          left: checked ? 'calc(100% - 18px)' : '2px',
          background: checked ? 'var(--accent-green)' : 'var(--text-muted)',
          boxShadow: checked ? '0 0 6px var(--accent-green)' : 'none',
        }}
      />
    </button>
  );
}

/* ── Update Checker ── */
interface UpdateStatus {
  status: string;
  version?: string;
  percent?: number;
  message?: string;
}

function UpdateChecker(): React.JSX.Element {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);

  useEffect(() => {
    const unsubscribe = window.api.on('update:status', (_data: unknown) => {
      setUpdateStatus(_data as UpdateStatus);
    });
    return unsubscribe;
  }, []);

  const handleCheck = useCallback(async () => {
    setUpdateStatus({ status: 'checking' });
    await window.api.invoke('update:check');
  }, []);

  const handleDownload = useCallback(async () => {
    await window.api.invoke('update:download');
  }, []);

  const handleInstall = useCallback(async () => {
    await window.api.invoke('update:install');
  }, []);

  const statusColor =
    updateStatus?.status === 'available' || updateStatus?.status === 'ready'
      ? 'var(--accent-green)'
      : updateStatus?.status === 'error'
        ? 'var(--accent-red)'
        : 'var(--text-muted)';

  return (
    <div className="flex items-center gap-3 mt-2">
      {(!updateStatus || updateStatus.status === 'up-to-date' || updateStatus.status === 'error' || updateStatus.status === 'dev') ? (
        <button
          onClick={handleCheck}
          className="text-xs px-3 py-1.5 rounded cursor-pointer transition-colors hover:bg-white/5"
          style={{
            color: 'var(--accent-cyan)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Check for Updates
        </button>
      ) : updateStatus.status === 'available' ? (
        <button
          onClick={handleDownload}
          className="text-xs px-3 py-1.5 rounded cursor-pointer transition-colors hover:bg-white/5"
          style={{
            color: 'var(--accent-green)',
            border: '1px solid var(--border-accent)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Download v{updateStatus.version}
        </button>
      ) : updateStatus.status === 'ready' ? (
        <button
          onClick={handleInstall}
          className="text-xs px-3 py-1.5 rounded cursor-pointer transition-colors hover:bg-white/5"
          style={{
            color: 'var(--accent-green)',
            border: '1px solid var(--border-accent)',
            fontFamily: "'JetBrains Mono', monospace",
            textShadow: '0 0 8px var(--accent-green)',
          }}
        >
          Install v{updateStatus.version} & Restart
        </button>
      ) : updateStatus.status === 'checking' ? (
        <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
          Checking...
        </span>
      ) : null}

      {updateStatus?.status === 'downloading' && (
        <span className="text-xs" style={{ color: 'var(--accent-cyan)', fontFamily: "'JetBrains Mono', monospace" }}>
          Downloading... {updateStatus.percent?.toFixed(0)}%
        </span>
      )}

      {updateStatus && updateStatus.status !== 'checking' && updateStatus.status !== 'downloading' && (
        <span className="text-xs" style={{ color: statusColor, fontFamily: "'JetBrains Mono', monospace" }}>
          {updateStatus.status === 'up-to-date' && 'You\'re on the latest version'}
          {updateStatus.status === 'available' && `v${updateStatus.version} available`}
          {updateStatus.status === 'ready' && `v${updateStatus.version} ready to install`}
          {updateStatus.status === 'error' && (updateStatus.message || 'Update check failed')}
          {updateStatus.status === 'dev' && 'Updates disabled in dev mode'}
        </span>
      )}
    </div>
  );
}

/* ── Main Settings Page ── */
export function SettingsPage(): React.JSX.Element {
  const settings = useSettingsStore();
  const tor = useTorStore();
  const [gpuInfo, setGpuInfo] = useState<{ backend: string; vramMb: number; deviceName: string; suggestedGpuLayers: number } | null>(null);
  const [gpuDetecting, setGpuDetecting] = useState(false);

  useEffect(() => {
    settings.loadSettings();
    tor.fetchStatus();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(async (key: string, value: string) => {
    await settings.saveSetting(key, value);
  }, [settings]);

  const handleDetectGPU = useCallback(async () => {
    setGpuDetecting(true);
    try {
      const result = await window.api.invoke('inference:detect-gpu') as { success: boolean; data?: { backend: string; vramMb: number; deviceName: string; suggestedGpuLayers: number } };
      if (result.success && result.data) {
        setGpuInfo(result.data);
      }
    } catch {
      // Ignore
    } finally {
      setGpuDetecting(false);
    }
  }, []);

  const handleApplyGPUSuggestion = useCallback(() => {
    if (!gpuInfo) return;
    settings.setGpuLayers(gpuInfo.suggestedGpuLayers);
    handleSave('defaultGpuLayers', String(gpuInfo.suggestedGpuLayers));
  }, [gpuInfo, settings, handleSave]);

  const handlePickModelsDir = useCallback(async () => {
    try {
      const result = await window.api.invoke('models:pick-dir') as { success: boolean; data?: string };
      if (result.success && result.data) {
        settings.setModelsDirectory(result.data);
        handleSave('modelsDirectory', result.data);
      }
    } catch {
      // Ignore
    }
  }, [settings, handleSave]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
          Settings
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
          Configure inference, security, and appearance
        </p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-8">
        {/* ── General ── */}
        <SectionHeader title="General" />

        <SettingRow label="Models Directory" description="Where model files are stored on disk">
          <div className="flex items-center gap-2">
            <span className="text-xs truncate max-w-48" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
              {settings.modelsDirectory || 'Default'}
            </span>
            <button
              onClick={handlePickModelsDir}
              className="px-3 py-1 rounded text-xs cursor-pointer transition-all hover:bg-white/5"
              style={{
                color: 'var(--accent-green)',
                border: '1px solid var(--border-accent)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Browse
            </button>
          </div>
        </SettingRow>

        {/* ── Inference ── */}
        <SectionHeader title="Inference Defaults" />

        <SettingRow label="GPU Layers" description="Number of layers to offload to GPU (0 = CPU only)">
          <NumberInput
            value={settings.defaultGpuLayers}
            onChange={(val) => { settings.setGpuLayers(val); handleSave('defaultGpuLayers', String(val)); }}
            min={0}
            max={128}
          />
        </SettingRow>

        {/* GPU Auto-Detection */}
        <div className="py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                GPU Auto-Detect
              </span>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Detect your GPU and get recommended GPU layer count
              </p>
            </div>
            <button
              onClick={handleDetectGPU}
              disabled={gpuDetecting}
              className="px-3 py-1 rounded text-xs cursor-pointer transition-all hover:bg-white/5"
              style={{
                color: gpuDetecting ? 'var(--text-muted)' : 'var(--accent-cyan)',
                border: `1px solid ${gpuDetecting ? 'var(--border-subtle)' : 'rgba(0, 212, 255, 0.3)'}`,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {gpuDetecting ? 'Detecting...' : 'Detect GPU'}
            </button>
          </div>
          {gpuInfo && (
            <div className="mt-2 p-2 rounded text-xs space-y-1" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <span style={{ color: 'var(--text-secondary)' }}>Device: </span>
                <span style={{ color: 'var(--accent-cyan)' }}>{gpuInfo.deviceName}</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <span style={{ color: 'var(--text-secondary)' }}>Backend: </span>
                <span style={{ color: 'var(--accent-green)' }}>{gpuInfo.backend.toUpperCase()}</span>
              </div>
              {gpuInfo.vramMb > 0 && (
                <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  <span style={{ color: 'var(--text-secondary)' }}>VRAM: </span>
                  <span style={{ color: 'var(--text-primary)' }}>{(gpuInfo.vramMb / 1024).toFixed(1)} GB</span>
                </div>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                  Suggested GPU Layers: <span style={{ color: 'var(--accent-green)' }}>{gpuInfo.suggestedGpuLayers}</span>
                </span>
                {gpuInfo.suggestedGpuLayers !== settings.defaultGpuLayers && (
                  <button
                    onClick={handleApplyGPUSuggestion}
                    className="px-2 py-0.5 rounded cursor-pointer transition-all hover:bg-white/5"
                    style={{
                      color: 'var(--accent-green)',
                      border: '1px solid var(--border-accent)',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                    }}
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <SettingRow label="Thread Count" description="Number of CPU threads for inference">
          <NumberInput
            value={settings.defaultThreadCount}
            onChange={(val) => { settings.setThreadCount(val); handleSave('defaultThreadCount', String(val)); }}
            min={1}
            max={64}
          />
        </SettingRow>

        <SettingRow label="Batch Size" description="Token batch size for prompt processing">
          <NumberInput
            value={settings.defaultBatchSize}
            onChange={(val) => { settings.setBatchSize(val); handleSave('defaultBatchSize', String(val)); }}
            min={32}
            max={4096}
          />
        </SettingRow>

        <SettingRow label="Context Size" description="Maximum context window in tokens">
          <NumberInput
            value={settings.defaultContextSize}
            onChange={(val) => { settings.setContextSize(val); handleSave('defaultContextSize', String(val)); }}
            min={512}
            max={131072}
          />
        </SettingRow>

        {/* ── Generation ── */}
        <SectionHeader title="Generation" />

        <SettingRow label="Max Tokens" description="Maximum tokens to generate per response (higher = longer answers)">
          <NumberInput
            value={settings.defaultMaxTokens}
            onChange={(val) => { settings.setMaxTokens(val); handleSave('defaultMaxTokens', String(val)); }}
            min={64}
            max={131072}
          />
        </SettingRow>

        <SettingRow label="Temperature" description="Randomness of output (0 = deterministic, 2 = very random)">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={settings.defaultTemperature}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                settings.setTemperature(val);
                handleSave('defaultTemperature', String(val));
              }}
              className="w-24 accent-green-500"
              style={{ accentColor: 'var(--accent-green)' }}
            />
            <span className="text-xs w-8 text-right" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
              {settings.defaultTemperature.toFixed(2)}
            </span>
          </div>
        </SettingRow>

        <SettingRow label="Top P" description="Nucleus sampling threshold">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.defaultTopP}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                settings.setTopP(val);
                handleSave('defaultTopP', String(val));
              }}
              className="w-24"
              style={{ accentColor: 'var(--accent-green)' }}
            />
            <span className="text-xs w-8 text-right" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
              {settings.defaultTopP.toFixed(2)}
            </span>
          </div>
        </SettingRow>

        <SettingRow label="Top K" description="Top-K sampling (0 = disabled)">
          <NumberInput
            value={settings.defaultTopK}
            onChange={(val) => { settings.setTopK(val); handleSave('defaultTopK', String(val)); }}
            min={0}
            max={500}
          />
        </SettingRow>

        <SettingRow label="Repeat Penalty" description="Penalty for repeating tokens (1.0 = no penalty)">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={2}
              step={0.05}
              value={settings.defaultRepeatPenalty}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                settings.setRepeatPenalty(val);
                handleSave('defaultRepeatPenalty', String(val));
              }}
              className="w-24"
              style={{ accentColor: 'var(--accent-green)' }}
            />
            <span className="text-xs w-8 text-right" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
              {settings.defaultRepeatPenalty.toFixed(2)}
            </span>
          </div>
        </SettingRow>

        {/* ── Privacy / Tor ── */}
        <SectionHeader title="Privacy &amp; Tor" />

        <SettingRow label="Tor Routing" description="Route all external connections through the Tor network">
          <Toggle
            checked={tor.isEnabled}
            onChange={(enabled) => {
              if (enabled) tor.startTor();
              else tor.stopTor();
            }}
          />
        </SettingRow>

        <SettingRow label="Tor Status" description="Current connection state">
          <span className="text-xs px-2 py-0.5 rounded" style={{
            background: tor.connectionStatus === 'connected'
              ? 'rgba(153, 69, 255, 0.15)'
              : tor.connectionStatus === 'error'
              ? 'rgba(255, 51, 85, 0.15)'
              : tor.connectionStatus === 'bootstrapping' || tor.connectionStatus === 'connecting'
              ? 'rgba(255, 204, 0, 0.15)'
              : 'var(--bg-surface)',
            color: tor.connectionStatus === 'connected'
              ? 'var(--accent-purple)'
              : tor.connectionStatus === 'error'
              ? 'var(--accent-red)'
              : tor.connectionStatus === 'bootstrapping' || tor.connectionStatus === 'connecting'
              ? 'var(--accent-yellow)'
              : 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {tor.connectionStatus}
            {tor.connectionStatus === 'bootstrapping' && ` (${tor.bootstrapProgress}%)`}
          </span>
        </SettingRow>

        {tor.error && (
          <div className="px-3 py-2 rounded text-xs mb-2" style={{ background: 'rgba(255, 51, 85, 0.1)', color: 'var(--accent-red)', border: '1px solid rgba(255, 51, 85, 0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
            {tor.error}
          </div>
        )}

        {/* ── Appearance ── */}
        <SectionHeader title="Appearance" />

        <SettingRow label="CRT Scanlines" description="Enable the retro CRT scanline overlay effect">
          <Toggle
            checked={settings.scanlineEnabled}
            onChange={(enabled) => { settings.setScanlineEnabled(enabled); handleSave('scanlineEnabled', String(enabled)); }}
          />
        </SettingRow>

        <SettingRow label="Theme Variant" description="Adjust the background darkness">
          <select
            value={settings.theme}
            onChange={(e) => { settings.setTheme(e.target.value as 'dark' | 'darker' | 'black'); handleSave('theme', e.target.value); }}
            className="px-2 py-1 rounded text-xs outline-none cursor-pointer"
            style={{
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <option value="black">Black (default)</option>
            <option value="darker">Darker</option>
            <option value="dark">Dark</option>
          </select>
        </SettingRow>

        {/* ── About ── */}
        <SectionHeader title="About" />

        <div className="py-3 space-y-2">
          <p className="text-xs" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
            Freedom Studio v0.3.2-dev
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
            Copyright (C) 2026 Alberto Tijunelis Neto
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
            License: GNU GPL v3 — Free as in freedom.
          </p>
          <UpdateChecker />
        </div>
      </div>
    </div>
  );
}
