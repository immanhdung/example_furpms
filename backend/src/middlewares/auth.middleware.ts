import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../configs/jwt';
import { ApiError } from '../shared/apiError';
import { Role } from '../constants/roles';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: Role[];
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('No token provided.'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtConfig.accessSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(ApiError.unauthorized('Token has expired.'));
    }
    return next(ApiError.unauthorized('Invalid token.'));
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, jwtConfig.accessSecret) as JwtPayload;
      req.user = decoded;
    } catch {
      // silently ignore invalid tokens for optional auth
    }
  }
  next();
};
