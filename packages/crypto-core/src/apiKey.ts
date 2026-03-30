// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { randomBytes } from 'node:crypto';

const API_KEY_PREFIX = 'fs-';
const API_KEY_BYTES = 32;

export function generateApiKey(): string {
  const keyBytes = randomBytes(API_KEY_BYTES);
  return `${API_KEY_PREFIX}${keyBytes.toString('hex')}`;
}

export function isValidApiKey(key: string): boolean {
  if (!key.startsWith(API_KEY_PREFIX)) {
    return false;
  }
  const hex = key.slice(API_KEY_PREFIX.length);
  return hex.length === API_KEY_BYTES * 2 && /^[0-9a-f]+$/.test(hex);
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) {
    return '***';
  }
  return key.slice(0, 6) + '...' + key.slice(-4);
}
