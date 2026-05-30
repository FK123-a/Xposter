import type { PlatformCode } from '../../shared/constants';

export class PublishError extends Error {
  public readonly code: string;
  public readonly platformCode: PlatformCode;
  public readonly recoverable: boolean;

  constructor(message: string, platformCode: PlatformCode, code: string, recoverable: boolean) {
    super(message);
    this.name = 'PublishError';
    this.code = code;
    this.platformCode = platformCode;
    this.recoverable = recoverable;
  }
}
