import { describe, it, expect } from 'vitest';
import { MarkdownToRed } from '../../../infrastructure/content/MarkdownToRed';
import { createMarkdownContent } from '../../../domain/models/content';

const adapter = new MarkdownToRed();

describe('MarkdownToRed', () => {
  it('truncates title to 20 chars', async () => {
    const content = createMarkdownContent('# A very long title that exceeds limit\n\nBody');
    const result = await adapter.adapt(content);
    expect(result.title.length).toBeLessThanOrEqual(20);
  });

  it('truncates body to 1000 chars', async () => {
    const content = createMarkdownContent('# Title\n\n' + 'B'.repeat(2000));
    const result = await adapter.adapt(content);
    expect(result.plainText.length).toBeLessThanOrEqual(1000);
  });

  it('appends hashtags to body', async () => {
    const content = createMarkdownContent('# Title\n\nContent about #travel and #food', { tags: ['lifestyle'] });
    const result = await adapter.adapt(content);
    expect(result.body).toContain('#travel');
    expect(result.body).toContain('#food');
    expect(result.body).toContain('#lifestyle');
  });

  it('generates title from body if empty', async () => {
    const content = createMarkdownContent('First sentence. Second sentence.');
    const result = await adapter.adapt(content);
    expect(result.title).toBeTruthy();
    expect(result.title.length).toBeLessThanOrEqual(20);
  });
});
