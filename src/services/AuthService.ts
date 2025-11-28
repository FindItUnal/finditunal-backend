import jwt from 'jsonwebtoken';
import { ACCESS_RULES, GOOGLE_OAUTH_CONFIG, JWT_CONFIG } from '../config';
import UserModel from '../models/UserModel';
import { UpdateUserInput } from '../schemas/authSchemas';
import { UnauthorizedError, NotFoundError, ConflictError, ForbiddenError } from '../utils/errors';
import { OAuth2Client } from 'google-auth-library';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserInfo {
  user_id: string;
  email: string;
  name: string;
  phone_number?: string;
  role: 'user' | 'admin';
  is_active: number;
}

export class AuthService {
  constructor(private userModel: UserModel) {}

  // Construir URL de autorización de Google
  getGoogleAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: GOOGLE_OAUTH_CONFIG.CLIENT_ID,
      redirect_uri: GOOGLE_OAUTH_CONFIG.REDIRECT_URI,
      response_type: 'code',
      scope: GOOGLE_OAUTH_CONFIG.SCOPES.join(' '),
      access_type: 'online',
      include_granted_scopes: 'true',
      prompt: 'consent',
    });
    if (state) params.set('state', state);
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Intercambiar el code por tokens y autenticar usuario
  async loginWithGoogle(code: string): Promise<{ tokens: TokenPair; user: UserInfo }> {
    if (!GOOGLE_OAUTH_CONFIG.CLIENT_ID || !GOOGLE_OAUTH_CONFIG.CLIENT_SECRET) {
      throw new UnauthorizedError('Configuración de Google OAuth incompleta');
    }

    const client = new OAuth2Client(
      GOOGLE_OAUTH_CONFIG.CLIENT_ID,
      GOOGLE_OAUTH_CONFIG.CLIENT_SECRET,
      GOOGLE_OAUTH_CONFIG.REDIRECT_URI,
    );

    const { tokens } = await client.getToken({ code, redirect_uri: GOOGLE_OAUTH_CONFIG.REDIRECT_URI });
    if (!tokens.id_token) {
      throw new UnauthorizedError('No se recibió id_token de Google');
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_OAUTH_CONFIG.CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      throw new UnauthorizedError('Token de Google inválido');
    }

    const email = payload.email;
    const googleId = payload.sub;
    const name = payload.name || email.split('@')[0];

    // Reglas de acceso
    const isAdmin = ACCESS_RULES.ADMIN_EMAIL && email.toLowerCase() === ACCESS_RULES.ADMIN_EMAIL.toLowerCase();
    const isAllowedDomain = email.toLowerCase().endsWith(ACCESS_RULES.ALLOWED_DOMAIN);
    if (!isAdmin && !isAllowedDomain) {
      throw new UnauthorizedError('Dominio de correo no permitido');
    }

    // Buscar o crear usuario por google_id
    let user = await this.userModel.getUserByGoogleId(googleId);
    if (!user) {
      const userByEmail = await this.userModel.getUserByEmail(email);
      if (userByEmail) {
        user = userByEmail;
      } else {
        const generatedUserId = await this.generateUserId(email);
        await this.userModel.createUserFromGoogle({
          user_id: generatedUserId,
          email,
          google_id: googleId,
          name,
          role: isAdmin ? 'admin' : 'user',
        });
        user = (await this.userModel.getUserByGoogleId(googleId))!;
      }
    }

    if (!user) {
      throw new UnauthorizedError('No se pudo crear o recuperar el usuario');
    }

    if (user.is_active !== 1) {
      if (user.is_active === 2) {
        throw new ForbiddenError('El usuario se encuentra baneado');
      }
      throw new ForbiddenError('El usuario no est\u00e1 activo');
    }

    const tokensPair = this.generateTokens(user.user_id, isAdmin ? 'admin' : user.role);

    const userInfo: UserInfo = {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      phone_number: user.phone_number,
      role: isAdmin ? 'admin' : user.role,
      is_active: user.is_active,
    };

    return { tokens: tokensPair, user: userInfo };
  }

  // Refrescar el access token
  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      // Verificar el refresh token
      const decoded = jwt.verify(refreshToken, JWT_CONFIG.REFRESH_TOKEN_SECRET) as {
        user_id: string;
      };

      // Generar un nuevo access token
      const accessToken = jwt.sign({ user_id: decoded.user_id }, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
        expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
      } as jwt.SignOptions);

      return accessToken;
    } catch {
      throw new UnauthorizedError('Refresh token inválido');
    }
  }

  // Obtener información del usuario
  async getUserInfo(userId: string): Promise<UserInfo> {
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
      is_active: user.is_active,
    };
  }

  // Actualizar información del usuario
  async updateUser(userId: string, input: UpdateUserInput): Promise<void> {
    const user = await this.userModel.getUserById(userId);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    await this.userModel.updateUser(userId, input);
  }

  // Generar tokens JWT
  private generateTokens(userId: string, role: 'user' | 'admin'): TokenPair {
    const accessToken = jwt.sign({ user_id: userId, role }, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign({ user_id: userId }, JWT_CONFIG.REFRESH_TOKEN_SECRET, {
      expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }

  private async generateUserId(email: string): Promise<string> {
    const localPart = email.split('@')[0] || 'user';
    const sanitized = localPart.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user';

    for (let attempt = 0; attempt < 5; attempt++) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const candidate = `${sanitized}${randomSuffix}`;
      const existing = await this.userModel.getUserById(candidate);
      if (!existing) {
        return candidate;
      }
    }

    throw new ConflictError('No se pudo generar un identificador de usuario único');
  }
}
