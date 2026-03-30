// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

export type QuantizationType =
  | 'Q2_K'
  | 'Q3_K_S'
  | 'Q3_K_M'
  | 'Q3_K_L'
  | 'Q4_0'
  | 'Q4_K_S'
  | 'Q4_K_M'
  | 'Q5_0'
  | 'Q5_K_S'
  | 'Q5_K_M'
  | 'Q6_K'
  | 'Q8_0'
  | 'F16'
  | 'F32';

export type ModelFormat = 'gguf' | 'ggml' | 'safetensors';

export interface ModelInfo {
  id: string;
  name: string;
  fileName: string;
  filePath: string;
  format: ModelFormat;
  size: number;
  quantization: QuantizationType | string;
  contextLength: number;
  parameters: string;
  architecture: string;
  license: string;
  sha256: string;
  addedAt: number;
}

export interface HuggingFaceModel {
  id: string;
  author: string;
  name: string;
  downloads: number;
  likes: number;
  tags: string[];
  lastModified: string;
  files: HuggingFaceFile[];
}

export interface HuggingFaceFile {
  filename: string;
  size: number;
  quantization: string;
  sha256: string;
  downloadUrl: string;
}

export interface DownloadProgress {
  modelId: string;
  fileName: string;
  percent: number;
  downloadedBytes: number;
  totalBytes: number;
  speed: string;
  eta: string;
  status: 'queued' | 'downloading' | 'verifying' | 'completed' | 'failed';
  error?: string;
}

export interface DiskUsageInfo {
  totalBytes: number;
  modelCount: number;
  formattedSize: string;
}
