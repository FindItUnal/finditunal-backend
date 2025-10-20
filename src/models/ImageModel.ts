import { RowDataPacket } from 'mysql2';
import { MySQLDatabase } from '../database/mysql';

export interface Image {
  image_url: string;
}

class ImageModel {
  //Guardar url de imagen
  async saveImage(image_url: string, report_id: number): Promise<void> {
    const db = await MySQLDatabase.getInstance();
    const connection = db.getConnection();
    await connection.query('INSERT INTO Images (image_url, report_id) VALUES (?, ?)', [image_url, report_id]);
  }

  async getImageByReportId(report_id: number): Promise<Image | null> {
    const db = await MySQLDatabase.getInstance();
    const connection = db.getConnection();
    const [rows] = await connection.query<RowDataPacket[]>('SELECT image_url FROM Images WHERE report_id = ?', [
      report_id,
    ]);
    return (rows[0] as Image) || null;
  }
}
export default ImageModel;
