import type { PlatformCode } from '../../shared/constants';
import type { IContentAdapter } from './IContentAdapter';
import type { PublishJob, PublishResult, PublishProgress } from '../models/publish';
import type { AuthValidationResult } from '../models/auth';
import type { PlatformCapabilities } from '../models/platform';

export interface IPlatformPublisher {
  readonly platformCode: PlatformCode;
  readonly supportsApi: boolean;

  /** Check if the current user session/API key is valid for publishing */
  validateCredentials(): Promise<AuthValidationResult>;

  /** Get the content adapter associated with this platform */
  getContentAdapter(): IContentAdapter;

  /** Execute the publish. Called only in real mode. */
  publish(job: PublishJob, onProgress?: (progress: PublishProgress) => void): Promise<PublishResult>;

  /** Abort an in-progress publish */
  abort(jobId: string): Promise<void>;

  /** Declarative capabilities for UI rendering and validation */
  getCapabilities(): PlatformCapabilities;
}
