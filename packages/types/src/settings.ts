// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

export interface AppSettings {
  general: GeneralSettings;
  inference: InferenceSettings;
  security: SecuritySettings;
  tor: TorSettings;
  appearance: AppearanceSettings;
}

export interface GeneralSettings {
  modelsDirectory: string;
  language: string;
  launchOnStartup: boolean;
  minimizeToTray: boolean;
  checkForUpdates: boolean;
}

export interface InferenceSettings {
  defaultGpuLayers: number;
  defaultThreadCount: number;
  defaultBatchSize: number;
  defaultContextSize: number;
  flashAttention: boolean;
}

export interface SecuritySettings {
  masterPasswordSet: boolean;
  tlsEnabled: boolean;
  mtlsEnabled: boolean;
  autoLockMinutes: number;
  lockOnMinimize: boolean;
}

export interface TorSettings {
  enabled: boolean;
  socksPort: number;
  controlPort: number;
  bridgeMode: boolean;
  bridges: string[];
  useForModelDownloads: boolean;
  useForUpdateChecks: boolean;
}

export interface AppearanceSettings {
  theme: 'dark' | 'darker' | 'black';
  fontSize: number;
  scanlineIntensity: number;
  scanlineEnabled: boolean;
  reducedMotion: boolean;
}

export interface ThemeConfig {
  name: string;
  bgVoid: string;
  bgDark: string;
  bgSurface: string;
  accentGreen: string;
  accentCyan: string;
}
