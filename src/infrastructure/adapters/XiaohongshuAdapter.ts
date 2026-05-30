/**
 * RED / Xiaohongshu publisher adapter.
 * Strategy: Content-script-only (RED has no public publish API).
 */
import type { IPlatformPublisher } from '../../domain/ports/IPlatformPublisher';
import type { IContentAdapter } from '../../domain/ports/IContentAdapter';
import type { PublishJob, PublishResult, PublishProgress } from '../../domain/models/publish';
import type { AuthValidationResult } from '../../domain/models/auth';
import type { PlatformCapabilities } from '../../domain/models/platform';
import type { PlatformCode } from '../../shared/constants';
import { MarkdownToRed } from '../content/MarkdownToRed';
import { PLATFORM_LIMITS } from '../../shared/constants';

export class XiaohongshuAdapter implements IPlatformPublisher {
  readonly platformCode: PlatformCode = 'xiaohongshu';
  readonly supportsApi = false;
  private readonly contentAdapter = new MarkdownToRed();

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
      error: { code: 'CONTENT_SCRIPT_REQUIRED', message: 'RED requires browser tab injection', recoverable: true },
    };
  }

  async abort(_jobId: string): Promise<void> {}

  getCapabilities(): PlatformCapabilities {
    const l = PLATFORM_LIMITS['xiaohongshu'];
    return {
      supportsArticle: true, supportsVideo: false,
      maxTitleLength: l.maxTitleLength, maxContentLength: l.maxContentLength,
      maxImageSizeMB: l.maxImageSizeMB, supportedImageFormats: l.supportedImageFormats,
      supportsDraft: false, supportsSchedule: false,
      requiresTags: l.requiresTags, maxTags: l.maxTags, requiresCover: l.requiresCover,
    };
  }
}
