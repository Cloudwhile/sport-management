import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../config/index.js';
import { DecodedToken } from '../types/express.js';

export const generateToken = (payload: Omit<DecodedToken, 'iat' | 'exp'>): string => {
  return jwt.sign(payload as any, config.jwt.secret as any, {
    expiresIn: config.jwt.expiresIn as any,
  } as any);
};

export const verifyToken = (token: string): DecodedToken | null => {
  try {
    return jwt.verify(token, config.jwt.secret) as DecodedToken;
  } catch (error) {
    return null;
  }
};
