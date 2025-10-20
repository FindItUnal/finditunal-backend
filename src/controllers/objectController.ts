import { Request, Response } from 'express';
import ObjectModel from '../models/ObjectModel';

export class ObjectController {
  private objectModel: ObjectModel;
  constructor(objectModel: ObjectModel) {
    this.objectModel = objectModel;
  }

  // Obtener todos los objetos
  getAllObjects = async (_req: Request, res: Response): Promise<void> => {
    try {
      const objects = await this.objectModel.getAllObjects();
      res.status(200).json(objects);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
  };

  // Obtener un objeto por su report_id
  getObjectById = async (req: Request, res: Response): Promise<void> => {
    try {
      const report_id = parseInt(req.params.report_id, 10);
      const object = await this.objectModel.getObjectById(report_id);

      if (!object) {
        res.status(404).json({ message: 'Objeto no encontrado' });
        return;
      }

      res.status(200).json(object);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
  };

  // Buscar objetos por categoría, ubicación, rango de fechas y palabras clave
  searchObjects = async (req: Request, res: Response): Promise<void> => {
    try {
      const { category, location, startDate, endDate, keyword, status } = req.query;

      const objects = await this.objectModel.searchObjects(
        category as string,
        location as string,
        startDate as string,
        endDate as string,
        keyword as string,
        status as 'perdido' | 'encontrado',
      );

      res.status(200).json(objects);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
  };
}
