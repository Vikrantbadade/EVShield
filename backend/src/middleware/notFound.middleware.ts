import { Request, Response } from 'express';
import { createErrorResponse } from '../utils/apiResponse.js';

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json(
    createErrorResponse('NOT_FOUND', `Route ${req.originalUrl} not found on this server.`)
  );
};
