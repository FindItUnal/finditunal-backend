import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/NotificationService';
import { sendSuccess } from '../utils/responseHandler';

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  getUserNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.user_id;
      const limitParam = req.query.limit as string | undefined;
      const offsetParam = req.query.offset as string | undefined;
      const onlyUnreadParam = req.query.only_unread as string | undefined;

      const limit = limitParam ? parseInt(limitParam, 10) : undefined;
      const offset = offsetParam ? parseInt(offsetParam, 10) : undefined;
      const onlyUnread = onlyUnreadParam === 'true';

      const page = await this.notificationService.listUserNotifications(userId, {
        limit,
        offset,
        onlyUnread,
      });

      sendSuccess(res, page);
    } catch (error) {
      next(error);
    }
  };

  markNotificationAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.user_id;
      const notificationId = parseInt(req.params.notification_id, 10);

      await this.notificationService.markNotificationAsRead(userId, notificationId);

      sendSuccess(res, { message: 'Notificacion marcada como leida' });
    } catch (error) {
      next(error);
    }
  };

  markAllNotificationsAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.user_id;

      await this.notificationService.markAllNotificationsAsRead(userId);

      sendSuccess(res, { message: 'Todas las notificaciones marcadas como leidas' });
    } catch (error) {
      next(error);
    }
  };
}
