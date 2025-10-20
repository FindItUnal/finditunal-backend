import { Router } from 'express';
import { LocationController } from '../controllers/LocationController';
import LocationModel from '../models/LocationModel';
import { authenticate } from '../middlewares/authMiddleware';

export const createLocationRouter = (locationModel: LocationModel): Router => {
  const locationRouter = Router();
  const locationController = new LocationController(locationModel);

  // Obtener todas las ubicaciones
  locationRouter.get('/:user_id/locations', authenticate, locationController.getAllLocations);

  return locationRouter;
};
