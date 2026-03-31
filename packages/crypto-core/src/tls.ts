// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

export interface TLSCertPair {
  cert: string;
  key: string;
  fingerprint: string;
  validFrom: string;
  validTo: string;
}

export interface TLSGenerateOptions {
  commonName?: string;
  organization?: string;
  validityDays?: number;
  keySize?: number;
}

let selfsignedModule: typeof import('selfsigned') | null = null;

async function getSelfsigned(): Promise<typeof import('selfsigned')> {
  if (!selfsignedModule) {
    selfsignedModule = await import('selfsigned');
  }
  return selfsignedModule;
}

export async function generateSelfSignedCert(options: TLSGenerateOptions = {}): Promise<TLSCertPair> {
  const selfsigned = await getSelfsigned();

  const attrs = [
    { name: 'commonName', value: options.commonName ?? 'Freedom Studio Local' },
    { name: 'organizationName', value: options.organization ?? 'Freedom Studio' },
  ];

  const validityDays = options.validityDays ?? 365;
  const keySize = options.keySize ?? 2048;

  const pems = await selfsigned.generate(attrs, {
    days: validityDays,
    keySize,
    algorithm: 'sha256',
    extensions: [
      { name: 'subjectAltName', altNames: [
        { type: 2, value: 'localhost' },
        { type: 7, ip: '127.0.0.1' },
        { type: 7, ip: '::1' },
      ]},
    ],
  } as Record<string, unknown>);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

  // Extract fingerprint from cert
  const { createHash } = await import('node:crypto');
  const certDer = Buffer.from(
    pems.cert.replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\s/g, ''),
    'base64'
  );
  const fingerprint = createHash('sha256').update(certDer).digest('hex')
    .match(/.{2}/g)!.join(':').toUpperCase();

  return {
    cert: pems.cert,
    key: pems.private,
    fingerprint,
    validFrom: now.toISOString(),
    validTo: expiresAt.toISOString(),
  };
}

export function saveCertToDir(certDir: string, certPair: TLSCertPair): { certPath: string; keyPath: string } {
  mkdirSync(certDir, { recursive: true, mode: 0o700 });

  const certPath = join(certDir, 'server.crt');
  const keyPath = join(certDir, 'server.key');

  writeFileSync(certPath, certPair.cert, { encoding: 'utf-8', mode: 0o644 });
  writeFileSync(keyPath, certPair.key, { encoding: 'utf-8', mode: 0o600 });

  return { certPath, keyPath };
}

export function loadCertFromDir(certDir: string): TLSCertPair | null {
  const certPath = join(certDir, 'server.crt');
  const keyPath = join(certDir, 'server.key');

  if (!existsSync(certPath) || !existsSync(keyPath)) {
    return null;
  }

  const cert = readFileSync(certPath, 'utf-8');
  const key = readFileSync(keyPath, 'utf-8');

  return { cert, key, fingerprint: '', validFrom: '', validTo: '' };
}
