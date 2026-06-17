export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors: unknown[] | null;

  constructor(statusCode: number, message: string, errors: unknown[] | null = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, errors?: unknown[]): ApiError {
    return new ApiError(400, message, errors ?? null);
  }

  static unauthorized(message = 'Unauthorized access.'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Access forbidden.'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found.'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }

  static internal(message = 'An internal server error occurred.'): ApiError {
    return new ApiError(500, message);
  }
}
