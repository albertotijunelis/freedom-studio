// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

export interface ModelConfig {
  contextSize: number;
  batchSize: number;
  gpuLayers: number;
  threads: number;
}

export interface InferenceParams {
  temperature: number;
  topP: number;
  topK: number;
  repeatPenalty: number;
  maxTokens: number;
  stop: string[];
}

export interface IPCChannels {
  // Inference
  'inference:load-model': { modelPath: string; config: ModelConfig };
  'inference:run': { prompt: string; params: InferenceParams };
  'inference:stream-token': { token: string; done: boolean };
  'inference:stop': void;

  // Models
  'models:list': void;
  'models:download': { modelId: string; quantization: string };
  'models:download-progress': { percent: number; speed: string };
  'models:delete': { modelId: string };
  'models:import': void;
  'models:import-progress': { fileName: string; percent: number; status: 'copying' | 'verifying' | 'completed' | 'failed' };

  // Server
  'server:start': { port: number };
  'server:stop': void;
  'server:status': { running: boolean; port: number };

  // Tor
  'tor:start': void;
  'tor:stop': void;
  'tor:status': { connected: boolean; circuit: string[] };

  // Crypto
  'crypto:set-master-password': { password: string };
  'crypto:unlock': { password: string };
  'crypto:generate-api-key': void;
}

export type IPCChannel = keyof IPCChannels;

export type IPCPayload<T extends IPCChannel> = IPCChannels[T];

export interface ElectronAPI {
  invoke(channel: string, ...args: unknown[]): Promise<unknown>;
  on(channel: string, callback: (...args: unknown[]) => void): () => void;
  send(channel: string, ...args: unknown[]): void;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
