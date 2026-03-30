// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

export interface EncryptionConfig {
  algorithm: 'aes-256-gcm';
  ivLength: number;
  tagLength: number;
  keyLength: number;
}

export interface KeyDerivationConfig {
  algorithm: 'argon2id';
  memoryCost: number;
  timeCost: number;
  parallelism: number;
  hashLength: number;
  saltLength: number;
}

export interface CertConfig {
  commonName: string;
  organization: string;
  validityDays: number;
  keySize: number;
}

export interface TLSCertInfo {
  certPath: string;
  keyPath: string;
  fingerprint: string;
  validFrom: string;
  validTo: string;
  issuer: string;
  subject: string;
}

export interface MasterPasswordStatus {
  isSet: boolean;
  isUnlocked: boolean;
  lastUnlockedAt: number | null;
}
