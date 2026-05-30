/**
 * Bilibili publisher adapter.
 * Strategy: API-first for video upload, content script for article posts.
 */
import type { IPlatformPublisher } from '../../domain/ports/IPlatformPublisher';
import type { IContentAdapter } from '../../domain/ports/IContentAdapter';
import type { PublishJob, PublishResult, PublishProgress } from '../../domain/models/publish';
import type { AuthValidationResult } from '../../domain/models/auth';
import type { PlatformCapabilities } from '../../domain/models/platform';
import type { PlatformCode } from '../../shared/constants';
import { MarkdownToBilibili } from '../content/MarkdownToBilibili';
import { PLATFORM_LIMITS } from '../../shared/constants';

export class BilibiliAdapter implements IPlatformPublisher {
  readonly platformCode: PlatformCode = 'bilibili';
  readonly supportsApi = false; // API requires OAuth, not yet implemented
  private readonly contentAdapter = new MarkdownToBilibili();

  getContentAdapter(): IContentAdapter { return this.contentAdapter; }

  async validateCredentials(): Promise<AuthValidationResult> {
    return { valid: true, platformCode: this.platformCode, method: 'session' };
  }

  async publish(job: PublishJob, onProgress?: (p: PublishProgress) => void): Promise<PublishResult> {
    const adapted = await this.contentAdapter.adapt(job.content);
    const validation = this.contentAdapter.validate(adapted);
    if (!validation.valid) {
      return {
        jobId: job.id, platformCode: this.platformCode, status: 'failed',
        error: { code: 'VALIDATION_FAILED', message: 'Content validation failed', recoverable: true },
        validation,
      };
    }
    if (job.mode === 'simulated') {
      onProgress?.({ jobId: job.id, platformCode: this.platformCode, step: 'verifying', percent: 100, message: 'Simulated' });
      return { jobId: job.id, platformCode: this.platformCode, status: 'published', validation };
    }
    return {
      jobId: job.id, platformCode: this.platformCode, status: 'pending',
      error: { code: 'CONTENT_SCRIPT_REQUIRED', message: 'Bilibili requires browser tab injection', recoverable: true },
    };
  }

  async abort(_jobId: string): Promise<void> {}

  getCapabilities(): PlatformCapabilities {
    const l = PLATFORM_LIMITS['bilibili'];
    return {
      supportsArticle: true, supportsVideo: true,
      maxTitleLength: l.maxTitleLength, maxContentLength: l.maxContentLength,
      maxImageSizeMB: l.maxImageSizeMB, supportedImageFormats: l.supportedImageFormats,
      supportsDraft: false, supportsSchedule: false,
      requiresTags: l.requiresTags, maxTags: l.maxTags, requiresCover: l.requiresCover,
    };
  }
}
