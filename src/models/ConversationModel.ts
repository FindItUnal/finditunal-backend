import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { MySQLDatabase } from '../database/mysql';
import { DatabaseError } from '../utils/errors';

export interface ConversationRecord {
  conversation_id: number;
  report_id: number;
  user1_id: string;
  user2_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface ConversationSummary {
  conversation_id: number;
  report_id: number;
  report_title: string;
  other_user_id: string;
  other_user_name: string;
  last_message_text: string | null;
  last_message_at: Date | null;
  unread_count: number;
  updated_at: Date;
}

interface InsertResult {
  insertId: number;
  affectedRows: number;
}

type DatabaseProvider = Pick<typeof MySQLDatabase, 'getInstance'>;

class ConversationModel {
  private readonly tableName = 'conversations';

  constructor(private readonly databaseProvider: DatabaseProvider = MySQLDatabase) {}

  async findByIdForUser(conversation_id: number, user_id: string): Promise<ConversationRecord | null> {
    try {
      const db = await this.databaseProvider.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>(
          `SELECT * FROM ${this.tableName} WHERE conversation_id = ? AND (user1_id = ? OR user2_id = ?)`,
          [conversation_id, user_id, user_id],
        );
        return (rows[0] as ConversationRecord) || null;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al obtener conversacion por ID:', error);
      throw new DatabaseError('Error al obtener conversacion');
    }
  }

  async findOrCreateByReportAndUsers(params: {
    report_id: number;
    owner_id: string;
    participant_id: string;
  }): Promise<{ conversation: ConversationRecord; created: boolean }> {
    const { report_id, owner_id, participant_id } = params;

    try {
      const db = await this.databaseProvider.getInstance();
      const connection = await db.getConnection();
      try {
        // Enforce deterministic ordering: user1 = owner, user2 = participant
        const user1_id = owner_id;
        const user2_id = participant_id;

        const [existingRows] = await connection.query<RowDataPacket[]>(
          `SELECT * FROM ${this.tableName} WHERE report_id = ? AND user1_id = ? AND user2_id = ? LIMIT 1`,
          [report_id, user1_id, user2_id],
        );

        if (existingRows.length > 0) {
          return { conversation: existingRows[0] as ConversationRecord, created: false };
        }

        const [result] = await connection.query<ResultSetHeader>(
          `INSERT INTO ${this.tableName} (report_id, user1_id, user2_id) VALUES (?, ?, ?)`,
          [report_id, user1_id, user2_id],
        );

        const insertResult: InsertResult = {
          insertId: result.insertId,
          affectedRows: result.affectedRows,
        };

        const [rows] = await connection.query<RowDataPacket[]>(
          `SELECT * FROM ${this.tableName} WHERE conversation_id = ?`,
          [insertResult.insertId],
        );

        return { conversation: rows[0] as ConversationRecord, created: true };
      } finally {
        connection.release();
      }
    } catch (error: any) {
      // Manejar posible carrera por UNIQUE KEY
      if (error && error.code === 'ER_DUP_ENTRY') {
        try {
          const db = await this.databaseProvider.getInstance();
          const connection = await db.getConnection();
          try {
            const [rows] = await connection.query<RowDataPacket[]>(
              `SELECT * FROM ${this.tableName} WHERE report_id = ? AND user1_id = ? AND user2_id = ? LIMIT 1`,
              [params.report_id, params.owner_id, params.participant_id],
            );
            if (rows.length > 0) {
              return { conversation: rows[0] as ConversationRecord, created: false };
            }
          } finally {
            connection.release();
          }
        } catch (innerError) {
          console.error('Error al recuperar conversacion despues de ER_DUP_ENTRY:', innerError);
        }
      }

      console.error('Error al crear u obtener conversacion:', error);
      throw new DatabaseError('Error al crear conversacion');
    }
  }

  async existsByReportAndUsers(params: { report_id: number; owner_id: string; participant_id: string }): Promise<boolean> {
    try {
      const db = await this.databaseProvider.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>(
          `SELECT conversation_id FROM ${this.tableName} WHERE report_id = ? AND user1_id = ? AND user2_id = ? LIMIT 1`,
          [params.report_id, params.owner_id, params.participant_id],
        );
        return rows.length > 0;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al verificar existencia de conversacion:', error);
      throw new DatabaseError('Error al verificar conversacion');
    }
  }

  async getConversationsByUser(user_id: string): Promise<ConversationSummary[]> {
    try {
      const db = await this.databaseProvider.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>(
          `
          SELECT
            c.conversation_id,
            c.report_id,
            r.title AS report_title,
            CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END AS other_user_id,
            CASE WHEN c.user1_id = ? THEN u2.name ELSE u1.name END AS other_user_name,
            (
              SELECT m.message_text
              FROM messages m
              WHERE m.conversation_id = c.conversation_id
              ORDER BY m.created_at DESC
              LIMIT 1
            ) AS last_message_text,
            (
              SELECT m.created_at
              FROM messages m
              WHERE m.conversation_id = c.conversation_id
              ORDER BY m.created_at DESC
              LIMIT 1
            ) AS last_message_at,
            (
              SELECT COUNT(*)
              FROM messages m
              WHERE
                m.conversation_id = c.conversation_id
                AND m.sender_id <> ?
                AND m.is_read = 0
            ) AS unread_count,
            c.updated_at
          FROM ${this.tableName} c
          JOIN users u1 ON u1.user_id = c.user1_id
          JOIN users u2 ON u2.user_id = c.user2_id
          JOIN reports r ON r.report_id = c.report_id
          WHERE c.user1_id = ? OR c.user2_id = ?
          ORDER BY
            last_message_at IS NULL,
            last_message_at DESC,
            c.updated_at DESC
          `,
          [user_id, user_id, user_id, user_id, user_id],
        );

        return rows.map((row) => ({
          conversation_id: row.conversation_id as number,
          report_id: row.report_id as number,
          report_title: row.report_title as string,
          other_user_id: row.other_user_id as string,
          other_user_name: row.other_user_name as string,
          last_message_text: (row.last_message_text as string) ?? null,
          last_message_at: (row.last_message_at as Date) ?? null,
          unread_count: Number(row.unread_count ?? 0),
          updated_at: row.updated_at as Date,
        }));
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al obtener conversaciones del usuario:', error);
      throw new DatabaseError('Error al obtener conversaciones');
    }
  }

  async touchConversation(conversation_id: number): Promise<void> {
    try {
      const db = await this.databaseProvider.getInstance();
      const connection = await db.getConnection();
      try {
        await connection.query(
          `UPDATE ${this.tableName} SET updated_at = CURRENT_TIMESTAMP WHERE conversation_id = ?`,
          [conversation_id],
        );
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al actualizar timestamp de conversacion:', error);
      throw new DatabaseError('Error al actualizar conversacion');
    }
  }

  async deleteConversation(conversation_id: number): Promise<void> {
    try {
      const db = await this.databaseProvider.getInstance();
      const connection = await db.getConnection();
      try {
        await connection.query(`DELETE FROM ${this.tableName} WHERE conversation_id = ?`, [conversation_id]);
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al eliminar conversacion:', error);
      throw new DatabaseError('Error al eliminar conversacion');
    }
  }
}

export default ConversationModel;
