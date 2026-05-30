import type { PlatformCode } from '../../shared/constants';

export interface PlatformCapabilities {
  readonly supportsArticle: boolean;
  readonly supportsVideo: boolean;
  readonly maxTitleLength: number;
  readonly maxContentLength: number;
  readonly maxImageSizeMB: number;
  readonly supportedImageFormats: string[];
  readonly supportsDraft: boolean;
  readonly supportsSchedule: boolean;
  readonly requiresTags: boolean;
  readonly maxTags: number;
  readonly requiresCover: boolean;
}

export interface PlatformConfig {
  readonly code: PlatformCode;
  readonly name: string;
  readonly icon: string;
  readonly color: string;
  readonly publishUrl: string;
  readonly contentScriptEntry: string;
  readonly capabilities: PlatformCapabilities;
}

export function createPlatformConfig(
  code: PlatformCode,
  overrides: {
    name: string;
    icon: string;
    color: string;
    publishUrl: string;
    contentScriptEntry: string;
    capabilities: PlatformCapabilities;
  },
): PlatformConfig {
  return { code, ...overrides };
}
