import { NotificationService } from '../../src/services/NotificationService';
import NotificationModel, { NotificationRecord } from '../../src/models/NotificationModel';
import { Server as SocketIOServer } from 'socket.io';

const createService = () => {
  const notificationModel = {
    createNotification: jest.fn(),
    getUserNotifications: jest.fn(),
    countUserNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  };

  const service = new NotificationService(notificationModel as unknown as NotificationModel);
  return { service, notificationModel };
};

const mockSocketServer = () => {
  const emit = jest.fn();
  const io = {
    to: jest.fn().mockReturnValue({
      emit,
    }),
  };
  NotificationService.setSocketServer(io as unknown as SocketIOServer);
  return { io, emit };
};

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates and emits notifications', async () => {
    const { service, notificationModel } = createService();
    const { io, emit } = mockSocketServer();

    const record: NotificationRecord = {
      notification_id: 1,
      user_id: 'user-1',
      type: 'message',
      title: 'Hola',
      message: 'Test',
      related_id: 10,
      is_read: 0,
      created_at: new Date(),
    };

    notificationModel.createNotification.mockResolvedValue(record);

    const result = await service.notifyUser({
      user_id: 'user-1',
      type: 'message',
      title: 'Hola',
      message: 'Test',
      related_id: 10,
    });

    expect(result).toEqual(record);
    expect(notificationModel.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1' }),
    );
    expect(io.to).toHaveBeenCalledWith('user:user-1');
    expect(emit).toHaveBeenCalledWith('notification:new', record);
    expect(emit).toHaveBeenCalledWith('notification:message', record);
  });

  it('paginates and counts notifications with clamped options', async () => {
    const { service, notificationModel } = createService();
    mockSocketServer();

    notificationModel.getUserNotifications.mockResolvedValue([]);
    notificationModel.countUserNotifications.mockResolvedValueOnce(5).mockResolvedValueOnce(2);

    const result = await service.listUserNotifications('user-1', { limit: 500, offset: -10, onlyUnread: true });

    expect(notificationModel.getUserNotifications).toHaveBeenCalledWith('user-1', {
      limit: 100,
      offset: 0,
      onlyUnread: true,
    });
    expect(notificationModel.countUserNotifications).toHaveBeenNthCalledWith(1, 'user-1', { onlyUnread: true });
    expect(notificationModel.countUserNotifications).toHaveBeenNthCalledWith(2, 'user-1', { onlyUnread: true });
    expect(result).toEqual({
      items: [],
      total: 5,
      unread_count: 2,
      limit: 100,
      offset: 0,
    });
  });

  it('marks notifications as read', async () => {
    const { service, notificationModel } = createService();
    mockSocketServer();

    await service.markNotificationAsRead('user-1', 99);
    expect(notificationModel.markAsRead).toHaveBeenCalledWith(99, 'user-1');

    await service.markAllNotificationsAsRead('user-1');
    expect(notificationModel.markAllAsRead).toHaveBeenCalledWith('user-1');
  });
});
