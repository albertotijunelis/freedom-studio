// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, it, expect } from 'vitest';
import { generateKey } from '../keys';

describe('Key Generation', () => {
  it('should generate a 32-byte key by default', () => {
    const key = generateKey();
    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32);
  });

  it('should generate a key with custom length', () => {
    const key = generateKey(16);
    expect(key.length).toBe(16);
  });

  it('should generate unique keys', () => {
    const key1 = generateKey();
    const key2 = generateKey();
    expect(key1.toString('hex')).not.toBe(key2.toString('hex'));
  });

  it('should generate cryptographically random data', () => {
    const keys = new Set<string>();
    for (let i = 0; i < 100; i++) {
      keys.add(generateKey().toString('hex'));
    }
    expect(keys.size).toBe(100);
  });
});
