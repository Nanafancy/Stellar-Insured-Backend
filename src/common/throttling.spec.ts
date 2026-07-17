import {
  Controller,
  Get,
  INestApplication,
  Module,
  Post,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { SkipThrottle, Throttle, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { AppThrottlerGuard } from '../auth/guards/app-throttler.guard';
import { AllExceptionsFilter } from './filters/http-exception.filter';
import { ErrorCode } from './enums/error-codes.enum';

@Controller('auth-probe')
@SkipThrottle({ default: true })
@Throttle({ auth: {} })
class AuthProbeController {
  @Post()
  create() {
    return { ok: true };
  }
}

@Controller('general-probe')
@SkipThrottle({ auth: true })
@Throttle({ default: {} })
class GeneralProbeController {
  @Get()
  list() {
    return { ok: true };
  }
}

@Controller('public-probe')
@SkipThrottle({ auth: true })
class PublicProbeController {
  @Get()
  hello() {
    return { ok: true };
  }

  @SkipThrottle({ default: true, auth: true })
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'default', ttl: 60_000, limit: 3 },
        { name: 'auth', ttl: 60_000, limit: 2 },
      ],
    }),
  ],
  controllers: [
    AuthProbeController,
    GeneralProbeController,
    PublicProbeController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
class ThrottlingProbeModule {}

describe('Global rate limiting (issue #409)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ThrottlingProbeModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 429 via AllExceptionsFilter after the auth throttler limit', async () => {
    await request(app.getHttpServer()).post('/auth-probe').expect(201);
    await request(app.getHttpServer()).post('/auth-probe').expect(201);

    const blocked = await request(app.getHttpServer())
      .post('/auth-probe')
      .expect(429);

    expect(blocked.body).toMatchObject({
      success: false,
      error: {
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests. Please slow down and try again later.',
      },
    });
    expect(blocked.body.error).not.toHaveProperty('statusCode');
  });

  it('returns 429 after the default throttler limit on general endpoints', async () => {
    await request(app.getHttpServer()).get('/general-probe').expect(200);
    await request(app.getHttpServer()).get('/general-probe').expect(200);
    await request(app.getHttpServer()).get('/general-probe').expect(200);

    const blocked = await request(app.getHttpServer())
      .get('/general-probe')
      .expect(429);

    expect(blocked.body).toMatchObject({
      success: false,
      error: {
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
      },
    });
  });

  it('keeps public routes reachable under the default limiter', async () => {
    await request(app.getHttpServer()).get('/public-probe').expect(200);
    await request(app.getHttpServer()).get('/public-probe/health').expect(200);
  });
});
