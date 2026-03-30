// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

export async function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);

    stream.on('data', (chunk: Buffer) => {
      hash.update(chunk);
    });

    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });

    stream.on('error', (err: Error) => {
      reject(err);
    });
  });
}

export async function verifyFileChecksum(filePath: string, expectedHash: string): Promise<boolean> {
  const computedHash = await hashFile(filePath);
  return computedHash.toLowerCase() === expectedHash.toLowerCase();
}

export function hashString(input: string): string {
  return createHash('sha256').update(input, 'utf-8').digest('hex');
}
