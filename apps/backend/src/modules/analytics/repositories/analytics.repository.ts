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
    const sessionTimeout = new Date(Date.now() - 30 * 60 * 1000);
    const existing = await prisma.visitorSession.findFirst({
      where: {
        visitorId,
        linkId,
        endedAt: null,
        startedAt: { gte: sessionTimeout },
      },
    });
    if (existing) return existing;

    await prisma.visitorSession.updateMany({
      where: { visitorId, linkId, endedAt: null },
      data: { endedAt: new Date() },
    });

    return prisma.visitorSession.create({
      data: { visitorId, linkId },
    });
  }

  async createAnalyticsEvent(event: EnrichedAnalyticsEvent) {
    return prisma.analyticsEvent.create({
      data: {
        linkId: event.linkId,
        alias: event.alias,
        ownerId: event.ownerId,
        sessionId: event.sessionId,
        visitorId: event.visitorId,
        timestamp: event.timestamp,
        ipHash: event.ipHash,
        country: event.country,
        region: event.region,
        city: event.city,
        timezone: event.timezone,
        language: event.language,
        browser: event.browser,
        browserVersion: event.browserVersion,
        os: event.os,
        osVersion: event.osVersion,
        deviceType: event.deviceType,
        platform: event.platform,
        userAgent: event.userAgent,
        referrer: event.referrer,
        referrerUrl: event.referrerUrl,
        utmSource: event.utmSource,
        utmMedium: event.utmMedium,
        utmCampaign: event.utmCampaign,
        utmContent: event.utmContent,
        utmTerm: event.utmTerm,
        redirectDuration: event.redirectDuration ?? 0,
        httpStatus: event.httpStatus ?? 302,
      },
    });
  }

  async batchCreateAnalyticsEvents(events: EnrichedAnalyticsEvent[]) {
    return prisma.analyticsEvent.createMany({
      data: events.map(e => ({
        linkId: e.linkId,
        alias: e.alias,
        ownerId: e.ownerId,
        sessionId: e.sessionId,
        visitorId: e.visitorId,
        timestamp: e.timestamp,
        ipHash: e.ipHash,
        country: e.country,
        region: e.region,
        city: e.city,
        timezone: e.timezone,
        language: e.language,
        browser: e.browser,
        browserVersion: e.browserVersion,
        os: e.os,
        osVersion: e.osVersion,
        deviceType: e.deviceType,
        platform: e.platform,
        userAgent: e.userAgent,
        referrer: e.referrer,
        referrerUrl: e.referrerUrl,
        utmSource: e.utmSource,
        utmMedium: e.utmMedium,
        utmCampaign: e.utmCampaign,
        utmContent: e.utmContent,
        utmTerm: e.utmTerm,
        redirectDuration: e.redirectDuration ?? 0,
        httpStatus: e.httpStatus ?? 302,
      })),
      skipDuplicates: true,
    });
  }

  async incrementLinkClicks(linkId: string) {
    return prisma.smartLink.update({
      where: { id: linkId },
      data: { clicks: { increment: 1 } },
    });
  }

  async updateHourlyMetrics(linkId: string, timestamp: Date, visitorId: string, isUnique: boolean) {
    const hour = new Date(timestamp);
    hour.setUTCMinutes(0, 0, 0);

    const upsertData: any = {
      totalClicks: { increment: 1 },
    };
    if (isUnique) {
      upsertData.uniqueVisitors = { increment: 1 };
    }

    return prisma.hourlyMetrics.upsert({
      where: { linkId_hour: { linkId, hour } },
      update: upsertData,
      create: {
        linkId,
        hour,
        totalClicks: 1,
        uniqueVisitors: isUnique ? 1 : 0,
      },
    });
  }

  async updateDailyMetrics(linkId: string, timestamp: Date, visitorId: string, isUnique: boolean) {
    const date = new Date(timestamp);
    date.setUTCHours(0, 0, 0, 0);

    const upsertData: any = {
      totalClicks: { increment: 1 },
    };
    if (isUnique) {
      upsertData.uniqueVisitors = { increment: 1 };
    }

    await prisma.dailyMetrics.upsert({
      where: { linkId_date: { linkId, date } },
      update: upsertData,
      create: {
        linkId,
        date,
        totalClicks: 1,
        uniqueVisitors: isUnique ? 1 : 0,
      },
    });

    const month = new Date(date);
    month.setUTCDate(1);

    await prisma.monthlyMetrics.upsert({
      where: { linkId_month: { linkId, month } },
      update: upsertData,
      create: {
        linkId,
        month,
        totalClicks: 1,
        uniqueVisitors: isUnique ? 1 : 0,
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

  async recordDbError(type: string, error?: any) {
    console.error(`[Analytics] DB Error type=${type}`, error?.message || '');
  }

  async checkExistingVisitorToday(linkId: string, visitorId: string, date: Date): Promise<boolean> {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existing = await prisma.analyticsEvent.findFirst({
      where: {
        linkId,
        visitorId,
        timestamp: { gte: startOfDay, lte: endOfDay },
      },
    });
    return existing !== null;
  }
}
