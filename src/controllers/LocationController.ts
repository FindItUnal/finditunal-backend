import { Request, Response, NextFunction } from 'express';
import LocationModel from '../models/LocationModel';
import { sendSuccess } from '../utils/responseHandler';

export class LocationController {
  constructor(private locationModel: LocationModel) {}

  // Obtener todas las ubicaciones
  getAllLocations = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const locations = await this.locationModel.getAllLocations();
      sendSuccess(res, locations);
    } catch (error) {
      next(error);
    }
  };
}
