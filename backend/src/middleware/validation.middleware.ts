import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { createErrorResponse } from '../utils/apiResponse.js';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        res.status(400).json(
          createErrorResponse('VALIDATION_ERROR', 'Invalid request body parameter(s)', formattedErrors)
        );
        return;
      }
      next(error);
    }
  };
};
