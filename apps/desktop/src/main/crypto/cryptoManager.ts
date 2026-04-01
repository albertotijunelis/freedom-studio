// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { join } from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { app } from 'electron';
import {
  encrypt,
  decrypt,
  generateKey,
  generateApiKey,
  generateSelfSignedCert,
} from '@freedom-studio/crypto-core';
import type { EncryptedPayload, TLSCertPair } from '@freedom-studio/crypto-core';
import type { MasterPasswordStatus, TLSCertInfo } from '@freedom-studio/types';

interface StoredConfig {
  salt: string;
  verificationToken: string; // encrypted known-plaintext to verify password
}

export class CryptoManager {
  private derivedKey: Buffer | null = null;
  private configDir: string;
  private certsDir: string;
  private lastUnlockedAt: number | null = null;
  /** Ephemeral TLS cert/key — generated in memory each launch, never written to disk */
  private ephemeralCert: TLSCertPair | null = null;

  constructor() {
    const userDataPath = app?.getPath?.('userData') || join(process.env.APPDATA || process.env.HOME || '', 'freedom-studio');
    this.configDir = join(userDataPath, 'crypto');
    this.certsDir = join(userDataPath, 'certs');
    mkdirSync(this.configDir, { recursive: true });
    // certsDir kept for potential future CA cert storage (mTLS), but server.key is no longer persisted
    mkdirSync(this.certsDir, { recursive: true });
  }

  async setup(masterPassword: string): Promise<void> {
    // Prevent overwriting existing master password without verification
    if (this.isSetup()) {
      throw new Error('Master password is already set. Use unlock() instead.');
    }

    // Enforce minimum password strength
    if (!masterPassword || masterPassword.trim().length < 8) {
      throw new Error('Master password must be at least 8 characters.');
    }

    const { deriveKey } = await import('@freedom-studio/crypto-core');

    const { key, salt } = await deriveKey(masterPassword);
    this.derivedKey = key;
    this.lastUnlockedAt = Date.now();

    // Store salt and verification token
    const verificationToken = encrypt('freedom-studio-verify', key);

    const config: StoredConfig = {
      salt,
      verificationToken: JSON.stringify(verificationToken),
    };

    const configPath = join(this.configDir, 'master.json');
    writeFileSync(
      configPath,
      JSON.stringify(config, null, 2),
      { encoding: 'utf-8', mode: 0o600 }
    );

    // On Windows, POSIX mode flags are ignored — restrict via icacls
    if (process.platform === 'win32') {
      try {
        const username = process.env.USERNAME || '';
        if (username) {
          execSync(`icacls "${configPath}" /inheritance:r /grant:r "${username}:(R,W)"`, { stdio: 'ignore' });
        }
      } catch {
        // Silent fallback — file is still usable
      }
    }

    // Encrypt the plaintext dbkey now that we have a derived key
    this.encryptDbKeyIfNeeded();
  }

  async unlock(masterPassword: string): Promise<boolean> {
    const configPath = join(this.configDir, 'master.json');

    if (!existsSync(configPath)) {
      throw new Error('Master password not set up. Run setup first.');
    }

    const config: StoredConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
    const { deriveKey } = await import('@freedom-studio/crypto-core');

    const { key } = await deriveKey(masterPassword, config.salt);

    // Verify by decrypting the verification token
    try {
      const verificationPayload: EncryptedPayload = JSON.parse(config.verificationToken);
      const result = decrypt(verificationPayload, key);

      if (result !== 'freedom-studio-verify') {
        return false;
      }

      this.derivedKey = key;
      this.lastUnlockedAt = Date.now();
      return true;
    } catch {
      return false;
    }
  }

  isSetup(): boolean {
    return existsSync(join(this.configDir, 'master.json'));
  }

  isUnlocked(): boolean {
    return this.derivedKey !== null;
  }

  getStatus(): MasterPasswordStatus {
    return {
      isSet: this.isSetup(),
      isUnlocked: this.isUnlocked(),
      lastUnlockedAt: this.lastUnlockedAt,
    };
  }

  lock(): void {
    if (this.derivedKey) {
      this.derivedKey.fill(0);
    }
    this.derivedKey = null;
  }

  encryptData(plaintext: string): EncryptedPayload {
    if (!this.derivedKey) {
      throw new Error('Crypto manager is locked');
    }
    return encrypt(plaintext, this.derivedKey);
  }

  decryptData(payload: EncryptedPayload): string {
    if (!this.derivedKey) {
      throw new Error('Crypto manager is locked');
    }
    return decrypt(payload, this.derivedKey);
  }

  createApiKey(): string {
    return generateApiKey();
  }

  // ─── Database Key Encryption ───

  /**
   * Encrypt the plaintext dbkey file with the derived key (AES-256-GCM).
   * The GCM auth tag provides tamper detection — if the encrypted file is
   * modified on disk, decryption will fail with an authentication error.
   * Called after setup() to protect the dbkey at rest.
   */
  encryptDbKeyIfNeeded(): void {
    if (!this.derivedKey) return;

    const dbKeyPath = join(this.configDir, 'dbkey');
    const encDbKeyPath = join(this.configDir, 'dbkey.enc');

    if (!existsSync(dbKeyPath)) return;  // No plaintext key to encrypt
    if (existsSync(encDbKeyPath)) return; // Already encrypted

    const dbKeyHex = readFileSync(dbKeyPath, 'utf-8').trim();
    const encrypted = encrypt(dbKeyHex, this.derivedKey);
    writeFileSync(encDbKeyPath, JSON.stringify(encrypted), { encoding: 'utf-8', mode: 0o600 });

    // Restrict permissions on Windows
    if (process.platform === 'win32') {
      try {
        const username = process.env.USERNAME || '';
        if (username) {
          execSync(`icacls "${encDbKeyPath}" /inheritance:r /grant:r "${username}:(R,W)"`, { stdio: 'ignore' });
        }
      } catch {
        // Silent fallback
      }
    }

    // Securely delete plaintext key
    unlinkSync(dbKeyPath);
    console.log('[Crypto] Database key encrypted with master password — plaintext key removed');
  }

  /**
   * Decrypt the encrypted dbkey file using the derived key.
   * AES-256-GCM auth tag ensures integrity — tampered files will throw.
   */
  decryptDbKey(): string | null {
    const encDbKeyPath = join(this.configDir, 'dbkey.enc');

    if (!existsSync(encDbKeyPath)) return null;
    if (!this.derivedKey) return null;

    const payload: EncryptedPayload = JSON.parse(readFileSync(encDbKeyPath, 'utf-8'));
    return decrypt(payload, this.derivedKey);
  }

  /**
   * Check whether the dbkey is stored in encrypted form.
   */
  hasEncryptedDbKey(): boolean {
    return existsSync(join(this.configDir, 'dbkey.enc'));
  }

  async generateTLSCert(): Promise<TLSCertInfo> {
    // Generate ephemeral TLS cert in memory — never touches disk
    const certPair = await generateSelfSignedCert({
      commonName: 'Freedom Studio Local',
      organization: 'Freedom Studio',
      validityDays: 1, // Ephemeral — regenerated each launch
    });

    this.ephemeralCert = certPair;

    return {
      certPath: '', // Not on disk
      keyPath: '',  // Not on disk
      fingerprint: certPair.fingerprint,
      validFrom: certPair.validFrom,
      validTo: certPair.validTo,
      issuer: 'Freedom Studio',
      subject: 'Freedom Studio Local',
    };
  }

  /**
   * Get the ephemeral TLS cert/key as PEM strings for use in HTTPS server options.
   * Returns null if no cert has been generated yet.
   */
  getEphemeralTLSCert(): { cert: string; key: string } | null {
    if (!this.ephemeralCert) return null;
    return { cert: this.ephemeralCert.cert, key: this.ephemeralCert.key };
  }

  getTLSCertPaths(): { certPath: string; keyPath: string } | null {
    // Legacy — check for old on-disk certs to allow migration/cleanup
    const certPath = join(this.certsDir, 'server.crt');
    const keyPath = join(this.certsDir, 'server.key');

    if (existsSync(certPath) && existsSync(keyPath)) {
      return { certPath, keyPath };
    }

    return null;
  }

  getCertsDir(): string {
    return this.certsDir;
  }
}

export const cryptoManager = new CryptoManager();
