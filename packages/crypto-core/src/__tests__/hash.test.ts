// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, it, expect } from 'vitest';
import { hashString } from '../hash';

describe('SHA256 Hash', () => {
  it('should produce a consistent hash for the same input', () => {
    const hash1 = hashString('test-input');
    const hash2 = hashString('test-input');
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different inputs', () => {
    const hash1 = hashString('input-a');
    const hash2 = hashString('input-b');
    expect(hash1).not.toBe(hash2);
  });

  it('should return a 64-character hex string', () => {
    const hash = hashString('any input');
    expect(hash).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
  });

  it('should handle empty string', () => {
    const hash = hashString('');
    expect(hash).toHaveLength(64);
    // SHA256 of empty string is well-known
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('should handle unicode strings', () => {
    const hash = hashString('🔒 seguro');
    expect(hash).toHaveLength(64);
  });
});
