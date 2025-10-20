import { Request, Response } from 'express';
import UserModel from '../models/UserModel';
import { validateUpdateUser } from '../schemas/authSchemas';

export class UserController {
  private userModel: UserModel;

  constructor(userModel: UserModel) {
    this.userModel = userModel;
  }

  // Obtener todos los reportes de un usuario
  getUserInformation = async (req: Request, res: Response): Promise<void> => {
    try {
      // Obtener el user_id del token decodificado
      const user_id = req.body.user.user_id;

      // Buscar el usuario en la base de datos
      const user = await this.userModel.getUserById(user_id);

      if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
      }

      // Enviar solo la información necesaria (sin datos sensibles)
      const userInfo = {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        phone_number: user.phone_number,
        role: user.role,
      };

      res.status(200).json(userInfo);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
  };

  // Editar un reporte
  updateUser = async (req: Request, res: Response): Promise<void> => {
    const validate = validateUpdateUser(req.body);

    if (!validate.success) {
      res.status(400).json({ error: JSON.parse(validate.error.message) });
      return;
    }

    const user_id = parseInt(req.params.user_id, 10);

    try {
      const updateData = {
        email: validate.data.email || '',
        name: validate.data.name || '',
        phone_number: validate.data.phone_number,
      };

      await this.userModel.updateUser(user_id, updateData);
      res.status(200).json({ message: 'Usuario actualizado exitosamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
  };
}
