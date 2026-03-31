// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { ipcMain, BrowserWindow } from 'electron';
import type { HuggingFaceModel, HuggingFaceFile } from '@freedom-studio/types';
import { modelManager } from './modelsHandler';

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

const HF_API_BASE = 'https://huggingface.co/api';

function detectQuantization(filename: string): string {
  const patterns = [
    /IQ1_S/i, /IQ1_M/i, /IQ2_XXS/i, /IQ2_XS/i, /IQ2_S/i, /IQ2_M/i,
    /IQ3_XXS/i, /IQ3_XS/i, /IQ3_S/i, /IQ3_M/i, /IQ4_XS/i, /IQ4_NL/i,
    /Q2_K/i, /Q3_K_S/i, /Q3_K_M/i, /Q3_K_L/i,
    /Q4_0/i, /Q4_1/i, /Q4_K_S/i, /Q4_K_M/i,
    /Q5_0/i, /Q5_1/i, /Q5_K_S/i, /Q5_K_M/i,
    /Q6_K/i, /Q8_0/i, /F16/i, /F32/i,
  ];
  for (const p of patterns) {
    const match = filename.match(p);
    if (match) return match[0].toUpperCase();
  }
  return 'Unknown';
}

export function registerHuggingFaceHandlers(): void {
  // Search GGUF models on HuggingFace
  ipcMain.handle('hf:search', (_event, args: { query: string; limit?: number }) => {
    return wrapHandler(async () => {
      const query = encodeURIComponent(args.query);
      const limit = args.limit || 20;

      const url = `${HF_API_BASE}/models?search=${query}&filter=gguf&sort=downloads&direction=-1&limit=${limit}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.status}`);
      }

      const models = await response.json() as Array<Record<string, unknown>>;

      const results: HuggingFaceModel[] = models.map((m) => ({
        id: m.id as string,
        author: (m.id as string).split('/')[0] || '',
        name: (m.id as string).split('/').pop() || '',
        downloads: (m.downloads as number) || 0,
        likes: (m.likes as number) || 0,
        tags: (m.tags as string[]) || [],
        lastModified: (m.lastModified as string) || '',
        files: [],
      }));

      return results;
    });
  });

  // Get GGUF files for a specific model
  ipcMain.handle('hf:get-files', (_event, args: { modelId: string }) => {
    return wrapHandler(async () => {
      const url = `${HF_API_BASE}/models/${args.modelId}?blobs=true`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.status}`);
      }

      const model = await response.json() as Record<string, unknown>;
      const siblings = (model.siblings as Array<Record<string, unknown>>) || [];

      const files: HuggingFaceFile[] = siblings
        .filter((s) => {
          const fname = (s.rfilename as string) || '';
          return fname.endsWith('.gguf');
        })
        .map((s) => {
          const filename = s.rfilename as string;
          return {
            filename,
            size: (s.size as number) || 0,
            quantization: detectQuantization(filename),
            sha256: ((s.lfs as Record<string, unknown> | undefined)?.oid as string) || '',
            downloadUrl: `https://huggingface.co/${args.modelId}/resolve/main/${filename}`,
          };
        })
        .sort((a, b) => a.size - b.size);

      return files;
    });
  });

  // Download a GGUF file from HuggingFace
  ipcMain.handle('hf:download', (event, args: { modelId: string; filename: string; url: string }) => {
    return wrapHandler(async () => {
      // Validate URL is actually HuggingFace to prevent SSRF
      try {
        const parsed = new URL(args.url);
        if (!parsed.hostname.endsWith('huggingface.co')) {
          throw new Error('Downloads are only allowed from huggingface.co');
        }
        if (parsed.protocol !== 'https:') {
          throw new Error('Only HTTPS downloads are allowed');
        }
      } catch (e) {
        if (e instanceof Error && e.message.includes('allowed')) throw e;
        throw new Error('Invalid download URL');
      }

      const window = BrowserWindow.fromWebContents(event.sender);

      const filePath = await modelManager.downloadModel(
        args.url,
        args.filename,
        (progress) => {
          if (window && !window.isDestroyed()) {
            window.webContents.send('models:download-progress', progress);
          }
        }
      );

      // Send final 'completed' progress so the store can clean up its listener
      if (window && !window.isDestroyed()) {
        window.webContents.send('models:download-progress', {
          modelId: args.filename,
          fileName: args.filename,
          percent: 100,
          downloadedBytes: 0,
          totalBytes: 0,
          speed: '0 B/s',
          eta: '0s',
          status: 'completed',
        });
      }

      return { filePath, fileName: args.filename };
    });
  });
}
