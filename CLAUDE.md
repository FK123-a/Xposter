# Xposter — Multi-Platform Content Publishing Browser Extension

## Overview
Xposter is a Chrome/Edge browser extension that lets creators write content once in Markdown and publish it to multiple Chinese platforms (微信公众号, 知乎, B站, 小红书) with automatic format adaptation. It uses official APIs where available and browser automation (content script injection) as fallback.

- **Tech Stack**: WXT (Manifest V3), React 19, TypeScript (strict), Zustand, CodeMirror 6, markdown-it
- **Architecture**: Clean Architecture with plugin-based platform adapters
- **Test Framework**: Vitest + jsdom + chrome API mocks

## Quick Start
```bash
npm install
npm run dev        # Start dev server, open chrome://extensions, load unpacked dist/
npm run build      # Production build to dist/
npm test           # Run all tests
npm run test:watch # Watch mode
npm run type-check # TypeScript check (also npm run lint)
```

Load the extension:
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" → select the `dist/` folder

## Repository Map
```
xposter/
├── src/
│   ├── entrypoints/         # WXT file-based routing
│   │   ├── background.ts    # Service worker (orchestrator, API proxy, keep-alive)
│   │   ├── popup/           # Toolbar popup UI
│   │   ├── options/         # Full-page settings
│   │   └── platforms/       # Content scripts injected into target platform pages
│   │
│   ├── domain/              # Pure TS — NO framework or Chrome API dependencies
│   │   ├── models/          # Entities: MarkdownContent, PublishJob, PlatformConfig, etc.
│   │   ├── ports/           # Interfaces: IContentAdapter, IPlatformPublisher, IStorageRepository
│   │   └── errors/          # Domain-specific error classes
│   │
│   ├── application/         # Use cases — depends only on domain ports
│   │   ├── use-cases/       # CreatePublishJob, AdaptContent, ExecutePublish, BatchPublish
│   │   └── services/        # MarkdownParser, ContentTransformer, PublishOrchestrator
│   │
│   ├── infrastructure/      # Concrete implementations of domain ports
│   │   ├── api/             # REST/OAuth clients: WechatMPClient, BilibiliClient
│   │   ├── adapters/        # Platform adapters: WechatMPAdapter, ZhihuAdapter, etc.
│   │   ├── content/         # Markdown to platform format: MarkdownToWechat, MarkdownToRed, etc.
│   │   ├── storage/         # ChromeStorageRepository (chrome.storage wrapper)
│   │   ├── image/           # ImageProcessor (resize, reformat, CORS bypass)
│   │   └── messaging/       # MessageBus, typed message handlers
│   │
│   ├── presentation/        # React UI
│   │   ├── components/      # Editor/, Platform/, Publish/, Settings/, Common/
│   │   ├── hooks/           # useContentStore, usePlatformStore, usePublishStore
│   │   ├── stores/          # Zustand stores with chrome.storage middleware
│   │   └── styles/          # Global CSS, editor styles, platform preview themes
│   │
│   ├── shared/              # constants.ts, types.ts, utils/, i18n/
│   ├── __tests__/           # Mirrors src/ structure
│   └── test-utils/          # Chrome API mocks, test fixtures
│
├── specs/                   # SDD specification documents
├── wxt.config.ts            # Manifest V3 config, permissions, host_permissions
├── vitest.config.ts         # Test configuration
└── vitest.setup.ts          # Global chrome.* API mocks
```

## Architecture (See specs/000-architecture.md for full details)

### Layered Clean Architecture
```
PRESENTATION → APPLICATION → INFRASTRUCTURE (implements DOMAIN ports)
                                   DOMAIN (depends on nothing)
```

### Core Principle: Two-Interface Platform Adapter
Every platform must implement:
- **IPlatformPublisher** — transport (API or content script)
- **IContentAdapter** — format conversion (Markdown → platform format)

Adding a new platform = implement these two interfaces + register in PlatformRegistry.

### Platform Registry (Composition Root)
```typescript
// src/infrastructure/adapters/PlatformRegistry.ts
// The ONLY place that knows about concrete adapter classes.
// All other code references platforms by interface.
```

### Two-Mode Publishing
| Mode | Method | When |
|------|--------|------|
| Real (API) | Direct REST/OAuth from background worker | Platform has API + valid credentials |
| Real (Content Script) | Open tab → inject script → fill form → submit | No API or no credentials |
| Simulated | Adapt + validate only, log results | User toggles "Simulated" mode |

## Development Conventions

### SDD + TDD Workflow
1. **Spec** — Write spec document in `specs/` (Problem, Acceptance Criteria, Domain Types, Errors)
2. **Red** — Write failing test in `src/__tests__/` mirroring source structure
3. **Green** — Minimal implementation to pass the test
4. **Refactor** — Extract shared logic, apply patterns, keep tests green
5. **Spec Review** — Update spec with edge cases discovered during implementation

### Code Style
- TypeScript strict mode enforced (`tsc --noEmit`)
- Import aliases: `@domain/`, `@application/`, `@infrastructure/`, `@presentation/`, `@shared/`
- Domain layer: NO side effects, NO framework imports, pure functions preferred
- Infrastructure layer: implements domain ports, may import Chrome APIs, HTTP clients
- All storage access through `IStorageRepository` interface
- File naming: PascalCase for classes/components, camelCase for functions/instances

### Commit Convention
```
<type>(<scope>): <subject>
```
Types: `feat`, `test`, `refactor`, `docs`, `chore`, `fix`
Scopes: `domain`, `app`, `infra`, `ui`, `spec`

## Adding a New Platform (Step-by-Step)
1. Add `PlatformCode` to `src/shared/constants.ts`
2. Add platform limits to `PLATFORM_LIMITS`
3. Create `MarkdownTo<Platform>.ts` in `src/infrastructure/content/` (implements IContentAdapter)
4. Create `<Platform>Adapter.ts` in `src/infrastructure/adapters/` (implements IPlatformPublisher)
5. Create `<platform>.content.ts` in `src/entrypoints/platforms/` (content script)
6. Register in PlatformRegistry
7. Write spec document in `specs/`
8. Write tests: content adapter + platform adapter + content script
9. Add UI: PlatformSelector checkbox, PreviewPanel tab, PlatformCard

## Testing
```bash
npm test              # Run all tests (unit + integration)
npm run test:watch    # Watch mode for development
npm run test:coverage # With coverage report
```

### Chrome API Mocks
Global mocks initialized in `vitest.setup.ts` cover:
`chrome.storage.local`, `chrome.runtime`, `chrome.tabs`, `chrome.scripting`, `chrome.alarms`

## Platform Knowledge

### 微信公众号
- API: `https://api.weixin.qq.com/cgi-bin/` (requires certified enterprise account post-2025/07)
- Draft → Publish flow: createDraft → uploadImage → publishDraft
- Content format: Rich HTML with inline styles (no external CSS)

### 知乎
- No public publish API → content script injection only
- Editor: Draft.js (contentEditable), topic search + select
- Content format: Markdown-like with LaTeX support

### B站
- API: `https://api.bilibili.com/` (OAuth 2.0)
- Video upload: chunked (≤4GB, ≤5h duration)
- Article publish via content script as fallback

### 小红书
- No public publish API → content script injection only
- Creator page: `creator.xiaohongshu.com/publish/publish`
- Content limits: title ≤20 chars, body ≤1000 chars, hashtag-heavy style
