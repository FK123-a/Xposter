/**
 * Platform identifiers
 */
export const PlatformCodes = [
  'zhihu',
  'bilibili',
  'xiaohongshu',
] as const;

export type PlatformCode = (typeof PlatformCodes)[number];

export const PLATFORM_DISPLAY_NAMES: Record<PlatformCode, string> = {
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
  zhihu: 'https://zhuanlan.zhihu.com/write',
  bilibili: 'https://member.bilibili.com/platform/upload/text/new-edit',
  xiaohongshu: 'https://creator.xiaohongshu.com/publish/publish?from=menu&target=article',
};

export const PLATFORM_COLORS: Record<PlatformCode, string> = {
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
  zhihu: 'content-scripts/zhihu.content.js',
  bilibili: 'content-scripts/bilibili.content.js',
  xiaohongshu: 'content-scripts/xiaohongshu.content.js',
} as const;

export const STORAGE_KEYS = {
  CURRENT_DRAFT: 'draft:current',
  DRAFT_PREFIX: 'draft:',
  API_KEYS: 'settings:apiKeys',
  USER_SETTINGS: 'settings:user',
  PUBLISH_HISTORY: 'publish:history',
} as const;
