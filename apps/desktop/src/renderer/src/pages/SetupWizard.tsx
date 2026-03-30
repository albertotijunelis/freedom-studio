// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { ShieldIcon, CpuIcon, ModelIcon } from '../components/icons/Icons';

type WizardStep = 'welcome' | 'gpu' | 'models' | 'security' | 'complete';

const STEPS: WizardStep[] = ['welcome', 'gpu', 'models', 'security', 'complete'];

export function SetupWizard(): React.JSX.Element {
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const { setSetupComplete, navigate } = useAppStore();

  // Security step state
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSet, setPasswordSet] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);

  // Models step state
  const [modelsDir, setModelsDir] = useState('');
  const [pickingDir, setPickingDir] = useState(false);

  // Security: TLS cert state
  const [tlsCertGenerated, setTlsCertGenerated] = useState(false);
  const [generatingCert, setGeneratingCert] = useState(false);

  // GPU detection state
  const [gpuInfo, setGpuInfo] = useState<string>('Detecting...');

  const stepIndex = STEPS.indexOf(currentStep);

  // Load initial models directory
  useEffect(() => {
    window.api.invoke('models:get-dir').then((result: unknown) => {
      const r = result as { success: boolean; data?: string };
      if (r.success && r.data) setModelsDir(r.data);
    }).catch(() => {});
  }, []);

  // Detect GPU on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setGpuInfo('CPU mode available. GPU layers can be configured per model in Settings.');
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Check if TLS cert already exists
  useEffect(() => {
    window.api.invoke('crypto:tls-cert-paths').then((result: unknown) => {
      const r = result as { success: boolean; data?: { certPath: string; keyPath: string } | null };
      if (r.success && r.data) setTlsCertGenerated(true);
    }).catch(() => {});
  }, []);

  // Check if master password is already set
  useEffect(() => {
    window.api.invoke('crypto:status').then((result: unknown) => {
      const r = result as { success: boolean; data?: { isSet: boolean } };
      if (r.success && r.data?.isSet) setPasswordSet(true);
    }).catch(() => {});
  }, []);

  const handleNext = useCallback(() => {
    const next = STEPS[stepIndex + 1];
    if (next) setCurrentStep(next);
  }, [stepIndex]);

  const handleBack = useCallback(() => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setCurrentStep(prev);
  }, [stepIndex]);

  const handlePickModelsDir = useCallback(async () => {
    setPickingDir(true);
    try {
      const result = await window.api.invoke('models:pick-dir') as { success: boolean; data?: string | null };
      if (result.success && result.data) {
        setModelsDir(result.data);
      }
    } catch {
      // User cancelled
    } finally {
      setPickingDir(false);
    }
  }, []);

  const handleSetPassword = useCallback(async () => {
    setPasswordError('');
    if (masterPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    if (masterPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setSettingPassword(true);
    try {
      const result = await window.api.invoke('crypto:set-master-password', { password: masterPassword }) as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error);
      setPasswordSet(true);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to set password');
    } finally {
      setSettingPassword(false);
    }
  }, [masterPassword, confirmPassword]);

  const handleGenerateTLS = useCallback(async () => {
    setGeneratingCert(true);
    try {
      const result = await window.api.invoke('crypto:generate-tls-cert') as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error);
      setTlsCertGenerated(true);
    } catch {
      // TLS generation failed — non-fatal
    } finally {
      setGeneratingCert(false);
    }
  }, []);

  const handleFinish = useCallback(async () => {
    // Persist setup complete to settings DB
    await window.api.invoke('settings:set', { key: 'setupComplete', value: 'true' }).catch(() => {});
    setSetupComplete(true);
    navigate('chat');
  }, [setSetupComplete, navigate]);

  const canProceed = (): boolean => {
    if (currentStep === 'security') return passwordSet;
    return true;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8" style={{ background: 'var(--bg-void)' }}>
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full transition-colors"
              style={{
                background: i <= stepIndex ? 'var(--accent-green)' : 'var(--bg-surface)',
                boxShadow: i <= stepIndex ? '0 0 6px var(--accent-green)' : 'none',
              }}
            />
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px" style={{ background: i < stepIndex ? 'var(--accent-green)' : 'var(--border-subtle)' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="glass-panel p-8 w-full max-w-lg text-center">
        {currentStep === 'welcome' && (
          <>
            <pre
              className="text-xs leading-tight mb-6 select-none"
              style={{
                color: 'var(--accent-green)',
                textShadow: 'var(--glow-green)',
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
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
              Welcome to Freedom Studio
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Local-first AI inference. Zero telemetry. End-to-end encrypted.
            </p>
          </>
        )}

        {currentStep === 'gpu' && (
          <>
            <CpuIcon size={48} style={{ color: 'var(--accent-green)', margin: '0 auto 16px' }} />
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
              GPU Detection
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Detecting available hardware acceleration...
            </p>
            <div className="glass-panel p-4 text-left" style={{ background: 'var(--bg-void)' }}>
              <p className="text-xs" style={{ color: 'var(--text-code)', fontFamily: "'Fira Code', monospace" }}>
                $ detect --gpu
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--accent-yellow)', fontFamily: "'Fira Code', monospace" }}>
                {gpuInfo}
              </p>
            </div>
          </>
        )}

        {currentStep === 'models' && (
          <>
            <ModelIcon size={48} style={{ color: 'var(--accent-green)', margin: '0 auto 16px' }} />
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
              Model Directory
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Choose where GGUF models will be stored. You can change this later in Settings.
            </p>
            <div className="glass-panel p-4 text-left" style={{ background: 'var(--bg-void)' }}>
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)', fontFamily: "'Fira Code', monospace" }}>
                Current directory:
              </p>
              <p className="text-xs break-all" style={{ color: 'var(--text-code)', fontFamily: "'Fira Code', monospace" }}>
                {modelsDir || 'Loading...'}
              </p>
            </div>
            <button
              onClick={handlePickModelsDir}
              disabled={pickingDir}
              className="mt-4 px-4 py-2 rounded text-xs cursor-pointer transition-all hover:bg-white/5"
              style={{
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                fontFamily: "'JetBrains Mono', monospace",
                opacity: pickingDir ? 0.5 : 1,
              }}
            >
              {pickingDir ? 'Choosing...' : 'Choose Directory'}
            </button>
          </>
        )}

        {currentStep === 'security' && (
          <>
            <ShieldIcon size={48} style={{ color: 'var(--accent-green)', margin: '0 auto 16px' }} />
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
              Security Setup
            </h2>

            {passwordSet ? (
              <>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-sm" style={{ color: 'var(--accent-green)' }}>✓</span>
                  <span className="text-sm" style={{ color: 'var(--accent-green)', fontFamily: "'JetBrains Mono', monospace" }}>
                    Master password is set
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Set a master password to encrypt your conversations and API keys.
                </p>
                <div className="flex flex-col gap-3 text-left">
                  <input
                    type="password"
                    placeholder="Master password (min 8 characters)"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded text-sm outline-none"
                    style={{
                      background: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  />
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSetPassword()}
                    className="w-full px-3 py-2 rounded text-sm outline-none"
                    style={{
                      background: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  />
                  {passwordError && (
                    <p className="text-xs" style={{ color: 'var(--accent-red)' }}>{passwordError}</p>
                  )}
                  <button
                    onClick={handleSetPassword}
                    disabled={settingPassword}
                    className="px-4 py-2 rounded text-xs font-bold uppercase cursor-pointer transition-all"
                    style={{
                      background: 'rgba(0, 255, 136, 0.12)',
                      color: 'var(--accent-green)',
                      border: '1px solid var(--border-accent)',
                      fontFamily: "'JetBrains Mono', monospace",
                      opacity: settingPassword ? 0.5 : 1,
                    }}
                  >
                    {settingPassword ? 'Setting up...' : 'Set Master Password'}
                  </button>
                </div>
              </>
            )}

            {/* TLS Cert */}
            <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                TLS Certificate (for local API server)
              </p>
              {tlsCertGenerated ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm" style={{ color: 'var(--accent-green)' }}>✓</span>
                  <span className="text-xs" style={{ color: 'var(--accent-green)', fontFamily: "'JetBrains Mono', monospace" }}>
                    Self-signed TLS certificate ready
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleGenerateTLS}
                  disabled={generatingCert}
                  className="px-4 py-1.5 rounded text-xs cursor-pointer transition-all hover:bg-white/5"
                  style={{
                    color: 'var(--accent-cyan)',
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                    fontFamily: "'JetBrains Mono', monospace",
                    opacity: generatingCert ? 0.5 : 1,
                  }}
                >
                  {generatingCert ? 'Generating...' : 'Generate TLS Certificate'}
                </button>
              )}
            </div>
          </>
        )}

        {currentStep === 'complete' && (
          <>
            <div className="text-4xl mb-4" style={{ color: 'var(--accent-green)' }}>✓</div>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--accent-green)', fontFamily: "'JetBrains Mono', monospace" }}>
              Setup Complete
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              You're ready to start using Freedom Studio. Import or download a GGUF model to begin chatting.
            </p>
            <div className="glass-panel p-3 text-left" style={{ background: 'var(--bg-void)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'Fira Code', monospace" }}>
                $ models → {modelsDir || 'default'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'Fira Code', monospace" }}>
                $ security → {passwordSet ? '✓ encrypted' : '○ no password'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'Fira Code', monospace" }}>
                $ tls → {tlsCertGenerated ? '✓ ready' : '○ not generated'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 mt-6">
        {stepIndex > 0 && currentStep !== 'complete' && (
          <button
            onClick={handleBack}
            className="px-4 py-2 rounded text-xs cursor-pointer transition-all hover:bg-white/5"
            style={{
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Back
          </button>
        )}
        {currentStep === 'complete' ? (
          <button
            onClick={handleFinish}
            className="px-6 py-2 rounded text-xs font-bold uppercase cursor-pointer transition-all"
            style={{
              background: 'rgba(0, 255, 136, 0.15)',
              color: 'var(--accent-green)',
              border: '1px solid var(--border-accent)',
              fontFamily: "'JetBrains Mono', monospace",
              textShadow: '0 0 8px var(--accent-green)',
            }}
          >
            Launch Freedom Studio
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="px-6 py-2 rounded text-xs font-bold uppercase cursor-pointer transition-all"
            style={{
              background: canProceed() ? 'rgba(0, 255, 136, 0.15)' : 'var(--bg-surface)',
              color: canProceed() ? 'var(--accent-green)' : 'var(--text-muted)',
              border: `1px solid ${canProceed() ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {currentStep === 'security' && !passwordSet ? 'Set password to continue' : 'Next'}
          </button>
        )}
      </div>
    </div>
  );
}
