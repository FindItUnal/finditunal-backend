import { Request, Response, NextFunction } from 'express';
import { ObjectService } from '../services/ObjectService';
import { sendSuccess } from '../utils/responseHandler';

export class ObjectController {
  constructor(private objectService: ObjectService) {}

  // Obtener todos los objetos
  getAllObjects = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const objects = await this.objectService.getAllObjects();
      sendSuccess(res, objects);
    } catch (error) {
      next(error);
    }
  };

  // Obtener un objeto por su report_id
  getObjectById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reportId = parseInt(req.params.report_id, 10);
      const object = await this.objectService.getObjectById(reportId);

      sendSuccess(res, object);
    } catch (error) {
      next(error);
    }
  };

  // Buscar objetos por categoría, ubicación, rango de fechas y palabras clave
  searchObjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category, location, startDate, endDate, keyword, status } = req.query;

      const objects = await this.objectService.searchObjects({
        category: category as string,
        location: location as string,
        startDate: startDate as string,
        endDate: endDate as string,
        keyword: keyword as string,
        status: status as 'perdido' | 'encontrado',
      });

      sendSuccess(res, objects);
    } catch (error) {
      next(error);
    }
  };
}
