import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: unknown;
}

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<unknown> | unknown> {
    return next.handle().pipe(map((body) => this.formatResponse(body)));
  }

  private formatResponse(body: unknown): unknown {
    if (
      body &&
      typeof body === 'object' &&
      !Array.isArray(body) &&
      'success' in body &&
      typeof (body as any).success === 'boolean'
    ) {
      return body;
    }

    if (
      body &&
      typeof body === 'object' &&
      !Array.isArray(body) &&
      'data' in body &&
      'meta' in body
    ) {
      const { data, meta } = body as any;
      return { success: true, data: this.stripSoftDeleteMetadata(data), meta };
    }

    return { success: true, data: this.stripSoftDeleteMetadata(body) };
  }

  /**
   * Removes the internal `deletedAt` soft-delete marker from response
   * payloads so it never leaks through the public API. Only plain objects
   * and arrays are traversed; class instances (Date, Prisma.Decimal, ...)
   * are returned untouched.
   */
  private stripSoftDeleteMetadata(value: unknown, depth = 0): unknown {
    if (depth > 10 || value === null || typeof value !== 'object') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map(item => this.stripSoftDeleteMetadata(item, depth + 1));
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      return value;
    }

    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (key === 'deletedAt') {
        continue;
      }
      result[key] = this.stripSoftDeleteMetadata(entry, depth + 1);
    }

    return result;
  }
}
