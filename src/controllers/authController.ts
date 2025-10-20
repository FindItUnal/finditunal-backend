/* eslint-disable prettier/prettier */
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config';
import UserModel from '../models/UserModel';
import bcrypt from 'bcrypt';
import { validateLogin, validateRegister } from '../schemas/authSchemas';

export class AuthController {
  private userModel: UserModel;

  constructor(userModel: UserModel) {
    this.userModel = userModel;
  }

  // Registrar un nuevo usuario
  register = async (req: Request, res: Response): Promise<void> => {
    const validate = validateRegister(req.body);

    if (!validate.success) {
      // 422 Unprocessable Entity
      res.status(400).json({ error: JSON.parse(validate.error.message) });
      return;
    }

    const result = req.body;

    try {
      // Verificar si el usuario ya existe
      const existingUser = await this.userModel.getUserByEmail(result.email);
      if (existingUser) {
        res.status(400).json({ message: 'El usuario ya existe' });
        return;
      }

      // Hash de la contraseña
      const password_hash = await bcrypt.hash(result.password, 10);
      result.password = password_hash;
      // Crear el usuario
      await this.userModel.createUser(result);

      res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
  };

  // Iniciar sesión
  login = async (req: Request, res: Response): Promise<void> => {
    const validate = validateLogin(req.body);

    if (!validate.success) {
      res.status(400).json({ error: JSON.parse(validate.error.message) });
      return;
    }

    const { email, password } = req.body;

    try {
      // Buscar el usuario por email
      const user = await this.userModel.getUserByEmail(email);
      if (!user) {
        res.status(401).json({ message: 'Credenciales inválidas' });
        return;
      }

      // Verificar la contraseña
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        res.status(401).json({ message: 'Credenciales inválidas' });
        return;
      }

      // Generar access token
      const accessToken = jwt.sign({ user_id: user.user_id, role: user.role }, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
        expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
      } as jwt.SignOptions);

      // Generar refresh token
      const refreshToken = jwt.sign({ user_id: user.user_id }, JWT_CONFIG.REFRESH_TOKEN_SECRET, {
        expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
      } as jwt.SignOptions);

      // Configurar cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true, // Necesario para sameSite: 'none'
        maxAge: 10 * 60 * 1000, // 10 minutos
        sameSite: 'none',
        path: '/',
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true, // Necesario para sameSite: 'none'
        maxAge: 30 * 60 * 1000, // 30 minuto
        sameSite: 'none',
        path: '/',
      });

      res.status(200).json({ message: 'Inicio de sesión exitoso' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
  };

  // Refrescar el access token
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.cookies;

    try {
      // Verificar el refresh token
      const decoded = jwt.verify(refreshToken, JWT_CONFIG.REFRESH_TOKEN_SECRET) as {
        user_id: number;
      };

      // Generar un nuevo access token
      const accessToken = jwt.sign({ user_id: decoded.user_id }, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
        expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
      } as jwt.SignOptions);

      // Configurar la nueva cookie de access token
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        maxAge: 10 * 60 * 1000, // 10 minutos
        sameSite: 'none',
        path: '/',
      });

      res.status(200).json({ message: 'Access token refrescado' });
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Refresh token inválido' });
    }
  };

  logout = (_req: Request, res: Response): void => {
    try {
      // Eliminar las cookies de accessToken y refreshToken
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.status(200).json({ message: 'Sesión cerrada exitosamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
  };

  getUserModel = (): UserModel => {
    return this.userModel;
  };
}
