import express from 'express';
import cors from 'cors';
import linkRoutes from './modules/links/routes';
import collectionRoutes from './modules/collections/routes';
import analyticsRoutes from './modules/analytics/routes';
import redirectRoutes from './modules/redirect/routes';
import { metricsMiddleware } from './modules/redirect/services/metrics.service';
import { MetricsController } from './modules/redirect/controllers/metrics.controller';
import { HealthController } from './modules/redirect/controllers/health.controller';

const app = express();

app.use(cors());
app.use(express.json());

// Observability Middleware
app.use(metricsMiddleware);

// Observability Routes
app.get('/metrics', MetricsController.getMetrics);
app.get('/health', HealthController.getHealth);
app.get('/ready', HealthController.getReadiness);

app.use('/api/v1/links', linkRoutes);
app.use('/api/v1/collections', collectionRoutes);
app.use('/api/v1/analytics/links', analyticsRoutes);

// CRITICAL: Mount wildcard redirect routes LAST to avoid intercepting API routes
app.use('/', redirectRoutes);

export default app;
