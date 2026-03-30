// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { ipcMain, BrowserWindow } from 'electron';
import { torManager } from '../tor/torManager';

interface IPCResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

function wrapHandler<T>(fn: () => Promise<T> | T): Promise<IPCResult<T>> {
  return Promise.resolve()
    .then(() => fn())
    .then((data) => ({ success: true, data }))
    .catch((err: unknown) => ({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }));
}

export function registerTorHandlers(): void {
  ipcMain.handle('tor:start', (event, args?: { socksPort?: number; controlPort?: number }) => {
    return wrapHandler(async () => {
      const window = BrowserWindow.fromWebContents(event.sender);

      await torManager.start(args?.socksPort, args?.controlPort);

      if (window && !window.isDestroyed()) {
        window.webContents.send('tor:status', torManager.getStatus());
      }

      return torManager.getStatus();
    });
  });

  ipcMain.handle('tor:stop', () => {
    return wrapHandler(() => torManager.stop());
  });

  ipcMain.handle('tor:status', () => {
    return wrapHandler(() => torManager.getStatus());
  });
}
