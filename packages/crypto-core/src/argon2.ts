// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { randomBytes } from 'node:crypto';
import { argon2id, argon2Verify } from 'hash-wasm';

const SALT_LENGTH = 32;
const DEFAULT_HASH_LENGTH = 32;
const DEFAULT_MEMORY_COST = 65536; // 64 MB
const DEFAULT_TIME_COST = 3;
const DEFAULT_PARALLELISM = 4;

export interface Argon2Options {
  memoryCost?: number;
  timeCost?: number;
  parallelism?: number;
  hashLength?: number;
}

export interface DerivedKeyResult {
  key: Buffer;
  salt: string;
}

export async function deriveKey(
  password: string,
  salt?: string,
  options: Argon2Options = {}
): Promise<DerivedKeyResult> {
  const saltBuffer = salt
    ? Buffer.from(salt, 'base64')
    : randomBytes(SALT_LENGTH);

  const hashLength = options.hashLength ?? DEFAULT_HASH_LENGTH;
  const memoryCost = options.memoryCost ?? DEFAULT_MEMORY_COST;
  const timeCost = options.timeCost ?? DEFAULT_TIME_COST;
  const parallelism = options.parallelism ?? DEFAULT_PARALLELISM;

  const hashHex = await argon2id({
    password,
    salt: saltBuffer,
    memorySize: memoryCost,
    iterations: timeCost,
    parallelism,
    hashLength,
    outputType: 'hex',
  });

  return {
    key: Buffer.from(hashHex, 'hex'),
    salt: saltBuffer.toString('base64'),
  };
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedKey: Buffer,
  options: Argon2Options = {}
): Promise<boolean> {
  const { key } = await deriveKey(password, salt, options);
  return key.equals(expectedKey);
}

export function generateSalt(): string {
  return randomBytes(SALT_LENGTH).toString('base64');
}
