# Xposter

Multi-platform content publishing browser extension. Write once in Markdown, publish everywhere.

## Supported Platforms

| Platform | Publish Method | Status |
|----------|---------------|--------|
| 微信公众号 (WeChat MP) | Official API + Content Script fallback | Planned |
| 知乎 (Zhihu) | Content Script injection | Planned |
| B站 (Bilibili) | Official API + Content Script | Planned |
| 小红书 (RED) | Content Script injection | Planned |

## Quick Start

```bash
git clone https://github.com/FK123-a/Xposter.git
cd Xposter
npm install
npm run dev
```

Load in Chrome/Edge:
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" → select the `dist/` folder

## Features

- **Write Once**: Compose content in Markdown with live preview
- **Auto-Adapt**: Content automatically re-formatted per platform (length limits, style, image constraints)
- **One-Click Publish**: Select platforms, click publish, see progress in real-time
- **Simulated Mode**: Test the full pipeline without actually publishing — validates content format, checks auth, logs everything
- **Extensible**: Add a new platform by implementing two TypeScript interfaces

## Architecture

Clean Architecture with plugin-based platform adapters.

```
Presentation (React + Zustand)
    → Application (Use cases)
        → Domain (Port interfaces)
            ← Infrastructure (Chrome APIs, HTTP, DOM automation)
```

Each platform implements two interfaces:
- `IPlatformPublisher` — transport (API or content script injection)
- `IContentAdapter` — Markdown → platform-specific format

See [CLAUDE.md](./CLAUDE.md) for full documentation and development conventions.

## Tech Stack & Dependencies

### Runtime Dependencies

| Library | Version | Purpose | Why Chosen |
|---------|---------|---------|------------|
| react | ^19.x | UI framework | Largest ecosystem, WXT native support, hooks model fits our state architecture |
| react-dom | ^19.x | DOM renderer | Required by React for browser rendering |
| zustand | ^5.x | State management | Minimal boilerplate (~1KB), native chrome.storage middleware, excellent React hooks integration. Chosen over Redux (too heavy for extension) and Jotai (less mature storage persistence). |

### Development Dependencies

| Library | Version | Purpose | Why Chosen |
|---------|---------|---------|------------|
| wxt | ^0.20.x | Extension framework | Best-in-class Manifest V3 DX, auto-generates manifest.json, TypeScript + React integration, HMR for extension development |
| typescript | ^5.x | Type checking | Strict mode catches platform-specific edge cases at compile time |
| vitest | ^4.x | Test framework | Vite-native (fast startup), ESM-first, compatible with WXT's build pipeline, snapshot support |
| @testing-library/react | latest | Component testing | Industry standard for React component tests, encourages testing user behavior not implementation |
| @testing-library/jest-dom | latest | DOM matchers | Provides `.toBeInTheDocument()`, `.toHaveTextContent()` and other semantic assertions |
| jsdom | latest | DOM simulation | Needed by vitest for testing DOM manipulation code (content adapters, content scripts) |
| vitest-chrome | latest | Chrome API mocks | Provides `chrome.storage`, `chrome.runtime`, `chrome.tabs`, `chrome.scripting` mocks for testing without a real browser |

### Bundled via WXT (No Direct Install Required)

| Library | Purpose |
|---------|---------|
| @wxt-dev/module-react | React integration for WXT, auto-configures JSX transform and HMR |

### Future Dependencies (Phase 2+)

| Library | Purpose | Why |
|---------|---------|-----|
| @codemirror/view, @codemirror/state, @codemirror/lang-markdown | Markdown editor | Chosen over Monaco (200KB vs 2MB+), sufficient for Markdown, better extension model for custom platform previews |
| markdown-it | Markdown parsing | Faster than unified/remark, simpler plugin system, well-maintained, used by 11ty and other static site generators |

## Original Features

This project's core original implementations include:

1. **Dual-Mode Platform Adapter Pattern**: A two-interface contract (`IPlatformPublisher` + `IContentAdapter`) that separates format conversion from publishing transport, enabling independent testing and platform-agnostic content adaptation.

2. **Platform-Specific Content Adaptation Pipeline**: Custom Markdown-to-platform-format transformers that handle each platform's unique constraints (e.g., 小红书 20-char title limit, 公众号 inline CSS requirements, 知乎 LaTeX preservation, B站 description format).

3. **Hybrid Publishing Strategy**: Automatic routing between official REST APIs (for platforms that support them) and content script DOM injection (for platforms without APIs), with a unified progress-reporting interface.

4. **Content Script Injection Framework**: Reusable DOM interaction primitives (`observeElement`, `fillRichTextViaPaste`, `uploadImageViaDataTransfer`) that work across Draft.js, contentEditable, and custom rich text editors used by Chinese platforms.

5. **Simulated Publish Mode**: A full-content-pipeline dry-run mode that validates formats, checks credentials, and logs results without actually publishing — enabling safe testing and content verification.

6. **Extensible Platform Registry**: A composition-root pattern that maps platform codes to adapter factories, allowing new platforms to be added by implementing two interfaces and registering one line — no core code changes needed.

## Code Source Declaration

All code in this repository is original implementation created specifically for the Xposter project. No third-party code has been copied or adapted. Algorithmic approaches (e.g., Clean Architecture layering, adapter pattern, observer pattern for DOM element detection) are standard software engineering patterns and are not derived from any specific codebase.

Reference projects consulted for platform behavior understanding (no code reused):
- PostBot (gitcoffee-os/postbot) — reference for content script injection approach
- multi-publisher (npm) — reference for CLI-based cross-posting workflow
- COSE (doocs/cose) — reference for browser extension publishing UX

## License

MIT
