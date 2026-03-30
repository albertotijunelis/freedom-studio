// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

export interface ServerConfig {
  port: number;
  host: string;
  tlsEnabled: boolean;
  mtlsEnabled: boolean;
  certPath: string;
  keyPath: string;
  clientCertPath: string;
}

export interface APIKey {
  id: string;
  key: string;
  name: string;
  createdAt: number;
  lastUsedAt: number | null;
  expiresAt: number | null;
  isActive: boolean;
}

export interface RequestLog {
  id: string;
  timestamp: number;
  method: string;
  endpoint: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  statusCode: number;
  clientIp: string;
  apiKeyId: string;
}

export interface ServerStatus {
  running: boolean;
  port: number;
  tlsEnabled: boolean;
  mtlsEnabled: boolean;
  uptime: number;
  totalRequests: number;
}
