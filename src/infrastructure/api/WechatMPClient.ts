/**
 * WeChat Official Account (公众号) REST API client.
 *
 * API flow: getAccessToken → createDraft → uploadImage → publishDraft
 *
 * Docs: https://developers.weixin.qq.com/doc/offiaccount/Draft_Box/Add_draft.html
 */
import type { PlatformCode } from '../../shared/constants';

const API_BASE = 'https://api.weixin.qq.com/cgi-bin';

export interface WechatMPConfig {
  appId: string;
  appSecret: string;
}

export interface DraftArticle {
  title: string;
  content: string;        // Rich HTML
  thumb_media_id: string; // Cover image media ID
  need_open_comment?: 0 | 1;
  only_fans_can_comment?: 0 | 1;
}

export interface PublishResult {
  publish_id?: string;
  errcode: number;
  errmsg: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  errcode?: number;
  errmsg?: string;
}

interface MediaUploadResponse {
  media_id: string;
  url?: string;
  errcode?: number;
  errmsg?: string;
}

export class WechatMPClient {
  readonly platformCode: PlatformCode = 'wechat-mp';

  private config: WechatMPConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: WechatMPConfig) {
    this.config = config;
  }

  // -----------------------------------------------------------------------
  // Authentication
  // -----------------------------------------------------------------------

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 300000) {
      return this.accessToken;
    }

    const url = `${API_BASE}/token?grant_type=client_credential&appid=${this.config.appId}&secret=${this.config.appSecret}`;
    const res = await this.request<TokenResponse>(url);

    if (res.errcode) {
      throw new Error(`WeChat auth failed: ${res.errmsg} (code ${res.errcode})`);
    }

    this.accessToken = res.access_token;
    this.tokenExpiresAt = Date.now() + res.expires_in * 1000;
    return this.accessToken;
  }

  /** Check if the current API credentials are valid */
  async validateCredentials(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch {
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // Draft management
  // -----------------------------------------------------------------------

  async createDraft(article: DraftArticle): Promise<string> {
    const token = await this.getAccessToken();
    const url = `${API_BASE}/draft/add?access_token=${token}`;

    const body = JSON.stringify({ articles: [article] });
    const res = await this.request<{ media_id: string; errcode?: number; errmsg?: string }>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (res.errcode) {
      throw new Error(`Draft creation failed: ${res.errmsg || 'unknown'} (code ${res.errcode})`);
    }

    return res.media_id;
  }

  // -----------------------------------------------------------------------
  // Image / media upload
  // -----------------------------------------------------------------------

  async uploadImage(file: Blob, fileName: string): Promise<string> {
    const token = await this.getAccessToken();
    const url = `${API_BASE}/media/uploadimg?access_token=${token}`;

    const formData = new FormData();
    formData.append('media', file, fileName);

    const res = await this.request<MediaUploadResponse>(url, {
      method: 'POST',
      body: formData,
    });

    if (res.errcode) {
      throw new Error(`Image upload failed: ${res.errmsg || 'unknown'} (code ${res.errcode})`);
    }

    return res.media_id;
  }

  /** Upload permanent material (for cover images) */
  async uploadPermanentMaterial(file: Blob, fileName: string, type: 'image' | 'thumb'): Promise<{ mediaId: string; url?: string }> {
    const token = await this.getAccessToken();
    const url = `${API_BASE}/material/add_material?access_token=${token}&type=${type}`;

    const formData = new FormData();
    formData.append('media', file, fileName);

    const res = await this.request<MediaUploadResponse>(url, {
      method: 'POST',
      body: formData,
    });

    if (res.errcode) {
      throw new Error(`Material upload failed: ${res.errmsg || 'unknown'} (code ${res.errcode})`);
    }

    return { mediaId: res.media_id, url: res.url };
  }

  // -----------------------------------------------------------------------
  // Publish
  // -----------------------------------------------------------------------

  async publishDraft(mediaId: string): Promise<PublishResult> {
    const token = await this.getAccessToken();
    const url = `${API_BASE}/freepublish/submit?access_token=${token}`;

    const body = JSON.stringify({ media_id: mediaId });
    return this.request<PublishResult>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  }

  /** Get the published article URL (approximate; WeChat doesn't return it directly) */
  async getPublishedArticle(articleId: string): Promise<string | null> {
    const token = await this.getAccessToken();
    const url = `${API_BASE}/freepublish/getarticle?access_token=${token}`;
    const body = JSON.stringify({ article_id: articleId });
    const res = await this.request<{ news_detail: { url: string }[]; errcode?: number }>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (res.errcode || !res.news_detail?.length) return null;
    return res.news_detail[0]!.url;
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }
}
