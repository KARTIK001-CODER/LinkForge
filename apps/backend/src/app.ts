import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import linkRoutes from './modules/links/routes';
import collectionRoutes from './modules/collections/routes';
import analyticsRoutes from './modules/analytics/routes';
import authRoutes from './modules/auth/routes';
import redirectRoutes from './modules/redirect/routes';
import { metricsMiddleware } from './modules/redirect/services/metrics.service';
import { MetricsController } from './modules/redirect/controllers/metrics.controller';
import { HealthController } from './modules/redirect/controllers/health.controller';
import { AuthMiddleware } from './modules/auth/middleware/auth.middleware';
import { requestIdMiddleware } from './lib/request-id';
import logger from './lib/logger';

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(compression());
app.use(cookieParser());
app.use(requestIdMiddleware);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many requests, please try again later' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const redirectLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many redirect requests' } },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);

app.use(metricsMiddleware);

app.get('/metrics', MetricsController.getMetrics);
app.get('/health', HealthController.getHealth);
app.get('/ready', HealthController.getReadiness);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/links', AuthMiddleware.optionalAuth, linkRoutes);
app.use('/api/v1/collections', AuthMiddleware.optionalAuth, collectionRoutes);
app.use('/api/v1/analytics/links', AuthMiddleware.optionalAuth, analyticsRoutes);

app.use('/', redirectLimiter, redirectRoutes);

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err, requestId: req.requestId }, 'Unhandled error');
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
});

export default app;
