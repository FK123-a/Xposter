/**
 * BatchPublish use case: orchestrates publishing one content piece
 * to multiple platforms in parallel with progress tracking.
 */
import type { PublishJob, PublishResult, PublishProgress } from '../../domain/models/publish';
import type { PlatformCode, PublishMode } from '../../shared/constants';
import type { MarkdownContent } from '../../domain/models/content';
import { createPublishJob, createPublishResult } from '../../domain/models/publish';
import { platformRegistry } from '../../infrastructure/adapters/platforms';

export interface BatchPublishOptions {
  content: MarkdownContent;
  platforms: PlatformCode[];
  mode: PublishMode;
  onProgress?: (jobId: string, platform: PlatformCode, progress: PublishProgress) => void;
}

export class BatchPublish {
  async execute(options: BatchPublishOptions): Promise<PublishJob> {
    const job = createPublishJob(options.content, options.platforms, options.mode);

    const results = await Promise.allSettled(
      options.platforms.map(async (code) => {
        if (!platformRegistry.isRegistered(code)) {
          return createPublishResult(job.id, code, {
            status: 'failed',
            error: { code: 'NOT_REGISTERED', message: `Platform ${code} not registered`, recoverable: false },
          });
        }

        const publisher = platformRegistry.getPublisher(code);
        return publisher.publish(job, (progress) => {
          options.onProgress?.(job.id, code, progress);
        });
      }),
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        job.platformResults.set(result.value.platformCode, result.value);
      }
    }

    return job;
  }
}
