import { describe, it, expect, beforeEach } from 'vitest';
import { ChromeStorageRepository } from '../../../infrastructure/storage/ChromeStorageRepository';
import { createMarkdownContent } from '../../../domain/models/content';

const repo = new ChromeStorageRepository();

function clearStorageStore() {
  const store = (globalThis as Record<string, unknown>).__xposter_storage_store as Map<string, unknown>;
  if (store) store.clear();
}

beforeEach(() => {
  clearStorageStore();
});

describe('ChromeStorageRepository — Drafts', () => {
  it('saves and loads a draft', async () => {
    const content = createMarkdownContent('# Test\n\nBody');
    await repo.saveDraft(content);
    const loaded = await repo.loadDraft();
    expect(loaded?.title).toBe('Test');
  });

  it('returns null when no draft exists', async () => {
    const loaded = await repo.loadDraft();
    expect(loaded).toBeNull();
  });

  it('deletes and confirms removal', async () => {
    const content = createMarkdownContent('# Test\n\nBody');
    await repo.saveDraft(content);
    await repo.deleteDraft();
    const loaded = await repo.loadDraft();
    expect(loaded).toBeNull();
  });
});

describe('ChromeStorageRepository — Publish History', () => {
  it('returns empty array with no history', async () => {
    const history = await repo.loadPublishHistory();
    expect(history).toEqual([]);
  });
});

describe('ChromeStorageRepository — ApiCredentials', () => {
  it('returns null for unknown platform credentials', async () => {
    const creds = await repo.loadApiCredentials('zhihu');
    expect(creds).toBeNull();
  });
});
