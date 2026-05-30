import { describe, it, expect, vi } from 'vitest';
import { WechatMPAdapter } from '../../../infrastructure/adapters/WechatMPAdapter';
import { createMarkdownContent } from '../../../domain/models/content';
import { createPublishJob } from '../../../domain/models/publish';

describe('WechatMPAdapter', () => {
  it('has platformCode wechat-mp and supports API', () => {
    const adapter = new WechatMPAdapter();
    expect(adapter.platformCode).toBe('wechat-mp');
    expect(adapter.supportsApi).toBe(true);
  });

  it('returns content adapter with correct platform', () => {
    const adapter = new WechatMPAdapter();
    expect(adapter.getContentAdapter().platformCode).toBe('wechat-mp');
  });

  it('returns capabilities matching WeChat limits', () => {
    const caps = new WechatMPAdapter().getCapabilities();
    expect(caps.maxTitleLength).toBe(64);
    expect(caps.supportsArticle).toBe(true);
  });

  it('credentials invalid without API client', async () => {
    const auth = await new WechatMPAdapter().validateCredentials();
    expect(auth.valid).toBe(false);
  });

  it('simulated publish validates and succeeds', async () => {
    const content = createMarkdownContent('# Test\n\nHello');
    const job = createPublishJob(content, ['wechat-mp'], 'simulated');
    const result = await new WechatMPAdapter().publish(job);
    expect(result.status).toBe('published');
  });

  it('real publish fails without API client', async () => {
    const content = createMarkdownContent('# Test\n\nHello');
    const job = createPublishJob(content, ['wechat-mp'], 'real');
    const result = await new WechatMPAdapter().publish(job);
    expect(result.status).toBe('failed');
  });
});
