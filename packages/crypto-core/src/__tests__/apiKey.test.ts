// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, it, expect } from 'vitest';
import { generateApiKey, isValidApiKey, maskApiKey } from '../apiKey';

describe('API Key', () => {
  it('should generate a key with fs- prefix', () => {
    const key = generateApiKey();
    expect(key.startsWith('fs-')).toBe(true);
  });

  it('should generate a key with correct length (3 prefix + 64 hex chars)', () => {
    const key = generateApiKey();
    expect(key.length).toBe(3 + 64);
  });

  it('should validate a correct key', () => {
    const key = generateApiKey();
    expect(isValidApiKey(key)).toBe(true);
  });

  it('should reject an invalid key prefix', () => {
    expect(isValidApiKey('xx-' + 'a'.repeat(64))).toBe(false);
  });

  it('should reject a key with wrong hex length', () => {
    expect(isValidApiKey('fs-abc')).toBe(false);
  });

  it('should mask a key properly', () => {
    const key = 'fs-abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678';
    const masked = maskApiKey(key);
    expect(masked.startsWith('fs-abc')).toBe(true);
    expect(masked.endsWith('5678')).toBe(true);
    expect(masked).toContain('...');
  });

  it('should generate unique keys', () => {
    const keys = new Set(Array.from({ length: 100 }, () => generateApiKey()));
    expect(keys.size).toBe(100);
  });
});
