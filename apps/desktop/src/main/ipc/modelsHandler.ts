// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { ipcMain, BrowserWindow, app, dialog } from 'electron';
import { join } from 'node:path';
import { ModelManager } from '../models/manager';

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

const defaultModelsDir = join(
  app?.getPath?.('userData') || join(process.env.APPDATA || process.env.HOME || '', 'freedom-studio'),
  'models'
);

const modelManager = new ModelManager(defaultModelsDir);

export { modelManager };

export function registerModelsHandlers(): void {
  ipcMain.handle('models:list', () => {
    return wrapHandler(() => modelManager.scanLocalModels());
  });

  ipcMain.handle('models:download', (event, args: { modelId: string; quantization: string; url?: string }) => {
    return wrapHandler(async () => {
      const window = BrowserWindow.fromWebContents(event.sender);
      const fileName = `${args.modelId}-${args.quantization}.gguf`;
      const url = args.url || `https://huggingface.co/${args.modelId}/resolve/main/${fileName}`;

      const filePath = await modelManager.downloadModel(
        url,
        fileName,
        (progress) => {
          if (window && !window.isDestroyed()) {
            window.webContents.send('models:download-progress', progress);
          }
        }
      );

      return { filePath, fileName };
    });
  });

  ipcMain.handle('models:delete', (_event, args: { modelId: string }) => {
    return wrapHandler(() => {
      // Cancel any active download for this model before deleting
      modelManager.cancelDownload(args.modelId);
      return modelManager.deleteModel(args.modelId);
    });
  });

  ipcMain.handle('models:cancel-download', (_event, args: { fileName: string }) => {
    return wrapHandler(() => {
      modelManager.cancelDownload(args.fileName);
    });
  });

  ipcMain.handle('models:disk-usage', () => {
    return wrapHandler(() => modelManager.getDiskUsage());
  });

  ipcMain.handle('models:get-info', (_event, args: { filePath: string }) => {
    return wrapHandler(() => modelManager.getModelInfo(args.filePath));
  });

  ipcMain.handle('models:get-dir', () => {
    return wrapHandler(() => modelManager.getModelsDir());
  });

  ipcMain.handle('models:set-dir', (_event, args: { dir: string }) => {
    return wrapHandler(() => modelManager.setModelsDir(args.dir));
  });

  ipcMain.handle('models:pick-dir', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Models Directory',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: true, data: null };
    }

    const dir = result.filePaths[0];
    modelManager.setModelsDir(dir);
    return { success: true, data: dir };
  });

  ipcMain.handle('models:import', async (event) => {
    const result = await dialog.showOpenDialog({
      title: 'Import Model File',
      filters: [
        { name: 'Model Files', extensions: ['gguf', 'ggml'] },
      ],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: true, data: null };
    }

    const sourcePath = result.filePaths[0];
    const window = BrowserWindow.fromWebContents(event.sender);

    return wrapHandler(() =>
      modelManager.importModel(sourcePath, (progress) => {
        if (window && !window.isDestroyed()) {
          window.webContents.send('models:import-progress', progress);
        }
      })
    );
  });
}
