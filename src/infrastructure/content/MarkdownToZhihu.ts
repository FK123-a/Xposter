/**
 * Converts Markdown to Zhihu (知乎) article format.
 *
 * Zhihu constraints:
 * - Supports Markdown-like syntax with LaTeX
 * - Topics (话题) are required
 * - Cover image required
 * - Title max 100 chars
 */
import { BaseContentAdapter } from './BaseContentAdapter';
import type { MarkdownContent, AdaptedContent } from '../../domain/models/content';
import type { PlatformCode } from '../../shared/constants';

export class MarkdownToZhihu extends BaseContentAdapter {
  readonly platformCode: PlatformCode = 'zhihu';

  async adapt(input: MarkdownContent): Promise<AdaptedContent> {
    const html = this.renderMarkdown(input.raw);

    return {
      platformCode: this.platformCode,
      title: input.title.substring(0, 100),
      body: html,
      plainText: this.toPlainText(input.raw),
      images: [],
      tags: input.metadata.tags.slice(0, 5),
      category: input.metadata.category || null,
      metadata: {
        coverImageUrl: input.metadata.coverImageUrl ?? null,
        sourceUrl: input.metadata.sourceUrl ?? null,
      },
    };
  }
}
