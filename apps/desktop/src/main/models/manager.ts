// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { readdir, stat, unlink, copyFile } from 'node:fs/promises';
import { join, extname, basename, resolve, sep } from 'node:path';
import { createReadStream, createWriteStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { hashFile, verifyFileChecksum } from '@freedom-studio/crypto-core';
import type { ModelInfo, DownloadProgress, DiskUsageInfo } from '@freedom-studio/types';

const SUPPORTED_EXTENSIONS = ['.gguf', '.ggml'];

function isWithinDirectory(filePath: string, directory: string): boolean {
  const resolvedPath = resolve(filePath);
  const resolvedDir = resolve(directory);
  return resolvedPath === resolvedDir || resolvedPath.startsWith(resolvedDir + sep);
}

export class ModelManager {
  private modelsDir: string;
  private activeDownloads = new Map<string, AbortController>();

  constructor(modelsDir: string) {
    this.modelsDir = modelsDir;
    if (!existsSync(modelsDir)) {
      mkdirSync(modelsDir, { recursive: true });
    }
  }

  async scanLocalModels(): Promise<ModelInfo[]> {
    const models: ModelInfo[] = [];

    try {
      const files = await readdir(this.modelsDir);

      for (const file of files) {
        const ext = extname(file).toLowerCase();
        if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;

        const filePath = join(this.modelsDir, file);
        const fileStat = await stat(filePath);

        if (!fileStat.isFile()) continue;

        models.push({
          id: file,
          name: basename(file, ext),
          fileName: file,
          filePath,
          format: ext === '.gguf' ? 'gguf' : 'ggml',
          size: fileStat.size,
          quantization: this.detectQuantization(file),
          contextLength: 4096,
          parameters: 'Unknown',
          architecture: 'Unknown',
          license: 'Unknown',
          sha256: '',
          addedAt: fileStat.mtimeMs,
        });
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    return models.sort((a, b) => b.addedAt - a.addedAt);
  }

  async getModelInfo(filePath: string): Promise<ModelInfo | null> {
    if (!isWithinDirectory(filePath, this.modelsDir)) {
      throw new Error('Access denied: path outside models directory');
    }

    try {
      const fileStat = await stat(filePath);
      const fileName = basename(filePath);
      const ext = extname(fileName).toLowerCase();

      return {
        id: fileName,
        name: basename(fileName, ext),
        fileName,
        filePath,
        format: ext === '.gguf' ? 'gguf' : 'ggml',
        size: fileStat.size,
        quantization: this.detectQuantization(fileName),
        contextLength: 4096,
        parameters: 'Unknown',
        architecture: 'Unknown',
        license: 'Unknown',
        sha256: '',
        addedAt: fileStat.mtimeMs,
      };
    } catch {
      return null;
    }
  }

  async downloadModel(
    url: string,
    fileName: string,
    onProgress: (progress: DownloadProgress) => void,
    proxyAgent?: unknown
  ): Promise<string> {
    const filePath = join(this.modelsDir, fileName);

    if (!isWithinDirectory(filePath, this.modelsDir)) {
      throw new Error('Access denied: invalid filename');
    }

    const controller = new AbortController();
    this.activeDownloads.set(fileName, controller);

    try {
      const fetchOptions: RequestInit = {
        signal: controller.signal,
      };

      if (proxyAgent) {
        (fetchOptions as Record<string, unknown>).agent = proxyAgent;
      }

      // Validate URL scheme to prevent SSRF
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        throw new Error('Invalid download URL');
      }
      if (parsedUrl.protocol !== 'https:') {
        throw new Error('Only HTTPS downloads are allowed');
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new Error(`Download failed: HTTP ${response.status}`);
      }

      const totalBytes = Number(response.headers.get('content-length') || 0);
      let downloadedBytes = 0;
      const startTime = Date.now();

      const fileStream = createWriteStream(filePath);
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const buf = Buffer.from(value);
        const canContinue = fileStream.write(buf);
        downloadedBytes += value.byteLength;

        // Handle backpressure — wait for drain if write buffer is full
        if (!canContinue) {
          await new Promise<void>((r) => fileStream.once('drain', r));
        }

        const elapsed = (Date.now() - startTime) / 1000;
        const speed = elapsed > 0 ? downloadedBytes / elapsed : 0;
        const remaining = speed > 0 ? (totalBytes - downloadedBytes) / speed : 0;

        onProgress({
          modelId: fileName,
          fileName,
          percent: totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0,
          downloadedBytes,
          totalBytes,
          speed: this.formatSpeed(speed),
          eta: this.formatTime(remaining),
          status: 'downloading',
        });
      }

      await new Promise<void>((resolve, reject) => {
        fileStream.end((err?: Error) => (err ? reject(err) : resolve()));
      });

      onProgress({
        modelId: fileName,
        fileName,
        percent: 100,
        downloadedBytes: totalBytes,
        totalBytes,
        speed: '0 B/s',
        eta: '0s',
        status: 'verifying',
      });

      return filePath;
    } catch (err) {
      // Clean up partial file on failed download
      try { await unlink(filePath); } catch { /* ignore if file doesn't exist */ }
      throw err;
    } finally {
      this.activeDownloads.delete(fileName);
    }
  }

  cancelDownload(fileName: string): void {
    const controller = this.activeDownloads.get(fileName);
    if (controller) {
      controller.abort();
      this.activeDownloads.delete(fileName);
    }
  }

  async deleteModel(modelId: string): Promise<void> {
    const filePath = join(this.modelsDir, modelId);

    if (!isWithinDirectory(filePath, this.modelsDir)) {
      throw new Error('Access denied: path outside models directory');
    }

    // Cancel any active download for this file first
    this.cancelDownload(modelId);

    // Wait briefly for the download stream to close after abort
    await new Promise((r) => setTimeout(r, 200));

    // Retry delete in case the file handle is still closing
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await unlink(filePath);
        return;
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === 'EBUSY' || code === 'EPERM') {
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
        throw err;
      }
    }

    throw new Error('File is still in use. Please wait for the download to finish or try again.');
  }

  async verifyChecksum(filePath: string, expectedHash: string): Promise<boolean> {
    if (!isWithinDirectory(filePath, this.modelsDir)) {
      throw new Error('Access denied: path outside models directory');
    }

    return verifyFileChecksum(filePath, expectedHash);
  }

  async getDiskUsage(): Promise<DiskUsageInfo> {
    const models = await this.scanLocalModels();
    const totalBytes = models.reduce((sum, m) => sum + m.size, 0);

    return {
      totalBytes,
      modelCount: models.length,
      formattedSize: this.formatSize(totalBytes),
    };
  }

  getModelsDir(): string {
    return this.modelsDir;
  }

  setModelsDir(dir: string): void {
    this.modelsDir = dir;
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  async importModel(
    sourcePath: string,
    onProgress: (progress: { fileName: string; percent: number; status: 'copying' | 'verifying' | 'completed' | 'failed' }) => void,
  ): Promise<ModelInfo> {
    const fileName = basename(sourcePath);
    const ext = extname(fileName).toLowerCase();

    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      throw new Error(`Unsupported file format: ${ext}. Only .gguf and .ggml files are supported.`);
    }

    const destPath = join(this.modelsDir, fileName);

    if (!isWithinDirectory(destPath, this.modelsDir)) {
      throw new Error('Access denied: invalid filename');
    }

    if (existsSync(destPath)) {
      throw new Error(`A model with the name "${fileName}" already exists.`);
    }

    const sourceStat = statSync(sourcePath);
    const totalBytes = sourceStat.size;

    // Copy with progress via streams
    await new Promise<void>((resolve, reject) => {
      const readStream = createReadStream(sourcePath);
      const writeStream = createWriteStream(destPath);
      let copiedBytes = 0;

      readStream.on('data', (chunk: Buffer) => {
        copiedBytes += chunk.length;
        const percent = totalBytes > 0 ? (copiedBytes / totalBytes) * 100 : 0;
        onProgress({ fileName, percent, status: 'copying' });
      });

      readStream.on('error', (err) => {
        writeStream.destroy();
        reject(err);
      });

      writeStream.on('error', (err) => {
        readStream.destroy();
        reject(err);
      });

      writeStream.on('finish', () => resolve());

      readStream.pipe(writeStream);
    });

    // SHA256 verification
    onProgress({ fileName, percent: 100, status: 'verifying' });
    const sha256 = await hashFile(destPath);

    onProgress({ fileName, percent: 100, status: 'completed' });

    const fileStat = await stat(destPath);
    return {
      id: fileName,
      name: basename(fileName, ext),
      fileName,
      filePath: destPath,
      format: ext === '.gguf' ? 'gguf' : 'ggml',
      size: fileStat.size,
      quantization: this.detectQuantization(fileName),
      contextLength: 4096,
      parameters: 'Unknown',
      architecture: 'Unknown',
      license: 'Unknown',
      sha256,
      addedAt: fileStat.mtimeMs,
    };
  }

  private detectQuantization(fileName: string): string {
    const upper = fileName.toUpperCase();
    const quantPatterns = [
      'IQ1_S', 'IQ1_M', 'IQ2_XXS', 'IQ2_XS', 'IQ2_S', 'IQ2_M',
      'IQ3_XXS', 'IQ3_XS', 'IQ3_S', 'IQ3_M',
      'IQ4_NL', 'IQ4_XS',
      'Q2_K', 'Q3_K_S', 'Q3_K_M', 'Q3_K_L',
      'Q4_0', 'Q4_K_S', 'Q4_K_M',
      'Q5_0', 'Q5_K_S', 'Q5_K_M',
      'Q6_K', 'Q8_0', 'F16', 'F32',
    ];

    for (const pattern of quantPatterns) {
      if (upper.includes(pattern)) return pattern;
    }

    return 'Unknown';
  }

  private formatSpeed(bytesPerSecond: number): string {
    if (bytesPerSecond < 1024) return `${Math.round(bytesPerSecond)} B/s`;
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    if (bytesPerSecond < 1024 * 1024 * 1024) return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
    return `${(bytesPerSecond / (1024 * 1024 * 1024)).toFixed(2)} GB/s`;
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  private formatTime(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }
}
