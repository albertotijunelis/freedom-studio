// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron/renderer';

const ALLOWED_INVOKE_CHANNELS = [
  'inference:load-model',
  'inference:run',
  'inference:stop',
  'inference:stats',
  'inference:is-loaded',
  'inference:unload',
  'models:list',
  'models:download',
  'models:delete',
  'models:disk-usage',
  'models:get-info',
  'models:get-dir',
  'models:set-dir',
  'models:pick-dir',
  'models:import',
  'server:start',
  'server:stop',
  'server:status',
  'server:logs',
  'server:update-keys',
  'tor:start',
  'tor:stop',
  'tor:status',
  'crypto:set-master-password',
  'crypto:unlock',
  'crypto:generate-api-key',
  'crypto:status',
  'crypto:lock',
  'crypto:generate-tls-cert',
  'crypto:tls-cert-paths',
  'chat:create-conversation',
  'chat:list-conversations',
  'chat:get-conversation',
  'chat:update-conversation',
  'chat:delete-conversation',
  'chat:add-message',
  'chat:get-messages',
  'chat:list-system-prompts',
  'chat:create-system-prompt',
  'settings:get',
  'settings:set',
] as const;

const ALLOWED_ON_CHANNELS = [
  'inference:stream-token',
  'models:download-progress',
  'models:import-progress',
  'server:status',
  'tor:status',
] as const;

type AllowedInvokeChannel = (typeof ALLOWED_INVOKE_CHANNELS)[number];
type AllowedOnChannel = (typeof ALLOWED_ON_CHANNELS)[number];

function isAllowedInvokeChannel(channel: string): channel is AllowedInvokeChannel {
  return (ALLOWED_INVOKE_CHANNELS as readonly string[]).includes(channel);
}

function isAllowedOnChannel(channel: string): channel is AllowedOnChannel {
  return (ALLOWED_ON_CHANNELS as readonly string[]).includes(channel);
}

const api = {
  invoke(channel: string, ...args: unknown[]): Promise<unknown> {
    if (!isAllowedInvokeChannel(channel)) {
      return Promise.reject(new Error(`IPC channel "${channel}" is not allowed`));
    }
    return ipcRenderer.invoke(channel, ...args);
  },

  on(channel: string, callback: (...args: unknown[]) => void): () => void {
    if (!isAllowedOnChannel(channel)) {
      throw new Error(`IPC channel "${channel}" is not allowed for listening`);
    }
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]): void => {
      callback(...args);
    };
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },

  send(channel: string, ...args: unknown[]): void {
    if (!isAllowedInvokeChannel(channel)) {
      throw new Error(`IPC channel "${channel}" is not allowed`);
    }
    ipcRenderer.send(channel, ...args);
  },
};

contextBridge.exposeInMainWorld('api', api);
