import type { IStorageRepository } from '../../domain/ports/IStorageRepository';
import type { MarkdownContent } from '../../domain/models/content';
import type { UserSettings, ApiCredentials } from '../../domain/models/settings';
import type { PublishJob, PublishResult } from '../../domain/models/publish';
import { STORAGE_KEYS, type PlatformCode } from '../../shared/constants';
import { DEFAULT_USER_SETTINGS } from '../../domain/models/settings';

export class ChromeStorageRepository implements IStorageRepository {
  // -----------------------------------------------------------------------
  // Draft management
  // -----------------------------------------------------------------------

  async saveDraft(content: MarkdownContent): Promise<void> {
    await chrome.storage.local.set({
      [STORAGE_KEYS.CURRENT_DRAFT]: JSON.stringify(content),
    });
  }

  async loadDraft(): Promise<MarkdownContent | null> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.CURRENT_DRAFT);
    const raw = result[STORAGE_KEYS.CURRENT_DRAFT];
    if (!raw) return null;
    try {
      return JSON.parse(raw as string) as MarkdownContent;
    } catch {
      return null;
    }
  }

  async deleteDraft(): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEYS.CURRENT_DRAFT);
  }

  // -----------------------------------------------------------------------
  // Settings
  // -----------------------------------------------------------------------

  async saveSettings(settings: UserSettings): Promise<void> {
    await chrome.storage.local.set({
      [STORAGE_KEYS.USER_SETTINGS]: JSON.stringify(settings),
    });
  }

  async loadSettings(): Promise<UserSettings> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.USER_SETTINGS);
    const raw = result[STORAGE_KEYS.USER_SETTINGS];
    if (!raw) return DEFAULT_USER_SETTINGS;
    try {
      return JSON.parse(raw as string) as UserSettings;
    } catch {
      return DEFAULT_USER_SETTINGS;
    }
  }

  // -----------------------------------------------------------------------
  // API credentials
  // -----------------------------------------------------------------------

  async saveApiCredentials(credentials: ApiCredentials): Promise<void> {
    const existing = await this.loadAllApiCredentials();
    existing[credentials.platform] = credentials;
    await chrome.storage.local.set({
      [STORAGE_KEYS.API_KEYS]: JSON.stringify(existing),
    });
  }

  async loadApiCredentials(platform: PlatformCode): Promise<ApiCredentials | null> {
    const all = await this.loadAllApiCredentials();
    return all[platform] ?? null;
  }

  async deleteApiCredentials(platform: PlatformCode): Promise<void> {
    const all = await this.loadAllApiCredentials();
    delete all[platform];
    await chrome.storage.local.set({
      [STORAGE_KEYS.API_KEYS]: JSON.stringify(all),
    });
  }

  private async loadAllApiCredentials(): Promise<Record<string, ApiCredentials>> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.API_KEYS);
    const raw = result[STORAGE_KEYS.API_KEYS];
    if (!raw) return {};
    try {
      return JSON.parse(raw as string) as Record<string, ApiCredentials>;
    } catch {
      return {};
    }
  }

  // -----------------------------------------------------------------------
  // Publish history
  // -----------------------------------------------------------------------

  async savePublishResult(result: PublishResult): Promise<void> {
    const history = await this.loadPublishHistory();
    history.push(result);
    await chrome.storage.local.set({
      [STORAGE_KEYS.PUBLISH_HISTORY]: JSON.stringify(history),
    });
  }

  async loadPublishHistory(): Promise<PublishResult[]> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.PUBLISH_HISTORY);
    const raw = result[STORAGE_KEYS.PUBLISH_HISTORY];
    if (!raw) return [];
    try {
      return JSON.parse(raw as string) as PublishResult[];
    } catch {
      return [];
    }
  }

  async clearPublishHistory(): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEYS.PUBLISH_HISTORY);
  }

  // -----------------------------------------------------------------------
  // Active publish jobs
  // -----------------------------------------------------------------------

  async savePublishJob(job: PublishJob): Promise<void> {
    const result = {
      ...job,
      platformResults: Array.from(job.platformResults.entries()),
    };
    await chrome.storage.local.set({
      [`${STORAGE_KEYS.DRAFT_PREFIX}job:${job.id}`]: JSON.stringify(result),
    });
  }

  async loadPublishJob(jobId: string): Promise<PublishJob | null> {
    const result = await chrome.storage.local.get(`${STORAGE_KEYS.DRAFT_PREFIX}job:${jobId}`);
    const raw = result[`${STORAGE_KEYS.DRAFT_PREFIX}job:${jobId}`];
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw as string);
      return {
        ...parsed,
        platformResults: new Map(parsed.platformResults ?? []),
      };
    } catch {
      return null;
    }
  }

  async deletePublishJob(jobId: string): Promise<void> {
    await chrome.storage.local.remove(`${STORAGE_KEYS.DRAFT_PREFIX}job:${jobId}`);
  }
}
