import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as webpush from 'web-push';
import { PrismaService } from '../../prisma.service';
import { EmailService } from './email.service';
import { WebPushService } from './web-push.service';
import { NotificationType } from '../enums/notification-type.enum';
import { validateEnum } from '../../common/validators/enum.validator';
import { UserService } from '../../user/user.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly webPushService: WebPushService,
    private readonly userService: UserService,
  ) {}

  async notify(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Prisma.InputJsonValue,
  ): Promise<void> {
    // Validate notification type at runtime
    validateEnum(NotificationType, type, 'NotificationType');

    let contactData;
    try {
      contactData = await this.userService.getDecryptedContact(userId);
    } catch {
      this.logger.warn(`User ${userId} not found for notification`);
      return;
    }

    // Default settings if none exist
    const settings = contactData.notificationSettings || {
      emailEnabled: true,
      pushEnabled: false,
      notifyContributions: true,
      notifyMilestones: true,
      notifyDeadlines: true,
    };

    // Check specific preferences
    if (type === 'CONTRIBUTION' && !settings.notifyContributions) return;
    if (type === 'MILESTONE' && !settings.notifyMilestones) return;
    if (type === 'DEADLINE' && !settings.notifyDeadlines) return;

    // Save notification to history
    await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data,
      },
    });

    // Dispatch via Email
    if (settings.emailEnabled && contactData.email) {
      try {
        await this.emailService.sendEmail(
          contactData.email,
          title,
          `<p>${message}</p>`,
        );
      } catch {
        this.logger.error(
          `Failed to send email to ${contactData.email} for notification ${title}`,
        );
      }
    }

    // Dispatch via Web Push
    const pushSubscription = this.getPushSubscription(contactData.pushSubscription);
    if (settings.pushEnabled && pushSubscription) {
      try {
        await this.webPushService.sendNotification(pushSubscription, {
          title,
          body: message,
          data,
        });
      } catch {
        this.logger.error(`Failed to send web push for user ${userId}`);
      }
    }
  }

  private getPushSubscription(
    value: Prisma.JsonValue | null,
  ): webpush.PushSubscription | null {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value) as unknown;
        return this.isPushSubscription(parsed) ? parsed : null;
      } catch {
        return null;
      }
    }

    return this.isPushSubscription(value) ? value : null;
  }

  private isPushSubscription(
    value: unknown,
  ): value is webpush.PushSubscription {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const candidate = value as Partial<webpush.PushSubscription>;
    return typeof candidate.endpoint === 'string' && Boolean(candidate.keys);
  }
}
