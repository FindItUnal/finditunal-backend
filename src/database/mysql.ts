import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import dotenv from 'dotenv';

// Carga las variables de entorno desde el archivo .env
dotenv.config();

export class MySQLDatabase {
  // Instancia única de la clase (patrón Singleton)
  private static instance: MySQLDatabase;
  private pool!: Pool;

  // Método estático para obtener la instancia única de la base de datos
  public static async getInstance(): Promise<MySQLDatabase> {
    if (!MySQLDatabase.instance) {
      MySQLDatabase.instance = new MySQLDatabase();
      await MySQLDatabase.instance.connect();
    }
    return MySQLDatabase.instance;
  }

  // Valida que las variables de entorno estén definidas
  private validateEnvVariables(): void {
    const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME', 'DB_PORT'];
    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(`Variables de entorno faltantes: ${missingVars.join(', ')}. Por favor, verifica tu archivo .env`);
    }
  }

  // Conecta a la base de datos MySQL usando un pool de conexiones
  private async connect(): Promise<void> {
    try {
      this.validateEnvVariables();

      this.pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      });

      // Probar la conexión
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();

      console.log('Pool de conexiones a MySQL establecido correctamente');
    } catch (error) {
      console.error('Error al conectar a MySQL:', error);
      throw new Error(
        `Error al conectar a la base de datos: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  // Obtiene una conexión del pool
  public async getConnection(): Promise<PoolConnection> {
    if (!this.pool) {
      throw new Error('El pool de conexiones a MySQL no está establecido.');
    }
    return await this.pool.getConnection();
  }

  // Ejecuta una query usando el pool
  public async query(sql: string, params?: any[]): Promise<any> {
    if (!this.pool) {
      throw new Error('El pool de conexiones a MySQL no está establecido.');
    }
    return await this.pool.query(sql, params);
  }

  // Cierra el pool de conexiones
  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      console.log('Pool de conexiones a MySQL cerrado');
    }
  }

  // Obtiene el pool directamente (útil para transacciones)
  public getPool(): Pool {
    if (!this.pool) {
      throw new Error('El pool de conexiones a MySQL no está establecido.');
    }
    return this.pool;
  }
}
