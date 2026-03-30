// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { create } from 'zustand';
import { useSettingsStore } from './settingsStore';

interface InferenceState {
  loadedModel: string | null;
  loadedModelPath: string | null;
  isLoading: boolean;
  isRunning: boolean;
  currentTokens: string;
  tokensPerSecond: number;
  totalTokensGenerated: number;

  setLoadedModel: (name: string | null, path: string | null) => void;
  setLoading: (loading: boolean) => void;
  setRunning: (running: boolean) => void;
  appendToken: (token: string) => void;
  clearTokens: () => void;
  setStats: (tps: number, total: number) => void;

  loadModel: (modelPath: string, modelName: string) => Promise<void>;
  runInference: (prompt: string) => Promise<void>;
  stopInference: () => Promise<void>;
  unloadModel: () => Promise<void>;
}

export const useInferenceStore = create<InferenceState>((set, get) => ({
  loadedModel: null,
  loadedModelPath: null,
  isLoading: false,
  isRunning: false,
  currentTokens: '',
  tokensPerSecond: 0,
  totalTokensGenerated: 0,

  setLoadedModel: (name, path) => set({ loadedModel: name, loadedModelPath: path }),
  setLoading: (loading) => set({ isLoading: loading }),
  setRunning: (running) => set({ isRunning: running }),
  appendToken: (token) => set((s) => ({ currentTokens: s.currentTokens + token })),
  clearTokens: () => set({ currentTokens: '' }),
  setStats: (tps, total) => set({ tokensPerSecond: tps, totalTokensGenerated: total }),

  loadModel: async (modelPath, modelName) => {
    const settings = useSettingsStore.getState();
    set({ isLoading: true });
    try {
      const result = await window.api.invoke('inference:load-model', {
        modelPath,
        config: {
          contextSize: settings.defaultContextSize,
          batchSize: settings.defaultBatchSize,
          gpuLayers: settings.defaultGpuLayers,
          threads: settings.defaultThreadCount,
        },
      }) as { success: boolean; error?: string };

      if (!result.success) throw new Error(result.error);

      set({ loadedModel: modelName, loadedModelPath: modelPath, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  runInference: async (prompt) => {
    set({ isRunning: true, currentTokens: '' });

    const unsub = window.api.on('inference:stream-token', (data: unknown) => {
      const { token, done, tokensPerSecond: tps, tokensGenerated } = data as {
        token: string; done: boolean; tokensPerSecond: number; tokensGenerated: number;
      };

      if (done) {
        set({ isRunning: false, tokensPerSecond: tps, totalTokensGenerated: tokensGenerated });
        unsub();
      } else {
        set((s) => ({
          currentTokens: s.currentTokens + token,
          tokensPerSecond: tps,
        }));
      }
    });

    try {
      await window.api.invoke('inference:run', {
        prompt,
        params: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          repeatPenalty: 1.1,
          maxTokens: 2048,
          stop: [],
        },
      });
    } catch {
      set({ isRunning: false });
      unsub();
    }
  },

  stopInference: async () => {
    await window.api.invoke('inference:stop');
    set({ isRunning: false });
  },

  unloadModel: async () => {
    await window.api.invoke('inference:unload');
    set({ loadedModel: null, loadedModelPath: null });
  },
}));
