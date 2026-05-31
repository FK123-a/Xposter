import { create } from 'zustand';
import type { MarkdownContent } from '../../domain/models/content';
import type { PlatformCode } from '../../shared/constants';
import { PLATFORM_DISPLAY_NAMES } from '../../shared/constants';

export interface ContentState {
  // Current draft
  markdown: string;
  title: string;
  lastSaved: number | null;

  // Platform preview selection
  selectedPlatforms: PlatformCode[];
  activePreviewPlatform: PlatformCode;

  // Draft management
  isDirty: boolean;

  // Actions
  setMarkdown: (text: string) => void;
  setTitle: (title: string) => void;
  togglePlatform: (code: PlatformCode) => void;
  setActivePreviewPlatform: (code: PlatformCode) => void;
  markSaved: () => void;
  markClean: () => void;
  loadDraft: (content: MarkdownContent) => void;
  reset: () => void;
}

const INITIAL_MARKDOWN = `# Welcome to Xposter

Start writing your content here using **Markdown**.

## Features
- Write once, publish everywhere
- Auto-adapt formats per platform
- Simulated mode for testing

> Select platforms below and click **Publish** when ready.
`;

const INITIAL_PLATFORMS: PlatformCode[] = ['zhihu', 'bilibili', 'xiaohongshu'];

export const useContentStore = create<ContentState>((set) => ({
  markdown: INITIAL_MARKDOWN,
  title: 'Welcome to Xposter',
  lastSaved: null,
  selectedPlatforms: INITIAL_PLATFORMS,
  activePreviewPlatform: 'zhihu',
  isDirty: false,

  setMarkdown: (text: string) => {
    const match = text.match(/^#\s+(.+)$/m);
    set({
      markdown: text,
      title: match ? match[1]!.trim() : '',
      isDirty: true,
    });
  },

  setTitle: (title: string) => {
    set({ title, isDirty: true });
  },

  togglePlatform: (code: PlatformCode) => {
    set((state) => {
      const selected = state.selectedPlatforms.includes(code)
        ? state.selectedPlatforms.filter((p) => p !== code)
        : [...state.selectedPlatforms, code];
      return { selectedPlatforms: selected };
    });
  },

  setActivePreviewPlatform: (code: PlatformCode) => {
    set({ activePreviewPlatform: code });
  },

  markSaved: () => {
    set({ lastSaved: Date.now(), isDirty: false });
  },

  markClean: () => {
    set({ isDirty: false });
  },

  loadDraft: (content: MarkdownContent) => {
    set({
      markdown: content.raw,
      title: content.title,
      lastSaved: Date.now(),
      isDirty: false,
    });
  },

  reset: () => {
    set({
      markdown: INITIAL_MARKDOWN,
      title: 'Welcome to Xposter',
      lastSaved: null,
      isDirty: false,
    });
  },
}));
