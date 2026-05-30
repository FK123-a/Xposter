/**
 * Converts Markdown to RED / Xiaohongshu (小红书) note format.
 *
 * RED constraints:
 * - Title max 20 chars
 * - Body max 1000 chars
 * - Image-first layout, hashtag-heavy style
 * - No Markdown rendering — plain text with emoji and #tags
 */
import { BaseContentAdapter } from './BaseContentAdapter';
import type { MarkdownContent, AdaptedContent } from '../../domain/models/content';
import type { PlatformCode } from '../../shared/constants';

export class MarkdownToRed extends BaseContentAdapter {
  readonly platformCode: PlatformCode = 'xiaohongshu';

  async adapt(input: MarkdownContent): Promise<AdaptedContent> {
    const plainText = this.toPlainText(input.raw);
    const hashtags = this.extractHashtags(input.raw);

    // RED style: title + body with hashtags appended
    const title = input.title.substring(0, 20) || this.generateTitle(plainText);
    const bodyWithoutTitle = plainText.replace(input.title, '').trim();
    const truncatedBody = bodyWithoutTitle.substring(0, 1000);
    const allTags = [...new Set([...input.metadata.tags, ...hashtags])].slice(0, 10);

    // Format RED-style body: text + #tags at the end
    const body = truncatedBody + '\n\n' + allTags.map((t) => `#${t}`).join(' ');

    return {
      platformCode: this.platformCode,
      title,
      body,
      plainText: truncatedBody,
      images: [],
      tags: allTags,
      category: input.metadata.category || null,
      metadata: {},
    };
  }

  private extractHashtags(raw: string): string[] {
    const matches = raw.match(/#([\w一-鿿㐀-䶿-]+)/g);
    if (!matches) return [];
    return [...new Set(matches.map((m) => m.replace(/^#/, '').trim()))];
  }

  private generateTitle(plainText: string): string {
    return plainText.split(/[。.!！?？\n]/)[0]?.substring(0, 20) || 'Untitled';
  }
}
