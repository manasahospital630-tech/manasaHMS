import { Request, Response, NextFunction } from 'express';
import { env } from '../config/environment';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = (err as AppError).statusCode || 500;
  const isOperational = (err as AppError).isOperational || statusCode < 500 || err instanceof AppError || err.name === 'AppError';

  console.error('Error Handler:', {
    name: err.name,
    message: err.message,
    statusCode,
    isOperational,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token.',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token has expired.',
    });
    return;
  }

  if (err.name === 'SyntaxError' && 'body' in err) {
    res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body.',
    });
    return;
  }

  // Expose operational error messages (e.g. 401 Invalid Credentials, 403 Deactivated) directly
  const message = isOperational || env.NODE_ENV !== 'production'
    ? (err.message || 'An error occurred.')
    : 'An unexpected error occurred. Please try again later.';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};
