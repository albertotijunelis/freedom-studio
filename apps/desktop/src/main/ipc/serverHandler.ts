// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { ipcMain } from 'electron';
import { apiServer } from '../server/apiServer';
import { cryptoManager } from '../crypto/cryptoManager';

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

export function registerServerHandlers(): void {
  ipcMain.handle('server:start', (_event, args: { port: number; apiKeys?: string[] }) => {
    return wrapHandler(async () => {
      let certPaths = cryptoManager.getTLSCertPaths();

      if (!certPaths) {
        await cryptoManager.generateTLSCert();
        certPaths = cryptoManager.getTLSCertPaths();
      }

      if (!certPaths) {
        throw new Error('Failed to generate TLS certificates');
      }

      await apiServer.start({
        port: args.port,
        certPath: certPaths.certPath,
        keyPath: certPaths.keyPath,
        apiKeys: args.apiKeys || [],
      });

      return apiServer.getStatus();
    });
  });

  ipcMain.handle('server:stop', () => {
    return wrapHandler(() => apiServer.stop());
  });

  ipcMain.handle('server:status', () => {
    return wrapHandler(() => apiServer.getStatus());
  });

  ipcMain.handle('server:logs', () => {
    return wrapHandler(() => apiServer.getRequestLogs());
  });

  ipcMain.handle('server:update-keys', (_event, args: { apiKeys: string[] }) => {
    return wrapHandler(() => apiServer.updateApiKeys(args.apiKeys));
  });
}
