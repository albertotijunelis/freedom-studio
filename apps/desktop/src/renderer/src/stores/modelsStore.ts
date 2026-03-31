// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { create } from 'zustand';
import type { ModelInfo, DownloadProgress, DiskUsageInfo } from '@freedom-studio/types';

interface ImportProgress {
  fileName: string;
  percent: number;
  status: 'copying' | 'verifying' | 'completed' | 'failed';
}

interface ModelsState {
  localModels: ModelInfo[];
  downloadQueue: DownloadProgress[];
  diskUsage: DiskUsageInfo | null;
  isLoading: boolean;
  error: string | null;
  importProgress: ImportProgress | null;

  fetchLocalModels: () => Promise<void>;
  fetchDiskUsage: () => Promise<void>;
  deleteModel: (modelId: string) => Promise<void>;
  downloadModel: (modelId: string, quantization: string) => Promise<void>;
  importModel: () => Promise<ModelInfo | null>;
  setDownloadProgress: (progress: DownloadProgress) => void;
}

export const useModelsStore = create<ModelsState>((set) => ({
  localModels: [],
  downloadQueue: [],
  diskUsage: null,
  isLoading: false,
  error: null,
  importProgress: null,

  fetchLocalModels: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await window.api.invoke('models:list') as { success: boolean; data?: ModelInfo[]; error?: string };
      if (!result.success) throw new Error(result.error);
      set({ localModels: result.data || [], isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Failed to load models' });
    }
  },

  fetchDiskUsage: async () => {
    try {
      const result = await window.api.invoke('models:disk-usage') as { success: boolean; data?: DiskUsageInfo };
      if (result.success && result.data) {
        set({ diskUsage: result.data });
      }
    } catch {
      // Ignore disk usage errors
    }
  },

  deleteModel: async (modelId) => {
    try {
      const result = await window.api.invoke('models:delete', { modelId }) as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error);

      set((s) => ({
        localModels: s.localModels.filter((m) => m.id !== modelId),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete model' });
    }
  },

  downloadModel: async (modelId, quantization) => {
    try {
      const unsub = window.api.on('models:download-progress', (data: unknown) => {
        const progress = data as DownloadProgress;
        set((s) => {
          const queue = [...s.downloadQueue];
          const idx = queue.findIndex((d) => d.modelId === progress.modelId);
          if (idx >= 0) {
            queue[idx] = progress;
          } else {
            queue.push(progress);
          }

          if (progress.status === 'completed' || progress.status === 'failed') {
            unsub();
          }

          return { downloadQueue: queue };
        });
      });

      await window.api.invoke('models:download', { modelId, quantization });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Download failed' });
    }
  },

  importModel: async () => {
    set({ error: null, importProgress: null });

    const unsub = window.api.on('models:import-progress', (data: unknown) => {
      const progress = data as ImportProgress;
      set({ importProgress: progress });
      if (progress.status === 'completed' || progress.status === 'failed') {
        unsub();
      }
    });

    try {
      const result = await window.api.invoke('models:import') as { success: boolean; data?: ModelInfo | null; error?: string };

      if (!result.success) {
        unsub();
        throw new Error(result.error);
      }

      // User cancelled the dialog
      if (!result.data) {
        unsub();
        set({ importProgress: null });
        return null;
      }

      // Refresh models list
      const listResult = await window.api.invoke('models:list') as { success: boolean; data?: ModelInfo[] };
      if (listResult.success && listResult.data) {
        set({ localModels: listResult.data });
      }

      set({ importProgress: null });
      return result.data;
    } catch (error) {
      unsub();
      const message = error instanceof Error ? error.message : 'Import failed';
      set({ error: message, importProgress: null });
      throw error;
    }
  },

  setDownloadProgress: (progress) => {
    set((s) => {
      const queue = [...s.downloadQueue];
      const idx = queue.findIndex((d) => d.modelId === progress.modelId);
      if (idx >= 0) queue[idx] = progress;
      else queue.push(progress);
      return { downloadQueue: queue };
    });
  },
}));

// Global listener: track ALL download progress events in modelsStore
// This ensures downloads started from HuggingFace browser also appear in Model Manager
// We use a module-level flag to prevent duplicate listeners on hot reload
let _downloadListenerRegistered = false;
if (typeof window !== 'undefined' && window.api && !_downloadListenerRegistered) {
  _downloadListenerRegistered = true;
  window.api.on('models:download-progress', (data: unknown) => {
    const progress = data as DownloadProgress;
    useModelsStore.getState().setDownloadProgress(progress);

    // Auto-refresh model list when a download completes
    if (progress.status === 'completed') {
      setTimeout(() => {
        useModelsStore.getState().fetchLocalModels();
        useModelsStore.getState().fetchDiskUsage();
      }, 500);
    }
  });
}
