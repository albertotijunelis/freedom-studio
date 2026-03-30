# Contributing to Freedom Studio

> **Freedom Studio is built by people who believe privacy isn't optional.**
> Every contribution — from fixing a typo to implementing a feature — makes the world a little more free. Thank you for being here.

---

## Our Philosophy

Freedom Studio exists because we believe:

1. **AI should run locally.** Your prompts, your models, your hardware — no cloud required.
2. **Privacy is a right, not a feature.** Zero telemetry. Zero tracking. Zero trust needed.
3. **Open source is non-negotiable.** GPL-3.0 ensures this project stays free forever.
4. **Security by default.** Every connection encrypted. Every file verified. Every input validated.

If you share these values, you're already one of us.

---

## Getting Started

### Prerequisites

- **Node.js** >= 20.x
- **pnpm** >= 9.x (we do NOT use npm or yarn)
- **Git**

### Setup

```bash
# Fork the repo on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/freedom-studio
cd freedom-studio
pnpm install
pnpm dev          # Launches the Electron app in dev mode
```

### Project Structure

```
freedom-studio/
├── apps/desktop/          # Electron app (main + renderer)
│   └── src/
│       ├── main/          # Main process: inference, server, tor, crypto, IPC
│       └── renderer/      # React UI: pages, components, stores, styles
├── packages/
│   ├── types/             # Shared TypeScript types
│   ├── crypto-core/       # Encryption primitives (AES, Argon2id, TLS)
│   └── ui/                # Shared design system components
└── docs/                  # Developer documentation
```

For the complete architecture, read [ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## How to Contribute

### 1. Find Something to Work On

- Check the [Issues](https://github.com/albertotijunelis/freedom-studio/issues) page
- Look for labels: `good first issue`, `help wanted`, `security`, `enhancement`
- Or pick from the list below

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Write Code

Follow the coding standards below. Every new file needs the GPL header.

### 4. Test

```bash
pnpm test          # Run all tests
pnpm typecheck     # TypeScript type checking
```

### 5. Submit a Pull Request

- Push your branch and open a PR against `main`
- Fill in the PR template
- Wait for review — we aim to respond within 48 hours

---

## Good First Issues

These are great starting points if you're new to the project:

| Issue | Difficulty | Area |
|---|---|---|
| Bundle Tor binary for all platforms | Medium | Build/Tor |
| Add more system prompt templates | Easy | UI/Chat |
| Improve GPU detection on Linux | Medium | Inference |
| Add model format conversion (safetensors -> GGUF) | Hard | Inference |
| Plugin/extension system architecture | Hard | Core |
| Dark mode variants (different accent colors) | Easy | UI |
| Add conversation search/filter | Medium | UI/Chat |
| Keyboard shortcuts for common actions | Easy | UI |
| Model download queue (multiple simultaneous) | Medium | Models |
| Add request rate limiting to API server | Medium | Server/Security |

---

## Coding Standards

### TypeScript
- `"strict": true` — no exceptions
- **No `any` types** — use `unknown` and narrow with type guards
- All async functions must handle errors (try/catch or `.catch()`)
- Prefer `interface` over `type` for object shapes

### React
- Functional components only — no class components
- Custom hooks for all business logic (no logic in components)
- `zustand` for global state, `useState` for UI-only state

### File Naming
| Type | Convention | Example |
|---|---|---|
| Components | PascalCase | `ModelCard.tsx` |
| Hooks | useCamelCase | `useInference.ts` |
| Stores | camelCaseStore | `chatStore.ts` |
| Utils | camelCase | `formatBytes.ts` |
| IPC handlers | camelCaseHandler | `modelsHandler.ts` |

### Security Rules
- **Never** log passwords, API keys, or conversation content in production
- **Always** validate and sanitize inputs before passing to llama.cpp or the file system
- **Always** use `path.join` and verify paths are within allowed directories
- Electron: `contextIsolation: true`, `nodeIntegration: false`, preload scripts for IPC
- Content Security Policy on all renderer windows

### GPL Header (Required on Every File)

```typescript
// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later
```

---

## Pull Request Checklist

Before submitting, make sure:

- [ ] Code follows the coding standards above
- [ ] Tests added or updated for new functionality
- [ ] No `any` types introduced
- [ ] GPL-3.0 header present on all new files
- [ ] No sensitive data logged
- [ ] Security implications considered and documented
- [ ] Builds successfully: `pnpm build`
- [ ] Type check passes: `pnpm typecheck`

---

## Reporting Issues

### Bug Reports
Use the **Bug Report** template. Include:
- Steps to reproduce
- Expected vs actual behavior
- Operating system and version
- Screenshots if applicable

### Feature Requests
Use the **Feature Request** template. Include:
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

### Security Vulnerabilities
**Do NOT open a public issue.** Email [albertotijunelis@gmail.com](mailto:albertotijunelis@gmail.com) directly.
See [SECURITY.md](SECURITY.md) for our full security policy.

---

## Code of Conduct

We are committed to creating a welcoming, inclusive community. By participating, you agree to:

- **Be respectful.** Disagreements are fine; personal attacks are not.
- **Be constructive.** Criticism should be actionable and kind.
- **Be inclusive.** We welcome contributors of all backgrounds and skill levels.
- **Be patient.** Everyone is learning. Help each other grow.
- **No harassment, discrimination, or hate speech.** Zero tolerance. Period.

Violations can be reported to [albertotijunelis@gmail.com](mailto:albertotijunelis@gmail.com).

---

## License

By contributing to Freedom Studio, you agree that your contributions will be licensed under the **GNU General Public License v3.0 (GPL-3.0-or-later)**.

This means your code will always remain free and open source. That's the whole point.

---

<p align="center">
  <strong>Thank you for helping build something that matters.</strong><br>
  <sub>— Alberto Tijunelis Neto</sub>
</p>
