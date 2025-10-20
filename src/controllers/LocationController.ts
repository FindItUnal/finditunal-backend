import { Request, Response } from 'express';
import LocationModel from '../models/LocationModel';

export class LocationController {
  private locationModel: LocationModel;
  constructor(locationModel: LocationModel) {
    this.locationModel = locationModel;
  }

  // Obtener todas las ubicaciones
  getAllLocations = async (_req: Request, res: Response): Promise<void> => {
    try {
      const locations = await this.locationModel.getAllLocations();
      res.status(200).json(locations);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
  };
}
