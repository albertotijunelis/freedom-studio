// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { create } from 'zustand';
import type { Conversation, Message, Role, SystemPrompt } from '@freedom-studio/types';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  systemPrompts: SystemPrompt[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;

  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  fetchSystemPrompts: () => Promise<void>;
  createConversation: (title: string, systemPrompt?: string) => Promise<string>;
  setActiveConversation: (id: string | null) => void;
  addMessage: (role: Role, content: string, tokenCount?: number) => Promise<Message | null>;
  deleteConversation: (id: string) => Promise<void>;
  updateConversation: (id: string, updates: { title?: string; systemPrompt?: string }) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  systemPrompts: [],
  isLoadingConversations: false,
  isLoadingMessages: false,

  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const result = await window.api.invoke('chat:list-conversations', { limit: 50 }) as {
        success: boolean; data?: Conversation[];
      };
      if (result.success) {
        set({ conversations: result.data || [] });
      }
    } finally {
      set({ isLoadingConversations: false });
    }
  },

  fetchMessages: async (conversationId: string) => {
    set({ isLoadingMessages: true });
    try {
      const result = await window.api.invoke('chat:get-messages', { conversationId }) as {
        success: boolean; data?: Message[];
      };
      if (result.success) {
        set({ messages: result.data || [] });
      }
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  fetchSystemPrompts: async () => {
    const result = await window.api.invoke('chat:list-system-prompts') as {
      success: boolean; data?: SystemPrompt[];
    };
    if (result.success) {
      set({ systemPrompts: result.data || [] });
    }
  },

  createConversation: async (title, systemPrompt) => {
    const result = await window.api.invoke('chat:create-conversation', {
      title,
      systemPrompt: systemPrompt || '',
    }) as { success: boolean; data?: Conversation };

    if (result.success && result.data) {
      set((s) => ({
        conversations: [result.data!, ...s.conversations],
        activeConversationId: result.data!.id,
        messages: [],
      }));
      return result.data.id;
    }
    return '';
  },

  setActiveConversation: (id) => {
    set({ activeConversationId: id, messages: [] });
    if (id) {
      get().fetchMessages(id);
    }
  },

  addMessage: async (role, content, tokenCount) => {
    const { activeConversationId } = get();
    if (!activeConversationId) return null;

    const result = await window.api.invoke('chat:add-message', {
      conversationId: activeConversationId,
      role,
      content,
      tokenCount,
    }) as { success: boolean; data?: Message };

    if (result.success && result.data) {
      set((s) => ({
        messages: [...s.messages, result.data!],
      }));
      return result.data;
    }
    return null;
  },

  deleteConversation: async (id) => {
    await window.api.invoke('chat:delete-conversation', { id });
    set((s) => {
      const conversations = s.conversations.filter((c) => c.id !== id);
      const isActive = s.activeConversationId === id;
      return {
        conversations,
        activeConversationId: isActive ? null : s.activeConversationId,
        messages: isActive ? [] : s.messages,
      };
    });
  },

  updateConversation: async (id, updates) => {
    await window.api.invoke('chat:update-conversation', { id, updates });
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },
}));
