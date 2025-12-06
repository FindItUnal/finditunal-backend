import { Server as SocketIOServer } from 'socket.io';
import NotificationModel, { NotificationRecord, NotificationType } from '../models/NotificationModel';

export interface CreateNotificationInput {
  user_id: string;
  type: NotificationType;
  title: string;
  message?: string | null;
  related_id?: number | null;
}

export interface NotificationPage {
  items: NotificationRecord[];
  total: number;
  unread_count: number;
  limit: number;
  offset: number;
}

export class NotificationService {
  private static io: SocketIOServer | null = null;

  constructor(private notificationModel: NotificationModel) {}

  static setSocketServer(io: SocketIOServer): void {
    NotificationService.io = io;
  }

  private emitSocketEvents(notification: NotificationRecord): void {
    if (!NotificationService.io) {
      return;
    }
    const room = `user:${notification.user_id}`;
    NotificationService.io.to(room).emit('notification:new', notification);
    NotificationService.io.to(room).emit(`notification:${notification.type}`, notification);
  }

  async notifyUser(input: CreateNotificationInput): Promise<NotificationRecord> {
    const notification = await this.notificationModel.createNotification(input);
    this.emitSocketEvents(notification);
    return notification;
  }

  async listUserNotifications(
    user_id: string,
    options?: { limit?: number; offset?: number; onlyUnread?: boolean },
  ): Promise<NotificationPage> {
    const limit = Math.min(Math.max(options?.limit ?? 20, 1), 100);
    const offset = Math.max(options?.offset ?? 0, 0);
    const onlyUnread = options?.onlyUnread ?? false;

    const [items, total, unread] = await Promise.all([
      this.notificationModel.getUserNotifications(user_id, { limit, offset, onlyUnread }),
      this.notificationModel.countUserNotifications(user_id, { onlyUnread }),
      this.notificationModel.countUserNotifications(user_id, { onlyUnread: true }),
    ]);

    return {
      items,
      total,
      unread_count: unread,
      limit,
      offset,
    };
  }

  async markNotificationAsRead(user_id: string, notification_id: number): Promise<void> {
    await this.notificationModel.markAsRead(notification_id, user_id);
  }

  async markAllNotificationsAsRead(user_id: string): Promise<void> {
    await this.notificationModel.markAllAsRead(user_id);
  }
}
