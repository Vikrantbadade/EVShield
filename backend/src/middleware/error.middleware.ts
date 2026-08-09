import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';
import { createErrorResponse } from '../utils/apiResponse.js';

export class AppError extends Error {
  public statusCode: number;
  public errorCode: string;

  constructor(message: string, statusCode = 500, errorCode = 'INTERNAL_SERVER_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const errorCode = err instanceof AppError ? err.errorCode : 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected internal error occurred.';

  // Log error internally in dev or staging
  if (config.isDevelopment) {
    console.error(`[ERROR] ${errorCode} (${statusCode}):`, err);
  }

  res.status(statusCode).json(
    createErrorResponse(
      errorCode,
      message,
      config.isDevelopment ? { stack: err.stack } : undefined
    )
  );
};
