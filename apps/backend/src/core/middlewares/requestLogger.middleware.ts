import { Request, Response, NextFunction } from 'express';
import { logger } from '../../config/logger';

export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      reqId: req.id,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
    }, 'HTTP Request');
  });

  next();
};
