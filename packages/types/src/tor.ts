// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

export interface TorConfig {
  enabled: boolean;
  socksPort: number;
  controlPort: number;
  bridgeMode: boolean;
  bridges: string[];
}

export interface TorCircuit {
  nodes: TorNode[];
  createdAt: number;
}

export interface TorNode {
  fingerprint: string;
  nickname: string;
  country: string;
  ip: string;
}

export type TorConnectionStatus = 'disconnected' | 'connecting' | 'bootstrapping' | 'connected' | 'error';

export interface TorStatus {
  connectionStatus: TorConnectionStatus;
  bootstrapProgress: number;
  circuit: TorCircuit | null;
  socksPort: number;
  uptime: number;
  error: string | null;
}
