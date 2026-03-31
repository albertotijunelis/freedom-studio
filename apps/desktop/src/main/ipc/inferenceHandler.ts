// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { ipcMain, BrowserWindow } from 'electron';
import { inferenceEngine } from '../inference/engine';
import type { ChatMessage } from '../inference/engine';
import type { ModelConfig, InferenceParams } from '@freedom-studio/types';

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

export function registerInferenceHandlers(): void {
  ipcMain.handle('inference:load-model', (_event, args: { modelPath: string; config: ModelConfig }) => {
    return wrapHandler(() => inferenceEngine.loadModel(args.modelPath, args.config));
  });

  ipcMain.handle('inference:run', (event, args: { prompt: string; params: InferenceParams; messages?: Array<{ role: string; content: string }>; conversationId?: string }) => {
    return wrapHandler(async () => {
      const window = BrowserWindow.fromWebContents(event.sender);

      const tokenCallback = (token: string, done: boolean, stats: { tokensGenerated: number; tokensPerSecond: number }): void => {
        if (window && !window.isDestroyed()) {
          window.webContents.send('inference:stream-token', { token, done, ...stats });
        }
      };

      // If full message history is provided, use context-aware streaming
      if (args.messages && args.messages.length > 0) {
        const chatMessages: ChatMessage[] = args.messages.map((m) => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content,
        }));
        const result = await inferenceEngine.streamWithHistory(chatMessages, args.params, tokenCallback, args.conversationId);
        return result;
      }

      // Fallback: stream with just the prompt (API server compatibility)
      const result = await inferenceEngine.stream(args.prompt, args.params, tokenCallback);
      return result;
    });
  });

  ipcMain.handle('inference:stop', () => {
    return wrapHandler(() => {
      inferenceEngine.stop();
    });
  });

  ipcMain.handle('inference:stats', () => {
    return wrapHandler(() => inferenceEngine.getStats());
  });

  ipcMain.handle('inference:is-loaded', () => {
    return wrapHandler(() => inferenceEngine.getIsLoaded());
  });

  ipcMain.handle('inference:unload', () => {
    return wrapHandler(() => inferenceEngine.unload());
  });

  ipcMain.handle('inference:detect-gpu', () => {
    return wrapHandler(() => inferenceEngine.detectGPU());
  });
}
