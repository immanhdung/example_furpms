import { Request } from 'express';

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export interface SortOptions {
  [key: string]: 1 | -1;
}

export const getPaginationOptions = (req: Request): PaginationOptions => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const getSortOptions = (
  req: Request,
  allowedFields: string[],
  defaultField = 'createdAt',
  defaultOrder: 1 | -1 = -1,
): SortOptions => {
  const sortBy = (req.query.sortBy as string) || defaultField;
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  const field = allowedFields.includes(sortBy) ? sortBy : defaultField;
  return { [field]: sortOrder };
};

export const buildFilterQuery = (
  req: Request,
  allowedFilters: string[],
): Record<string, unknown> => {
  const filter: Record<string, unknown> = { isDeleted: false };
  for (const key of allowedFilters) {
    const value = req.query[key];
    if (value !== undefined && value !== '') {
      filter[key] = value;
    }
  }
  return filter;
};
