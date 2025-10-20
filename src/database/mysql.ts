import mysql, { Connection } from 'mysql2/promise';
import dotenv from 'dotenv';

// Carga las variables de entorno desde el archivo .env
dotenv.config();

export class MySQLDatabase {
  // Instancia única de la clase (patrón Singleton)
  private static instance: MySQLDatabase;
  private connection!: Connection;

  // Método estático para obtener la instancia única de la base de datos
  public static async getInstance(): Promise<MySQLDatabase> {
    if (!MySQLDatabase.instance) {
      MySQLDatabase.instance = new MySQLDatabase();
      await MySQLDatabase.instance.connect();
    }
    return MySQLDatabase.instance;
  }

  // Conecta a la base de datos MySQL usando las credenciales de .env
  private async connect(): Promise<void> {
    this.connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT),
    });
    console.log('Conexión a MySQL establecida');
  }

  // Obtiene la conexión activa o lanza un error si no está disponible
  public getConnection(): Connection {
    if (!this.connection) {
      throw new Error('La conexión a MySQL no está establecida.');
    }
    return this.connection;
  }
}
