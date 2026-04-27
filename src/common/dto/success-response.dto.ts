/**
 * SuccessResponseDto
 *
 * Top-level shape of every successful response body.
 *
 * Example:
 * {
 *   "success": true,
 *   "data": { ... },
 *   "meta": { ... }
 * }
 */
export class SuccessResponseDto<T = unknown> {
  success: true = true;
  data: T;
  meta?: unknown;
}
