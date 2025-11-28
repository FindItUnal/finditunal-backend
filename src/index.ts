import express, { json } from 'express';
import { Models } from './modelTypes';
import { corsMiddleware } from './middlewares/corsMiddleware';
import { errorHandler } from './middlewares/errorHandler';
import { MySQLDatabase } from './database/mysql';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { createAuthRouter } from './routes/authRoutes';
import { createReportRouter } from './routes/reportRoutes';
import { createUserRouter } from './routes/userRoutes';
import { createLocationRouter } from './routes/LocationRoutes';
import { createCategoryRouter } from './routes/CategoryRoutes';
import { createObjectRouter } from './routes/objectRoutes';
import { createImageRouter } from './routes/imageRoutes';
import { createComplaintRouter } from './routes/complaintRoutes';
// import 'dotenv/config'

export const createApp = async ({ models }: { models: Models }): Promise<express.Application> => {
  try {
    await MySQLDatabase.getInstance();

    const app = express();
    app.use(json());
    app.use(corsMiddleware());
    app.use(cookieParser());
    app.disable('x-powered-by');

    // Swagger UI
    app.use(
      '/swagger',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'FindIt UNAL API Documentation',
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
        },
      }),
    );

    // Servir especificación JSON
    app.get('/swagger.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    /**
     * @swagger
     * /health:
     *   get:
     *     summary: Verificar el estado del servidor
     *     description: Endpoint de health check que verifica el estado del servidor y la conexión a la base de datos
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: Servidor funcionando correctamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/HealthResponse'
     *             example:
     *               status: 'ok'
     *               message: 'El servidor está funcionando correctamente'
     *               timestamp: '2024-01-15T10:30:00.000Z'
     *               database: 'connected'
     *               uptime: 3600
     *       503:
     *         description: Servidor con problemas
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: 'error'
     *                 message:
     *                   type: string
     *                   example: 'El servidor tiene problemas'
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     *                 database:
     *                   type: string
     *                   example: 'disconnected'
     *                 error:
     *                   type: string
     *                   example: 'Error al conectar a la base de datos'
     */
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
    app.use(
      '/user',
      createComplaintRouter(new models.complaintModel(), new models.reportModel(), new models.imageModel()),
    );

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
