import { describe, it, expect } from 'vitest';
import { MarkdownToZhihu } from '../../../infrastructure/content/MarkdownToZhihu';
import { createMarkdownContent } from '../../../domain/models/content';

const adapter = new MarkdownToZhihu();

describe('MarkdownToZhihu', () => {
  it('adapts markdown for Zhihu format', async () => {
    const content = createMarkdownContent('# Title\n\nBody with **bold**');
    const result = await adapter.adapt(content);
    expect(result.platformCode).toBe('zhihu');
    expect(result.title).toBe('Title');
    expect(result.body).toContain('bold');
  });

  it('truncates title to 100 chars', async () => {
    const content = createMarkdownContent('# ' + 'A'.repeat(120) + '\n\nBody');
    const result = await adapter.adapt(content);
    expect(result.title.length).toBeLessThanOrEqual(100);
  });

  it('limits tags to 5', async () => {
    const content = createMarkdownContent('# Title\n\nBody', { tags: ['a','b','c','d','e','f'] });
    const result = await adapter.adapt(content);
    expect(result.tags.length).toBeLessThanOrEqual(5);
  });
});
