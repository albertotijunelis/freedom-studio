// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { create } from 'zustand';

interface SettingsState {
  modelsDirectory: string;
  defaultGpuLayers: number;
  defaultThreadCount: number;
  defaultBatchSize: number;
  defaultContextSize: number;
  defaultMaxTokens: number;
  defaultTemperature: number;
  defaultTopP: number;
  defaultTopK: number;
  defaultRepeatPenalty: number;
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
  setMaxTokens: (tokens: number) => void;
  setTemperature: (temp: number) => void;
  setTopP: (topP: number) => void;
  setTopK: (topK: number) => void;
  setRepeatPenalty: (penalty: number) => void;
  setScanlineEnabled: (enabled: boolean) => void;
  setTheme: (theme: 'dark' | 'darker' | 'black') => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  modelsDirectory: '',
  defaultGpuLayers: 0,
  defaultThreadCount: 4,
  defaultBatchSize: 512,
  defaultContextSize: 8192,
  defaultMaxTokens: 4096,
  defaultTemperature: 0.7,
  defaultTopP: 0.9,
  defaultTopK: 40,
  defaultRepeatPenalty: 1.1,
  autoLockMinutes: 30,
  scanlineEnabled: true,
  scanlineIntensity: 3,
  fontSize: 14,
  theme: 'black',

  loadSettings: async () => {
    try {
      const keys = [
        'modelsDirectory', 'defaultGpuLayers', 'defaultThreadCount',
        'defaultBatchSize', 'defaultContextSize', 'defaultMaxTokens',
        'defaultTemperature', 'defaultTopP', 'defaultTopK',
        'defaultRepeatPenalty', 'scanlineEnabled', 'theme',
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
            case 'defaultMaxTokens':
              set({ defaultMaxTokens: parseInt(value, 10) }); break;
            case 'defaultTemperature':
              set({ defaultTemperature: parseFloat(value) }); break;
            case 'defaultTopP':
              set({ defaultTopP: parseFloat(value) }); break;
            case 'defaultTopK':
              set({ defaultTopK: parseInt(value, 10) }); break;
            case 'defaultRepeatPenalty':
              set({ defaultRepeatPenalty: parseFloat(value) }); break;
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
  setMaxTokens: (tokens) => set({ defaultMaxTokens: tokens }),
  setTemperature: (temp) => set({ defaultTemperature: temp }),
  setTopP: (topP) => set({ defaultTopP: topP }),
  setTopK: (topK) => set({ defaultTopK: topK }),
  setRepeatPenalty: (penalty) => set({ defaultRepeatPenalty: penalty }),
  setScanlineEnabled: (enabled) => set({ scanlineEnabled: enabled }),
  setTheme: (theme) => set({ theme }),
}));
