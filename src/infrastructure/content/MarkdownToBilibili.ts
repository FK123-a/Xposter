/**
 * Converts Markdown to Bilibili article/video description format.
 * B站 constraints: title <80 chars, description <250 chars, tags needed.
 */
import { BaseContentAdapter } from './BaseContentAdapter';
import type { MarkdownContent, AdaptedContent } from '../../domain/models/content';
import type { PlatformCode } from '../../shared/constants';

export class MarkdownToBilibili extends BaseContentAdapter {
  readonly platformCode: PlatformCode = 'bilibili';

  async adapt(input: MarkdownContent): Promise<AdaptedContent> {
    const plainText = this.toPlainText(input.raw);
    const description = plainText.substring(0, 250);

    return {
      platformCode: this.platformCode,
      title: input.title.substring(0, 80),
      body: description,
      plainText: description,
      images: [],
      tags: input.metadata.tags.slice(0, 10),
      category: input.metadata.category || null,
      metadata: {
        coverImageUrl: input.metadata.coverImageUrl ?? null,
      },
    };
  }
}
