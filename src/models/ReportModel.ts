import { RowDataPacket } from 'mysql2';
import { MySQLDatabase } from '../database/mysql';

export interface Report {
  report_id: number;
  user_id: number;
  category_id: number;
  location_id: number;
  title: string;
  description?: string;
  status: 'perdido' | 'encontrado';
  date_lost_or_found: Date;
  contact_method: string;
  created_at: Date;
  updated_at: Date;
}

class ReportModel {
  // Crear un nuevo reporte
  async createReport(report: Omit<Report, 'report_id' | 'created_at' | 'updated_at'>): Promise<any> {
    const db = await MySQLDatabase.getInstance();
    const connection = db.getConnection();
    const [result] = await connection.query(
      'INSERT INTO Reports (user_id, category_id, location_id, title, description, status, date_lost_or_found, contact_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        report.user_id,
        report.category_id,
        report.location_id,
        report.title,
        report.description,
        report.status,
        report.date_lost_or_found,
        report.contact_method,
      ],
    );
    return result;
  }

  // Traer reportes del usuario por id
  async getReportsByUserId(user_id: number): Promise<RowDataPacket[]> {
    const db = await MySQLDatabase.getInstance();
    const connection = db.getConnection();
    const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM Reports WHERE user_id = ?', [user_id]);
    return rows;
  }

  // Editar un reporte
  async updateReport(report_id: number, updates: Partial<Report>): Promise<void> {
    const db = await MySQLDatabase.getInstance();
    const connection = db.getConnection();
    await connection.query('UPDATE Reports SET ? WHERE report_id = ?', [updates, report_id]);
  }

  // Eliminar un reporte
  async deleteReport(report_id: number): Promise<void> {
    const db = await MySQLDatabase.getInstance();
    const connection = db.getConnection();
    await connection.query('DELETE FROM Reports WHERE report_id = ?', [report_id]);
  }
}
export default ReportModel;
