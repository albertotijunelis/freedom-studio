// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { platform } from 'node:os';
import type { TorStatus, TorConnectionStatus } from '@freedom-studio/types';

export class TorManager {
  private process: ChildProcess | null = null;
  private connectionStatus: TorConnectionStatus = 'disconnected';
  private bootstrapProgress = 0;
  private socksPort = 9050;
  private controlPort = 9051;
  private startTime = 0;
  private lastError: string | null = null;
  private circuit: { nodes: Array<{ fingerprint: string; nickname: string; country: string; ip: string }> } | null = null;

  async start(socksPort = 9050, controlPort = 9051): Promise<void> {
    if (this.process) {
      throw new Error('Tor is already running');
    }

    this.socksPort = socksPort;
    this.controlPort = controlPort;
    this.connectionStatus = 'connecting';
    this.lastError = null;

    const torBinary = this.getTorBinaryPath();

    if (!torBinary || !existsSync(torBinary)) {
      this.connectionStatus = 'error';
      this.lastError = 'Tor binary not found. Please install Tor or place it in the app directory.';
      throw new Error(this.lastError);
    }

    return new Promise((resolve, reject) => {
      this.process = spawn(torBinary, [
        '--SocksPort', String(this.socksPort),
        '--ControlPort', String(this.controlPort),
        '--DataDirectory', join(process.env.APPDATA || process.env.HOME || '', 'freedom-studio', 'tor-data'),
      ], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const timeout = setTimeout(() => {
        if (this.connectionStatus !== 'connected') {
          this.connectionStatus = 'error';
          this.lastError = 'Tor bootstrap timeout';
          reject(new Error(this.lastError));
        }
      }, 120_000); // 2 min timeout

      this.process.stdout?.on('data', (data: Buffer) => {
        const line = data.toString();

        const bootstrapMatch = line.match(/Bootstrapped (\d+)%/);
        if (bootstrapMatch) {
          this.bootstrapProgress = parseInt(bootstrapMatch[1], 10);
          this.connectionStatus = 'bootstrapping';

          if (this.bootstrapProgress === 100) {
            this.connectionStatus = 'connected';
            this.startTime = Date.now();
            clearTimeout(timeout);
            resolve();
          }
        }
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        const line = data.toString();
        if (line.includes('[err]') || line.includes('[warn]')) {
          this.lastError = line.trim();
        }
      });

      this.process.on('exit', (code) => {
        const wasConnecting = this.connectionStatus !== 'connected';
        this.connectionStatus = 'disconnected';
        this.process = null;
        clearTimeout(timeout);

        if (code !== 0 && code !== null) {
          this.lastError = `Tor exited with code ${code}`;
        }

        // If Tor exited before connecting, reject the promise
        if (wasConnecting) {
          reject(new Error(this.lastError || `Tor exited with code ${code}`));
        }
      });

      this.process.on('error', (err) => {
        this.connectionStatus = 'error';
        this.lastError = err.message;
        this.process = null;
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.process) return;

    return new Promise((resolve) => {
      if (this.process) {
        this.process.on('exit', () => {
          this.process = null;
          this.connectionStatus = 'disconnected';
          this.bootstrapProgress = 0;
          resolve();
        });
        this.process.kill('SIGTERM');

        // Force kill after 5 seconds
        setTimeout(() => {
          if (this.process) {
            this.process.kill('SIGKILL');
          }
        }, 5000);
      } else {
        resolve();
      }
    });
  }

  getStatus(): TorStatus {
    return {
      connectionStatus: this.connectionStatus,
      bootstrapProgress: this.bootstrapProgress,
      circuit: this.circuit ? { ...this.circuit, createdAt: this.startTime } : null,
      socksPort: this.socksPort,
      uptime: this.connectionStatus === 'connected' ? Date.now() - this.startTime : 0,
      error: this.lastError,
    };
  }

  getSocksPort(): number {
    return this.socksPort;
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }

  async getHttpsAgent(): Promise<unknown> {
    if (!this.isConnected()) {
      throw new Error('Tor is not connected');
    }

    const { SocksProxyAgent } = await import('socks-proxy-agent');
    return new SocksProxyAgent(`socks5h://127.0.0.1:${this.socksPort}`);
  }

  private getTorBinaryPath(): string {
    const os = platform();

    const appDir = process.resourcesPath || join(__dirname, '..', '..', '..', '..');

    switch (os) {
      case 'win32':
        return join(appDir, 'tor', 'tor.exe');
      case 'darwin':
        return join(appDir, 'tor', 'tor');
      case 'linux':
        return join(appDir, 'tor', 'tor');
      default:
        return 'tor'; // Fallback to system PATH
    }
  }
}

export const torManager = new TorManager();
