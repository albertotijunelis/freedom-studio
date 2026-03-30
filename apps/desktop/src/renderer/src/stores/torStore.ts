// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { create } from 'zustand';
import type { TorConnectionStatus } from '@freedom-studio/types';

interface TorState {
  isEnabled: boolean;
  connectionStatus: TorConnectionStatus;
  bootstrapProgress: number;
  circuit: string[];
  socksPort: number;
  error: string | null;

  startTor: () => Promise<void>;
  stopTor: () => Promise<void>;
  fetchStatus: () => Promise<void>;
  setEnabled: (enabled: boolean) => void;
}

export const useTorStore = create<TorState>((set) => ({
  isEnabled: false,
  connectionStatus: 'disconnected',
  bootstrapProgress: 0,
  circuit: [],
  socksPort: 9050,
  error: null,

  startTor: async () => {
    set({ connectionStatus: 'connecting', error: null });
    try {
      const result = await window.api.invoke('tor:start') as {
        success: boolean; data?: { connectionStatus: TorConnectionStatus; error?: string | null }; error?: string;
      };
      if (!result.success) throw new Error(result.error);
      const status = result.data;
      set({
        connectionStatus: status?.connectionStatus ?? 'connected',
        isEnabled: true,
        error: status?.error ?? null,
      });
    } catch (error) {
      set({
        connectionStatus: 'error',
        error: error instanceof Error ? error.message : 'Failed to start Tor',
      });
    }
  },

  stopTor: async () => {
    try {
      await window.api.invoke('tor:stop');
      set({ connectionStatus: 'disconnected', isEnabled: false, circuit: [], error: null, bootstrapProgress: 0 });
    } catch {
      // Ignore
    }
  },

  fetchStatus: async () => {
    try {
      const result = await window.api.invoke('tor:status') as {
        success: boolean; data?: {
          connectionStatus: TorConnectionStatus;
          bootstrapProgress: number;
          socksPort: number;
          error?: string | null;
          uptime?: number;
        };
      };
      if (result.success && result.data) {
        set({
          connectionStatus: result.data.connectionStatus,
          bootstrapProgress: result.data.bootstrapProgress,
          socksPort: result.data.socksPort,
          isEnabled: result.data.connectionStatus === 'connected',
          error: result.data.error ?? null,
        });
      }
    } catch {
      // Ignore
    }
  },

  setEnabled: (enabled) => set({ isEnabled: enabled }),
}));
