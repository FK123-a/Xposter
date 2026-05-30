import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WechatMPClient } from '../../../infrastructure/api/WechatMPClient';

function mockFetch(body: unknown, ok = true, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
  });
}

const config = { appId: 'test-app-id', appSecret: 'test-secret' };

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('WechatMPClient', () => {
  it('getAccessToken returns a token on success', async () => {
    mockFetch({ access_token: 'test-token', expires_in: 7200 });
    const client = new WechatMPClient(config);
    const token = await client.getAccessToken();
    expect(token).toBe('test-token');
  });

  it('getAccessToken throws on WeChat API error', async () => {
    mockFetch({ errcode: 40001, errmsg: 'invalid credential' });
    const client = new WechatMPClient(config);
    await expect(client.getAccessToken()).rejects.toThrow('invalid credential');
  });

  it('caches the token and reuses it', async () => {
    mockFetch({ access_token: 'cached-token', expires_in: 7200 });
    const client = new WechatMPClient(config);
    await client.getAccessToken();

    // Second call should use cache, not call fetch again
    mockFetch({ access_token: 'should-not-appear', expires_in: 7200 });
    const token = await client.getAccessToken();
    expect(token).toBe('cached-token');
  });

  it('validateCredentials returns true on success', async () => {
    mockFetch({ access_token: 'valid', expires_in: 7200 });
    const client = new WechatMPClient(config);
    const valid = await client.validateCredentials();
    expect(valid).toBe(true);
  });

  it('validateCredentials returns false on error', async () => {
    mockFetch({ errcode: 40001, errmsg: 'invalid' });
    const client = new WechatMPClient(config);
    const valid = await client.validateCredentials();
    expect(valid).toBe(false);
  });

  it('createDraft returns media_id on success', async () => {
    mockFetch({ access_token: 'token', expires_in: 7200 }); // First call: getToken
    const client = new WechatMPClient(config);

    // Override for the draft call
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ access_token: 'token', expires_in: 7200 }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ media_id: 'draft-123' }) });

    const mediaId = await client.createDraft({ title: 'Test', content: '<p>Hello</p>', thumb_media_id: '' });
    expect(mediaId).toBe('draft-123');
  });

  it('publishDraft sends the correct request', async () => {
    mockFetch({ access_token: 'token', expires_in: 7200 });
    const client = new WechatMPClient(config);

    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ access_token: 'token', expires_in: 7200 }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ errcode: 0, errmsg: 'ok', publish_id: 'pub-456' }) });

    const result = await client.publishDraft('draft-123');
    expect(result.errcode).toBe(0);
    expect(result.publish_id).toBe('pub-456');
  });
});
