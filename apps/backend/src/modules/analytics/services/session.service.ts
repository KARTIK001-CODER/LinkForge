import { AnalyticsRepository } from '../repositories/analytics.repository';

export class SessionService {
  constructor(private analyticsRepo: AnalyticsRepository) {}

  async trackSession(visitorId: string, linkId: string): Promise<string> {
    const session = await this.analyticsRepo.findOrCreateSession(visitorId, linkId);
    return session.id;
  }
}
