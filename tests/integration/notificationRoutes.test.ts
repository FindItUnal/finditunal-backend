import express, { json } from 'express';
import request from 'supertest';
import { createNotificationRouter } from '../../src/routes/notificationRoutes';
import NotificationModel, { NotificationRecord } from '../../src/models/NotificationModel';

jest.mock('../../src/middlewares/authMiddleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { user_id: 'user-1' };
    next();
  },
}));

const createModel = () => {
  return {
    getUserNotifications: jest.fn(),
    countUserNotifications: jest.fn(),
    createNotification: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  } as unknown as jest.Mocked<NotificationModel>;
};

const setupApp = (model: NotificationModel) => {
  const app = express();
  app.use(json());
  app.use('/user', createNotificationRouter(model));
  return app;
};

describe('notification routes', () => {
  it('lists notifications with pagination options', async () => {
    const model = createModel();
    model.getUserNotifications.mockResolvedValue([
      {
        notification_id: 1,
        user_id: 'user-1',
        type: 'message',
        title: 'Hola',
        message: 'Test',
        related_id: 1,
        is_read: 0,
        created_at: new Date(),
      } as NotificationRecord,
    ]);
    model.countUserNotifications.mockResolvedValueOnce(10).mockResolvedValueOnce(3);

    const app = setupApp(model);

    const response = await request(app).get('/user/user-1/notifications?limit=5&offset=0');

    expect(response.status).toBe(200);
    expect(model.getUserNotifications).toHaveBeenCalledWith('user-1', {
      limit: 5,
      offset: 0,
      onlyUnread: false,
    });
    expect(response.body.total).toBe(10);
    expect(response.body.unread_count).toBe(3);
  });

  it('marks individual and all notifications as read', async () => {
    const model = createModel();
    model.getUserNotifications.mockResolvedValue([]);
    model.countUserNotifications.mockResolvedValue(0);
    const app = setupApp(model);

    const single = await request(app).post('/user/user-1/notifications/55/read');
    expect(single.status).toBe(200);
    expect(model.markAsRead).toHaveBeenCalledWith(55, 'user-1');

    const all = await request(app).post('/user/user-1/notifications/read-all');
    expect(all.status).toBe(200);
    expect(model.markAllAsRead).toHaveBeenCalledWith('user-1');
  });
});
