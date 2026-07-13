import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

client.collectDefaultMetrics({ prefix: 'linkforge_' });

export class MetricsService {
  public static readonly redirectLatency = new client.Histogram({
    name: 'linkforge_redirect_duration_seconds',
    help: 'Duration of redirect requests in seconds',
    labelNames: ['status'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5]
  });

  public static readonly apiLatency = new client.Histogram({
    name: 'linkforge_api_duration_seconds',
    help: 'Duration of API requests in seconds',
    labelNames: ['method', 'path', 'status'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5]
  });

  public static readonly cacheHits = new client.Counter({
    name: 'linkforge_cache_hits_total',
    help: 'Total number of cache hits in Redis',
    labelNames: ['cache_type']
  });

  public static readonly cacheMisses = new client.Counter({
    name: 'linkforge_cache_misses_total',
    help: 'Total number of cache misses in Redis',
    labelNames: ['cache_type']
  });

  public static readonly dbLatency = new client.Histogram({
    name: 'linkforge_db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['operation'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1]
  });

  public static readonly errorCounter = new client.Counter({
    name: 'linkforge_errors_total',
    help: 'Total number of application errors',
    labelNames: ['type', 'code']
  });

  public static async getMetrics(): Promise<string> {
    return await client.register.metrics();
  }

  public static getContentType(): string {
    return client.register.contentType;
  }
}

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;

    if (req.path === '/health' || req.path === '/metrics') {
      return;
    }

    if (req.path.startsWith('/api/')) {
      MetricsService.apiLatency.observe({
        method: req.method,
        path: req.path.split('?')[0].replace(/\/[a-f0-9-]{36}/g, '/:id'),
        status: res.statusCode.toString()
      }, durationInSeconds);
      return;
    }

    MetricsService.redirectLatency.observe({ status: res.statusCode.toString() }, durationInSeconds);
  });

  next();
};
