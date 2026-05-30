/**
 * Platform identifiers
 */
export const PlatformCodes = [
  'wechat-mp',
  'zhihu',
  'bilibili',
  'xiaohongshu',
] as const;

export type PlatformCode = (typeof PlatformCodes)[number];

export const PLATFORM_DISPLAY_NAMES: Record<PlatformCode, string> = {
  'wechat-mp': 'WeChat Official Account',
  zhihu: 'Zhihu',
  bilibili: 'Bilibili',
  xiaohongshu: 'RED (Xiaohongshu)',
};

export const PLATFORM_LIMITS: Record<
  PlatformCode,
  {
    maxTitleLength: number;
    maxContentLength: number;
    maxImageSizeMB: number;
    supportedImageFormats: string[];
    requiresTags: boolean;
    maxTags: number;
    requiresCover: boolean;
  }
> = {
  'wechat-mp': {
    maxTitleLength: 64, maxContentLength: 0, maxImageSizeMB: 10,
    supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif'],
    requiresTags: false, maxTags: 0, requiresCover: true,
  },
  zhihu: {
    maxTitleLength: 100, maxContentLength: 0, maxImageSizeMB: 20,
    supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    requiresTags: true, maxTags: 5, requiresCover: true,
  },
  bilibili: {
    maxTitleLength: 80, maxContentLength: 250, maxImageSizeMB: 5,
    supportedImageFormats: ['jpg', 'jpeg', 'png'],
    requiresTags: true, maxTags: 10, requiresCover: true,
  },
  xiaohongshu: {
    maxTitleLength: 20, maxContentLength: 1000, maxImageSizeMB: 20,
    supportedImageFormats: ['jpg', 'jpeg', 'png', 'webp'],
    requiresTags: true, maxTags: 10, requiresCover: false,
  },
};

export const PLATFORM_PUBLISH_URLS: Record<PlatformCode, string> = {
  'wechat-mp': 'https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=10&isMul=1',
  zhihu: 'https://zhuanlan.zhihu.com/write',
  bilibili: 'https://member.bilibili.com/platform/upload/video/frame',
  xiaohongshu: 'https://creator.xiaohongshu.com/publish/publish',
};

export const PLATFORM_COLORS: Record<PlatformCode, string> = {
  'wechat-mp': '#07C160',
  zhihu: '#0066FF',
  bilibili: '#FB7299',
  xiaohongshu: '#FF3B30',
};

export const PublishModes = ['real', 'simulated'] as const;
export type PublishMode = (typeof PublishModes)[number];

export const PublishStatuses = [
  'pending', 'adapting', 'uploading_images', 'publishing',
  'published', 'failed', 'aborted',
] as const;
export type PublishStatus = (typeof PublishStatuses)[number];

export const CONTENT_SCRIPT_ENTRIES: Record<PlatformCode, string> = {
  'wechat-mp': 'platforms/wechat.content.js',
  zhihu: 'platforms/zhihu.content.js',
  bilibili: 'platforms/bilibili.content.js',
  xiaohongshu: 'platforms/xiaohongshu.content.js',
} as const;

export const STORAGE_KEYS = {
  CURRENT_DRAFT: 'draft:current',
  DRAFT_PREFIX: 'draft:',
  API_KEYS: 'settings:apiKeys',
  USER_SETTINGS: 'settings:user',
  PUBLISH_HISTORY: 'publish:history',
} as const;
