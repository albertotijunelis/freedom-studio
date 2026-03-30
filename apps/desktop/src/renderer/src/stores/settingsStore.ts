// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { create } from 'zustand';

interface SettingsState {
  modelsDirectory: string;
  defaultGpuLayers: number;
  defaultThreadCount: number;
  defaultBatchSize: number;
  defaultContextSize: number;
  autoLockMinutes: number;
  scanlineEnabled: boolean;
  scanlineIntensity: number;
  fontSize: number;
  theme: 'dark' | 'darker' | 'black';

  loadSettings: () => Promise<void>;
  saveSetting: (key: string, value: string) => Promise<void>;
  setModelsDirectory: (dir: string) => void;
  setGpuLayers: (layers: number) => void;
  setThreadCount: (count: number) => void;
  setBatchSize: (size: number) => void;
  setContextSize: (size: number) => void;
  setScanlineEnabled: (enabled: boolean) => void;
  setTheme: (theme: 'dark' | 'darker' | 'black') => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  modelsDirectory: '',
  defaultGpuLayers: 0,
  defaultThreadCount: 4,
  defaultBatchSize: 512,
  defaultContextSize: 4096,
  autoLockMinutes: 30,
  scanlineEnabled: true,
  scanlineIntensity: 3,
  fontSize: 14,
  theme: 'black',

  loadSettings: async () => {
    try {
      const keys = [
        'modelsDirectory', 'defaultGpuLayers', 'defaultThreadCount',
        'defaultBatchSize', 'defaultContextSize', 'scanlineEnabled', 'theme',
      ];

      for (const key of keys) {
        const result = await window.api.invoke('settings:get', { key }) as {
          success: boolean; data?: string | null;
        };
        if (result.success && result.data !== null && result.data !== undefined) {
          const value = result.data;
          switch (key) {
            case 'modelsDirectory':
              set({ modelsDirectory: value }); break;
            case 'defaultGpuLayers':
              set({ defaultGpuLayers: parseInt(value, 10) }); break;
            case 'defaultThreadCount':
              set({ defaultThreadCount: parseInt(value, 10) }); break;
            case 'defaultBatchSize':
              set({ defaultBatchSize: parseInt(value, 10) }); break;
            case 'defaultContextSize':
              set({ defaultContextSize: parseInt(value, 10) }); break;
            case 'scanlineEnabled':
              set({ scanlineEnabled: value === 'true' }); break;
            case 'theme':
              set({ theme: value as 'dark' | 'darker' | 'black' }); break;
          }
        }
      }
    } catch {
      // Use defaults
    }
  },

  saveSetting: async (key: string, value: string) => {
    await window.api.invoke('settings:set', { key, value });
  },

  setModelsDirectory: (dir) => set({ modelsDirectory: dir }),
  setGpuLayers: (layers) => set({ defaultGpuLayers: layers }),
  setThreadCount: (count) => set({ defaultThreadCount: count }),
  setBatchSize: (size) => set({ defaultBatchSize: size }),
  setContextSize: (size) => set({ defaultContextSize: size }),
  setScanlineEnabled: (enabled) => set({ scanlineEnabled: enabled }),
  setTheme: (theme) => set({ theme }),
}));
