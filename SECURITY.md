# Freedom Studio — Security Policy

> Copyright (C) 2026 Alberto Tijunelis Neto. Licensed under GPL-3.0-or-later.

## Reporting a Vulnerability

If you discover a security vulnerability in Freedom Studio, please report it responsibly:

**Email:** albertotijunelis@gmail.com

**Subject line:** `[SECURITY] Freedom Studio — <brief description>`

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

### Response Timeline
- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 7 days
- **Fix release**: Within 30 days for critical issues

### Scope
- Encryption implementation (AES-256-GCM, Argon2id, TLS)
- IPC channel security
- Local API server authentication
- Tor integration
- Electron security (CSP, context isolation, preload)
- Supply chain (dependencies)

### Out of Scope
- Issues in upstream dependencies (report to the upstream project)
- Social engineering
- Physical access attacks
- Denial of service on local machine

## Security Architecture

### Encryption
- **Database (Layer 1)**: Full SQLCipher encryption (AES-256) with random 256-bit key — encrypts schema, data, indexes, WAL
- **Field-level (Layer 2)**: AES-256-GCM encryption on sensitive content (messages, system prompts) when master password is set
- **Key derivation**: Argon2id with 64MB memory cost, 3 iterations, 4 parallelism
- **TLS**: Self-signed certificates for localhost API server
- **mTLS**: Optional mutual TLS for API server authentication

### Electron Hardening
- `contextIsolation: true` — renderer cannot access Node.js APIs
- `nodeIntegration: false` — no require() in renderer
- `webSecurity: true` — same-origin policy enforced
- Content Security Policy on all pages
- IPC channel whitelist in preload script
- External URL navigation restricted to whitelist

### Model Verification
- SHA-256 checksum verification for downloaded models
- Path traversal protection on all file operations

## Supported Versions

| Version | Supported |
|---|---|
| 0.3.x-dev (current) | ✅ |
