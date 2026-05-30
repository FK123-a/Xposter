import type { PlatformCode, PublishMode } from '../../shared/constants';

export interface ApiCredentials {
  readonly platform: PlatformCode;
  readonly appId: string;
  readonly appSecret: string;
  readonly accessToken?: string;
  readonly tokenExpiresAt?: number;
}

export interface UserSettings {
  readonly publishMode: PublishMode;
  readonly defaultTags: string[];
  readonly language: 'zh-CN' | 'en';
  readonly autoSaveIntervalMs: number;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  publishMode: 'simulated',
  defaultTags: [],
  language: 'zh-CN',
  autoSaveIntervalMs: 300,
};
