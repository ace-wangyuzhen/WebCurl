export type ErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_URL"
  | "UNSUPPORTED_PROTOCOL"
  | "REQUEST_TIMEOUT"
  | "REQUEST_ABORTED"
  | "RESPONSE_TOO_LARGE"
  | "UPSTREAM_CONNECTION_ERROR"
  | "UPSTREAM_RESPONSE_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}
