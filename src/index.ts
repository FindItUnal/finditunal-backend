import express, { json } from 'express';
import { Models } from './modelTypes';
import { corsMiddleware } from './middlewares/corsMiddleware';
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

    app.use('/auth', createAuthRouter(new models.userModel()));

    app.use('/user', createReportRouter(new models.reportModel(), new models.imageModel()));

    app.use('/user', createUserRouter(new models.userModel()));

    app.use('/user', createCategoryRouter(new models.categoryModel()));

    app.use('/user', createLocationRouter(new models.locationModel()));

    app.use('/user', createObjectRouter(new models.objectModel()));

    app.use('/user', createImageRouter());

    const PORT = process.env.PORT ?? 3000;
    app.listen(PORT, () => {
      console.log(`server listening on port http://localhost:${PORT}`);
    });

    return app;
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};
