import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = reqId as string;
  res.setHeader('X-Request-Id', reqId);
  next();
};
