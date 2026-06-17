import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  errors: unknown[] | null;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
): void => {
  const response: ApiResponse<T> = { success: true, message, data, errors: null };
  res.status(statusCode).json(response);
};

export const sendCreated = <T>(res: Response, data: T, message = 'Created successfully.'): void => {
  sendSuccess(res, data, message, 201);
};

export const sendPaginated = <T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  limit: number,
  message = 'List retrieved successfully.',
): void => {
  const paginatedData: PaginatedData<T> = {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
  sendSuccess(res, paginatedData, message);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  errors: unknown[] | null = null,
): void => {
  const response: ApiResponse<null> = { success: false, message, data: null, errors };
  res.status(statusCode).json(response);
};
