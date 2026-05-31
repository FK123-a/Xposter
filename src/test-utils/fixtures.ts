/**
 * Shared test fixtures for Xposter test suites.
 */
import type { MarkdownContent } from '../domain/models/content';
import type { PlatformCode } from '../shared/constants';

export const sampleMarkdown = `# Getting Started with Vite

Vite is a **fast** build tool for modern web projects.

## Features

- Instant server start
- HMR (Hot Module Replacement)
- Optimized build

> Vite uses esbuild for pre-bundling dependencies.

![Vite Logo](https://vitejs.dev/logo.svg)
`;

export const sampleMarkdownNoTitle = `This content has no H1 title.

Just some body text here.
`;

export const sampleMarkdownWithTags = `# My Article

This is a test article about #TypeScript and #React development.

Some thoughts on #CleanArchitecture patterns.
`;

export function createTestContent(overrides?: Partial<MarkdownContent>): MarkdownContent {
  const { createMarkdownContent } = require('../domain/models/content');
  return {
    ...createMarkdownContent(sampleMarkdown),
    ...overrides,
  };
}

export const allPlatformCodes: PlatformCode[] = [
  'zhihu',
  'bilibili',
  'xiaohongshu',
];
