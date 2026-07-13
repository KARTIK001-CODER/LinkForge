import prisma from '../../../lib/prisma';

export class AnalyticsService {

  async getSummary(linkId: string, workspaceId: string, startDate?: Date, endDate?: Date) {
    const dateFilter = startDate || endDate ? {
      timestamp: {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      }
    } : {};

    const [totalClicks, uniqueVisitorsAgg, referrers, topCountry] = await Promise.all([
      prisma.analyticsEvent.count({
        where: { linkId, ...dateFilter }
      }),

      prisma.analyticsEvent.groupBy({
        by: ['visitorId'],
        where: { linkId, visitorId: { not: null }, ...dateFilter },
        _count: true,
      }),

      prisma.analyticsEvent.groupBy({
        by: ['referrer'],
        where: { linkId, referrer: { not: null }, ...dateFilter },
        _count: { referrer: true },
        orderBy: { _count: { referrer: 'desc' } },
        take: 1,
      }),

      prisma.analyticsEvent.groupBy({
        by: ['country'],
        where: { linkId, country: { not: 'Unknown' }, ...dateFilter },
        _count: { country: true },
        orderBy: { _count: { country: 'desc' } },
        take: 1,
      }),
    ]);

    return {
      totalClicks,
      uniqueVisitors: uniqueVisitorsAgg.length,
      topReferrer: referrers.length > 0 ? referrers[0].referrer : 'Direct',
      topCountry: topCountry.length > 0 ? topCountry[0].country : 'Unknown',
    };
  }

  async getTimeseries(linkId: string, startDate: Date, endDate: Date) {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (days > 60) {
      return this.getTimeseriesFromMonthly(linkId, startDate, endDate);
    }
    return this.getTimeseriesFromDaily(linkId, startDate, endDate);
  }

  private async getTimeseriesFromDaily(linkId: string, startDate: Date, endDate: Date) {
    const dailyMetrics = await prisma.dailyMetrics.findMany({
      where: {
        linkId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });

    if (dailyMetrics.length > 0) {
      return dailyMetrics.map(d => ({
        timestamp: d.date.toISOString().split('T')[0],
        clicks: d.totalClicks,
        uniqueVisitors: d.uniqueVisitors,
      }));
    }

    const events = await prisma.analyticsEvent.findMany({
      where: {
        linkId,
        timestamp: { gte: startDate, lte: endDate },
      },
      select: { timestamp: true, visitorId: true },
    });

    const dailyMap: Record<string, { clicks: number; visitors: Set<string> }> = {};
    for (const e of events) {
      const dateStr = e.timestamp.toISOString().split('T')[0];
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { clicks: 0, visitors: new Set() };
      }
      dailyMap[dateStr].clicks += 1;
      if (e.visitorId) {
        dailyMap[dateStr].visitors.add(e.visitorId);
      }
    }

    const result = Object.entries(dailyMap).map(([date, data]) => ({
      timestamp: date,
      clicks: data.clicks,
      uniqueVisitors: data.visitors.size,
    }));
    result.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    return result;
  }

  private async getTimeseriesFromMonthly(linkId: string, startDate: Date, endDate: Date) {
    const monthlyMetrics = await prisma.monthlyMetrics.findMany({
      where: {
        linkId,
        month: { gte: startDate, lte: endDate },
      },
      orderBy: { month: 'asc' },
    });

    if (monthlyMetrics.length > 0) {
      return monthlyMetrics.map(m => ({
        timestamp: m.month.toISOString().split('T')[0],
        clicks: m.totalClicks,
        uniqueVisitors: m.uniqueVisitors,
      }));
    }

    const events = await prisma.analyticsEvent.findMany({
      where: {
        linkId,
        timestamp: { gte: startDate, lte: endDate },
      },
      select: { timestamp: true, visitorId: true },
    });

    const monthlyMap: Record<string, { clicks: number; visitors: Set<string> }> = {};
    for (const e of events) {
      const monthStr = e.timestamp.toISOString().slice(0, 7);
      if (!monthlyMap[monthStr]) {
        monthlyMap[monthStr] = { clicks: 0, visitors: new Set() };
      }
      monthlyMap[monthStr].clicks += 1;
      if (e.visitorId) {
        monthlyMap[monthStr].visitors.add(e.visitorId);
      }
    }

    return Object.entries(monthlyMap).map(([month, data]) => ({
      timestamp: month,
      clicks: data.clicks,
      uniqueVisitors: data.visitors.size,
    })).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  async getBreakdown(linkId: string, dimension: 'country' | 'browser' | 'os' | 'deviceType' | 'referrer') {
    const validDimensions = ['country', 'browser', 'os', 'deviceType', 'referrer'];
    if (!validDimensions.includes(dimension)) {
      throw new Error('Invalid dimension');
    }

    const agg = await prisma.aggregatedMetrics.findMany({
      where: { linkId, dimension },
      orderBy: { clicks: 'desc' },
      take: 10,
    });

    if (agg.length > 0) {
      return agg.map(r => ({
        name: r.value,
        clicks: r.clicks,
      }));
    }

    const result = await prisma.analyticsEvent.groupBy({
      by: [dimension as any],
      where: { linkId },
      _count: { [dimension]: true },
      orderBy: { _count: { [dimension as any]: 'desc' } },
      take: 10,
    });

    return result.map(r => ({
      name: r[dimension as keyof typeof r] || 'Unknown',
      clicks: (r._count as any)[dimension as any],
    }));
  }
}
