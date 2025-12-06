import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { MySQLDatabase } from '../database/mysql';
import { DatabaseError } from '../utils/errors';

export interface ActivityLogRecord {
  activity_id: number;
  event_type: string;
  actor_user_id: string | null;
  target_type: string;
  target_id: string | null;
  title: string;
  description: string | null;
  metadata: any | null;
  created_at: Date;
}

interface GetActivitiesParams {
  limit: number;
  offset: number;
}

class ActivityLogModel {
  private readonly tableName = 'activity_log';

  async createActivity(input: {
    event_type: string;
    actor_user_id?: string | null;
    target_type: string;
    target_id?: string | number | null;
    title: string;
    description?: string | null;
    metadata?: any;
  }): Promise<void> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const targetIdValue =
          input.target_id === undefined || input.target_id === null ? null : String(input.target_id);

        const metadataValue =
          input.metadata === undefined || input.metadata === null ? null : JSON.stringify(input.metadata);

        await connection.query<ResultSetHeader>(
          `INSERT INTO ${this.tableName} 
             (event_type, actor_user_id, target_type, target_id, title, description, metadata)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            input.event_type,
            input.actor_user_id ?? null,
            input.target_type,
            targetIdValue,
            input.title,
            input.description ?? null,
            metadataValue,
          ],
        );
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al crear registro de actividad:', error);
      throw new DatabaseError('Error al registrar actividad');
    }
  }

  async getActivities(params: GetActivitiesParams): Promise<ActivityLogRecord[]> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>(
          `SELECT activity_id, event_type, actor_user_id, target_type, target_id, title, description, metadata, created_at
           FROM ${this.tableName}
           ORDER BY created_at DESC
           LIMIT ? OFFSET ?`,
          [params.limit, params.offset],
        );

        return rows.map((row) => {
          let metadata: any = null;
          if (row.metadata !== undefined && row.metadata !== null) {
            try {
              metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata as string) : (row.metadata as any);
            } catch {
              metadata = null;
            }
          }

          return {
            activity_id: row.activity_id as number,
            event_type: row.event_type as string,
            actor_user_id: (row.actor_user_id as string) ?? null,
            target_type: row.target_type as string,
            target_id: (row.target_id as string) ?? null,
            title: row.title as string,
            description: (row.description as string) ?? null,
            metadata,
            created_at: row.created_at as Date,
          };
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al obtener actividad:', error);
      throw new DatabaseError('Error al obtener actividad');
    }
  }

  async countActivities(): Promise<number> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM ${this.tableName}`);
        const row = rows[0] as RowDataPacket;
        return Number(row.total ?? 0);
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al contar actividad:', error);
      throw new DatabaseError('Error al contar actividad');
    }
  }
}

export default ActivityLogModel;
