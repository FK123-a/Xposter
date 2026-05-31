import { describe, it, expect, beforeEach } from 'vitest';
import { platformRegistry } from '../../../infrastructure/adapters/PlatformRegistry';
import { MarkdownToZhihu } from '../../../infrastructure/content/MarkdownToZhihu';

// A minimal mock publisher for registry testing
import type { IPlatformPublisher } from '../../../domain/ports/IPlatformPublisher';
import type { IContentAdapter } from '../../../domain/ports/IContentAdapter';
import type { PublishJob, PublishResult, PublishProgress } from '../../../domain/models/publish';
import type { AuthValidationResult } from '../../../domain/models/auth';
import type { PlatformCapabilities } from '../../../domain/models/platform';
import type { PlatformCode } from '../../../shared/constants';

function createMockPublisher(code: PlatformCode, adapter: IContentAdapter): IPlatformPublisher {
  return {
    platformCode: code,
    supportsApi: false,
    validateCredentials: async () => ({ valid: true, platformCode: code, method: 'browser-session' }),
    getContentAdapter: () => adapter,
    publish: async () => ({ jobId: '', platformCode: code, status: 'published' }),
    abort: async () => {},
    getCapabilities: () => ({
      supportsArticle: true, supportsVideo: false,
      maxTitleLength: 64, maxContentLength: 0, maxImageSizeMB: 10,
      supportedImageFormats: ['jpg'], supportsDraft: false,
      supportsSchedule: false, requiresTags: false, maxTags: 0, requiresCover: false,
    }),
  };
}

beforeEach(() => {
  // Clear registry before each test
  const codes = platformRegistry.getRegisteredCodes();
  codes.forEach((c) => platformRegistry.unregister(c));
});

describe('PlatformRegistry', () => {
  it('starts with no registered platforms', () => {
    expect(platformRegistry.getRegisteredCodes()).toHaveLength(0);
  });

  it('registers and retrieves a publisher', () => {
    const adapter = new MarkdownToZhihu();
    platformRegistry.register('zhihu', () => createMockPublisher('zhihu', adapter));
    expect(platformRegistry.isRegistered('zhihu')).toBe(true);
    expect(platformRegistry.getRegisteredCodes()).toContain('zhihu');
  });

  it('returns content adapter for a registered platform', () => {
    const adapter = new MarkdownToZhihu();
    platformRegistry.register('zhihu', () => createMockPublisher('zhihu', adapter));
    const fetched = platformRegistry.getContentAdapter('zhihu');
    expect(fetched).toBe(adapter);
  });

  it('throws for unregistered platform', () => {
    expect(() => platformRegistry.getPublisher('bilibili')).toThrow('No publisher registered');
  });

  it('unregisters a platform', () => {
    const adapter = new MarkdownToZhihu();
    platformRegistry.register('zhihu', () => createMockPublisher('zhihu', adapter));
    platformRegistry.unregister('zhihu');
    expect(platformRegistry.isRegistered('zhihu')).toBe(false);
  });

  it('supports multiple platforms', () => {
    const adapter = new MarkdownToZhihu();
    platformRegistry.register('zhihu', () => createMockPublisher('zhihu', adapter));
    platformRegistry.register('bilibili', () => createMockPublisher('bilibili', adapter));
    expect(platformRegistry.getRegisteredCodes()).toHaveLength(2);
  });
});
