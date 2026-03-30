// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

export type {
  ModelConfig,
  InferenceParams,
  IPCChannels,
  IPCChannel,
  IPCPayload,
  ElectronAPI
} from './ipc';

export type {
  QuantizationType,
  ModelFormat,
  ModelInfo,
  HuggingFaceModel,
  HuggingFaceFile,
  DownloadProgress,
  DiskUsageInfo
} from './models';

export type {
  InferenceResult,
  StreamToken,
  InferenceStats,
  GPUBackend,
  GPUInfo
} from './inference';

export type {
  Role,
  Message,
  Conversation,
  SystemPrompt,
  Persona,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk
} from './chat';

export type {
  ServerConfig,
  APIKey,
  RequestLog,
  ServerStatus
} from './server';

export type {
  TorConfig,
  TorCircuit,
  TorNode,
  TorConnectionStatus,
  TorStatus
} from './tor';

export type {
  EncryptionConfig,
  KeyDerivationConfig,
  CertConfig,
  TLSCertInfo,
  MasterPasswordStatus
} from './crypto';

export type {
  AppSettings,
  GeneralSettings,
  InferenceSettings,
  SecuritySettings,
  TorSettings,
  AppearanceSettings,
  ThemeConfig
} from './settings';
