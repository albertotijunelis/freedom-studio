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

type TokenCallback = (token: string, done: boolean, stats: { tokensGenerated: number; tokensPerSecond: number }) => void;

export class InferenceEngine {
  private model: unknown = null;
  private session: unknown = null;
  private isLoaded = false;
  private isRunning = false;
  private abortController: AbortController | null = null;
  private totalTokensGenerated = 0;
  private currentModelPath = '';

  async loadModel(modelPath: string, config: ModelConfig): Promise<void> {
    await this.unload();

    try {
      const { getLlama, LlamaChatSession } = await import('node-llama-cpp');
      const llama = await getLlama();

      const model = await llama.loadModel({
        modelPath,
        gpuLayers: config.gpuLayers,
      });

      const context = await model.createContext({
        contextSize: config.contextSize,
        batchSize: config.batchSize,
        threads: config.threads,
      });

      const session = new LlamaChatSession({ contextSequence: context.getSequence() });

      this.model = model;
      this.session = session;
      this.isLoaded = true;
      this.currentModelPath = modelPath;
      this.totalTokensGenerated = 0;
    } catch (error) {
      this.isLoaded = false;
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
      throw error;
    } finally {
      this.isRunning = false;
      this.abortController = null;
    }
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
}

export const inferenceEngine = new InferenceEngine();
