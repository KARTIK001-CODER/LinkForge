import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AnalyticsService {
  
  async getSummary(linkId: string, workspaceId: string) {
    // Validate that the link belongs to the workspace or is accessible
    // For Epic 3, we just fetch from AnalyticsEvent
    
    const totalClicks = await prisma.analyticsEvent.count({
      where: { linkId }
    });
    
    // Unique visitors are distinct visitorIds
    const uniqueVisitorsResult = await prisma.visitorSession.count({
      where: { linkId } // Since we only create one session per link per visitor per day, this is roughly unique visitors. For exact unique visitors overall:
    });
    // Wait, distinct visitorIds
    const visitors = await prisma.analyticsEvent.groupBy({
      by: ['visitorId'],
      where: { linkId, visitorId: { not: null } },
      _count: true
    });
    const uniqueVisitors = visitors.length;

    // Top Referrer
    const referrers = await prisma.analyticsEvent.groupBy({
      by: ['referrer'],
      where: { linkId, referrer: { not: null } },
      _count: { referrer: true },
      orderBy: { _count: { referrer: 'desc' } },
      take: 1
    });

    const topCountry = await prisma.analyticsEvent.groupBy({
      by: ['country'],
      where: { linkId, country: { not: 'Unknown' } },
      _count: { country: true },
      orderBy: { _count: { country: 'desc' } },
      take: 1
    });

    return {
      totalClicks,
      uniqueVisitors,
      topReferrer: referrers.length > 0 ? referrers[0].referrer : 'Direct',
      topCountry: topCountry.length > 0 ? topCountry[0].country : 'Unknown'
    };
  }

  async getTimeseries(linkId: string, startDate: Date, endDate: Date) {
    // We group by day in memory for now or using raw SQL. Prisma doesn't have date_trunc native yet unless raw.
    // Given the scale in Epic 3, we should pull the events (or dailyMetrics) and return them.
    // For simplicity, let's pull from analyticsEvent
    
    const events = await prisma.analyticsEvent.findMany({
      where: {
        linkId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        }
      },
      select: {
        timestamp: true,
        visitorId: true
      }
    });

    const dailyData: Record<string, { clicks: number, visitors: Set<string> }> = {};
    
    events.forEach(e => {
      const dateStr = e.timestamp.toISOString().split('T')[0];
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { clicks: 0, visitors: new Set() };
      }
      dailyData[dateStr].clicks += 1;
      if (e.visitorId) {
        dailyData[dateStr].visitors.add(e.visitorId);
      }
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      timestamp: date,
      clicks: data.clicks,
      uniqueVisitors: data.visitors.size
    })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async getBreakdown(linkId: string, dimension: 'country' | 'browser' | 'os' | 'deviceType' | 'referrer') {
    const validDimensions = ['country', 'browser', 'os', 'deviceType', 'referrer'];
    if (!validDimensions.includes(dimension)) {
      throw new Error('Invalid dimension');
    }

    const result = await prisma.analyticsEvent.groupBy({
      by: [dimension as any],
      where: { linkId },
      _count: { [dimension]: true },
      orderBy: { _count: { [dimension as any]: 'desc' } },
      take: 10
    });

    return result.map(r => ({
      name: r[dimension as keyof typeof r] || 'Unknown',
      clicks: (r._count as any)[dimension as any]
    }));
  }
}
