// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { create } from 'zustand';
import type { HuggingFaceModel, HuggingFaceFile, DownloadProgress } from '@freedom-studio/types';

interface HFState {
  searchQuery: string;
  searchResults: HuggingFaceModel[];
  selectedModel: HuggingFaceModel | null;
  modelFiles: HuggingFaceFile[];
  isSearching: boolean;
  isLoadingFiles: boolean;
  downloadQueue: DownloadProgress[];
  error: string | null;

  setSearchQuery: (query: string) => void;
  searchModels: (query: string) => Promise<void>;
  selectModel: (model: HuggingFaceModel) => Promise<void>;
  clearSelection: () => void;
  downloadFile: (modelId: string, file: HuggingFaceFile) => Promise<void>;
}

export const useHuggingFaceStore = create<HFState>((set, get) => ({
  searchQuery: '',
  searchResults: [],
  selectedModel: null,
  modelFiles: [],
  isSearching: false,
  isLoadingFiles: false,
  downloadQueue: [],
  error: null,

  setSearchQuery: (query) => set({ searchQuery: query }),

  searchModels: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [], error: null });
      return;
    }
    set({ isSearching: true, error: null });
    try {
      const result = await window.api.invoke('hf:search', { query, limit: 20 }) as {
        success: boolean; data?: HuggingFaceModel[]; error?: string;
      };
      if (!result.success) throw new Error(result.error);
      set({ searchResults: result.data || [], isSearching: false });
    } catch (error) {
      set({ isSearching: false, error: error instanceof Error ? error.message : 'Search failed' });
    }
  },

  selectModel: async (model) => {
    set({ selectedModel: model, isLoadingFiles: true, modelFiles: [], error: null });
    try {
      const result = await window.api.invoke('hf:get-files', { modelId: model.id }) as {
        success: boolean; data?: HuggingFaceFile[]; error?: string;
      };
      if (!result.success) throw new Error(result.error);
      set({ modelFiles: result.data || [], isLoadingFiles: false });
    } catch (error) {
      set({ isLoadingFiles: false, error: error instanceof Error ? error.message : 'Failed to load files' });
    }
  },

  clearSelection: () => set({ selectedModel: null, modelFiles: [] }),

  downloadFile: async (modelId, file) => {
    const initialProgress: DownloadProgress = {
      modelId: file.filename,
      fileName: file.filename,
      percent: 0,
      downloadedBytes: 0,
      totalBytes: file.size,
      speed: '0 B/s',
      eta: '--',
      status: 'queued',
    };

    set((s) => ({ downloadQueue: [...s.downloadQueue, initialProgress] }));

    const unsub = window.api.on('models:download-progress', (data: unknown) => {
      const progress = data as DownloadProgress;
      set((s) => {
        const queue = s.downloadQueue.map((d) =>
          d.fileName === progress.fileName ? progress : d
        );
        if (progress.status === 'completed' || progress.status === 'failed') {
          unsub();
        }
        return { downloadQueue: queue };
      });
    });

    try {
      await window.api.invoke('hf:download', {
        modelId,
        filename: file.filename,
        url: file.downloadUrl,
      });
    } catch (error) {
      unsub();
      set((s) => ({
        downloadQueue: s.downloadQueue.map((d) =>
          d.fileName === file.filename
            ? { ...d, status: 'failed' as const, error: error instanceof Error ? error.message : 'Download failed' }
            : d
        ),
        error: error instanceof Error ? error.message : 'Download failed',
      }));
    }
  },
}));
