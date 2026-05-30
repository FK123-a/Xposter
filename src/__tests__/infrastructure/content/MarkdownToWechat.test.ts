import { describe, it, expect } from 'vitest';
import { MarkdownToWechat } from '../../../infrastructure/content/MarkdownToWechat';
import { createMarkdownContent } from '../../../domain/models/content';

const adapter = new MarkdownToWechat();

describe('MarkdownToWechat', () => {
  it('adapts markdown to WeChat HTML with inline styles', async () => {
    const content = createMarkdownContent('# Hello\n\nThis is **bold** text');
    const result = await adapter.adapt(content);
    expect(result.platformCode).toBe('wechat-mp');
    expect(result.body).toContain('style=');
    expect(result.body).toContain('<section');
    expect(result.body).toContain('Hello');
  });

  it('truncates title to 64 characters for WeChat', async () => {
    const longTitle = 'A'.repeat(100);
    const content = createMarkdownContent('# ' + longTitle + '\n\nBody');
    const result = await adapter.adapt(content);
    expect(result.title.length).toBeLessThanOrEqual(64);
  });

  it('applies WeChat green quote style to blockquotes', async () => {
    const content = createMarkdownContent('# Title\n\n> A quote');
    const result = await adapter.adapt(content);
    expect(result.body).toContain('#07C160');
  });

  it('adds inline styles to images', async () => {
    const content = createMarkdownContent('# Title\n\n![img](https://example.com/pic.png)');
    const result = await adapter.adapt(content);
    expect(result.body).toContain('max-width:100%');
    expect(result.body).toContain('border-radius');
  });

  it('returns empty plain text for empty input', async () => {
    const content = createMarkdownContent('');
    const result = await adapter.adapt(content);
    expect(result.title).toBe('');
    expect(result.plainText).toBe('');
  });
});

describe('MarkdownToWechat validation', () => {
  it('validates adapted content passes (title already truncated)', async () => {
    const content = createMarkdownContent('# Standard Title\n\nBody text here');
    const adapted = await adapter.adapt(content);
    const validation = adapter.validate(adapted);
    expect(validation.valid).toBe(true);
  });

  it('warns when no cover image', async () => {
    const content = createMarkdownContent('# Title\n\nBody');
    const adapted = await adapter.adapt(content);
    const validation = adapter.validate(adapted);
    expect(validation.issues.some((i) => i.field === 'images')).toBe(true);
  });

  it('warns when no tags on tag-required content', async () => {
    const content = createMarkdownContent('# Title\n\nBody');
    const adapted = await adapter.adapt(content);
    const validation = adapter.validate(adapted);
    // WeChat doesn't require tags, so this should not flag
    expect(validation.issues.some((i) => i.field === 'tags')).toBe(false);
  });
});
