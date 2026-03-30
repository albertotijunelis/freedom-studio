// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

export { encrypt, decrypt, encryptBuffer, decryptBuffer } from './aes';
export type { EncryptedPayload } from './aes';

export { deriveKey, verifyPassword, generateSalt } from './argon2';
export type { Argon2Options, DerivedKeyResult } from './argon2';

export { generateSelfSignedCert, saveCertToDir, loadCertFromDir } from './tls';
export type { TLSCertPair, TLSGenerateOptions } from './tls';

export { generateApiKey, isValidApiKey, maskApiKey } from './apiKey';

export { hashFile, verifyFileChecksum, hashString } from './hash';

export { generateMTLSCerts, saveMTLSCerts } from './mtls';
export type { MTLSCertSet } from './mtls';

export { generateKey } from './keys';

