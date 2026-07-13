import prisma from '../../../lib/prisma';
import { EnrichedAnalyticsEvent, VisitorData } from '../models/analytics.domain';

export class AnalyticsRepository {
  async upsertVisitor(visitorData: VisitorData) {
    return prisma.visitor.upsert({
      where: { hash: visitorData.hash },
      update: {},
      create: { hash: visitorData.hash },
    });
  }

  async findOrCreateSession(visitorId: string, linkId: string) {
    const existing = await prisma.visitorSession.findFirst({
      where: { visitorId, linkId, endedAt: null },
    });
    if (existing) return existing;

    return prisma.visitorSession.create({
      data: { visitorId, linkId },
    });
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

  async incrementLinkClicks(linkId: string) {
    return prisma.smartLink.update({
      where: { id: linkId },
      data: { clicks: { increment: 1 } },
    });
  }

  async updateDailyMetrics(linkId: string, timestamp: Date, visitorId: string) {
    const date = new Date(timestamp);
    date.setUTCHours(0, 0, 0, 0);

    const month = new Date(date);
    month.setUTCDate(1);

    await prisma.dailyMetrics.upsert({
      where: { linkId_date: { linkId, date } },
      update: { totalClicks: { increment: 1 } },
      create: {
        linkId,
        date,
        totalClicks: 1,
        uniqueVisitors: 1,
      },
    });

    await prisma.monthlyMetrics.upsert({
      where: { linkId_month: { linkId, month } },
      update: { totalClicks: { increment: 1 } },
      create: {
        linkId,
        month,
        totalClicks: 1,
        uniqueVisitors: 1,
      },
    });
  }

  async updateAggregatedMetric(linkId: string, dimension: string, value: string) {
    return prisma.aggregatedMetrics.upsert({
      where: { linkId_dimension_value: { linkId, dimension, value } },
      update: { clicks: { increment: 1 } },
      create: { linkId, dimension, value, clicks: 1 },
    });
  }

  async recordDbError(type: string) {
    console.error(`[Analytics] DB Error type=${type}`);
  }
}
