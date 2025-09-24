import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

type TokenPayload = {
  id: string;
  email: string;
  role: string;
  type?: string;
};

export const generateTokens = (user: { id: string; email: string; role: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, type: 'access' },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpirationMinutes * 60 }
  );

  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpirationDays * 24 * 60 * 60 }
  );

  return { accessToken, refreshToken };
};

export const verifyToken = (token: string, isRefresh = false) => {
  try {
    const secret = isRefresh ? config.jwt.refreshSecret : config.jwt.secret;
    return jwt.verify(token, secret) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const setTokenCookies = (res: any, tokens: { accessToken: string; refreshToken: string }) => {
  const { accessToken, refreshToken } = tokens;
  
  // Set HTTP-only cookies
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: config.jwt.accessExpirationMinutes * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: config.jwt.refreshExpirationDays * 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh-token',
  });
};
