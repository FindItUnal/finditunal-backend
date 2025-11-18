import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { NotFoundError } from '../utils/errors';

export class ImageController {
  sendImage = (req: Request, res: Response, next: NextFunction): void => {
    const filename = req.params.filename;
    const imagePath = path.join(__dirname, '..', 'uploads', filename);

    // Enviar el archivo al cliente
    res.sendFile(imagePath, (err) => {
      if (err) {
        next(new NotFoundError('Imagen no encontrada'));
      }
    });
  };
}
