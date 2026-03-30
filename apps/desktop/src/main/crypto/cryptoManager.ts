// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { join } from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { app } from 'electron';
import {
  encrypt,
  decrypt,
  generateKey,
  generateApiKey,
  generateSelfSignedCert,
  saveCertToDir,
  loadCertFromDir,
} from '@freedom-studio/crypto-core';
import type { EncryptedPayload } from '@freedom-studio/crypto-core';
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

  constructor() {
    const userDataPath = app?.getPath?.('userData') || join(process.env.APPDATA || process.env.HOME || '', 'freedom-studio');
    this.configDir = join(userDataPath, 'crypto');
    this.certsDir = join(userDataPath, 'certs');
    mkdirSync(this.configDir, { recursive: true });
    mkdirSync(this.certsDir, { recursive: true });
  }

  async setup(masterPassword: string): Promise<void> {
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

    writeFileSync(
      join(this.configDir, 'master.json'),
      JSON.stringify(config, null, 2),
      'utf-8'
    );
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

  async generateTLSCert(): Promise<TLSCertInfo> {
    const certPair = await generateSelfSignedCert({
      commonName: 'Freedom Studio Local',
      organization: 'Freedom Studio',
      validityDays: 365,
    });

    const { certPath, keyPath } = saveCertToDir(this.certsDir, certPair);

    return {
      certPath,
      keyPath,
      fingerprint: certPair.fingerprint,
      validFrom: certPair.validFrom,
      validTo: certPair.validTo,
      issuer: 'Freedom Studio',
      subject: 'Freedom Studio Local',
    };
  }

  getTLSCertPaths(): { certPath: string; keyPath: string } | null {
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
