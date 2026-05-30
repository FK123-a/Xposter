import { describe, it, expect } from 'vitest';
import { MarkdownParser } from '../../application/services/MarkdownParser';

const parser = new MarkdownParser();

describe('MarkdownParser', () => {
  it('renders bold markdown to HTML', () => {
    const html = parser.renderHtml('**bold**');
    expect(html).toContain('<strong>');
  });

  it('renders italic markdown to HTML', () => {
    const html = parser.renderHtml('*italic*');
    expect(html).toContain('<em>');
  });

  it('renders links', () => {
    const html = parser.renderHtml('[link](https://example.com)');
    expect(html).toContain('href="https://example.com"');
  });

  it('extracts plain text from markdown', () => {
    const text = parser.toPlainText('## Heading\n\nBody **bold** text');
    expect(text).toContain('Heading');
    expect(text).toContain('Body bold text');
  });

  it('parses structure from markdown', () => {
    const result = parser.parse('# My Title\n\nContent here');
    expect(result.title).toBe('My Title');
    expect(result.html).toBeTruthy();
    expect(result.plainText).toContain('My Title');
  });

  it('handles empty input', () => {
    const result = parser.parse('');
    expect(result.title).toBe('');
    expect(result.html).toBe('');
  });
});
