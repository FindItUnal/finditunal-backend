import ObjectModel from '../models/ObjectModel';
import { NotFoundError } from '../utils/errors';

export interface ObjectSearchParams {
  category?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  status?: 'perdido' | 'encontrado' | 'entregado';
  limit?: number;
  offset?: number;
}

export class ObjectService {
  constructor(private objectModel: ObjectModel) {}

  // Obtener todos los objetos
  async getAllObjects(): Promise<any[]> {
    return await this.objectModel.getAllObjects();
  }

  // Obtener un objeto por ID
  async getObjectById(reportId: number): Promise<any> {
    const object = await this.objectModel.getObjectById(reportId);

    if (!object) {
      throw new NotFoundError('Objeto no encontrado');
    }

    return object;
  }

  // Buscar objetos con filtros
  async searchObjects(params: ObjectSearchParams): Promise<any[]> {
    return await this.objectModel.searchObjects(
      params.category,
      params.location,
      params.startDate,
      params.endDate,
      params.keyword,
      params.status,
      params.limit,
      params.offset,
    );
  }
}
