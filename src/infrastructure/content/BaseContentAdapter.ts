import MarkdownIt from 'markdown-it';
import type { IContentAdapter } from '../../domain/ports/IContentAdapter';
import type { MarkdownContent, AdaptedContent } from '../../domain/models/content';
import type { ValidationResult, ContentIssue } from '../../domain/ports/IContentAdapter';
import type { PlatformCode } from '../../shared/constants';
import { PLATFORM_LIMITS } from '../../shared/constants';

export abstract class BaseContentAdapter implements IContentAdapter {
  abstract readonly platformCode: PlatformCode;

  protected readonly md: MarkdownIt;

  constructor() {
    this.md = new MarkdownIt({ html: false, linkify: true, typographer: true, breaks: false });
  }

  abstract adapt(input: MarkdownContent): Promise<AdaptedContent>;

  /** Default validation: check against platform content limits */
  validate(content: AdaptedContent): ValidationResult {
    const limits = PLATFORM_LIMITS[this.platformCode];
    const issues: ContentIssue[] = [];

    if (limits.maxTitleLength > 0 && content.title.length > limits.maxTitleLength) {
      issues.push({
        field: 'title', severity: 'warning',
        message: `Title exceeds ${limits.maxTitleLength} chars (${content.title.length})`,
        actual: `${content.title.length}`,
        expected: `${limits.maxTitleLength} max`,
      });
    }

    if (limits.maxContentLength > 0 && content.plainText.length > limits.maxContentLength) {
      issues.push({
        field: 'body', severity: 'error',
        message: `Content exceeds ${limits.maxContentLength} chars (${content.plainText.length})`,
        actual: `${content.plainText.length}`,
        expected: `${limits.maxContentLength} max`,
      });
    }

    if (limits.requiresCover && !content.metadata.coverImageUrl) {
      issues.push({
        field: 'images', severity: 'warning',
        message: 'Cover image is required', actual: 'none', expected: 'image URL',
      });
    }

    if (limits.requiresTags && content.tags.length === 0) {
      issues.push({
        field: 'tags', severity: 'warning',
        message: 'At least one tag is required', actual: '0', expected: '1+',
      });
    }

    return { valid: issues.filter((i) => i.severity === 'error').length === 0, issues };
  }

  async preview(markdown: MarkdownContent): Promise<{ html: string; css: string }> {
    return { html: this.md.render(markdown.raw), css: '' };
  }

  protected renderMarkdown(raw: string): string { return this.md.render(raw); }

  protected toPlainText(raw: string): string {
    return this.md.render(raw).replace(/<[^>]*>/g, '').replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
  }
}
