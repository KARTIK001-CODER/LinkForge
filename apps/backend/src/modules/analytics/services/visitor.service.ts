import crypto from 'crypto';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import { VisitorData } from '../models/analytics.domain';

export class VisitorService {
  constructor(private analyticsRepo: AnalyticsRepository) {}

  async processVisitor(ip: string, userAgent: string): Promise<{ visitorId: string; ipHash: string }> {
    const today = new Date().toISOString().split('T')[0];
    const salt = process.env.ANALYTICS_SALT || 'default-salt';

    const hashInput = `${ip}-${userAgent}-${today}-${salt}`;
    const visitorHash = crypto.createHash('sha256').update(hashInput).digest('hex');

    const ipHashInput = `${ip}-${salt}`;
    const ipHash = crypto.createHash('sha256').update(ipHashInput).digest('hex').slice(0, 16);

    const visitorData: VisitorData = { hash: visitorHash };
    const visitor = await this.analyticsRepo.upsertVisitor(visitorData);
    return { visitorId: visitor.id, ipHash };
  }

  generateSessionId(): string {
    return crypto.randomUUID();
  }
}
