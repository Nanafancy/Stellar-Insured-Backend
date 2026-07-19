import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import * as webpush from 'web-push';
import { Job } from 'bull';
import { QUEUE_NAMES, PushJobData } from '../constants/queue.constants';

export interface WebPushPayload {
  title: string;
  body: string;
  data?: unknown;
}

@Injectable()
@Processor(QUEUE_NAMES.PUSH)
export class WebPushService {
  private readonly logger = new Logger(WebPushService.name);

  constructor() {
    // Note: Provide VAPID keys in .env
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        `mailto:${process.env.VAPID_SUBJECT_EMAIL || 'admin@novafund.xyz'}`,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY,
      );
    } else {
      this.logger.warn(
        'VAPID keys not set. Web push notifications will not work.',
      );
    }
  }

  /**
   * Bull processor: sends one queued web-push notification. Throwing on failure
   * lets Bull retry with backoff. Expired subscriptions (HTTP 410) are logged so
   * they can be pruned, but never crash the worker or the calling request.
   */
  @Process()
  async handlePushJob(job: Job<PushJobData>): Promise<void> {
    const { subscription, payload } = job.data;

    if (!process.env.VAPID_PUBLIC_KEY) {
      this.logger.warn('VAPID keys not set. Web push notification skipped.');
      return;
    }

    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      this.logger.log(
        `Push notification sent to endpoint: ${subscription.endpoint}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      // HTTP 410 = subscription no longer valid; stop retrying this endpoint.
      const statusCode = (error as { statusCode?: number })?.statusCode;
      if (statusCode === 410) {
        this.logger.warn(
          `Web push subscription expired (410) for ${subscription.endpoint}; skipping.`,
        );
        return;
      }
      this.logger.error(`Failed to send push notification: ${message}`);
      throw error;
    }
  }
}
