import app from './app';
import { AnalyticsWorker } from './modules/analytics/services/analytics.worker';

const PORT = process.env.PORT || 4000;

process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught Exception:', error);
  process.exit(1);
});

const analyticsWorker = new AnalyticsWorker();

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  analyticsWorker.start().catch((err) => console.error('[Server] Worker start failed:', err));
});

const shutdown = async (signal: string) => {
  console.log(`[Server] Received ${signal}, shutting down gracefully...`);
  analyticsWorker.stop();
  server.close(async () => {
    console.log('[Server] HTTP server closed');
    try {
      const prisma = (await import('./lib/prisma')).default;
      await prisma.$disconnect();
      console.log('[Server] Prisma disconnected');
    } catch (e) {
      console.error('[Server] Prisma disconnect error', e);
    }
    process.exit(0);
  });
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
