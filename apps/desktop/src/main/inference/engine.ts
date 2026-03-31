// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { ModelConfig, InferenceParams } from '@freedom-studio/types';

export interface InferenceEngineStats {
  tokensPerSecond: number;
  totalTokensGenerated: number;
  memoryUsageMb: number;
  gpuLayersUsed: number;
  contextUsed: number;
  contextTotal: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

type TokenCallback = (token: string, done: boolean, stats: { tokensGenerated: number; tokensPerSecond: number }) => void;

export class InferenceEngine {
  private model: unknown = null;
  private session: unknown = null;
  private isLoaded = false;
  private isRunning = false;
  private abortController: AbortController | null = null;
  private totalTokensGenerated = 0;
  private currentModelPath = '';
  private activeConversationId: string | null = null;

  async loadModel(modelPath: string, config: ModelConfig): Promise<void> {
    await this.unload();

    try {
      console.log('[InferenceEngine] Loading model:', modelPath);
      console.log('[InferenceEngine] Config:', JSON.stringify(config));

      const { getLlama, LlamaChatSession } = await import('node-llama-cpp');
      console.log('[InferenceEngine] node-llama-cpp imported, initializing llama...');

      const llama = await getLlama();
      console.log('[InferenceEngine] Llama initialized, loading model file...');

      const model = await llama.loadModel({
        modelPath,
        gpuLayers: config.gpuLayers,
      });
      console.log('[InferenceEngine] Model loaded, creating context...');

      const context = await model.createContext({
        contextSize: config.contextSize,
        batchSize: config.batchSize,
        threads: config.threads,
      });
      console.log('[InferenceEngine] Context created, starting chat session...');

      const session = new LlamaChatSession({ contextSequence: context.getSequence() });

      this.model = model;
      this.session = session;
      this.isLoaded = true;
      this.currentModelPath = modelPath;
      this.totalTokensGenerated = 0;
      console.log('[InferenceEngine] Model ready:', modelPath);
    } catch (error) {
      this.isLoaded = false;
      console.error('[InferenceEngine] Failed to load model:', error);
      throw new Error(`Failed to load model: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async run(prompt: string, params: InferenceParams): Promise<string> {
    if (!this.isLoaded || !this.session) {
      throw new Error('No model loaded');
    }

    if (this.isRunning) {
      throw new Error('Inference already running');
    }

    this.isRunning = true;
    this.abortController = new AbortController();

    try {
      const session = this.session as { prompt: (text: string, options: Record<string, unknown>) => Promise<string> };
      const result = await session.prompt(prompt, {
        temperature: params.temperature,
        topP: params.topP,
        topK: params.topK,
        repeatPenalty: { penalty: params.repeatPenalty },
        maxTokens: params.maxTokens,
        stopTrigger: params.stop?.length ? params.stop : undefined,
        signal: this.abortController.signal,
      });

      return result;
    } finally {
      this.isRunning = false;
      this.abortController = null;
    }
  }

  async stream(prompt: string, params: InferenceParams, onToken: TokenCallback): Promise<void> {
    if (!this.isLoaded || !this.session) {
      throw new Error('No model loaded');
    }

    if (this.isRunning) {
      throw new Error('Inference already running');
    }

    this.isRunning = true;
    this.abortController = new AbortController();
    let tokensGenerated = 0;
    const startTime = Date.now();

    try {
      const session = this.session as {
        prompt: (text: string, options: Record<string, unknown>) => Promise<string>;
      };

      await session.prompt(prompt, {
        temperature: params.temperature,
        topP: params.topP,
        topK: params.topK,
        repeatPenalty: { penalty: params.repeatPenalty },
        maxTokens: params.maxTokens,
        stopTrigger: params.stop?.length ? params.stop : undefined,
        signal: this.abortController.signal,
        onTextChunk: (text: string) => {
          tokensGenerated++;
          this.totalTokensGenerated++;
          const elapsed = (Date.now() - startTime) / 1000;
          const tokensPerSecond = elapsed > 0 ? tokensGenerated / elapsed : 0;

          onToken(text, false, { tokensGenerated, tokensPerSecond });
        },
      });

      onToken('', true, {
        tokensGenerated,
        tokensPerSecond: tokensGenerated / ((Date.now() - startTime) / 1000),
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        onToken('', true, {
          tokensGenerated,
          tokensPerSecond: tokensGenerated / ((Date.now() - startTime) / 1000),
        });
        return;
      }
      // Always fire done on error so the renderer can clean up
      onToken('', true, {
        tokensGenerated,
        tokensPerSecond: tokensGenerated / ((Date.now() - startTime) / 1000 || 1),
      });
      throw error;
    } finally {
      this.isRunning = false;
      this.abortController = null;
    }
  }

  /**
   * Stream inference with full conversation history context.
   * Only resets the session history when switching to a different conversation.
   * When continuing the same conversation, the session already has the KV cache
   * from prior turns, so we skip setChatHistory to avoid costly re-evaluation.
   */
  async streamWithHistory(messages: ChatMessage[], params: InferenceParams, onToken: TokenCallback, conversationId?: string): Promise<void> {
    if (!this.isLoaded || !this.session) {
      throw new Error('No model loaded');
    }

    if (this.isRunning) {
      throw new Error('Inference already running');
    }

    if (messages.length === 0) {
      throw new Error('No messages provided');
    }

    // Separate the last user message (to prompt with) from the history
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
      throw new Error('Last message must be from user');
    }

    // Only reset the session history when switching to a different conversation.
    // When continuing the same conversation, the LlamaChatSession already holds
    // the full KV cache from previous turns — calling setChatHistory would
    // invalidate it and force a full re-evaluation of all tokens (causing the
    // massive slowdown from 30 tok/s to <1 tok/s).
    const needsHistoryReset = conversationId !== this.activeConversationId;

    if (needsHistoryReset) {
      const historyMessages = messages.slice(0, -1);

      // Build chat history in node-llama-cpp format
      const chatHistory: Array<{ type: string; text?: string; response?: string[] }> = [];

      for (const msg of historyMessages) {
        if (msg.role === 'system') {
          chatHistory.push({ type: 'system', text: msg.content });
        } else if (msg.role === 'user') {
          chatHistory.push({ type: 'user', text: msg.content });
        } else if (msg.role === 'assistant') {
          chatHistory.push({ type: 'model', response: [msg.content] });
        }
      }

      try {
        const session = this.session as {
          setChatHistory: (history: unknown[]) => void;
          prompt: (text: string, options: Record<string, unknown>) => Promise<string>;
        };
        session.setChatHistory(chatHistory);
        console.log('[InferenceEngine] Chat history reset for conversation:', conversationId);
      } catch (err) {
        console.warn('[InferenceEngine] setChatHistory not supported, falling back to plain stream:', err);
        return this.stream(lastMessage.content, params, onToken);
      }

      this.activeConversationId = conversationId ?? null;
    }

    // Now stream inference with just the new user message — the session context includes all history
    return this.stream(lastMessage.content, params, onToken);
  }

  stop(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  async unload(): Promise<void> {
    this.stop();

    if (this.session) {
      this.session = null;
    }

    if (this.model && typeof (this.model as { dispose?: () => Promise<void> }).dispose === 'function') {
      await (this.model as { dispose: () => Promise<void> }).dispose();
    }

    this.model = null;
    this.isLoaded = false;
    this.currentModelPath = '';
    this.activeConversationId = null;
  }

  getStats(): InferenceEngineStats {
    return {
      tokensPerSecond: 0,
      totalTokensGenerated: this.totalTokensGenerated,
      memoryUsageMb: process.memoryUsage().heapUsed / 1024 / 1024,
      gpuLayersUsed: 0,
      contextUsed: 0,
      contextTotal: 0,
    };
  }

  getIsLoaded(): boolean {
    return this.isLoaded;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  getCurrentModelPath(): string {
    return this.currentModelPath;
  }

  async detectGPU(): Promise<{ backend: string; vramMb: number; deviceName: string; suggestedGpuLayers: number }> {
    try {
      const { getLlama } = await import('node-llama-cpp');
      const llama = await getLlama();
      const gpuInfo = await llama.getGpuDeviceNames();

      let backend = 'cpu';
      let deviceName = 'CPU Only';
      let vramMb = 0;
      let suggestedGpuLayers = 0;

      if (gpuInfo && gpuInfo.length > 0) {
        deviceName = gpuInfo[0] || 'Unknown GPU';

        // Detect backend from platform
        if (process.platform === 'darwin') {
          backend = 'metal';
          suggestedGpuLayers = 99; // Metal handles all layers well
        } else {
          // Check for CUDA-capable GPU names
          const name = deviceName.toLowerCase();
          if (name.includes('nvidia') || name.includes('geforce') || name.includes('rtx') || name.includes('gtx') || name.includes('quadro') || name.includes('tesla')) {
            backend = 'cuda';
            suggestedGpuLayers = 35;
          } else {
            backend = 'vulkan';
            suggestedGpuLayers = 20;
          }
        }

        // Try to get VRAM info from the llama instance
        const vramInfo = await llama.getVramState();
        if (vramInfo) {
          vramMb = Math.round((vramInfo.total || 0) / (1024 * 1024));
          // Scale suggested layers based on VRAM
          if (vramMb >= 24000) suggestedGpuLayers = 99;
          else if (vramMb >= 12000) suggestedGpuLayers = 50;
          else if (vramMb >= 8000) suggestedGpuLayers = 35;
          else if (vramMb >= 4000) suggestedGpuLayers = 20;
          else if (vramMb >= 2000) suggestedGpuLayers = 10;
        }
      }

      return { backend, vramMb, deviceName, suggestedGpuLayers };
    } catch (error) {
      console.error('[InferenceEngine] GPU detection failed:', error);
      return { backend: 'cpu', vramMb: 0, deviceName: 'CPU Only (detection failed)', suggestedGpuLayers: 0 };
    }
  }
}

export const inferenceEngine = new InferenceEngine();
