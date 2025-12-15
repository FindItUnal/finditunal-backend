import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/index';
import { createRealModels } from '../utils/modelFactory';
import { mockDatabase } from '../utils/mockDb';
import { JWT_CONFIG } from '../../src/config';
import { ReportWithImage } from '../../src/services/ReportService';

jest.mock('../../src/middlewares/multerMiddleware', () => {
  const middleware = {
    array: () => (_req: any, _res: any, next: any) => next(),
  };
  return {
    __esModule: true,
    default: middleware,
    UPLOADS_BASE_PATH: 'uploads',
    deleteImage: jest.fn(),
  };
});

const tokenFor = (userId: string, role: 'user' | 'admin' = 'user'): string =>
  jwt.sign({ user_id: userId, role }, JWT_CONFIG.ACCESS_TOKEN_SECRET);

describe('Report routes mutations', () => {
  it('creates a report for the authenticated user', async () => {
    mockDatabase();
    const models = createRealModels();

    jest.spyOn(models.reportModel, 'createReport').mockResolvedValue({ insertId: 321, affectedRows: 1 } as any);
    jest.spyOn(models.imageModel, 'saveImage').mockResolvedValue(undefined as any);
    jest.spyOn(models.activityLogModel, 'createActivity').mockResolvedValue(undefined as any);

    const { app } = await createApp({ models });

    const response = await request(app)
      .post('/user/user-1/reports')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .send({
        category_id: '1',
        location_id: '2',
        title: 'Billetera',
        description: 'Negra',
        status: 'perdido',
        date_lost_or_found: '2024-01-01',
        contact_method: 'email',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'Reporte creado exitosamente' });
    expect(models.reportModel.createReport).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        category_id: 1,
        location_id: 2,
      }),
    );
  });

  it('updates an existing report and logs delivery', async () => {
    mockDatabase();
    const models = createRealModels();

    const storedReport: ReportWithImage = {
      report_id: 5,
      user_id: 'user-1',
      category_id: 1,
      location_id: 1,
      title: 'Billetera',
      description: 'Negra',
      status: 'perdido',
      date_lost_or_found: new Date('2024-01-01T00:00:00Z'),
      contact_method: 'email',
      created_at: new Date(),
      updated_at: new Date(),
    };

    jest.spyOn(models.reportModel, 'getReportById').mockResolvedValue(storedReport as any);
    jest.spyOn(models.reportModel, 'updateReport').mockResolvedValue(undefined as any);
    jest.spyOn(models.imageModel, 'getImagesByReportId').mockResolvedValue([]);
    jest.spyOn(models.imageModel, 'deleteImageByReportId').mockResolvedValue(undefined as any);
    jest.spyOn(models.imageModel, 'saveImage').mockResolvedValue(undefined as any);
    jest.spyOn(models.activityLogModel, 'createActivity').mockResolvedValue(undefined as any);

    const { app } = await createApp({ models });

    const response = await request(app)
      .patch(`/user/user-1/reports/${storedReport.report_id}`)
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .send({
        status: 'entregado',
      });

    expect(response.status).toBe(200);
    expect(models.reportModel.updateReport).toHaveBeenCalled();
    expect(models.activityLogModel.createActivity).toHaveBeenCalled();
  });

  it('deletes a report and its images', async () => {
    mockDatabase();
    const models = createRealModels();

    const storedReport: ReportWithImage = {
      report_id: 7,
      user_id: 'user-1',
      category_id: 1,
      location_id: 1,
      title: 'Objeto',
      description: 'Desc',
      status: 'encontrado',
      date_lost_or_found: new Date('2024-01-01T00:00:00Z'),
      contact_method: 'email',
      created_at: new Date(),
      updated_at: new Date(),
    };

    jest.spyOn(models.reportModel, 'getReportById').mockResolvedValue(storedReport as any);
    jest.spyOn(models.reportModel, 'deleteReport').mockResolvedValue(undefined as any);
    jest.spyOn(models.imageModel, 'getImagesByReportId').mockResolvedValue([{ image_url: 'old.png' }] as any);
    jest.spyOn(models.activityLogModel, 'createActivity').mockResolvedValue(undefined as any);

    const { app } = await createApp({ models });

    const response = await request(app)
      .delete(`/user/user-1/reports/${storedReport.report_id}`)
      .set('Authorization', `Bearer ${tokenFor('user-1')}`);

    expect(response.status).toBe(200);
    expect(models.reportModel.deleteReport).toHaveBeenCalledWith(storedReport.report_id);
    expect(models.imageModel.getImagesByReportId).toHaveBeenCalledWith(storedReport.report_id);
  });
});
