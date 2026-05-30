import type { PlatformCode, PublishMode, PublishStatus } from '../../shared/constants';
import type { MarkdownContent } from './content';

export interface ContentIssue {
  readonly field: 'title' | 'body' | 'images' | 'tags';
  readonly severity: 'error' | 'warning';
  readonly message: string;
  readonly actual: string;
  readonly expected: string;
}

export interface PublishResult {
  readonly jobId: string;
  readonly platformCode: PlatformCode;
  readonly status: PublishStatus;
  readonly url?: string;
  readonly publishedAt?: number;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly recoverable: boolean;
  };
  readonly validation?: {
    readonly valid: boolean;
    readonly issues: ContentIssue[];
  };
}

export interface PublishProgress {
  readonly jobId: string;
  readonly platformCode: PlatformCode;
  readonly step: 'adapting' | 'uploading_images' | 'filling_form' | 'submitting' | 'verifying';
  readonly percent: number;
  readonly message: string;
}

export interface PublishJob {
  readonly id: string;
  readonly content: MarkdownContent;
  readonly platforms: PlatformCode[];
  readonly mode: PublishMode;
  readonly createdAt: number;
  readonly platformResults: Map<PlatformCode, PublishResult>;
  readonly overallStatus: PublishStatus;
}

let jobCounter = 0;

export function createPublishJob(
  content: MarkdownContent,
  platforms: PlatformCode[],
  mode: PublishMode,
): PublishJob {
  jobCounter += 1;
  return {
    id: `job-${Date.now()}-${jobCounter}`,
    content,
    platforms,
    mode,
    createdAt: Date.now(),
    platformResults: new Map(),
    overallStatus: 'pending',
  };
}

export function createPublishResult(
  jobId: string,
  platformCode: PlatformCode,
  overrides?: Partial<PublishResult>,
): PublishResult {
  return { jobId, platformCode, status: 'pending', ...overrides };
}
