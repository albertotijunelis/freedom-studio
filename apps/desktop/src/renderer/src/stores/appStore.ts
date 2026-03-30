// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { create } from 'zustand';

export type PageId = 'chat' | 'models' | 'server' | 'settings' | 'setup';

interface AppState {
  isLocked: boolean;
  isSetupComplete: boolean;
  isCheckingSetup: boolean;
  currentPage: PageId;
  sidebarExpanded: boolean;
  unlockError: string | null;

  setLocked: (locked: boolean) => void;
  setSetupComplete: (complete: boolean) => void;
  navigate: (page: PageId) => void;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  checkSetupStatus: () => Promise<void>;
  unlockApp: (password: string) => Promise<boolean>;
}

export const useAppStore = create<AppState>((set) => ({
  isLocked: false,
  isSetupComplete: false,
  isCheckingSetup: true,
  currentPage: 'chat',
  sidebarExpanded: false,
  unlockError: null,

  setLocked: (locked) => set({ isLocked: locked }),
  setSetupComplete: (complete) => set({ isSetupComplete: complete }),
  navigate: (page) => set({ currentPage: page }),
  toggleSidebar: () => set((s) => ({ sidebarExpanded: !s.sidebarExpanded })),
  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),

  checkSetupStatus: async () => {
    try {
      const result = await window.api.invoke('settings:get', { key: 'setupComplete' }) as {
        success: boolean; data?: string | null;
      };
      if (result.success && result.data === 'true') {
        // Setup was completed — check if master password is configured
        const cryptoResult = await window.api.invoke('crypto:status') as {
          success: boolean; data?: { isSet: boolean; isUnlocked: boolean };
        };
        const needsUnlock = cryptoResult.success && cryptoResult.data?.isSet && !cryptoResult.data?.isUnlocked;
        set({ isSetupComplete: true, isLocked: !!needsUnlock, isCheckingSetup: false });
      } else {
        set({ isSetupComplete: false, isCheckingSetup: false });
      }
    } catch {
      set({ isSetupComplete: false, isCheckingSetup: false });
    }
  },

  unlockApp: async (password: string) => {
    set({ unlockError: null });
    try {
      const result = await window.api.invoke('crypto:unlock', { password }) as {
        success: boolean; data?: boolean; error?: string;
      };
      if (result.success && result.data === true) {
        set({ isLocked: false });
        return true;
      }
      set({ unlockError: 'Incorrect master password' });
      return false;
    } catch {
      set({ unlockError: 'Failed to unlock — please try again' });
      return false;
    }
  },
}));
