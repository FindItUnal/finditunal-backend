import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const JWT_CONFIG = {
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret_change_me',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret_change_me',
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || '10m',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '30m',
};

export const GOOGLE_OAUTH_CONFIG = {
  CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
  // Default scopes minimal for email + identity
  SCOPES: ['openid', 'email', 'profile'],
};

export const ACCESS_RULES = {
  ALLOWED_DOMAIN: '@unal.edu.co',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
};

export const APP_CONFIG = {
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true' || true,
};
