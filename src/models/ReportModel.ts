import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { MySQLDatabase } from '../database/mysql';
import { DatabaseError } from '../utils/errors';

export interface Report {
  report_id: number;
  user_id: string;
  category_id: number;
  location_id: number;
  title: string;
  description?: string;
  status: 'perdido' | 'encontrado' | 'entregado';
  date_lost_or_found: Date;
  contact_method: string;
  created_at: Date;
  updated_at: Date;
}

interface InsertResult {
  insertId: number;
  affectedRows: number;
}

class ReportModel {
  // Crear un nuevo reporte
  async createReport(report: Omit<Report, 'report_id' | 'created_at' | 'updated_at'>): Promise<InsertResult> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [result] = await connection.query<ResultSetHeader>(
          'INSERT INTO reports (user_id, category_id, location_id, title, description, status, date_lost_or_found, contact_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            report.user_id,
            report.category_id,
            report.location_id,
            report.title,
            report.description || null,
            report.status,
            report.date_lost_or_found,
            report.contact_method,
          ],
        );
        return {
          insertId: result.insertId,
          affectedRows: result.affectedRows,
        };
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al crear reporte:', error);
      throw new DatabaseError('Error al crear reporte');
    }
  }

  // Traer reportes del usuario por id
  async getReportsByUserId(user_id: string): Promise<Report[]> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>(
          'SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC',
          [user_id],
        );
        return rows as Report[];
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al obtener reportes:', error);
      throw new DatabaseError('Error al obtener reportes');
    }
  }

  // Obtener un reporte por ID
  async getReportById(report_id: number): Promise<Report | null> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM reports WHERE report_id = ?', [
          report_id,
        ]);
        return (rows[0] as Report) || null;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al obtener reporte por ID:', error);
      throw new DatabaseError('Error al obtener reporte');
    }
  }

  // Editar un reporte (solo campos permitidos)
  async updateReport(
    report_id: number,
    updates: Partial<Omit<Report, 'report_id' | 'user_id' | 'created_at' | 'updated_at'>>,
  ): Promise<void> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        type AllowedField =
          | 'category_id'
          | 'location_id'
          | 'title'
          | 'description'
          | 'status'
          | 'date_lost_or_found'
          | 'contact_method';
        const allowedFields: AllowedField[] = [
          'category_id',
          'location_id',
          'title',
          'description',
          'status',
          'date_lost_or_found',
          'contact_method',
        ];
        const updatesList: string[] = [];
        const values: any[] = [];

        // Solo actualizar campos permitidos
        for (const field of allowedFields) {
          const value = updates[field];
          if (value !== undefined) {
            updatesList.push(`${field} = ?`);
            values.push(value);
          }
        }

        if (updatesList.length === 0) {
          return; // No hay nada que actualizar
        }

        values.push(report_id);
        const query = `UPDATE reports SET ${updatesList.join(', ')} WHERE report_id = ?`;
        await connection.query(query, values);
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al actualizar reporte:', error);
      throw new DatabaseError('Error al actualizar reporte');
    }
  }

  // Eliminar un reporte
  async deleteReport(report_id: number): Promise<void> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        await connection.query('DELETE FROM reports WHERE report_id = ?', [report_id]);
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al eliminar reporte:', error);
      throw new DatabaseError('Error al eliminar reporte');
    }
  }

  async countAllReports(): Promise<number> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>('SELECT COUNT(*) AS total_reports FROM reports');
        return Number(rows[0]?.total_reports ?? 0);
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al contar reportes:', error);
      throw new DatabaseError('Error al contar reportes');
    }
  }

  async countReportsCreatedSince(since: Date): Promise<number> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>(
          'SELECT COUNT(*) AS reports_since FROM reports WHERE created_at >= ?',
          [since],
        );
        return Number(rows[0]?.reports_since ?? 0);
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al contar reportes recientes:', error);
      throw new DatabaseError('Error al contar reportes');
    }
  }

  async countReportsCreatedInRange(start: Date, end: Date): Promise<number> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>(
          'SELECT COUNT(*) AS reports_in_range FROM reports WHERE created_at >= ? AND created_at < ?',
          [start, end],
        );
        return Number(rows[0]?.reports_in_range ?? 0);
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al contar reportes en rango:', error);
      throw new DatabaseError('Error al contar reportes');
    }
  }

  async countDeliveredReportsInRange(start: Date, end: Date): Promise<number> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>(
          "SELECT COUNT(*) AS delivered_in_range FROM reports WHERE status = 'entregado' AND updated_at >= ? AND updated_at < ?",
          [start, end],
        );
        return Number(rows[0]?.delivered_in_range ?? 0);
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al contar reportes entregados en rango:', error);
      throw new DatabaseError('Error al contar reportes entregados');
    }
  }
}
export default ReportModel;
