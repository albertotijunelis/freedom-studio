// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, encryptBuffer, decryptBuffer } from '../aes';
import { generateKey } from '../keys';

describe('AES-256-GCM', () => {
  it('should encrypt and decrypt a string round trip', () => {
    const key = generateKey();
    const plaintext = 'Hello, Freedom Studio!';

    const encrypted = encrypt(plaintext, key);
    const decrypted = decrypt(encrypted, key);

    expect(decrypted).toBe(plaintext);
  });

  it('should encrypt and decrypt an empty string', () => {
    const key = generateKey();
    const plaintext = '';

    const encrypted = encrypt(plaintext, key);
    const decrypted = decrypt(encrypted, key);

    expect(decrypted).toBe(plaintext);
  });

  it('should encrypt and decrypt a large payload', () => {
    const key = generateKey();
    const plaintext = 'A'.repeat(100_000);

    const encrypted = encrypt(plaintext, key);
    const decrypted = decrypt(encrypted, key);

    expect(decrypted).toBe(plaintext);
  });

  it('should encrypt and decrypt unicode content', () => {
    const key = generateKey();
    const plaintext = '🔐 Criptografia é essencial! 日本語テスト àáâ';

    const encrypted = encrypt(plaintext, key);
    const decrypted = decrypt(encrypted, key);

    expect(decrypted).toBe(plaintext);
  });

  it('should produce different ciphertexts for the same plaintext (unique IVs)', () => {
    const key = generateKey();
    const plaintext = 'Same text twice';

    const encrypted1 = encrypt(plaintext, key);
    const encrypted2 = encrypt(plaintext, key);

    expect(encrypted1.iv).not.toBe(encrypted2.iv);
    expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
  });

  it('should throw on wrong key', () => {
    const key1 = generateKey();
    const key2 = generateKey();
    const plaintext = 'Secret data';

    const encrypted = encrypt(plaintext, key1);

    expect(() => decrypt(encrypted, key2)).toThrow();
  });

  it('should throw on tampered ciphertext', () => {
    const key = generateKey();
    const plaintext = 'Integrity check';

    const encrypted = encrypt(plaintext, key);
    // Tamper with ciphertext
    const tampered = Buffer.from(encrypted.ciphertext, 'base64');
    tampered[0] ^= 0xff;
    encrypted.ciphertext = tampered.toString('base64');

    expect(() => decrypt(encrypted, key)).toThrow();
  });

  it('should throw on tampered auth tag', () => {
    const key = generateKey();
    const plaintext = 'Tag check';

    const encrypted = encrypt(plaintext, key);
    const tampered = Buffer.from(encrypted.tag, 'base64');
    tampered[0] ^= 0xff;
    encrypted.tag = tampered.toString('base64');

    expect(() => decrypt(encrypted, key)).toThrow();
  });

  it('should reject a key with wrong length', () => {
    const shortKey = Buffer.alloc(16);
    expect(() => encrypt('test', shortKey)).toThrow('32-byte key');
  });

  it('should encrypt and decrypt buffers', () => {
    const key = generateKey();
    const data = Buffer.from('binary data test 🔒');

    const { iv, tag, ciphertext } = encryptBuffer(data, key);
    const decrypted = decryptBuffer(ciphertext, key, iv, tag);

    expect(decrypted.equals(data)).toBe(true);
  });
});
