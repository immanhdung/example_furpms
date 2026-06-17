import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../shared/apiError';
import { logger } from '../configs/logger';

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error(`[${req.method}] ${req.path} — ${err.message}`, { stack: err.stack });

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
      errors: err.errors,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed.',
      data: null,
      errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
    return;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid ID format.',
      data: null,
      errors: null,
    });
    return;
  }

  // Mongoose duplicate key error
  if ((err as NodeJS.ErrnoException).code === '11000') {
    res.status(409).json({
      success: false,
      message: 'Duplicate value. Resource already exists.',
      data: null,
      errors: null,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'An internal server error occurred.',
    data: null,
    errors: process.env.NODE_ENV === 'development' ? [err.message] : null,
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found.`,
    data: null,
    errors: null,
  });
};
