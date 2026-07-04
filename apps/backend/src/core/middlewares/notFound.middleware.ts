import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/ApiError';
import { HTTP_STATUS, MESSAGES } from '../constants';

export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.NOT_FOUND);
  next(error);
};
