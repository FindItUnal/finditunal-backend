import { RowDataPacket } from 'mysql2';
import { MySQLDatabase } from '../database/mysql';

export interface Location {
  location_id: number;
  name: string;
}

class LocationModel {
  // Obtener todas las ubicaciones
  async getAllLocations(): Promise<Location[]> {
    const db = await MySQLDatabase.getInstance();
    const connection = db.getConnection();
    const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM Locations');
    return rows as Location[];
  }
}
export default LocationModel;
