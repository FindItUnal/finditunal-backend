import { Router } from 'express';
import { ObjectController } from '../controllers/objectController';
import { ObjectService } from '../services/ObjectService';
import ObjectModel from '../models/ObjectModel';
import { authenticate } from '../middlewares/authMiddleware';

export const createObjectRouter = (objectModel: ObjectModel): Router => {
  const objectRouter = Router();
  const objectService = new ObjectService(objectModel);
  const objectController = new ObjectController(objectService);

  // Obtener todos los objetos
  objectRouter.get('/:user_id/objects', authenticate, objectController.getAllObjects);

  // Obtener un objeto por su report_id
  objectRouter.get('/:user_id/objects/filter/:report_id', authenticate, objectController.getObjectById);

  // Buscar objetos por categoría, ubicación, rango de fechas y palabras clave
  objectRouter.get('/:user_id/objects/filters', authenticate, objectController.searchObjects);

  return objectRouter;
};
