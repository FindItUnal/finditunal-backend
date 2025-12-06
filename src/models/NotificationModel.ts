import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { MySQLDatabase } from '../database/mysql';
import { DatabaseError } from '../utils/errors';

export type NotificationType = 'system' | 'report' | 'complaint' | 'message';

export interface NotificationRecord {
  notification_id: number;
  user_id: string;
  type: NotificationType;
  title: string;
  message?: string | null;
  related_id?: number | null;
  is_read: number;
  created_at: Date;
}

interface ListOptions {
  limit: number;
  offset: number;
  onlyUnread?: boolean;
}

class NotificationModel {
  private readonly tableName = 'notifications';

  async createNotification(input: {
    user_id: string;
    type: NotificationType;
    title: string;
    message?: string | null;
    related_id?: number | null;
  }): Promise<NotificationRecord> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [result] = await connection.query<ResultSetHeader>(
          `INSERT INTO ${this.tableName} (user_id, type, title, message, related_id)
           VALUES (?, ?, ?, ?, ?)`,
          [input.user_id, input.type, input.title, input.message ?? null, input.related_id ?? null],
        );

        const [rows] = await connection.query<RowDataPacket[]>(
          `SELECT * FROM ${this.tableName} WHERE notification_id = ?`,
          [result.insertId],
        );

        return rows[0] as NotificationRecord;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al crear notificacion:', error);
      throw new DatabaseError('Error al crear notificacion');
    }
  }

  async getUserNotifications(user_id: string, options: ListOptions): Promise<NotificationRecord[]> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const conditions = ['user_id = ?'];
        const params: any[] = [user_id];

        if (options.onlyUnread) {
          conditions.push('is_read = 0');
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const [rows] = await connection.query<RowDataPacket[]>(
          `SELECT * FROM ${this.tableName}
           ${whereClause}
           ORDER BY created_at DESC
           LIMIT ? OFFSET ?`,
          [...params, options.limit, options.offset],
        );
        return rows as NotificationRecord[];
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      throw new DatabaseError('Error al obtener notificaciones');
    }
  }

  async countUserNotifications(user_id: string, options?: { onlyUnread?: boolean }): Promise<number> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const conditions = ['user_id = ?'];
        const params: any[] = [user_id];

        if (options?.onlyUnread) {
          conditions.push('is_read = 0');
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const [rows] = await connection.query<RowDataPacket[]>(
          `SELECT COUNT(*) AS total FROM ${this.tableName} ${whereClause}`,
          params,
        );
        return Number(rows[0]?.total ?? 0);
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al contar notificaciones:', error);
      throw new DatabaseError('Error al contar notificaciones');
    }
  }

  async markAsRead(notification_id: number, user_id: string): Promise<void> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        await connection.query(`UPDATE ${this.tableName} SET is_read = 1 WHERE notification_id = ? AND user_id = ?`, [
          notification_id,
          user_id,
        ]);
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al marcar notificacion como leida:', error);
      throw new DatabaseError('Error al marcar notificacion como leida');
    }
  }

  async markAllAsRead(user_id: string): Promise<void> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        await connection.query(`UPDATE ${this.tableName} SET is_read = 1 WHERE user_id = ? AND is_read = 0`, [user_id]);
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leidas:', error);
      throw new DatabaseError('Error al marcar notificaciones como leidas');
    }
  }
}

export default NotificationModel;
