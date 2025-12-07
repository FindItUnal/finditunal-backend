import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/ChatService';
import { sendSuccess } from '../utils/responseHandler';

export class ChatController {
  constructor(private chatService: ChatService) {}

  createOrGetConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.user_id;
      const reportId = parseInt(req.params.report_id, 10);

      const conversation = await this.chatService.createOrGetConversation(reportId, userId);

      sendSuccess(res, conversation, 201);
    } catch (error) {
      next(error);
    }
  };

  conversationExists = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.user_id;
      const reportId = parseInt(req.params.report_id, 10);

      const exists = await this.chatService.conversationExists(reportId, userId);

      sendSuccess(res, { exists });
    } catch (error) {
      next(error);
    }
  };

  getUserConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.user_id;
      const conversations = await this.chatService.getUserConversations(userId);
      sendSuccess(res, conversations);
    } catch (error) {
      next(error);
    }
  };

  getConversationMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.user_id;
      const conversationId = parseInt(req.params.conversation_id, 10);

      const messages = await this.chatService.getConversationMessages(conversationId, userId);

      sendSuccess(res, messages);
    } catch (error) {
      next(error);
    }
  };

  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.user_id;
      const conversationId = parseInt(req.params.conversation_id, 10);
      const { message_text } = req.body as { message_text: string };

      const result = await this.chatService.sendMessage(conversationId, userId, message_text);

      sendSuccess(res, result.message, 201);
    } catch (error) {
      next(error);
    }
  };

  markConversationRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.user_id;
      const conversationId = parseInt(req.params.conversation_id, 10);

      await this.chatService.markConversationAsRead(conversationId, userId);

      sendSuccess(res, { message: 'Conversacion marcada como leida' });
    } catch (error) {
      next(error);
    }
  };

  deleteConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.user_id;
      const conversationId = parseInt(req.params.conversation_id, 10);

      await this.chatService.deleteConversation(conversationId, userId);

      sendSuccess(res, { message: 'Conversacion eliminada exitosamente' });
    } catch (error) {
      next(error);
    }
  };
}
