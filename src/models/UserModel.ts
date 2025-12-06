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
  is_active: number;
  role: 'user' | 'admin';
  created_at: Date;
  updated_at: Date;
}

export interface UserWithStats extends UserRecord {
  total_reports: number;
  delivered_reports: number;
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

  async listUsers(options?: { excludeUserIds?: string[] }): Promise<UserRecord[]> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const conditions: string[] = [];
        const values: any[] = [];

        const uniqueExcludeIds = Array.from(new Set(options?.excludeUserIds?.filter(Boolean) ?? []));
        if (uniqueExcludeIds.length) {
          const placeholders = uniqueExcludeIds.map(() => '?').join(', ');
          conditions.push(`user_id NOT IN (${placeholders})`);
          values.push(...uniqueExcludeIds);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const [rows] = await connection.query<RowDataPacket[]>(
          `SELECT user_id, email, google_id, name, phone_number, is_confirmed, is_active, role, created_at, updated_at FROM ${this.tableName} ${whereClause} ORDER BY created_at DESC`,
          values,
        );
        return rows as UserRecord[];
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al listar usuarios:', error);
      throw new DatabaseError('Error al listar usuarios');
    }
  }

  async getUserWithStats(user_id: string): Promise<UserWithStats | null> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>(
          `
          SELECT 
            u.*,
            (SELECT COUNT(*) FROM reports r WHERE r.user_id = u.user_id) AS total_reports,
            (SELECT COUNT(*) FROM reports r WHERE r.user_id = u.user_id AND r.status = 'entregado') AS delivered_reports
          FROM ${this.tableName} u
          WHERE u.user_id = ?
          LIMIT 1
        `,
          [user_id],
        );
        return (rows[0] as UserWithStats) || null;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al obtener usuario con estadisticas:', error);
      throw new DatabaseError('Error al buscar usuario');
    }
  }

  // Crear un nuevo usuario via Google OAuth
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

  // Actualizar informacion del usuario (solo phone_number)
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

  async banUser(
    user_id: string,
    updates: { google_id: string; name?: string; phone_number?: string | null },
  ): Promise<void> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        await connection.query(
          `UPDATE ${this.tableName} 
             SET google_id = ?, name = ?, phone_number = ?, is_confirmed = 0, is_active = 2 
           WHERE user_id = ?`,
          [updates.google_id, updates.name ?? 'Usuario Baneado', updates.phone_number ?? null, user_id],
        );
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al banear usuario:', error);
      throw new DatabaseError('Error al banear usuario');
    }
  }

  async countAllUsers(): Promise<number> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>(`SELECT COUNT(*) AS total_users FROM ${this.tableName}`);
        return Number(rows[0]?.total_users ?? 0);
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al contar usuarios:', error);
      throw new DatabaseError('Error al contar usuarios');
    }
  }

  async countUsersCreatedSince(since: Date): Promise<number> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>(
          `SELECT COUNT(*) AS new_users FROM ${this.tableName} WHERE created_at >= ?`,
          [since],
        );
        return Number(rows[0]?.new_users ?? 0);
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al contar usuarios nuevos:', error);
      throw new DatabaseError('Error al contar usuarios nuevos');
    }
  }

  async countActiveUsers(): Promise<number> {
    try {
      const db = await MySQLDatabase.getInstance();
      const connection = await db.getConnection();
      try {
        const [rows] = await connection.query<RowDataPacket[]>(
          `SELECT COUNT(*) AS active_users FROM ${this.tableName} WHERE is_active = 1`,
        );
        return Number(rows[0]?.active_users ?? 0);
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error al contar usuarios activos:', error);
      throw new DatabaseError('Error al contar usuarios activos');
    }
  }
}

export default UserModel;
