import type { ContentIssue } from '../models/publish';
import type { PlatformCode } from '../../shared/constants';

export class ContentValidationError extends Error {
  public readonly issues: ContentIssue[];
  public readonly platformCode: PlatformCode;

  constructor(message: string, platformCode: PlatformCode, issues: ContentIssue[]) {
    super(message);
    this.name = 'ContentValidationError';
    this.issues = issues;
    this.platformCode = platformCode;
  }
}
