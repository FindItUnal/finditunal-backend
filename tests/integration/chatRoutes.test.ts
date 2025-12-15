import express, { json } from 'express';
import request from 'supertest';
import { createChatRouter } from '../../src/routes/chatRoutes';
import { ChatService } from '../../src/services/ChatService';

jest.mock('../../src/middlewares/authMiddleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { user_id: 'user-1' };
    req.body.user = { user_id: 'user-1' };
    next();
  },
}));

const setupApp = (service: ChatService) => {
  const app = express();
  app.use(json());
  app.use('/user', createChatRouter(service));
  return app;
};

const createService = () => {
  return {
    createOrGetConversation: jest.fn(),
    conversationExists: jest.fn(),
    getUserConversations: jest.fn(),
    getConversationMessages: jest.fn(),
    sendMessage: jest.fn(),
    markConversationAsRead: jest.fn(),
    deleteConversation: jest.fn(),
  } as unknown as jest.Mocked<ChatService>;
};

describe('chat routes', () => {
  it('creates or retrieves a conversation', async () => {
    const service = createService();
    service.createOrGetConversation.mockResolvedValue({
      conversation_id: 1,
    } as any);
    const app = setupApp(service);

    const response = await request(app).post('/user/user-1/reports/10/conversations');

    expect(response.status).toBe(201);
    expect(response.body.conversation_id).toBe(1);
    expect(service.createOrGetConversation).toHaveBeenCalledWith(10, 'user-1');
  });

  it('lists conversations', async () => {
    const service = createService();
    service.getUserConversations.mockResolvedValue([{ conversation_id: 1 } as any]);
    const app = setupApp(service);

    const response = await request(app).get('/user/user-1/conversations');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  it('sends messages through the service', async () => {
    const service = createService();
    service.sendMessage.mockResolvedValue({
      message: { message_id: 99 } as any,
      conversation: { conversation_id: 5 } as any,
      recipientUserId: 'user-2',
    });
    const app = setupApp(service);

    const response = await request(app)
      .post('/user/user-1/conversations/5/messages')
      .send({ message_text: 'Hola' });

    expect(response.status).toBe(201);
    expect(response.body.message_id).toBe(99);
    expect(service.sendMessage).toHaveBeenCalledWith(5, 'user-1', 'Hola');
  });

  it('marks conversations as read and deletes them', async () => {
    const service = createService();
    service.markConversationAsRead.mockResolvedValue();
    service.deleteConversation.mockResolvedValue();
    const app = setupApp(service);

    const readResponse = await request(app).post('/user/user-1/conversations/5/read');
    expect(readResponse.status).toBe(200);
    expect(service.markConversationAsRead).toHaveBeenCalledWith(5, 'user-1');

    const deleteResponse = await request(app).delete('/user/user-1/conversations/5');
    expect(deleteResponse.status).toBe(200);
    expect(service.deleteConversation).toHaveBeenCalledWith(5, 'user-1');
  });
});
