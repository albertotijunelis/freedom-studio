// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, it, expect } from 'vitest';
import { generateSelfSignedCert } from '../tls';

describe('TLS Certificate Generation', () => {
  it('should generate a certificate and key', async () => {
    const cert = await generateSelfSignedCert();
    expect(cert).toBeDefined();
    expect(cert.cert).toContain('-----BEGIN CERTIFICATE-----');
    expect(cert.key).toContain('-----BEGIN');
  });

  it('should generate unique certificates each time', async () => {
    const cert1 = await generateSelfSignedCert();
    const cert2 = await generateSelfSignedCert();
    expect(cert1.cert).not.toBe(cert2.cert);
    expect(cert1.key).not.toBe(cert2.key);
  });

  it('should generate certificate with custom validity days', async () => {
    const cert = await generateSelfSignedCert({ validityDays: 30 });
    expect(cert.cert).toContain('-----BEGIN CERTIFICATE-----');
  });
});
