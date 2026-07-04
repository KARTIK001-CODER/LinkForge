import mongoose from 'mongoose';
import { env } from '../../config/env';

export class HealthService {
  public static getSystemHealth() {
    return {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      },
    };
  }
}
