import MarkdownIt from 'markdown-it';

export interface ParsedMarkdown {
  html: string;
  plainText: string;
  title: string;
}

export class MarkdownParser {
  private readonly md: MarkdownIt;

  constructor() {
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      breaks: false,
    });
  }

  /** Render Markdown to HTML using default settings */
  renderHtml(markdown: string): string {
    return this.md.render(markdown);
  }

  /** Render inline Markdown to HTML */
  renderInline(markdown: string): string {
    return this.md.renderInline(markdown);
  }

  /** Extract plain text by stripping HTML tags */
  toPlainText(markdown: string): string {
    const html = this.md.render(markdown);
    // Simple HTML tag stripping
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  /** Parse markdown into structured output */
  parse(markdown: string): ParsedMarkdown {
    const match = markdown.match(/^#\s+(.+)$/m);
    return {
      html: this.renderHtml(markdown),
      plainText: this.toPlainText(markdown),
      title: match ? match[1]!.trim() : '',
    };
  }
}
