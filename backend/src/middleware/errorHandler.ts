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

  console.error('Error Handler:', {
    name: err.name,
    message: err.message,
    statusCode,
    stack: err.stack,
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

  // Always return human-readable error message to help diagnostic feedback on Hostinger/Cloud hosting
  const message = err.message || 'An unexpected error occurred. Please try again later.';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};
