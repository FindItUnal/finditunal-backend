import { RowDataPacket } from 'mysql2';
import { MySQLDatabase } from '../database/mysql';
import { UpdateUserInput } from '../schemas/authSchemas';
import { DatabaseError } from '../utils/errors';

interface User {
  user_id: number;
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
  // Buscar un usuario por email
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM Users WHERE email = ?', [email]);
        return (rows[0] as User) || null;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al obtener usuario por email:', error);
      throw new DatabaseError('Error al buscar usuario');
    }
  }

  async getUserById(user_id: number): Promise<User | null> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM Users WHERE user_id = ?', [user_id]);
        return (rows[0] as User) || null;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al obtener usuario por ID:', error);
      throw new DatabaseError('Error al buscar usuario');
    }
  }

  // Buscar un usuario por google_id
  async getUserByGoogleId(google_id: string): Promise<User | null> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM Users WHERE google_id = ?', [google_id]);
        return (rows[0] as User) || null;
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
          'INSERT INTO Users (email, google_id, name, phone_number, role) VALUES (?, ?, ?, ?, ?)',
          [input.email, input.google_id, input.name, input.phone_number || null, input.role],
        );
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw new DatabaseError('Error al crear usuario');
    }
  }

  // Actualizar informacion del usuario (solo campos permitidos)
  async updateUser(user_id: number, input: UpdateUserInput): Promise<void> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const updates: string[] = [];
        const values: any[] = [];

        // Solo actualizar campos que estén definidos y sean permitidos
        if (input.email !== undefined) {
          updates.push('email = ?');
          values.push(input.email);
        }
        if (input.name !== undefined) {
          updates.push('name = ?');
          values.push(input.name);
        }
        if (input.phone_number !== undefined) {
          updates.push('phone_number = ?');
          values.push(input.phone_number || null);
        }

        if (updates.length === 0) {
          return; // No hay nada que actualizar
        }

        values.push(user_id);
        const query = `UPDATE Users SET ${updates.join(', ')} WHERE user_id = ?`;
        await connection.query(query, values);
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
