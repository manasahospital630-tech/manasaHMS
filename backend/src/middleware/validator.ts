import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        const detailedMessage = formattedErrors.map((e) => `${e.field}: ${e.message}`).join('; ');

        res.status(400).json({
          success: false,
          error: `Validation failed: ${detailedMessage}`,
          details: formattedErrors,
        });
        return;
      }

      next(error);
    }
  };
};
