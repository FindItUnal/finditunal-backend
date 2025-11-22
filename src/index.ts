import express, { json } from 'express';
import { Models } from './modelTypes';
import { corsMiddleware } from './middlewares/corsMiddleware';
import { errorHandler } from './middlewares/errorHandler';
import { MySQLDatabase } from './database/mysql';
import cookieParser from 'cookie-parser';
import { createAuthRouter } from './routes/authRoutes';
import { createReportRouter } from './routes/reportRoutes';
import { createUserRouter } from './routes/userRoutes';
import { createLocationRouter } from './routes/LocationRoutes';
import { createCategoryRouter } from './routes/CategoryRoutes';
import { createObjectRouter } from './routes/objectRoutes';
import { createImageRouter } from './routes/imageRoutes';
// import 'dotenv/config'

export const createApp = async ({ models }: { models: Models }): Promise<express.Application> => {
  try {
    await MySQLDatabase.getInstance();

    const app = express();
    app.use(json());
    app.use(corsMiddleware());
    app.use(cookieParser());
    app.disable('x-powered-by');

    // Endpoint de health check - verificación del estado del servidor
    app.get('/health', async (_req, res) => {
      try {
        // Verificar conexión a la base de datos
        const db = await MySQLDatabase.getInstance();
        const connection = await db.getConnection();
        await connection.ping();
        connection.release();

        res.status(200).json({
          status: 'ok',
          message: 'El servidor está funcionando correctamente',
          timestamp: new Date().toISOString(),
          database: 'connected',
          uptime: process.uptime(),
        });
      } catch (error) {
        res.status(503).json({
          status: 'error',
          message: 'El servidor tiene problemas',
          timestamp: new Date().toISOString(),
          database: 'disconnected',
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    });

    app.use('/auth', createAuthRouter(new models.userModel()));

    app.use('/user', createReportRouter(new models.reportModel(), new models.imageModel()));

    app.use('/user', createUserRouter(new models.userModel()));

    app.use('/user', createCategoryRouter(new models.categoryModel()));

    app.use('/user', createLocationRouter(new models.locationModel()));

    app.use('/user', createObjectRouter(new models.objectModel()));

    app.use('/user', createImageRouter());

    // Middleware de manejo de errores (debe ir al final)
    app.use(errorHandler);

    const PORT = process.env.PORT ?? 3000;
    const server = app.listen(PORT, () => {
      console.log(`server listening on port http://localhost:${PORT}`);
    });

    // Manejo de cierre graceful
    process.on('SIGTERM', async () => {
      console.log('SIGTERM recibido, cerrando servidor...');
      server.close(async () => {
        const db = await MySQLDatabase.getInstance();
        await db.close();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT recibido, cerrando servidor...');
      server.close(async () => {
        const db = await MySQLDatabase.getInstance();
        await db.close();
        process.exit(0);
      });
    });

    return app;
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};
