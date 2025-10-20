import { Request, Response } from 'express';
import path from 'path';

export class ImageController {
  sendImage = (req: Request, res: Response): void => {
    const filename = req.params.filename;
    const imagePath = path.join(__dirname, '..', 'uploads', filename);

    // Enviar el archivo al cliente
    res.sendFile(imagePath, (err) => {
      if (err) {
        console.error('Error al enviar la imagen:', err);
        res.status(404).json({ message: 'Imagen no encontrada' });
      }
    });
  };
}
