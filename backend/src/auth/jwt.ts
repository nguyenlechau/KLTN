import jwt from 'jsonwebtoken';
import { Secret, SignOptions } from 'jsonwebtoken';
import { AuthUser } from '../types.js';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'replace_me_in_prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

export interface JwtPayload {
  sub: string;
  email: string;
  role: AuthUser['role'];
  channelIds?: string[];
}

export function signAccessToken(user: AuthUser): string {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    channelIds: user.channelIds ?? [],
  };

  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
