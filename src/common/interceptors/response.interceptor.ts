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
      return { success: true, data, meta };
    }

    return { success: true, data: body };
  }
}
