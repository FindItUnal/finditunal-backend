import { ReportService } from '../../src/services/ReportService';
import ReportModel from '../../src/models/ReportModel';
import ImageModel from '../../src/models/ImageModel';
import { ActivityLogService } from '../../src/services/ActivityLogService';
import { CreateReportInput, UpdateReportInput } from '../../src/schemas/reportSchemas';
import { NotFoundError } from '../../src/utils/errors';
import { ReportWithImage } from '../../src/services/ReportService';

jest.mock('../../src/middlewares/multerMiddleware', () => ({
  deleteImage: jest.fn(),
}));

import { deleteImage } from '../../src/middlewares/multerMiddleware';

const baseReport: ReportWithImage = {
  report_id: 10,
  user_id: 'owner-1',
  category_id: 1,
  location_id: 2,
  title: 'Billetera perdida',
  description: 'Color negro',
  status: 'perdido',
  date_lost_or_found: new Date('2024-01-01T00:00:00Z'),
  contact_method: 'email',
  created_at: new Date('2024-01-01T00:00:00Z'),
  updated_at: new Date('2024-01-01T00:00:00Z'),
};

const createService = () => {
  const reportModel = {
    createReport: jest.fn(),
    getReportsByUserId: jest.fn(),
    getReportById: jest.fn(),
    updateReport: jest.fn(),
    deleteReport: jest.fn(),
  };

  const imageModel = {
    saveImage: jest.fn(),
    getImagesByReportId: jest.fn(),
    deleteImageByReportId: jest.fn(),
  };

  const activityLog = {
    logActivity: jest.fn(),
  };

  const service = new ReportService(
    reportModel as unknown as ReportModel,
    imageModel as unknown as ImageModel,
    activityLog as unknown as ActivityLogService,
  );

  return { service, reportModel, imageModel, activityLog };
};

describe('ReportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates reports, saves images and logs activity', async () => {
    const { service, reportModel, imageModel, activityLog } = createService();
    reportModel.createReport.mockResolvedValue({ insertId: 55, affectedRows: 1 });

    const input: CreateReportInput = {
      category_id: 1,
      location_id: 2,
      title: 'Objeto',
      description: 'desc',
      status: 'perdido',
      date_lost_or_found: new Date('2024-02-01T00:00:00Z'),
      contact_method: 'email',
    };

    const insertId = await service.createReport('user-1', input, ['img-1.png', 'img-2.png']);

    expect(insertId).toBe(55);
    expect(reportModel.createReport).toHaveBeenCalledWith({
      ...input,
      user_id: 'user-1',
    });
    expect(imageModel.saveImage).toHaveBeenCalledTimes(2);
    expect(imageModel.saveImage).toHaveBeenCalledWith('img-1.png', 55);
    expect(activityLog.logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'REPORT_CREATED',
        actor_user_id: 'user-1',
        target_id: 55,
      }),
    );
  });

  it('cleans up uploaded files if report creation fails', async () => {
    const { service, reportModel } = createService();
    reportModel.createReport.mockRejectedValue(new Error('db down'));

    const input: CreateReportInput = {
      category_id: 1,
      location_id: 2,
      title: 'Objeto',
      description: 'desc',
      status: 'perdido',
      date_lost_or_found: new Date('2024-02-01T00:00:00Z'),
      contact_method: 'email',
    };

    await expect(service.createReport('user-1', input, ['img-1.png', 'img-2.png'])).rejects.toThrow('db down');
    expect(deleteImage).toHaveBeenCalledWith('img-1.png');
    expect(deleteImage).toHaveBeenCalledWith('img-2.png');
  });

  it('throws NotFoundError when the user is not the owner', async () => {
    const { service, reportModel } = createService();
    reportModel.getReportById.mockResolvedValue(baseReport);

    await expect(service.verifyReportOwnership(baseReport.report_id, 'another-user')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('updates reports, replaces images and logs status change', async () => {
    const { service, reportModel, imageModel, activityLog } = createService();
    reportModel.getReportById.mockResolvedValue(baseReport);
    imageModel.getImagesByReportId.mockResolvedValue([{ image_url: 'old.png' }]);

    const update: UpdateReportInput = {
      category_id: 1,
      location_id: 2,
      title: 'Objeto',
      status: 'entregado',
      description: 'desc',
      date_lost_or_found: new Date('2024-02-01T00:00:00Z'),
      contact_method: 'email',
    };

    await service.updateReport(baseReport.report_id, baseReport.user_id, update, undefined, ['new.png']);

    expect(reportModel.updateReport).toHaveBeenCalledWith(
      baseReport.report_id,
      expect.objectContaining({
        status: 'entregado',
      }),
    );
    expect(imageModel.deleteImageByReportId).toHaveBeenCalledWith(baseReport.report_id);
    expect(imageModel.saveImage).toHaveBeenCalledWith('new.png', baseReport.report_id);
    expect(deleteImage).toHaveBeenCalledWith('old.png');
    expect(activityLog.logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'REPORT_UPDATED',
      }),
    );
    expect(activityLog.logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'REPORT_DELIVERED',
      }),
    );
  });

  it('deletes reports, removes images and logs the deletion', async () => {
    const { service, reportModel, imageModel, activityLog } = createService();
    reportModel.getReportById.mockResolvedValue(baseReport);
    imageModel.getImagesByReportId.mockResolvedValue([{ image_url: 'old.png' }, { image_url: 'old-2.png' }]);

    await service.deleteReport(baseReport.report_id, baseReport.user_id);

    expect(reportModel.deleteReport).toHaveBeenCalledWith(baseReport.report_id);
    expect(deleteImage).toHaveBeenCalledWith('old.png');
    expect(deleteImage).toHaveBeenCalledWith('old-2.png');
    expect(activityLog.logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'REPORT_DELETED',
        target_id: baseReport.report_id,
      }),
    );
  });
});
