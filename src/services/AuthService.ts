import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config';
import UserModel from '../models/UserModel';
import { RegisterInput, UpdateUserInput } from '../schemas/authSchemas';
import { UnauthorizedError, NotFoundError, ConflictError } from '../utils/errors';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserInfo {
  user_id: number;
  email: string;
  name: string;
  phone_number?: string;
  role: 'user' | 'admin';
}

export class AuthService {
  constructor(private userModel: UserModel) {}

  // Registrar un nuevo usuario
  async register(input: RegisterInput): Promise<void> {
    // Verificar si el usuario ya existe
    const existingUser = await this.userModel.getUserByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('El usuario ya existe');
    }

    // Hash de la contraseña
    const password_hash = await bcrypt.hash(input.password, 10);

    // Crear el usuario
    await this.userModel.createUser({
      ...input,
      password: password_hash,
    });
  }

  // Iniciar sesión
  async login(email: string, password: string): Promise<{ tokens: TokenPair; user: UserInfo }> {
    // Buscar el usuario por email
    const user = await this.userModel.getUserByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Generar tokens
    const tokens = this.generateTokens(user.user_id, user.role);

    // Retornar información del usuario (sin datos sensibles)
    const userInfo: UserInfo = {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      phone_number: user.phone_number,
      role: user.role,
    };

    return { tokens, user: userInfo };
  }

  // Refrescar el access token
  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      // Verificar el refresh token
      const decoded = jwt.verify(refreshToken, JWT_CONFIG.REFRESH_TOKEN_SECRET) as {
        user_id: number;
      };

      // Generar un nuevo access token
      const accessToken = jwt.sign({ user_id: decoded.user_id }, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
        expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
      } as jwt.SignOptions);

      return accessToken;
    } catch (error) {
      throw new UnauthorizedError('Refresh token inválido');
    }
  }

  // Obtener información del usuario
  async getUserInfo(userId: number): Promise<UserInfo> {
    const user = await this.userModel.getUserById(userId);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    return {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      phone_number: user.phone_number,
      role: user.role,
    };
  }

  // Actualizar información del usuario
  async updateUser(userId: number, input: UpdateUserInput): Promise<void> {
    const user = await this.userModel.getUserById(userId);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Si se actualiza el email, verificar que no exista otro usuario con ese email
    if (input.email && input.email !== user.email) {
      const existingUser = await this.userModel.getUserByEmail(input.email);
      if (existingUser) {
        throw new ConflictError('El email ya está en uso');
      }
    }

    await this.userModel.updateUser(userId, input);
  }

  // Generar tokens JWT
  private generateTokens(userId: number, role: 'user' | 'admin'): TokenPair {
    const accessToken = jwt.sign({ user_id: userId, role }, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign({ user_id: userId }, JWT_CONFIG.REFRESH_TOKEN_SECRET, {
      expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }
}
