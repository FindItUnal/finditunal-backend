import express, { json } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt, { JwtPayload } from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { Models } from './modelTypes';
import { corsMiddleware } from './middlewares/corsMiddleware';
import { errorHandler } from './middlewares/errorHandler';
import { MySQLDatabase } from './database/mysql';
import { swaggerSpec } from './config/swagger';
import { createAuthRouter } from './routes/authRoutes';
import { createReportRouter } from './routes/reportRoutes';
import { createUserRouter } from './routes/userRoutes';
import { createLocationRouter } from './routes/LocationRoutes';
import { createCategoryRouter } from './routes/CategoryRoutes';
import { createObjectRouter } from './routes/objectRoutes';
import { createImageRouter } from './routes/imageRoutes';
import { createComplaintRouter } from './routes/complaintRoutes';
import { createChatRouter } from './routes/chatRoutes';
import { createActivityLogRouter } from './routes/activityLogRoutes';
import { createNotificationRouter } from './routes/notificationRoutes';
import { UPLOADS_BASE_PATH } from './middlewares/multerMiddleware';
import { APP_CONFIG, JWT_CONFIG } from './config';
import { ChatService } from './services/ChatService';
import { NotificationService } from './services/NotificationService';
// import 'dotenv/config'

interface SocketUserPayload {
  user_id: string;
  role?: 'user' | 'admin';
}

export const createApp = async ({
  models,
}: {
  models: Models;
}): Promise<{ app: express.Application; io: SocketIOServer }> => {
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

    // Servir archivos estaticos de uploads
    app.use('/uploads', express.static(UPLOADS_BASE_PATH));

    // Servir especificacion JSON
    app.get('/swagger.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    /**
     * @swagger
     * /health:
     *   get:
     *     summary: Verificar el estado del servidor
     *     description: Endpoint de health check que verifica el estado del servidor y la conexion a la base de datos
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
     *               message: 'El servidor esta funcionando correctamente'
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
    // Endpoint de health check - verificacion del estado del servidor
    app.get('/health', async (_req, res) => {
      try {
        // Verificar conexion a la base de datos
        const db = await MySQLDatabase.getInstance();
        const connection = await db.getConnection();
        await connection.ping();
        connection.release();

        res.status(200).json({
          status: 'ok',
          message: 'El servidor esta funcionando correctamente',
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

    // Rutas de chat
    app.use(
      '/user',
      createChatRouter(new models.conversationModel(), new models.messageModel(), new models.reportModel()),
    );

    // Activity log (admin)
    app.use('/user', createActivityLogRouter(new models.activityLogModel()));

    // Notificaciones de usuario
    app.use('/user', createNotificationRouter(new models.notificationModel()));

    // Middleware de manejo de errores (debe ir al final)
    app.use(errorHandler);

    const PORT = Number(process.env.PORT ?? 3000);

    const httpServer = http.createServer(app);

    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: APP_CONFIG.FRONTEND_URL,
        credentials: true,
      },
    });

    NotificationService.setSocketServer(io);
    ChatService.setSocketServer(io);

    const chatService = new ChatService(
      new models.conversationModel(),
      new models.messageModel(),
      new models.reportModel(),
    );

    io.use((socket, next) => {
      try {
        // 1. Intentar obtener token desde auth o header
        const auth = socket.handshake.auth as { token?: string } | undefined;
        const headerAuth = socket.handshake.headers?.authorization as string | undefined;

        let token = auth?.token;
        if (!token && headerAuth && headerAuth.startsWith('Bearer ')) {
          token = headerAuth.substring(7);
        }

        // 2. Fallback: leer desde cookies (igual que REST API)
        if (!token) {
          const cookieHeader = socket.handshake.headers.cookie;
          if (cookieHeader) {
            const cookies = cookieHeader.split(';').reduce(
              (acc, c) => {
                const trimmed = c.trim();
                const eqIndex = trimmed.indexOf('=');
                if (eqIndex > 0) {
                  const key = trimmed.substring(0, eqIndex);
                  const val = trimmed.substring(eqIndex + 1);
                  acc[key] = val;
                }
                return acc;
              },
              {} as Record<string, string>,
            );
            token = cookies['accessToken'];
          }
        }

        if (!token) {
          return next(new Error('Token no proporcionado'));
        }

        jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET, (err, decoded) => {
          if (err || !decoded) {
            return next(new Error('Token invalido'));
          }

          const payload = decoded as JwtPayload & SocketUserPayload;
          if (!payload.user_id) {
            return next(new Error('Token sin user_id'));
          }

          socket.data.user = {
            user_id: payload.user_id,
            role: payload.role,
          } as SocketUserPayload;

          next();
        });
      } catch {
        next(new Error('Error en autenticacion de socket'));
      }
    });

    io.on('connection', (socket) => {
      const user = socket.data.user as SocketUserPayload | undefined;
      if (!user?.user_id) {
        socket.disconnect(true);
        return;
      }

      const userRoom = `user:${user.user_id}`;
      socket.join(userRoom);

      socket.on('conversation:join', async (payload: { conversation_id?: number }) => {
        if (!payload?.conversation_id) {
          return;
        }
        try {
          await chatService.getConversationMessages(payload.conversation_id, user.user_id);
          const room = `conversation:${payload.conversation_id}`;
          socket.join(room);
        } catch {
          socket.emit('error', { message: 'No se pudo unir a la conversacion' });
        }
      });

      socket.on('conversation:leave', (payload: { conversation_id?: number }) => {
        if (!payload?.conversation_id) {
          return;
        }
        const room = `conversation:${payload.conversation_id}`;
        socket.leave(room);
      });

      socket.on('message:send', async (payload: { conversation_id?: number; message_text?: string }): Promise<void> => {
        if (!payload?.conversation_id || !payload.message_text) {
          return;
        }

        try {
          const result = await chatService.sendMessage(payload.conversation_id, user.user_id, payload.message_text);

          const room = `conversation:${payload.conversation_id}`;
          io.to(room).emit('message:new', {
            conversation_id: result.message.conversation_id,
            message_id: result.message.message_id,
            sender_id: result.message.sender_id,
            message_text: result.message.message_text,
            created_at: result.message.created_at,
          });

          const recipientRoom = `user:${result.recipientUserId}`;
          io.to(recipientRoom).emit('notification:new', {
            type: 'chat_message',
            conversation_id: result.message.conversation_id,
            message_id: result.message.message_id,
            from_user_id: result.message.sender_id,
            created_at: result.message.created_at,
          });
        } catch {
          socket.emit('error', { message: 'No se pudo enviar el mensaje' });
        }
      });

      socket.on('conversation:read', async (payload: { conversation_id?: number }) => {
        if (!payload?.conversation_id) {
          return;
        }
        try {
          await chatService.markConversationAsRead(payload.conversation_id, user.user_id);
          const room = `conversation:${payload.conversation_id}`;
          io.to(room).emit('conversation:read', {
            conversation_id: payload.conversation_id,
            user_id: user.user_id,
          });
        } catch {
          socket.emit('error', { message: 'No se pudo marcar la conversacion como leida' });
        }
      });
    });

    httpServer.listen(PORT, () => {
      console.log(`server listening on port http://localhost:${PORT}`);
    });

    // Manejo de cierre graceful
    process.on('SIGTERM', async () => {
      console.log('SIGTERM recibido, cerrando servidor...');
      httpServer.close(async () => {
        const db = await MySQLDatabase.getInstance();
        await db.close();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT recibido, cerrando servidor...');
      httpServer.close(async () => {
        const db = await MySQLDatabase.getInstance();
        await db.close();
        process.exit(0);
      });
    });

    return { app, io };
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};
