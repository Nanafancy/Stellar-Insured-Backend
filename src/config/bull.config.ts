import { ConfigService } from '@nestjs/config';
import { BullModuleOptions } from '@nestjs/bull';

/**
 * Builds a shared Bull connection config from environment variables.
 * Falls back to the local Redis defaults already defined in .env.example.
 */
export function bullConfig(config: ConfigService): BullModuleOptions {
  const redisUrl = config.get<string>('REDIS_URL', 'redis://localhost:6379');
  const password = config.get<string>('REDIS_PASSWORD');
  const db = config.get<number>('REDIS_DB', 0);

  return {
    redis: {
      url: redisUrl,
      ...(password ? { password } : {}),
      db,
    },
  };
}
