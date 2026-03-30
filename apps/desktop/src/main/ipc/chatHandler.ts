// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { ipcMain } from 'electron';
import { databaseManager } from '../database/db';
import type { Role } from '@freedom-studio/types';

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

export function registerChatHandlers(): void {
  // Conversations
  ipcMain.handle('chat:create-conversation', (_event, args: { title: string; modelId?: string; systemPrompt?: string }) => {
    return wrapHandler(() => databaseManager.createConversation(args.title, args.modelId, args.systemPrompt));
  });

  ipcMain.handle('chat:list-conversations', (_event, args?: { limit?: number; offset?: number }) => {
    return wrapHandler(() => databaseManager.listConversations(args?.limit, args?.offset));
  });

  ipcMain.handle('chat:get-conversation', (_event, args: { id: string }) => {
    return wrapHandler(() => databaseManager.getConversation(args.id));
  });

  ipcMain.handle('chat:update-conversation', (_event, args: { id: string; updates: { title?: string; systemPrompt?: string } }) => {
    return wrapHandler(() => databaseManager.updateConversation(args.id, args.updates));
  });

  ipcMain.handle('chat:delete-conversation', (_event, args: { id: string }) => {
    return wrapHandler(() => databaseManager.deleteConversation(args.id));
  });

  // Messages
  ipcMain.handle('chat:add-message', (_event, args: { conversationId: string; role: Role; content: string; tokenCount?: number }) => {
    return wrapHandler(() => databaseManager.addMessage(args.conversationId, args.role, args.content, args.tokenCount));
  });

  ipcMain.handle('chat:get-messages', (_event, args: { conversationId: string; limit?: number; offset?: number }) => {
    return wrapHandler(() => databaseManager.getMessages(args.conversationId, args.limit, args.offset));
  });

  // System Prompts
  ipcMain.handle('chat:list-system-prompts', () => {
    return wrapHandler(() => databaseManager.listSystemPrompts());
  });

  ipcMain.handle('chat:create-system-prompt', (_event, args: { name: string; content: string }) => {
    return wrapHandler(() => databaseManager.createSystemPrompt(args.name, args.content));
  });

  // Settings
  ipcMain.handle('settings:get', (_event, args: { key: string }) => {
    return wrapHandler(() => databaseManager.getSetting(args.key));
  });

  ipcMain.handle('settings:set', (_event, args: { key: string; value: string }) => {
    return wrapHandler(() => databaseManager.setSetting(args.key, args.value));
  });
}
