/**
 * WeChat Official Account publisher adapter.
 *
 * Strategy: API-first. If AppID/AppSecret are configured, use the WeChat MP API.
 * Falls back to content script injection for users without API access.
 */
import type { IPlatformPublisher } from '../../domain/ports/IPlatformPublisher';
import type { IContentAdapter } from '../../domain/ports/IContentAdapter';
import type { PublishJob, PublishResult, PublishProgress } from '../../domain/models/publish';
import type { AuthValidationResult } from '../../domain/models/auth';
import type { PlatformCapabilities, PlatformConfig } from '../../domain/models/platform';
import type { PlatformCode } from '../../shared/constants';
import type { WechatMPConfig, WechatMPClient as IWechatMPClient } from '../api/WechatMPClient';
import { MarkdownToWechat } from '../content/MarkdownToWechat';
import { PLATFORM_LIMITS, PLATFORM_PUBLISH_URLS, CONTENT_SCRIPT_ENTRIES } from '../../shared/constants';

export class WechatMPAdapter implements IPlatformPublisher {
  readonly platformCode: PlatformCode = 'wechat-mp';
  readonly supportsApi = true;

  private readonly contentAdapter: MarkdownToWechat;
  private apiClient: IWechatMPClient | null = null;

  constructor(apiClient?: IWechatMPClient) {
    this.contentAdapter = new MarkdownToWechat();
    this.apiClient = apiClient ?? null;
  }

  // -----------------------------------------------------------------------
  // IPlatformPublisher
  // -----------------------------------------------------------------------

  getContentAdapter(): IContentAdapter {
    return this.contentAdapter;
  }

  async validateCredentials(): Promise<AuthValidationResult> {
    if (!this.apiClient) {
      return { valid: false, platformCode: this.platformCode, method: 'api', error: 'No API credentials configured' };
    }

    try {
      const ok = await this.apiClient.validateCredentials();
      return {
        valid: ok,
        platformCode: this.platformCode,
        method: 'api',
        error: ok ? undefined : 'Invalid credentials',
      };
    } catch (e) {
      return {
        valid: false,
        platformCode: this.platformCode,
        method: 'api',
        error: e instanceof Error ? e.message : 'Unknown auth error',
      };
    }
  }

  async publish(job: PublishJob, onProgress?: (progress: PublishProgress) => void): Promise<PublishResult> {
    const adapted = await this.contentAdapter.adapt(job.content);

    // Validate content before publishing
    const validation = this.contentAdapter.validate(adapted);
    if (!validation.valid) {
      return {
        jobId: job.id,
        platformCode: this.platformCode,
        status: 'failed',
        error: { code: 'VALIDATION_FAILED', message: 'Content validation failed', recoverable: true },
        validation,
      };
    }

    if (job.mode === 'simulated') {
      onProgress?.({ jobId: job.id, platformCode: this.platformCode, step: 'verifying', percent: 100, message: 'Simulated publish — content validated' });
      return {
        jobId: job.id,
        platformCode: this.platformCode,
        status: 'published',
        validation,
      };
    }

    // API path
    if (this.apiClient) {
      try {
        return await this.publishViaApi(job, adapted, onProgress);
      } catch (e) {
        return {
          jobId: job.id,
          platformCode: this.platformCode,
          status: 'failed',
          error: {
            code: 'API_ERROR',
            message: e instanceof Error ? e.message : 'Unknown error',
            recoverable: true,
          },
        };
      }
    }

    // Content script fallback
    return {
      jobId: job.id,
      platformCode: this.platformCode,
      status: 'failed',
      error: { code: 'NOT_IMPLEMENTED', message: 'Content script publish coming in Phase 4b', recoverable: true },
    };
  }

  async abort(_jobId: string): Promise<void> {
    // WeChat API doesn't support aborting a submitted publish
  }

  getCapabilities(): PlatformCapabilities {
    const limits = PLATFORM_LIMITS['wechat-mp'];
    return {
      supportsArticle: true,
      supportsVideo: false,
      maxTitleLength: limits.maxTitleLength,
      maxContentLength: limits.maxContentLength,
      maxImageSizeMB: limits.maxImageSizeMB,
      supportedImageFormats: limits.supportedImageFormats,
      supportsDraft: true,
      supportsSchedule: false,
      requiresTags: limits.requiresTags,
      maxTags: limits.maxTags,
      requiresCover: limits.requiresCover,
    };
  }

  // -----------------------------------------------------------------------
  // API publishing flow
  // -----------------------------------------------------------------------

  private async publishViaApi(
    job: PublishJob,
    adapted: Awaited<ReturnType<typeof this.contentAdapter.adapt>>,
    onProgress?: (p: PublishProgress) => void,
  ): Promise<PublishResult> {
    if (!this.apiClient) throw new Error('No API client configured');

    onProgress?.({ jobId: job.id, platformCode: this.platformCode, step: 'uploading_images', percent: 10, message: 'Uploading cover image...' });

    // Step 1: Upload cover image if available
    let thumbMediaId = '';
    if (job.content.metadata.coverImageUrl) {
      try {
        const coverBlob = await fetch(job.content.metadata.coverImageUrl).then((r) => r.blob());
        const result = await this.apiClient.uploadPermanentMaterial(coverBlob, 'cover.jpg', 'image');
        thumbMediaId = result.mediaId;
      } catch {
        // Non-fatal: proceed without cover
      }
    }

    onProgress?.({ jobId: job.id, platformCode: this.platformCode, step: 'publishing', percent: 50, message: 'Creating draft...' });

    // Step 2: Create draft
    const mediaId = await this.apiClient.createDraft({
      title: adapted.title,
      content: adapted.body,
      thumb_media_id: thumbMediaId || '',
    });

    onProgress?.({ jobId: job.id, platformCode: this.platformCode, step: 'submitting', percent: 80, message: 'Publishing...' });

    // Step 3: Publish
    await this.apiClient.publishDraft(mediaId);

    onProgress?.({ jobId: job.id, platformCode: this.platformCode, step: 'verifying', percent: 100, message: 'Published!' });

    return {
      jobId: job.id,
      platformCode: this.platformCode,
      status: 'published',
      url: undefined, // WeChat doesn't return URL via API
      publishedAt: Date.now(),
    };
  }
}
