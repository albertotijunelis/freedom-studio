# Freedom Studio — Architecture

> Copyright (C) 2026 Alberto Tijunelis Neto. Licensed under GPL-3.0-or-later.

## Overview

Freedom Studio is a local-first, privacy-focused AI model runner built with Electron, React, and llama.cpp. All inference runs 100% locally — no cloud, no telemetry.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Shell                        │
│  ┌─────────────────┐    ┌────────────────────────────┐  │
│  │  Renderer (React)│◄──►│   Main Process (Node.js)   │  │
│  │                  │IPC │                            │  │
│  │  • Chat UI       │    │  ┌──────────────────────┐  │  │
│  │  • Model Manager │    │  │  Inference Engine     │  │  │
│  │  • API Server UI │    │  │  (node-llama-cpp)     │  │  │
│  │  • Settings      │    │  └──────────────────────┘  │  │
│  │  • Setup Wizard  │    │  ┌──────────────────────┐  │  │
│  │                  │    │  │  API Server (Express) │  │  │
│  │  Zustand Stores  │    │  │  HTTPS + TLS          │  │  │
│  │  • appStore      │    │  └──────────────────────┘  │  │
│  │  • inferenceStore│    │  ┌──────────────────────┐  │  │
│  │  • chatStore     │    │  │  Tor Manager          │  │  │
│  │  • modelsStore   │    │  │  (external binary)    │  │  │
│  │  • serverStore   │    │  └──────────────────────┘  │  │
│  │  • torStore      │    │  ┌──────────────────────┐  │  │
│  │  • settingsStore │    │  │  Crypto Manager       │  │  │
│  └─────────────────┘    │  │  SQLCipher+AES-256-GCM │  │  │
│                          │  └──────────────────────┘  │  │
│                          │  ┌──────────────────────┐  │  │
│                          │  │  Database (SQLCipher) │  │  │
│                          │  │  AES-256 + WAL mode   │  │  │
│                          │  └──────────────────────┘  │  │
│                          └────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Monorepo Structure

| Package | Purpose |
|---|---|
| `apps/desktop` | Electron app (main + renderer + preload) |
| `packages/types` | Shared TypeScript interfaces |
| `packages/crypto-core` | Encryption primitives (AES, Argon2, TLS, hashing) |
| `packages/ui` | Reusable design system components |

## IPC Architecture

The renderer communicates with the main process via context-isolated IPC channels:

- **Invoke/Handle**: Request-response (e.g., `inference:load-model`)
- **On/Send**: Event streams (e.g., `inference:stream-token`, `models:download-progress`)

All IPC channels go through a preload script whitelist — only explicitly allowed channels can be used.

## Security Layers

1. **Context Isolation**: `contextIsolation: true`, `nodeIntegration: false`
2. **Content Security Policy**: Strict CSP in production
3. **IPC Whitelist**: Preload script validates all channel names
4. **URL Whitelist**: External navigation restricted to allowed domains
5. **TLS on localhost**: Self-signed certs for the local API server
6. **Encryption at rest**: AES-256-GCM for metadata, Argon2id key derivation
7. **Tor routing**: Optional SOCKS5 proxy for all external connections

## Data Flow

### Chat Flow
1. User types message → ChatStore → IPC `chat:add-message` → SQLite
2. Message sent to InferenceStore → IPC `inference:run`
3. InferenceEngine streams tokens via `inference:stream-token` events
4. Tokens accumulated in store → rendered in real-time
5. Final response saved via IPC `chat:add-message`

### File Save Flow (Code Blocks)
1. User clicks "Save" on a code block in chat → IPC `file:save-dialog`
2. Main process opens native Save dialog with language-aware file extension
3. User picks path → content written to disk via `fs.writeFile`

### Model Loading Flow
1. User selects model → InferenceStore `loadModel()`
2. IPC `inference:load-model` → InferenceEngine → node-llama-cpp
3. Model loaded into VRAM/RAM → ready state returned
4. TopBar updates to show loaded model name
