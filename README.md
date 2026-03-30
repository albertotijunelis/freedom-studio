<p align="center">
  <pre align="center">
███████╗██████╗ ███████╗███████╗██████╗  ██████╗ ███╗   ███╗
██╔════╝██╔══██╗██╔════╝██╔════╝██╔══██╗██╔═══██╗████╗ ████║
█████╗  ██████╔╝█████╗  █████╗  ██║  ██║██║   ██║██╔████╔██║
██╔══╝  ██╔══██╗██╔══╝  ██╔══╝  ██║  ██║██║   ██║██║╚██╔╝██║
██║     ██║  ██║███████╗███████╗██████╔╝╚██████╔╝██║ ╚═╝ ██║
╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝╚═════╝  ╚═════╝ ╚═╝     ╚═╝
      ███████╗████████╗██╗   ██╗██████╗ ██╗ ██████╗
      ██╔════╝╚══██╔══╝██║   ██║██╔══██╗██║██╔═══██╗
      ███████╗   ██║   ██║   ██║██║  ██║██║██║   ██║
      ╚════██║   ██║   ██║   ██║██║  ██║██║██║   ██║
      ███████║   ██║   ╚██████╔╝██████╔╝██║╚██████╔╝
      ╚══════╝   ╚═╝    ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝
  </pre>
</p>

<p align="center">
  <strong>Open-source AI model runner. End-to-end encrypted. Tor-powered. No telemetry. No cloud. No trust required.</strong>
</p>

<p align="center">
  <em>The privacy-first alternative to LM Studio — built for people who actually care about freedom.</em>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-00ff88?style=flat-square&logo=gnu" alt="License: GPL-3.0"></a>
  <a href="#"><img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-0a0a0a?style=flat-square&logo=electron&logoColor=00ff88" alt="Platform"></a>
  <a href="#"><img src="https://img.shields.io/badge/status-active%20development-00d4ff?style=flat-square" alt="Status"></a>
  <a href="#"><img src="https://img.shields.io/badge/built%20with-Electron%20%2B%20React-9945ff?style=flat-square&logo=electron" alt="Built with Electron"></a>
  <a href="#"><img src="https://img.shields.io/badge/inference-llama.cpp-ffcc00?style=flat-square" alt="Inference: llama.cpp"></a>
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-00ff88?style=flat-square" alt="PRs Welcome"></a>
</p>

---

## Why Freedom Studio?

**LM Studio** is solid software and a great way to run AI locally. It's partially open-source — the core engine is open, but the app itself is proprietary. If you're running models locally specifically for privacy, having parts you can't fully audit still leaves gaps.

**Freedom Studio** takes a different approach:

| | LM Studio | Freedom Studio |
|---|---|---|
| Source code | Partially open-source | **100% open (GPL-3.0)** |
| Telemetry | Has telemetry (opt-out in settings) | **Zero. None. Ever.** |
| Local encryption | No local encryption | **E2E: TLS + AES-256 + Argon2id** |
| Tor support | No | **Built-in Tor routing** |
| API encryption | HTTP on localhost | **HTTPS + mTLS on localhost** |
| Database | Unencrypted | **SQLCipher (AES-256)** |
| License | Proprietary (app) | **GPL-3.0 — forever free** |
| Price | Free (personal use) | **Free forever (GPL-3.0)** |

> *Your AI. Your hardware. Your data. No exceptions.*

---

## Features

### >> Local AI Inference
- Powered by **llama.cpp** via **node-llama-cpp** — runs 100% on your machine
- GPU acceleration: **CUDA** (NVIDIA), **Metal** (Apple Silicon), **Vulkan** (cross-platform)
- Full parameter control: temperature, top-p, top-k, repeat penalty, context size, batch size
- Streaming token output in real-time

### >> Model Manager
- Browse and download models from **HuggingFace** directly in the app
- Support for **GGUF** and **safetensors** formats
- Import local models via file picker with **SHA-256 checksum verification**
- View model metadata: size, quantization, context length, license
- Disk usage tracking

### >> Chat Interface
- Multi-conversation support with persistent history
- System prompt editor with templates
- **Markdown rendering** with syntax-highlighted code blocks (Shiki)
- Export conversations as Markdown or JSON
- Streaming responses with real-time token display

### >> OpenAI-Compatible API Server
- Drop-in replacement for OpenAI API — works with any client
- Endpoints: `/v1/chat/completions`, `/v1/completions`, `/v1/models`
- Streaming and non-streaming responses
- Per-session API key authentication
- Request logging with latency and token stats

### >> End-to-End Encryption
- **TLS** on the local API server (self-signed cert, auto-generated)
- **mTLS** option — mutual TLS, client cert required
- **AES-256-GCM** encryption for all stored data
- **Argon2id** key derivation from master password
- **SQLCipher** encrypted database for conversations and API keys

### >> Tor Integration
- Route ALL external connections through **Tor** (model downloads, update checks)
- Bundled Tor binary — no external install needed
- Circuit visualization in the UI
- Bridge mode support for censored regions
- Toggle on/off with one click

### >> Black Arch Aesthetic
- Pure black backgrounds, neon green (#00ff88) accents
- Glassmorphism panels with `backdrop-filter: blur(20px)`
- CRT scanline overlay animation
- JetBrains Mono font throughout
- Window transparency (vibrancy on macOS, acrylic on Windows)

---

## Screenshots

> *Screenshots coming soon — the app is in active development.*

`[screenshot: setup wizard]`
`[screenshot: chat interface]`
`[screenshot: model manager]`
`[screenshot: api server panel]`
`[screenshot: settings with tor]`

---

## Quick Start

### Download Installer

> Installers will be available on the [Releases](https://github.com/albertotijunelis/freedom-studio/releases) page once v0.1.0 launches.

| Platform | Format |
|---|---|
| Windows | NSIS installer (`.exe`) |
| macOS | Signed DMG |
| Linux | AppImage, `.deb`, `.rpm` |

### Build from Source

```bash
# Prerequisites: Node.js >= 20.x, pnpm >= 9.x

git clone https://github.com/albertotijunelis/freedom-studio
cd freedom-studio
pnpm install
pnpm dev          # Launch in development mode
```

```bash
pnpm build:win    # Build Windows installer
pnpm build:mac    # Build macOS DMG
pnpm build:linux  # Build Linux packages
```

---

## API Usage

Freedom Studio exposes an **OpenAI-compatible API** on localhost. Use it with any client that supports the OpenAI API format.

### curl

```bash
curl https://localhost:1337/v1/chat/completions \
  -H "Authorization: Bearer fs-YOUR-API-KEY" \
  -H "Content-Type: application/json" \
  --cacert ~/.freedom-studio/tls/cert.pem \
  -d '{
    "model": "your-model.gguf",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'
```

### Python (OpenAI SDK)

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://localhost:1337/v1",
    api_key="fs-YOUR-API-KEY",
    # For self-signed TLS cert:
    http_client=httpx.Client(verify="/path/to/cert.pem")
)

response = client.chat.completions.create(
    model="your-model.gguf",
    messages=[{"role": "user", "content": "Explain quantum computing"}],
    stream=True
)

for chunk in response:
    print(chunk.choices[0].delta.content, end="")
```

---

## Security Architecture

```
User ──[Master Password]──▶ Argon2id KDF ──▶ Encryption Key
                                                    │
                         ┌──────────────────────────┤
                         ▼                          ▼
                   SQLCipher DB              AES-256-GCM
                (conversations,             (API keys,
                 system prompts)             metadata)

Client ──[TLS/mTLS]──▶ Local API Server ──▶ llama.cpp
                              │
                    [Optional Tor Proxy]
                              │
                         Tor Network ──▶ HuggingFace
```

| Layer | Protection |
|---|---|
| Data at rest | SQLCipher (AES-256), Argon2id key derivation |
| API transport | TLS 1.3 with self-signed cert, optional mTLS |
| Network traffic | Tor SOCKS5 proxy for all external connections |
| Model integrity | SHA-256 checksum verification on download |
| Electron | `contextIsolation: true`, `nodeIntegration: false`, CSP enforced |
| IPC | Whitelisted channels only, input validation on every handler |

Full security details: [SECURITY.md](SECURITY.md)

---

## Roadmap

| Status | Feature |
|---|---|
| Done | Electron + React app shell with Black Arch design |
| Done | Setup wizard (master password, TLS cert, GPU detection) |
| Done | Local model manager (scan, list, import, delete) |
| Done | HuggingFace model browser + downloader |
| Done | Chat UI with streaming tokens + markdown |
| Done | OpenAI-compatible HTTPS API server |
| Done | AES-256-GCM + Argon2id encryption |
| Done | TLS/mTLS on local API server |
| Done | SHA-256 model checksum verification |
| In Progress | Tor binary bundling + integration |
| Planned | Plugin/extension system |
| Planned | Model quantization tool (GGUF conversion) |
| Planned | Multi-modal support (vision models) |
| Planned | RAG pipeline (local document Q&A) |
| Planned | Voice input/output |
| Planned | Signed installers + auto-update |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop | Electron 30+ |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS + custom CSS variables |
| State | Zustand |
| Build | Vite + electron-vite |
| Inference | llama.cpp (node-llama-cpp) |
| API Server | Express.js (HTTPS) |
| Encryption | AES-256-GCM, Argon2id, TLS/mTLS |
| Database | SQLite + SQLCipher |
| Tor | Bundled tor binary + socks-proxy-agent |
| Installer | electron-builder |
| Monorepo | Turborepo + pnpm |
| Testing | Vitest + Playwright |

---

## Contributing

We'd love your help! Freedom Studio is a community project. Whether you fix a typo, add a feature, or report a bug — every contribution matters.

Read our [Contributing Guide](CONTRIBUTING.md) to get started.

### Good First Issues
- Bundle Tor binary for all platforms
- Add model quantization/conversion tool
- Plugin system architecture
- Improve GPU detection on Linux
- Add more system prompt templates

---

## License

**GNU General Public License v3.0**

Freedom Studio is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This means Freedom Studio will **always** be open source. No one can take it and make it proprietary. Ever.

See [LICENSE](LICENSE) for the full text.

---

<p align="center">
  <strong>⭐ If Freedom Studio helps you, please star this repo — it helps more people find it.</strong>
</p>

<p align="center">
  <sub>Built with paranoia and love by <a href="mailto:albertotijunelis@gmail.com">Alberto Tijunelis Neto</a></sub><br>
  <sub>Contact: albertotijunelis@gmail.com</sub>
</p>
