import { describe, it, expect, beforeEach } from 'vitest';
import { platformRegistry } from '../../../infrastructure/adapters/PlatformRegistry';
import { MarkdownToWechat } from '../../../infrastructure/content/MarkdownToWechat';

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
    const adapter = new MarkdownToWechat();
    platformRegistry.register('wechat-mp', () => createMockPublisher('wechat-mp', adapter));
    expect(platformRegistry.isRegistered('wechat-mp')).toBe(true);
    expect(platformRegistry.getRegisteredCodes()).toContain('wechat-mp');
  });

  it('returns content adapter for a registered platform', () => {
    const adapter = new MarkdownToWechat();
    platformRegistry.register('wechat-mp', () => createMockPublisher('wechat-mp', adapter));
    const fetched = platformRegistry.getContentAdapter('wechat-mp');
    expect(fetched).toBe(adapter);
  });

  it('throws for unregistered platform', () => {
    expect(() => platformRegistry.getPublisher('zhihu')).toThrow('No publisher registered');
  });

  it('unregisters a platform', () => {
    const adapter = new MarkdownToWechat();
    platformRegistry.register('wechat-mp', () => createMockPublisher('wechat-mp', adapter));
    platformRegistry.unregister('wechat-mp');
    expect(platformRegistry.isRegistered('wechat-mp')).toBe(false);
  });

  it('supports multiple platforms', () => {
    const adapter = new MarkdownToWechat();
    platformRegistry.register('wechat-mp', () => createMockPublisher('wechat-mp', adapter));
    platformRegistry.register('zhihu', () => createMockPublisher('zhihu', adapter));
    expect(platformRegistry.getRegisteredCodes()).toHaveLength(2);
  });
});
