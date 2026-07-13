import app from './app';
import { AnalyticsWorker } from './modules/analytics/services/analytics.worker';

const PORT = process.env.PORT || 4000;

const analyticsWorker = new AnalyticsWorker();

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  analyticsWorker.start().catch(console.error);
});

const shutdown = async (signal: string) => {
  console.log(`[Server] Received ${signal}, shutting down gracefully...`);
  analyticsWorker.stop();
  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
