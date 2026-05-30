# Spec 000: Xposter Architecture

## Problem
Creators need to publish content to multiple Chinese platforms (公众号, 知乎, B站, 小红书), but each platform has different format requirements and publishing mechanisms. There is no single tool that supports all four platforms with both API-based and browser-automation-based publishing.

## Architecture Decision: Clean Architecture + Plugin Adapters

```
PRESENTATION  (React + Zustand + WXT entrypoints)
     ↓ depends on
APPLICATION   (Use cases + domain services)
     ↓ depends on DOMAIN ports
INFRASTRUCTURE (Chrome APIs, HTTP clients, DOM automation, storage)
     implements ← DOMAIN ports
DOMAIN        (Pure TypeScript — entities, value objects, port interfaces)
     depends on NOTHING
```

### Rationale
- **Testability**: Domain and Application layers can be tested without a browser
- **Extensibility**: Adding a new platform = implementing two interfaces, no core changes
- **Swappability**: Can replace storage backend (chrome.storage → IndexedDB) without touching use cases

## Core Abstractions

### Platform Adapter (Two-Interface Contract)

Every platform implements `IPlatformPublisher` (transport) and provides an `IContentAdapter` (format conversion). These are separate interfaces because:
- Content formatting can be tested independently of publishing
- The same formatting works for both real publish and simulated mode

### Platform Registry (Composition Root)

```typescript
const registry = new Map<PlatformCode, () => IPlatformPublisher>();
// Single point of configuration; the only place that knows concrete classes
```

### Two-Mode Publishing
| Mode | Mechanism | Trigger |
|------|-----------|---------|
| Real (API) | Direct HTTP calls from background | `supportsApi && valid credentials` |
| Real (Content Script) | Open tab → inject script → fill form → submit | No API available or no credentials |
| Simulated | Adapt + validate only, log results | User selects "Simulated" mode |

### Message Protocol
```
Popup ←→ Background ←→ Content Script
```
Typed messages via `chrome.runtime.sendMessage` / `tabs.sendMessage`.

## Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Extension framework | WXT | Modern Manifest V3 DX, TypeScript auto-config, React integration |
| UI | React 19 + Zustand | Lightweight state with chrome.storage persistence |
| Editor | CodeMirror 6 | Small bundle (200KB), extensible Markdown support |
| Markdown parsing | markdown-it | Fast, plugin-architecture, well-maintained |
| Testing | Vitest + jsdom | Vite-native, fast, good ESM support |
| Language | TypeScript (strict) | Compile-time safety for platform-specific edge cases |

## Directory Structure
```
src/
├── entrypoints/      # WXT file-based routing (background, popup, content scripts)
├── domain/           # Pure TS — models, port interfaces, errors
├── application/      # Use cases — depends only on domain ports
├── infrastructure/   # Concrete implementations (API clients, adapters, storage)
├── presentation/     # React UI (components, hooks, stores, styles)
├── shared/           # Constants, shared types, utilities, i18n
├── __tests__/        # Mirrors src/ structure
└── test-utils/       # Chrome API mocks, fixtures
```

## Constraints
- Manifest V3: Service worker is ephemeral (≤30s idle lifetime); use chrome.alarms for keep-alive
- Content scripts run in isolated worlds; cannot share state with page scripts
- Images must be fetched via background worker (CORS bypass)
- API keys stored in chrome.storage.local (never transmitted except to target platform API)
