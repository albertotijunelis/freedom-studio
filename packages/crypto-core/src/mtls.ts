// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface MTLSCertSet {
  serverCert: string;
  serverKey: string;
  clientCert: string;
  clientKey: string;
  caCert: string;
  caKey: string;
}

let selfsignedModule: typeof import('selfsigned') | null = null;

async function getSelfsigned(): Promise<typeof import('selfsigned')> {
  if (!selfsignedModule) {
    selfsignedModule = await import('selfsigned');
  }
  return selfsignedModule;
}

export async function generateMTLSCerts(validityDays = 365): Promise<MTLSCertSet> {
  const selfsigned = await getSelfsigned();

  // Generate CA cert
  const caAttrs = [
    { name: 'commonName', value: 'Freedom Studio CA' },
    { name: 'organizationName', value: 'Freedom Studio' },
  ];

  const caPems = await selfsigned.generate(caAttrs, {
    days: validityDays,
    keySize: 2048,
    algorithm: 'sha256',
    extensions: [
      { name: 'basicConstraints', cA: true },
      { name: 'keyUsage', keyCertSign: true, cRLSign: true },
    ],
  } as Record<string, unknown>);

  // Generate server cert
  const serverAttrs = [
    { name: 'commonName', value: 'Freedom Studio Server' },
    { name: 'organizationName', value: 'Freedom Studio' },
  ];

  const serverPems = await selfsigned.generate(serverAttrs, {
    days: validityDays,
    keySize: 2048,
    algorithm: 'sha256',
    extensions: [
      { name: 'subjectAltName', altNames: [
        { type: 2, value: 'localhost' },
        { type: 7, ip: '127.0.0.1' },
        { type: 7, ip: '::1' },
      ]},
    ],
  } as Record<string, unknown>);

  // Generate client cert
  const clientAttrs = [
    { name: 'commonName', value: 'Freedom Studio Client' },
    { name: 'organizationName', value: 'Freedom Studio' },
  ];

  const clientPems = await selfsigned.generate(clientAttrs, {
    days: validityDays,
    keySize: 2048,
    algorithm: 'sha256',
  } as Record<string, unknown>);

  return {
    serverCert: serverPems.cert,
    serverKey: serverPems.private,
    clientCert: clientPems.cert,
    clientKey: clientPems.private,
    caCert: caPems.cert,
    caKey: caPems.private,
  };
}

export function saveMTLSCerts(certDir: string, certs: MTLSCertSet): void {
  mkdirSync(certDir, { recursive: true });

  writeFileSync(join(certDir, 'ca.crt'), certs.caCert, 'utf-8');
  writeFileSync(join(certDir, 'ca.key'), certs.caKey, { encoding: 'utf-8', mode: 0o600 });
  writeFileSync(join(certDir, 'server.crt'), certs.serverCert, 'utf-8');
  writeFileSync(join(certDir, 'server.key'), certs.serverKey, { encoding: 'utf-8', mode: 0o600 });
  writeFileSync(join(certDir, 'client.crt'), certs.clientCert, 'utf-8');
  writeFileSync(join(certDir, 'client.key'), certs.clientKey, { encoding: 'utf-8', mode: 0o600 });
}
