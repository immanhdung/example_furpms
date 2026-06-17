import { Request, Response, NextFunction } from 'express';
import { Role } from '../constants/roles';
import { ApiError } from '../shared/apiError';

export const authorize =
  (...allowedRoles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(ApiError.unauthorized());

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return next(ApiError.forbidden(`Access requires one of: ${allowedRoles.join(', ')}`));
    }
    next();
  };

export const authorizeOwnerOrRoles =
  (getOwnerId: (req: Request) => string | undefined, ...allowedRoles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(ApiError.unauthorized());

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (hasRole) return next();

    const ownerId = getOwnerId(req);
    if (ownerId && ownerId === req.user.sub) return next();

    return next(ApiError.forbidden());
  };
