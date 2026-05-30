import type { PlatformCode } from '../../shared/constants';

export class PlatformAuthError extends Error {
  public readonly platformCode: PlatformCode;
  public readonly detail: string;

  constructor(message: string, platformCode: PlatformCode, detail: string) {
    super(message);
    this.name = 'PlatformAuthError';
    this.platformCode = platformCode;
    this.detail = detail;
  }
}
