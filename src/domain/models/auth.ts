import type { PlatformCode } from '../../shared/constants';

export type AuthMethod = 'api' | 'browser-session';

export interface AuthToken {
  readonly platform: PlatformCode;
  readonly method: AuthMethod;
  readonly token: string;
  readonly expiresAt?: number;
  readonly refreshToken?: string;
}

export interface AuthValidationResult {
  readonly valid: boolean;
  readonly platformCode: PlatformCode;
  readonly method: AuthMethod;
  readonly expiresAt?: number;
  readonly error?: string;
}
