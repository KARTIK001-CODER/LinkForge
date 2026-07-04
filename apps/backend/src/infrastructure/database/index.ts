import mongoose from 'mongoose';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error({ err }, 'MongoDB connection error');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    await mongoose.connect(env.MONGO_URI);
  } catch (error) {
    logger.error({ err: error }, 'Failed to connect to MongoDB');
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected through app termination');
  } catch (error) {
    logger.error({ err: error }, 'Error during MongoDB disconnection');
  }
};
