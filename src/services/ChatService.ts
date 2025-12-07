import ConversationModel, { ConversationRecord, ConversationSummary } from '../models/ConversationModel';
import MessageModel, { MessageRecord } from '../models/MessageModel';
import ReportModel from '../models/ReportModel';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import NotificationModel from '../models/NotificationModel';
import { NotificationService } from './NotificationService';

export interface SendMessageResult {
  message: MessageRecord;
  conversation: ConversationRecord;
  recipientUserId: string;
}

export class ChatService {
  private notificationService: NotificationService;

  constructor(
    private conversationModel: ConversationModel,
    private messageModel: MessageModel,
    private reportModel: ReportModel,
  ) {
    this.notificationService = new NotificationService(new NotificationModel());
  }

  async createOrGetConversation(reportId: number, currentUserId: string): Promise<ConversationRecord> {
    const report = await this.reportModel.getReportById(reportId);
    if (!report) {
      throw new NotFoundError('Reporte no encontrado');
    }

    const ownerId = report.user_id;
    if (ownerId === currentUserId) {
      throw new ForbiddenError('No puedes iniciar una conversacion contigo mismo');
    }

    const { conversation, created } = await this.conversationModel.findOrCreateByReportAndUsers({
      report_id: reportId,
      owner_id: ownerId,
      participant_id: currentUserId,
    });

    if (created) {
      const previewTitle = report.title.length > 80 ? `${report.title.slice(0, 77)}...` : report.title;
      await this.notificationService.notifyUser({
        user_id: ownerId,
        type: 'message',
        title: 'Nueva conversacion sobre tu publicacion',
        message: `Un usuario quiere contactarte sobre "${previewTitle}"`,
        related_id: conversation.conversation_id,
      });
    }

    return conversation;
  }

  async conversationExists(reportId: number, currentUserId: string): Promise<boolean> {
    const report = await this.reportModel.getReportById(reportId);
    if (!report) {
      throw new NotFoundError('Reporte no encontrado');
    }

    const ownerId = report.user_id;
    if (ownerId === currentUserId) {
      throw new ForbiddenError('No puedes iniciar una conversacion contigo mismo');
    }

    return this.conversationModel.existsByReportAndUsers({
      report_id: reportId,
      owner_id: ownerId,
      participant_id: currentUserId,
    });
  }

  async getUserConversations(userId: string): Promise<ConversationSummary[]> {
    return this.conversationModel.getConversationsByUser(userId);
  }

  private async getConversationForUserOrThrow(conversationId: number, userId: string): Promise<ConversationRecord> {
    const conversation = await this.conversationModel.findByIdForUser(conversationId, userId);
    if (!conversation) {
      throw new NotFoundError('Conversacion no encontrada');
    }
    return conversation;
  }

  async getConversationMessages(conversationId: number, userId: string): Promise<MessageRecord[]> {
    await this.getConversationForUserOrThrow(conversationId, userId);
    const messages = await this.messageModel.getMessagesByConversation(conversationId);
    return messages;
  }

  async sendMessage(conversationId: number, userId: string, messageText: string): Promise<SendMessageResult> {
    const conversation = await this.getConversationForUserOrThrow(conversationId, userId);

    const message = await this.messageModel.createMessage({
      conversation_id: conversationId,
      sender_id: userId,
      message_text: messageText,
    });

    await this.conversationModel.touchConversation(conversationId);

    const recipientUserId = conversation.user1_id === userId ? conversation.user2_id : conversation.user1_id;

    const preview = messageText.length > 120 ? `${messageText.slice(0, 117)}...` : messageText;

    await this.notificationService.notifyUser({
      user_id: recipientUserId,
      type: 'message',
      title: 'Nuevo mensaje recibido',
      message: preview,
      related_id: conversationId,
    });

    return {
      message,
      conversation,
      recipientUserId,
    };
  }

  async markConversationAsRead(conversationId: number, userId: string): Promise<void> {
    await this.getConversationForUserOrThrow(conversationId, userId);
    await this.messageModel.markMessagesAsRead(conversationId, userId);
  }

  async deleteConversation(conversationId: number, userId: string): Promise<void> {
    await this.getConversationForUserOrThrow(conversationId, userId);
    await this.conversationModel.deleteConversation(conversationId);
  }
}
