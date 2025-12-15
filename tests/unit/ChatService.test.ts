import { ChatService } from '../../src/services/ChatService';
import ConversationModel, { ConversationRecord } from '../../src/models/ConversationModel';
import MessageModel, { MessageRecord } from '../../src/models/MessageModel';
import ReportModel, { Report } from '../../src/models/ReportModel';
import { NotificationService } from '../../src/services/NotificationService';
import { ForbiddenError, NotFoundError } from '../../src/utils/errors';

const baseReport: Report = {
  report_id: 10,
  user_id: 'owner-1',
  category_id: 1,
  location_id: 1,
  title: 'Objeto perdido en biblioteca',
  description: 'Descripcion',
  status: 'perdido',
  date_lost_or_found: new Date('2024-01-01T00:00:00Z'),
  contact_method: 'email',
  created_at: new Date('2024-01-01T00:00:00Z'),
  updated_at: new Date('2024-01-01T00:00:00Z'),
};

const baseConversation: ConversationRecord = {
  conversation_id: 1,
  report_id: 10,
  user1_id: 'owner-1',
  user2_id: 'participant-1',
  created_at: new Date('2024-01-01T00:00:00Z'),
  updated_at: new Date('2024-01-01T00:00:00Z'),
};

const baseMessage: MessageRecord = {
  message_id: 20,
  conversation_id: 1,
  sender_id: 'participant-1',
  message_text: 'Hola, me interesa el objeto',
  is_read: 0,
  created_at: new Date('2024-01-02T00:00:00Z'),
};

const createChatService = () => {
  const conversationModel = {
    findOrCreateByReportAndUsers: jest.fn(),
    existsByReportAndUsers: jest.fn(),
    getConversationsByUser: jest.fn(),
    findByIdForUser: jest.fn(),
    touchConversation: jest.fn(),
    deleteConversation: jest.fn(),
  };

  const messageModel = {
    createMessage: jest.fn(),
    getMessagesByConversation: jest.fn(),
    markMessagesAsRead: jest.fn(),
  };

  const reportModel = {
    getReportById: jest.fn(),
  };

  const notificationService = {
    notifyUser: jest.fn(),
  };

  const chatService = new ChatService(
    conversationModel as unknown as ConversationModel,
    messageModel as unknown as MessageModel,
    reportModel as unknown as ReportModel,
    notificationService as unknown as NotificationService,
  );

  return { chatService, conversationModel, messageModel, reportModel, notificationService };
};

describe('ChatService', () => {
  describe('createOrGetConversation', () => {
    it('throws NotFoundError if the report does not exist', async () => {
      const { chatService, reportModel } = createChatService();
      reportModel.getReportById.mockResolvedValueOnce(null);

      await expect(chatService.createOrGetConversation(10, 'participant-1')).rejects.toBeInstanceOf(NotFoundError);
    });

    it('throws ForbiddenError if the user owns the report', async () => {
      const { chatService, reportModel } = createChatService();
      reportModel.getReportById.mockResolvedValueOnce(baseReport);

      await expect(chatService.createOrGetConversation(baseReport.report_id, baseReport.user_id)).rejects.toBeInstanceOf(
        ForbiddenError,
      );
    });

    it('notifies the report owner when a new conversation is created', async () => {
      const { chatService, reportModel, conversationModel, notificationService } = createChatService();

      const longTitle = 'Titulo'.repeat(20);
      reportModel.getReportById.mockResolvedValueOnce({ ...baseReport, title: longTitle });
      const conversation = { ...baseConversation, conversation_id: 99 };
      conversationModel.findOrCreateByReportAndUsers.mockResolvedValueOnce({ conversation, created: true });

      const result = await chatService.createOrGetConversation(conversation.report_id, 'participant-1');

      expect(result).toEqual(conversation);
      expect(notificationService.notifyUser).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: baseReport.user_id,
          type: 'message',
          related_id: conversation.conversation_id,
          message: expect.stringContaining('Titulo'),
        }),
      );
    });
  });

  describe('sendMessage', () => {
    it('persists message, updates conversation and notifies recipient', async () => {
      const { chatService, conversationModel, messageModel, notificationService } = createChatService();

      conversationModel.findByIdForUser.mockResolvedValueOnce(baseConversation);
      messageModel.createMessage.mockResolvedValueOnce({ ...baseMessage, message_text: 'Hola'.repeat(50) });

      const result = await chatService.sendMessage(baseConversation.conversation_id, 'participant-1', 'Hola'.repeat(50));

      expect(messageModel.createMessage).toHaveBeenCalledWith({
        conversation_id: baseConversation.conversation_id,
        sender_id: 'participant-1',
        message_text: 'Hola'.repeat(50),
      });
      expect(conversationModel.touchConversation).toHaveBeenCalledWith(baseConversation.conversation_id);
      expect(notificationService.notifyUser).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: baseConversation.user1_id,
          related_id: baseConversation.conversation_id,
        }),
      );
      expect(result.recipientUserId).toBe(baseConversation.user1_id);
      expect(result.message.message_text).toHaveLength('Hola'.repeat(50).length);
    });

    it('throws NotFoundError when the conversation does not belong to the user', async () => {
      const { chatService, conversationModel } = createChatService();
      conversationModel.findByIdForUser.mockResolvedValueOnce(null);

      await expect(chatService.sendMessage(1, 'unknown', 'hola')).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
