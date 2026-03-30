// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { create } from 'zustand';
import type { RequestLog, ServerStatus } from '@freedom-studio/types';

interface ServerState {
  isRunning: boolean;
  port: number;
  requestLogs: RequestLog[];
  apiKeys: string[];
  tlsEnabled: boolean;
  error: string | null;

  startServer: (port?: number) => Promise<void>;
  stopServer: () => Promise<void>;
  fetchStatus: () => Promise<void>;
  fetchLogs: () => Promise<void>;
  generateApiKey: () => Promise<string | null>;
  removeApiKey: (key: string) => void;
  setPort: (port: number) => void;
}

export const useServerStore = create<ServerState>((set, get) => ({
  isRunning: false,
  port: 8080,
  requestLogs: [],
  apiKeys: [],
  tlsEnabled: true,
  error: null,

  startServer: async (port) => {
    const p = port ?? get().port;
    try {
      const result = await window.api.invoke('server:start', {
        port: p,
        apiKeys: get().apiKeys,
      }) as { success: boolean; data?: ServerStatus; error?: string };

      if (!result.success) throw new Error(result.error);

      // Use the actual port from server status (important when port 0 auto-assigns)
      const actualPort = result.data?.port ?? p;
      set({ isRunning: true, port: actualPort, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to start server' });
    }
  },

  stopServer: async () => {
    try {
      await window.api.invoke('server:stop');
      set({ isRunning: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to stop server' });
    }
  },

  fetchStatus: async () => {
    try {
      const result = await window.api.invoke('server:status') as {
        success: boolean; data?: ServerStatus;
      };
      if (result.success && result.data) {
        set({ isRunning: result.data.running, port: result.data.port });
      }
    } catch {
      // Ignore
    }
  },

  fetchLogs: async () => {
    try {
      const result = await window.api.invoke('server:logs') as {
        success: boolean; data?: RequestLog[];
      };
      if (result.success && result.data) {
        set({ requestLogs: result.data });
      }
    } catch {
      // Ignore
    }
  },

  generateApiKey: async () => {
    try {
      const result = await window.api.invoke('crypto:generate-api-key') as {
        success: boolean; data?: string;
      };
      if (result.success && result.data) {
        const newKeys = [...get().apiKeys, result.data];
        set({ apiKeys: newKeys });

        // Sync with running server
        if (get().isRunning) {
          await window.api.invoke('server:update-keys', { apiKeys: newKeys });
        }

        return result.data;
      }
    } catch {
      // Ignore
    }
    return null;
  },

  removeApiKey: (key) => {
    const newKeys = get().apiKeys.filter((k) => k !== key);
    set({ apiKeys: newKeys });

    // Sync with running server
    if (get().isRunning) {
      window.api.invoke('server:update-keys', { apiKeys: newKeys }).catch(() => {});
    }
  },

  setPort: (port) => set({ port }),
}));
