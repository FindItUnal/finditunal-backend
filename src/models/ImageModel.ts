import { RowDataPacket } from 'mysql2';
import { MySQLDatabase } from '../database/mysql';
import { DatabaseError } from '../utils/errors';

export interface Image {
  image_url: string;
}

class ImageModel {
  // Guardar url de imagen
  async saveImage(image_url: string, report_id: number): Promise<void> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        await connection.query('INSERT INTO images (image_url, report_id) VALUES (?, ?)', [image_url, report_id]);
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al guardar imagen:', error);
      throw new DatabaseError('Error al guardar imagen');
    }
  }

  async getImageByReportId(report_id: number): Promise<Image | null> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>('SELECT image_url FROM images WHERE report_id = ?', [
          report_id,
        ]);
        return (rows[0] as Image) || null;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al obtener imagen:', error);
      throw new DatabaseError('Error al obtener imagen');
    }
  }

  // Eliminar imagen por report_id
  async deleteImageByReportId(report_id: number): Promise<void> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        await connection.query('DELETE FROM images WHERE report_id = ?', [report_id]);
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      throw new DatabaseError('Error al eliminar imagen');
    }
  }
}
export default ImageModel;
