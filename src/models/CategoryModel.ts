import { RowDataPacket } from 'mysql2';
import { MySQLDatabase } from '../database/mysql';
import { DatabaseError } from '../utils/errors';

export interface Category {
  category_id: number;
  name: string;
}

class CategoryModel {
  // Obtener todas las categorías
  async getAllCategories(): Promise<Category[]> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM categories ORDER BY name ASC');
        return rows as Category[];
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      throw new DatabaseError('Error al obtener categorías');
    }
  }
}
export default CategoryModel;
