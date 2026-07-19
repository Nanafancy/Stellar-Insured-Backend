import type * as webpush from 'web-push';

export const QUEUE_NAMES = {
  EMAIL: 'email',
  PUSH: 'push',
  IPFS_PIN: 'ipfs-pin',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export interface EmailJobData {
  outboxId: string;
  to: string;
  subject: string;
  html: string;
}

export interface PushJobData {
  subscription: webpush.PushSubscription;
  payload: {
    title: string;
    body: string;
    data?: unknown;
  };
}

export interface IpfsPinJobData {
  metadata: Record<string, unknown>;
}

export const EMAIL_MAX_ATTEMPTS = 5;
