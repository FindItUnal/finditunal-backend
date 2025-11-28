import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { NotFoundError } from '../utils/errors';
import ImageModel from '../models/ImageModel';
import { UPLOADS_BASE_PATH } from '../middlewares/multerMiddleware';

export class ImageController {
  constructor(private imageModel: ImageModel) {}

  sendImage = (req: Request, res: Response, next: NextFunction): void => {
    const filename = req.params.filename;
    const imagePath = path.join(UPLOADS_BASE_PATH, filename);

    res.sendFile(imagePath, (err) => {
      if (err) {
        next(new NotFoundError('Imagen no encontrada'));
      }
    });
  };

  listImagesByReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reportId = Number(req.params.report_id);
      if (Number.isNaN(reportId)) {
        res.status(400).json({ message: 'report_id inválido' });
        return;
      }

      const images = await this.imageModel.getImagesByReportId(reportId);
      const data = images.map((image) => ({
        filename: image.image_url,
        url: `/uploads/${image.image_url}`,
      }));

      res.json({ report_id: reportId, images: data });
    } catch (error) {
      next(error);
    }
  };
}
