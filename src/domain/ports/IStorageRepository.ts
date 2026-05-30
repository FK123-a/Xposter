import type { MarkdownContent } from '../models/content';
import type { UserSettings, ApiCredentials } from '../models/settings';
import type { PublishJob, PublishResult } from '../models/publish';
import type { PlatformCode } from '../../shared/constants';

export interface IStorageRepository {
  /** Draft management */
  saveDraft(content: MarkdownContent): Promise<void>;
  loadDraft(): Promise<MarkdownContent | null>;
  deleteDraft(): Promise<void>;

  /** Settings */
  saveSettings(settings: UserSettings): Promise<void>;
  loadSettings(): Promise<UserSettings>;

  /** API credentials */
  saveApiCredentials(credentials: ApiCredentials): Promise<void>;
  loadApiCredentials(platform: PlatformCode): Promise<ApiCredentials | null>;
  deleteApiCredentials(platform: PlatformCode): Promise<void>;

  /** Publish history */
  savePublishResult(result: PublishResult): Promise<void>;
  loadPublishHistory(): Promise<PublishResult[]>;
  clearPublishHistory(): Promise<void>;

  /** Active publish jobs */
  savePublishJob(job: PublishJob): Promise<void>;
  loadPublishJob(jobId: string): Promise<PublishJob | null>;
  deletePublishJob(jobId: string): Promise<void>;
}
