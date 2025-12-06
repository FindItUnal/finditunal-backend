import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { MySQLDatabase } from '../database/mysql';
import { DatabaseError } from '../utils/errors';

export interface MessageRecord {
  message_id: number;
  conversation_id: number;
  sender_id: string;
  message_text: string;
  is_read: number;
  created_at: Date;
}

class MessageModel {
  private readonly tableName = 'messages';

  async createMessage(input: {
    conversation_id: number;
    sender_id: string;
    message_text: string;
  }): Promise<MessageRecord> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [result] = await connection.query<ResultSetHeader>(
          `INSERT INTO ${this.tableName} (conversation_id, sender_id, message_text) VALUES (?, ?, ?)`,
          [input.conversation_id, input.sender_id, input.message_text],
        );

        const [rows] = await connection.query<RowDataPacket[]>(`SELECT * FROM ${this.tableName} WHERE message_id = ?`, [
          result.insertId,
        ]);

        return rows[0] as MessageRecord;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al crear mensaje:', error);
      throw new DatabaseError('Error al crear mensaje');
    }
  }

  async getMessagesByConversation(conversation_id: number): Promise<MessageRecord[]> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>(
          `SELECT * FROM ${this.tableName} WHERE conversation_id = ? ORDER BY created_at ASC`,
          [conversation_id],
        );
        return rows as MessageRecord[];
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al obtener mensajes de la conversacion:', error);
      throw new DatabaseError('Error al obtener mensajes');
    }
  }

  async markMessagesAsRead(conversation_id: number, reader_user_id: string): Promise<void> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        await connection.query(
          `UPDATE ${this.tableName}
           SET is_read = 1
           WHERE conversation_id = ? AND sender_id <> ? AND is_read = 0`,
          [conversation_id, reader_user_id],
        );
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al marcar mensajes como leidos:', error);
      throw new DatabaseError('Error al marcar mensajes como leidos');
    }
  }
}

export default MessageModel;
