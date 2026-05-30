import { BaseContentAdapter } from './BaseContentAdapter';
import type { MarkdownContent, AdaptedContent } from '../../domain/models/content';
import type { PlatformCode } from '../../shared/constants';

/**
 * Converts Markdown to WeChat Official Account rich HTML format.
 *
 * WeChat constraints:
 * - Inline styles required (no external CSS classes)
 * - Images must be < 10MB, jpg/png/gif only
 * - Cover image required
 * - Title max 64 characters
 */
export class MarkdownToWechat extends BaseContentAdapter {
  readonly platformCode: PlatformCode = 'wechat-mp';

  async adapt(input: MarkdownContent): Promise<AdaptedContent> {
    const html = this.renderMarkdown(input.raw);

    const body = [
      '<section style="max-width:100%;padding:0;margin:0 auto;">',
      this.wrapContent(html),
      '</section>',
    ].join('\n');

    return {
      platformCode: this.platformCode,
      title: input.title.substring(0, 64),
      body,
      plainText: this.toPlainText(input.raw).substring(0, 20000),
      images: [],
      tags: input.metadata.tags,
      category: input.metadata.category || null,
      metadata: {
        coverImageUrl: input.metadata.coverImageUrl ?? null,
        sourceUrl: input.metadata.sourceUrl ?? null,
      },
    };
  }

  private wrapContent(html: string): string {
    return html
      .replace(/<h1([^>]*)>/g,
        '<h1$1 style="font-size:22px;font-weight:700;margin:16px 0 8px;color:#1a1a1a;border-bottom:2px solid #eee;padding-bottom:6px;">')
      .replace(/<h2([^>]*)>/g,
        '<h2$1 style="font-size:18px;font-weight:600;margin:14px 0 6px;color:#333;">')
      .replace(/<h3([^>]*)>/g,
        '<h3$1 style="font-size:16px;font-weight:600;margin:12px 0 4px;color:#555;">')
      .replace(/<p([^>]*)>/g,
        '<p$1 style="margin:8px 0;line-height:1.8;color:#333;font-size:15px;">')
      .replace(/<blockquote([^>]*)>/g,
        '<blockquote$1 style="border-left:3px solid #07C160;margin:12px 0;padding:8px 16px;background:#f0faf3;color:#555;font-size:14px;">')
      .replace(/<pre([^>]*)>/g,
        '<pre$1 style="background:#f5f5f5;border-radius:6px;padding:12px;overflow-x:auto;font-size:13px;">')
      .replace(/<ul([^>]*)>/g,
        '<ul$1 style="padding-left:20px;margin:8px 0;">')
      .replace(/<ol([^>]*)>/g,
        '<ol$1 style="padding-left:20px;margin:8px 0;">')
      .replace(/<img([^>]*)>/g,
        '<img$1 style="max-width:100%;height:auto;border-radius:6px;margin:8px 0;" />');
  }
}
