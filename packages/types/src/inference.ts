// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

export interface InferenceResult {
  text: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  tokensPerSecond: number;
  durationMs: number;
  stopReason: 'max_tokens' | 'stop_sequence' | 'eos' | 'user_stopped';
}

export interface StreamToken {
  token: string;
  done: boolean;
  tokensGenerated: number;
  tokensPerSecond: number;
}

export interface InferenceStats {
  tokensPerSecond: number;
  totalTokensGenerated: number;
  memoryUsageMb: number;
  gpuLayersUsed: number;
  contextUsed: number;
  contextTotal: number;
}

export type GPUBackend = 'metal' | 'cuda' | 'vulkan' | 'cpu';

export interface GPUInfo {
  backend: GPUBackend;
  name: string;
  vramMb: number;
  available: boolean;
}
