/**
 * Vitest setup file
 *
 * Initializes global mocks for Chrome Extension APIs so domain,
 * application, and infrastructure tests can run without a real browser.
 */

import { vi } from 'vitest';
import type { Mock } from 'vitest';

// ---------------------------------------------------------------------------
// chrome.storage.local
// ---------------------------------------------------------------------------
const storageStore = new Map<string, unknown>();

const chromeStorageLocalMock = {
  get: vi.fn((keys: string | string[] | null, callback?: (items: Record<string, unknown>) => void) => {
    const result: Record<string, unknown> = {};
    if (keys === null || keys === undefined) {
      storageStore.forEach((v, k) => { result[k] = v; });
    } else if (typeof keys === 'string') {
      result[keys] = storageStore.get(keys) ?? null;
    } else if (Array.isArray(keys)) {
      keys.forEach((k) => { result[k] = storageStore.get(k) ?? null; });
    }
    if (callback) {
      setTimeout(() => callback(result), 0);
    }
    return Promise.resolve(result);
  }) as Mock & ((keys: string | string[] | null, callback?: (items: Record<string, unknown>) => void) => Promise<Record<string, unknown>>),

  set: vi.fn((items: Record<string, unknown>, callback?: () => void) => {
    Object.entries(items).forEach(([k, v]) => { storageStore.set(k, v); });
    if (callback) {
      setTimeout(callback, 0);
    }
    return Promise.resolve();
  }),

  remove: vi.fn((keys: string | string[], callback?: () => void) => {
    const keyList = Array.isArray(keys) ? keys : [keys];
    keyList.forEach((k) => storageStore.delete(k));
    if (callback) {
      setTimeout(callback, 0);
    }
    return Promise.resolve();
  }),

  clear: vi.fn((callback?: () => void) => {
    storageStore.clear();
    if (callback) {
      setTimeout(callback, 0);
    }
    return Promise.resolve();
  }),
};

// ---------------------------------------------------------------------------
// chrome.runtime
// ---------------------------------------------------------------------------
const messageListeners: Array<(message: unknown, sender: unknown, sendResponse: (response?: unknown) => void) => boolean | undefined> = [];

const chromeRuntimeMock = {
  sendMessage: vi.fn((_message: unknown) => Promise.resolve()),
  onMessage: {
    addListener: vi.fn((listener: (message: unknown, sender: unknown, sendResponse: (response?: unknown) => void) => boolean | undefined) => {
      messageListeners.push(listener);
    }),
    removeListener: vi.fn(),
    hasListener: vi.fn(() => false),
  },
  getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
  id: 'mock-extension-id',
};

// ---------------------------------------------------------------------------
// chrome.tabs
// ---------------------------------------------------------------------------
const chromeTabsMock = {
  create: vi.fn((_createProperties: unknown, _callback?: (tab: unknown) => void) => {
    const tab = { id: 1, url: 'about:blank' };
    if (_callback) setTimeout(() => _callback(tab), 0);
    return Promise.resolve(tab);
  }),
  sendMessage: vi.fn((_tabId: number, _message: unknown) => Promise.resolve()),
  query: vi.fn((_queryInfo: unknown, _callback?: (tabs: unknown[]) => void) => {
    const tabs: unknown[] = [];
    if (_callback) setTimeout(() => _callback(tabs), 0);
    return Promise.resolve(tabs);
  }),
  onRemoved: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
  onUpdated: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
};

// ---------------------------------------------------------------------------
// chrome.scripting
// ---------------------------------------------------------------------------
const chromeScriptingMock = {
  executeScript: vi.fn((_injection: unknown, _callback?: (results: unknown[]) => void) => {
    const results: unknown[] = [{ result: 'injected' }];
    if (_callback) setTimeout(() => _callback(results), 0);
    return Promise.resolve(results);
  }),
};

// ---------------------------------------------------------------------------
// chrome.alarms
// ---------------------------------------------------------------------------
const chromeAlarmsMock = {
  create: vi.fn((_name: string, _alarmInfo: unknown) => Promise.resolve()),
  clear: vi.fn((_name: string) => Promise.resolve(true)),
  onAlarm: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
};

// ---------------------------------------------------------------------------
// Assemble global chrome stub
// ---------------------------------------------------------------------------
(globalThis as Record<string, unknown>).chrome = {
  storage: {
    local: chromeStorageLocalMock,
    sync: { ...chromeStorageLocalMock },  // same shape, separate store
  },
  runtime: chromeRuntimeMock,
  tabs: chromeTabsMock,
  scripting: chromeScriptingMock,
  alarms: chromeAlarmsMock,
};

// ---------------------------------------------------------------------------
// Re-export for use in tests
// ---------------------------------------------------------------------------
export {
  chromeStorageLocalMock,
  chromeRuntimeMock,
  chromeTabsMock,
  chromeScriptingMock,
  chromeAlarmsMock,
};

/**
 * Reset all mock state between tests.
 */
export function resetChromeMocks() {
  storageStore.clear();
  messageListeners.length = 0;
  vi.clearAllMocks();
}
