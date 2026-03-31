// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { create } from 'zustand';
import { useSettingsStore } from './settingsStore';
import { useChatStore } from './chatStore';

interface InferenceState {
  loadedModel: string | null;
  loadedModelPath: string | null;
  isLoading: boolean;
  isRunning: boolean;
  loadError: string | null;
  currentTokens: string;
  tokensPerSecond: number;
  totalTokensGenerated: number;
  inferenceConversationId: string | null;

  setLoadedModel: (name: string | null, path: string | null) => void;
  setLoading: (loading: boolean) => void;
  setRunning: (running: boolean) => void;
  appendToken: (token: string) => void;
  clearTokens: () => void;
  setStats: (tps: number, total: number) => void;

  loadModel: (modelPath: string, modelName: string) => Promise<void>;
  runInference: (prompt: string, conversationId: string) => Promise<void>;
  stopInference: () => Promise<void>;
  unloadModel: () => Promise<void>;
  restoreLastModel: () => Promise<void>;
}

export const useInferenceStore = create<InferenceState>((set, get) => ({
  loadedModel: null,
  loadedModelPath: null,
  isLoading: false,
  isRunning: false,
  loadError: null,
  currentTokens: '',
  tokensPerSecond: 0,
  totalTokensGenerated: 0,
  inferenceConversationId: null,

  setLoadedModel: (name, path) => set({ loadedModel: name, loadedModelPath: path }),
  setLoading: (loading) => set({ isLoading: loading }),
  setRunning: (running) => set({ isRunning: running }),
  appendToken: (token) => set((s) => ({ currentTokens: s.currentTokens + token })),
  clearTokens: () => set({ currentTokens: '' }),
  setStats: (tps, total) => set({ tokensPerSecond: tps, totalTokensGenerated: total }),

  loadModel: async (modelPath, modelName) => {
    const settings = useSettingsStore.getState();
    set({ isLoading: true, loadError: null });
    try {
      const result = await window.api.invoke('inference:load-model', {
        modelPath,
        config: {
          contextSize: settings.defaultContextSize,
          batchSize: settings.defaultBatchSize,
          gpuLayers: settings.defaultGpuLayers,
          threads: settings.defaultThreadCount,
        },
      }) as { success: boolean; error?: string };

      if (!result.success) throw new Error(result.error || 'Failed to load model');

      set({ loadedModel: modelName, loadedModelPath: modelPath, isLoading: false, loadError: null });

      // Persist last loaded model to settings DB
      window.api.invoke('settings:set', { key: 'lastModelPath', value: modelPath });
      window.api.invoke('settings:set', { key: 'lastModelName', value: modelName });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load model';
      set({ isLoading: false, loadError: message });
      throw error;
    }
  },

  runInference: async (prompt, conversationId) => {
    set({ isRunning: true, currentTokens: '', inferenceConversationId: conversationId });

    let cleaned = false;
    const cleanup = (): void => {
      if (!cleaned) {
        cleaned = true;
        set({ isRunning: false, inferenceConversationId: null });
        unsub();
      }
    };

    const unsub = window.api.on('inference:stream-token', (data: unknown) => {
      const { token, done, tokensPerSecond: tps, tokensGenerated } = data as {
        token: string; done: boolean; tokensPerSecond: number; tokensGenerated: number;
      };

      if (done) {
        set({ tokensPerSecond: tps, totalTokensGenerated: tokensGenerated });
        cleanup();
      } else {
        set((s) => ({
          currentTokens: s.currentTokens + token,
          tokensPerSecond: tps,
        }));
      }
    });

    try {
      const settings = useSettingsStore.getState();
      const chatState = useChatStore.getState();

      // Build full message history for context-aware inference
      // Include system prompt + all previous messages + the new user message
      const conversation = chatState.conversations.find((c) => c.id === conversationId);
      const messages: Array<{ role: string; content: string }> = [];

      // Add system prompt if the conversation has one
      if (conversation?.systemPrompt) {
        messages.push({ role: 'system', content: conversation.systemPrompt });
      }

      // Add all existing messages from the conversation
      for (const msg of chatState.messages) {
        messages.push({ role: msg.role, content: msg.content });
      }

      // If the latest user message isn't in the store yet (race condition),
      // ensure it's at the end
      const lastMsg = messages[messages.length - 1];
      if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== prompt) {
        messages.push({ role: 'user', content: prompt });
      }

      const result = await window.api.invoke('inference:run', {
        prompt,
        messages,
        params: {
          temperature: settings.defaultTemperature,
          topP: settings.defaultTopP,
          topK: settings.defaultTopK,
          repeatPenalty: settings.defaultRepeatPenalty,
          maxTokens: settings.defaultMaxTokens,
          stop: [],
        },
      }) as { success: boolean; error?: string };

      // If the IPC call returned success: false (stream error caught by wrapHandler),
      // the done event may never have fired. Ensure cleanup.
      if (!result.success) {
        console.error('[Inference] Stream error:', result.error);
        cleanup();
      }
    } catch {
      cleanup();
    }
  },

  stopInference: async () => {
    await window.api.invoke('inference:stop');
    set({ isRunning: false, inferenceConversationId: null });
  },

  unloadModel: async () => {
    await window.api.invoke('inference:unload');
    set({ loadedModel: null, loadedModelPath: null });
    // Clear persisted model
    window.api.invoke('settings:set', { key: 'lastModelPath', value: '' });
    window.api.invoke('settings:set', { key: 'lastModelName', value: '' });
  },

  restoreLastModel: async () => {
    try {
      const pathResult = await window.api.invoke('settings:get', { key: 'lastModelPath' }) as {
        success: boolean; data?: string | null;
      };
      const nameResult = await window.api.invoke('settings:get', { key: 'lastModelName' }) as {
        success: boolean; data?: string | null;
      };

      const modelPath = pathResult.success ? pathResult.data : null;
      const modelName = nameResult.success ? nameResult.data : null;

      if (modelPath && modelName) {
        await get().loadModel(modelPath, modelName);
      }
    } catch {
      // Model may have been deleted or settings cleared — silently ignore
    }
  },
}));
