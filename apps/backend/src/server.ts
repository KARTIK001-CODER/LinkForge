import app from './app';
import { AnalyticsWorker } from './modules/analytics/services/analytics.worker';
import logger from './lib/logger';

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'ANALYTICS_SALT',
] as const;

for (const envVar of REQUIRED_ENV_VARS) {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} environment variable is required`);
  }
}

const PORT = process.env.PORT || 4000;

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled rejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception');
  process.exit(1);
});

const analyticsWorker = new AnalyticsWorker();

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started');
  analyticsWorker.start().catch((err) => logger.error({ err }, 'Worker start failed'));
});

const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Shutting down gracefully');
  analyticsWorker.stop();
  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      const prisma = (await import('./lib/prisma')).default;
      await prisma.$disconnect();
      logger.info('Prisma disconnected');
    } catch (e) {
      logger.error({ err: e }, 'Prisma disconnect error');
    }
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
