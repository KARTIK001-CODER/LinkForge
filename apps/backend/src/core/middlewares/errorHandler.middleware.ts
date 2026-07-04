import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/ApiError';
import { HTTP_STATUS, MESSAGES, APP_CONFIG } from '../constants';
import { logger } from '../../config/logger';

export const errorHandlerMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message: string = MESSAGES.INTERNAL_SERVER_ERROR;
  let isOperational = false;
  let errors: any[] = [];

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
    errors = err.errors || [];
  }

  if (!isOperational) {
    logger.error({ err, reqId: req.id }, 'Unexpected Error');
  } else {
    logger.warn({ err: err.message, reqId: req.id }, 'Operational Error');
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(process.env.NODE_ENV === APP_CONFIG.ENVIRONMENTS.DEVELOPMENT && { stack: err.stack }),
  });
};
