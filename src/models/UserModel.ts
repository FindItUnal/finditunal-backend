import { RowDataPacket } from 'mysql2';
import { MySQLDatabase } from '../database/mysql';
import { UpdateUserInput } from '../schemas/authSchemas';
import { DatabaseError } from '../utils/errors';

export interface UserRecord {
  user_id: string;
  email: string;
  google_id: string;
  name: string;
  phone_number?: string;
  is_confirmed: boolean;
  is_active: boolean;
  role: 'user' | 'admin';
  created_at: Date;
  updated_at: Date;
}

class UserModel {
  private readonly tableName = 'users';

  // Buscar un usuario por email
  async getUserByEmail(email: string): Promise<UserRecord | null> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>(`SELECT * FROM ${this.tableName} WHERE email = ?`, [
          email,
        ]);
        return (rows[0] as UserRecord) || null;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al obtener usuario por email:', error);
      throw new DatabaseError('Error al buscar usuario');
    }
  }

  async getUserById(user_id: string): Promise<UserRecord | null> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>(`SELECT * FROM ${this.tableName} WHERE user_id = ?`, [
          user_id,
        ]);
        return (rows[0] as UserRecord) || null;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al obtener usuario por ID:', error);
      throw new DatabaseError('Error al buscar usuario');
    }
  }

  // Buscar un usuario por google_id
  async getUserByGoogleId(google_id: string): Promise<UserRecord | null> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>(`SELECT * FROM ${this.tableName} WHERE google_id = ?`, [
          google_id,
        ]);
        return (rows[0] as UserRecord) || null;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al obtener usuario por google_id:', error);
      throw new DatabaseError('Error al buscar usuario');
    }
  }

  // Crear un nuevo usuario vía Google OAuth
  async createUserFromGoogle(input: {
    user_id: string;
    email: string;
    google_id: string;
    name: string;
    phone_number?: string | null;
    role: 'user' | 'admin';
  }): Promise<void> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        await connection.query(
          `INSERT INTO ${this.tableName} (user_id, email, google_id, name, phone_number, role) VALUES (?, ?, ?, ?, ?, ?)`,
          [input.user_id, input.email, input.google_id, input.name, input.phone_number || null, input.role],
        );
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw new DatabaseError('Error al crear usuario');
    }
  }

  // Actualizar información del usuario (solo phone_number)
  async updateUser(user_id: string, input: UpdateUserInput): Promise<void> {
    if (input.phone_number === undefined) {
      return;
    }
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        await connection.query(`UPDATE ${this.tableName} SET phone_number = ? WHERE user_id = ?`, [
          input.phone_number || null,
          user_id,
        ]);
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw new DatabaseError('Error al actualizar usuario');
    }
  }
}

export default UserModel;
