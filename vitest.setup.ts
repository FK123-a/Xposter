import { vi } from 'vitest';

// Expose storage store so tests can clear it between cases
const storageStore = new Map<string, unknown>();

// Make it globally accessible for beforeEach cleanup
(globalThis as Record<string, unknown>).__xposter_storage_store = storageStore;

(globalThis as Record<string, unknown>).chrome = {
  storage: {
    local: {
      get: vi.fn((keys: string | string[] | null, callback?: (items: Record<string, unknown>) => void) => {
        const result: Record<string, unknown> = {};
        if (keys === null || keys === undefined) {
          storageStore.forEach((v, k) => { result[k] = v; });
        } else if (typeof keys === 'string') {
          result[keys] = storageStore.get(keys) ?? null;
        } else if (Array.isArray(keys)) {
          keys.forEach((k) => { result[k] = storageStore.get(k) ?? null; });
        }
        if (callback) { setTimeout(() => callback(result), 0); }
        return Promise.resolve(result);
      }),
      set: vi.fn((items: Record<string, unknown>, callback?: () => void) => {
        Object.entries(items).forEach(([k, v]) => { storageStore.set(k, v); });
        if (callback) { setTimeout(callback, 0); }
        return Promise.resolve();
      }),
      remove: vi.fn((keys: string | string[], callback?: () => void) => {
        const keyList = Array.isArray(keys) ? keys : [keys];
        keyList.forEach((k) => storageStore.delete(k));
        if (callback) { setTimeout(callback, 0); }
        return Promise.resolve();
      }),
      clear: vi.fn((callback?: () => void) => {
        storageStore.clear();
        if (callback) { setTimeout(callback, 0); }
        return Promise.resolve();
      }),
    },
    sync: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
      remove: vi.fn(() => Promise.resolve()),
      clear: vi.fn(() => Promise.resolve()),
    },
  },
  runtime: {
    sendMessage: vi.fn((_message: unknown) => Promise.resolve()),
    onMessage: { addListener: vi.fn(), removeListener: vi.fn(), hasListener: vi.fn(() => false) },
    getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
    id: 'mock-extension-id',
  },
  tabs: {
    create: vi.fn((_createProperties: unknown, _callback?: (tab: unknown) => void) => {
      const tab = { id: 1, url: 'about:blank' };
      if (_callback) setTimeout(() => _callback(tab), 0);
      return Promise.resolve(tab);
    }),
    sendMessage: vi.fn((_tabId: number, _message: unknown) => Promise.resolve()),
    query: vi.fn((_queryInfo: unknown, _callback?: (tabs: unknown[]) => void) => {
      if (_callback) setTimeout(() => _callback([]), 0);
      return Promise.resolve([]);
    }),
    onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
    onUpdated: { addListener: vi.fn(), removeListener: vi.fn() },
  },
  scripting: {
    executeScript: vi.fn((_injection: unknown, _callback?: (results: unknown[]) => void) => {
      if (_callback) setTimeout(() => _callback([{ result: 'injected' }]), 0);
      return Promise.resolve([{ result: 'injected' }]);
    }),
  },
  alarms: {
    create: vi.fn((_name: string, _alarmInfo: unknown) => Promise.resolve()),
    clear: vi.fn((_name: string) => Promise.resolve(true)),
    onAlarm: { addListener: vi.fn(), removeListener: vi.fn() },
  },
};

// Helper to reset storage between tests
export function resetChromeStorage() {
  storageStore.clear();
}
