import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { APP_CONFIG } from './core/constants';
import { requestIdMiddleware } from './core/middlewares/requestId.middleware';
import { requestLoggerMiddleware } from './core/middlewares/requestLogger.middleware';
import { notFoundMiddleware } from './core/middlewares/notFound.middleware';
import { errorHandlerMiddleware } from './core/middlewares/errorHandler.middleware';

import { healthRoutes } from './modules/health/health.routes';

const app: Application = express();

// Security Middlewares
app.use(helmet());
app.use(cors());

// Payload Parsers & Compression
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Custom Request Middlewares
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);

// Routes
app.use(`${APP_CONFIG.API_PREFIX}/health`, healthRoutes);

// Error Handling
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

export default app;
