import type { PlatformCode } from '../../shared/constants';
import type { MarkdownContent, AdaptedContent } from '../models/content';
import type { ContentIssue } from '../models/publish';

export interface ValidationResult {
  readonly valid: boolean;
  readonly issues: ContentIssue[];
}

export interface IContentAdapter {
  readonly platformCode: PlatformCode;

  /** Convert generic Markdown to this platform's target format */
  adapt(input: MarkdownContent): Promise<AdaptedContent>;

  /** Check if adapted content meets platform constraints */
  validate(content: AdaptedContent): ValidationResult;

  /** Generate a sandbox-safe HTML preview of how this platform will render */
  preview(markdown: MarkdownContent): Promise<{ html: string; css: string }>;
}
