import crypto from 'crypto';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import { VisitorData } from '../models/analytics.domain';

export class VisitorService {
  constructor(private analyticsRepo: AnalyticsRepository) {}

  async processVisitor(ip: string, userAgent: string): Promise<string> {
    const today = new Date().toISOString().split('T')[0];
    const salt = process.env.ANALYTICS_SALT || 'default-salt';
    
    // Hash IP + UA + Date + Salt to ensure no PII is stored
    const hashInput = `${ip}-${userAgent}-${today}-${salt}`;
    const visitorHash = crypto.createHash('sha256').update(hashInput).digest('hex');

    const visitorData: VisitorData = { hash: visitorHash };
    
    const visitor = await this.analyticsRepo.upsertVisitor(visitorData);
    return visitor.id;
  }
}
