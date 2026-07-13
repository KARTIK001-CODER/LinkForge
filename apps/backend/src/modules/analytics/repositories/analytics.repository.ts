import { PrismaClient } from '@prisma/client';
import { EnrichedAnalyticsEvent, VisitorData } from '../models/analytics.domain';

const prisma = new PrismaClient();

export class AnalyticsRepository {
  async upsertVisitor(visitorData: VisitorData) {
    return prisma.visitor.upsert({
      where: { hash: visitorData.hash },
      update: {},
      create: { hash: visitorData.hash },
    });
  }

  async findOrCreateSession(visitorId: string, linkId: string) {
    let session = await prisma.visitorSession.findFirst({
      where: { visitorId, linkId },
    });

    if (!session) {
      session = await prisma.visitorSession.create({
        data: {
          visitorId,
          linkId,
        }
      });
    }
    return session;
  }

  async createAnalyticsEvent(event: EnrichedAnalyticsEvent) {
    return prisma.analyticsEvent.create({
      data: {
        linkId: event.linkId,
        visitorId: event.visitorId,
        timestamp: event.timestamp,
        country: event.country,
        city: event.city,
        browser: event.browser,
        os: event.os,
        deviceType: event.deviceType,
        referrer: event.referrer,
        utmSource: event.utmSource,
        utmMedium: event.utmMedium,
        utmCampaign: event.utmCampaign,
      }
    });
  }
}
