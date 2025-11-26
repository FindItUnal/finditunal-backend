import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { MySQLDatabase } from '../database/mysql';
import { DatabaseError } from '../utils/errors';

export type ComplaintReason = 'spam' | 'inappropriate' | 'fraud' | 'other';
export type ComplaintStatus = 'pending' | 'in_review' | 'resolved' | 'rejected';

export interface ComplaintRecord {
  complaint_id: number;
  report_id: number;
  reporter_user_id: string;
  reason: ComplaintReason;
  description?: string | null;
  status: ComplaintStatus;
  admin_notes?: string | null;
  resolved_by?: string | null;
  resolved_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface InsertResult {
  insertId: number;
  affectedRows: number;
}

class ComplaintModel {
  private readonly tableName = 'complaints';

  async createComplaint(input: {
    report_id: number;
    reporter_user_id: string;
    reason: ComplaintReason;
    description?: string | null;
  }): Promise<InsertResult> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [result] = await connection.query<ResultSetHeader>(
          `INSERT INTO ${this.tableName} (report_id, reporter_user_id, reason, description) VALUES (?, ?, ?, ?)`,
          [input.report_id, input.reporter_user_id, input.reason, input.description ?? null],
        );

        return {
          insertId: result.insertId,
          affectedRows: result.affectedRows,
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al crear denuncia:', error);
      throw new DatabaseError('Error al crear denuncia');
    }
  }

  async getComplaintById(complaint_id: number): Promise<ComplaintRecord | null> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>(
          `SELECT * FROM ${this.tableName} WHERE complaint_id = ?`,
          [complaint_id],
        );
        return (rows[0] as ComplaintRecord) || null;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al obtener denuncia por ID:', error);
      throw new DatabaseError('Error al obtener denuncia');
    }
  }

  async getComplaintsByReporter(reporter_user_id: string, status?: ComplaintStatus): Promise<ComplaintRecord[]> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const conditions = ['reporter_user_id = ?'];
        const values: any[] = [reporter_user_id];

        if (status) {
          conditions.push('status = ?');
          values.push(status);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const [rows] = await connection.query<RowDataPacket[]>(
          `SELECT * FROM ${this.tableName} ${whereClause} ORDER BY created_at DESC`,
          values,
        );
        return rows as ComplaintRecord[];
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al listar denuncias del usuario:', error);
      throw new DatabaseError('Error al listar denuncias');
    }
  }

  async getAllComplaints(filters?: {
    status?: ComplaintStatus;
    reason?: ComplaintReason;
    report_id?: number;
  }): Promise<ComplaintRecord[]> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const conditions: string[] = [];
        const values: any[] = [];

        if (filters?.status) {
          conditions.push('status = ?');
          values.push(filters.status);
        }
        if (filters?.reason) {
          conditions.push('reason = ?');
          values.push(filters.reason);
        }
        if (filters?.report_id) {
          conditions.push('report_id = ?');
          values.push(filters.report_id);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const [rows] = await connection.query<RowDataPacket[]>(
          `SELECT * FROM ${this.tableName} ${whereClause} ORDER BY created_at DESC`,
          values,
        );
        return rows as ComplaintRecord[];
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al listar denuncias:', error);
      throw new DatabaseError('Error al listar denuncias');
    }
  }

  async updateComplaint(
    complaint_id: number,
    updates: Partial<Pick<ComplaintRecord, 'status' | 'admin_notes' | 'resolved_by' | 'resolved_at'>>,
  ): Promise<void> {
    const allowedFields: (keyof typeof updates)[] = ['status', 'admin_notes', 'resolved_by', 'resolved_at'];
    const assignments: string[] = [];
    const values: any[] = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        assignments.push(`${field} = ?`);
        values.push(updates[field]);
      }
    }

    if (!assignments.length) {
      return;
    }

    values.push(complaint_id);

    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        await connection.query(`UPDATE ${this.tableName} SET ${assignments.join(', ')} WHERE complaint_id = ?`, values);
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al actualizar denuncia:', error);
      throw new DatabaseError('Error al actualizar denuncia');
    }
  }
}

export default ComplaintModel;
