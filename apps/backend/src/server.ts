import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './infrastructure/database';

const startServer = async () => {
  try {
    // Connect to Infrastructure
    await connectDatabase();

    // Start Express Server
    const server = app.listen(env.PORT, () => {
      logger.info(`Server is running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    // Graceful Shutdown Handlers
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDatabase();
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    // Handle Uncaught Exceptions & Rejections
    process.on('uncaughtException', (err) => {
      logger.fatal({ err }, 'Uncaught Exception');
      process.exit(1);
    });

    process.on('unhandledRejection', (err) => {
      logger.fatal({ err }, 'Unhandled Rejection');
      process.exit(1);
    });

  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();
