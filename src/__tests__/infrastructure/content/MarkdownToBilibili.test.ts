import { describe, it, expect } from 'vitest';
import { MarkdownToBilibili } from '../../../infrastructure/content/MarkdownToBilibili';
import { createMarkdownContent } from '../../../domain/models/content';

const adapter = new MarkdownToBilibili();

describe('MarkdownToBilibili', () => {
  it('adapts markdown to B站 format', async () => {
    const content = createMarkdownContent('# 视频标题\n\n## 简介\n视频内容描述');
    const result = await adapter.adapt(content);
    expect(result.platformCode).toBe('bilibili');
    expect(result.title).toContain('视频标题');
  });

  it('truncates description to 250 chars', async () => {
    const content = createMarkdownContent('# Title\n\n' + 'A'.repeat(500));
    const result = await adapter.adapt(content);
    expect(result.plainText.length).toBeLessThanOrEqual(250);
  });

  it('truncates tags to 10', async () => {
    const tags = Array.from({ length: 15 }, (_, i) => `tag${i}`);
    const content = createMarkdownContent('# Title\n\nBody', { tags });
    const result = await adapter.adapt(content);
    expect(result.tags.length).toBeLessThanOrEqual(10);
  });
});
