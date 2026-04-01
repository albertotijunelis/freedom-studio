// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { ipcMain } from 'electron';
import { cryptoManager } from '../crypto/cryptoManager';
import { databaseManager } from '../database/db';

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

export function registerCryptoHandlers(): void {
  ipcMain.handle('crypto:set-master-password', (_event, args: { password: string }) => {
    return wrapHandler(() => cryptoManager.setup(args.password));
  });

  ipcMain.handle('crypto:unlock', (_event, args: { password: string }) => {
    return wrapHandler(async () => {
      const success = await cryptoManager.unlock(args.password);
      // If DB was deferred because dbkey was encrypted, initialize it now
      if (success && databaseManager.isPendingUnlock()) {
        databaseManager.initializeAfterUnlock();
      }
      return success;
    });
  });

  ipcMain.handle('crypto:generate-api-key', () => {
    return wrapHandler(() => cryptoManager.createApiKey());
  });

  ipcMain.handle('crypto:status', () => {
    return wrapHandler(() => cryptoManager.getStatus());
  });

  ipcMain.handle('crypto:lock', () => {
    return wrapHandler(() => cryptoManager.lock());
  });

  ipcMain.handle('crypto:generate-tls-cert', () => {
    return wrapHandler(() => cryptoManager.generateTLSCert());
  });

  ipcMain.handle('crypto:tls-cert-paths', () => {
    return wrapHandler(() => cryptoManager.getTLSCertPaths());
  });
}
