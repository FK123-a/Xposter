export class NetworkError extends Error {
  public readonly statusCode?: number;
  public readonly retryAfter?: number;

  constructor(message: string, statusCode?: number, retryAfter?: number) {
    super(message);
    this.name = 'NetworkError';
    this.statusCode = statusCode;
    this.retryAfter = retryAfter;
  }
}
