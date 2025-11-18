import { RowDataPacket } from 'mysql2';
import { MySQLDatabase } from '../database/mysql';
import { DatabaseError } from '../utils/errors';

export interface Location {
  location_id: number;
  name: string;
}

class LocationModel {
  // Obtener todas las ubicaciones
  async getAllLocations(): Promise<Location[]> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM Locations ORDER BY name ASC');
        return rows as Location[];
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al obtener ubicaciones:', error);
      throw new DatabaseError('Error al obtener ubicaciones');
    }
  }
}
export default LocationModel;
