import { Prisma } from '@prisma/client';
import prisma from '../../../lib/prisma';
import { AnalyticsCache } from './analytics.cache';

export interface SummaryResult {
  totalClicks: number;
  uniqueVisitors: number;
  topReferrer: string;
  topCountry: string;
  topBrowser: string;
  topDevice: string;
  totalLinks: number;
  avgRedirectDuration: number;
}

export interface TimeseriesPoint {
  timestamp: string;
  clicks: number;
  uniqueVisitors: number;
}

export interface BreakdownItem {
  name: string;
  clicks: number;
}

const VALID_DIMENSIONS = ['country', 'browser', 'os', 'deviceType', 'referrer'] as const;
type Dimension = typeof VALID_DIMENSIONS[number];

export class AnalyticsService {
  private cache: AnalyticsCache;

  constructor() {
    this.cache = new AnalyticsCache();
  }

  async getSummary(linkId: string, userId: string, startDate?: Date, endDate?: Date): Promise<SummaryResult> {
    const cacheKey = `${linkId}:summary:${startDate?.toISOString() || ''}:${endDate?.toISOString() || ''}`;
    const cached = await this.cache.get<SummaryResult>(cacheKey);
    if (cached) {
      await this.cache.recordHit();
      return cached;
    }
    await this.cache.recordMiss();

    const dateFilter = startDate || endDate ? {
      timestamp: {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      }
    } : {};

    const [dailyAgg, hourlyAgg, referrers, countries, browsers, devices, linkClickCount, redirectDurationAgg] = await Promise.all([
      prisma.dailyMetrics.aggregate({
        where: { linkId, date: dateFilter.timestamp as any || undefined },
        _sum: { totalClicks: true, uniqueVisitors: true },
      }),
      prisma.hourlyMetrics.aggregate({
        where: { linkId, hour: dateFilter.timestamp as any || undefined },
        _sum: { totalClicks: true, uniqueVisitors: true },
      }),
      prisma.aggregatedMetrics.findMany({
        where: { linkId, dimension: 'referrer' },
        orderBy: { clicks: 'desc' },
        take: 1,
      }),
      prisma.aggregatedMetrics.findMany({
        where: { linkId, dimension: 'country' },
        orderBy: { clicks: 'desc' },
        take: 1,
      }),
      prisma.aggregatedMetrics.findMany({
        where: { linkId, dimension: 'browser' },
        orderBy: { clicks: 'desc' },
        take: 1,
      }),
      prisma.aggregatedMetrics.findMany({
        where: { linkId, dimension: 'deviceType' },
        orderBy: { clicks: 'desc' },
        take: 1,
      }),
      prisma.smartLink.findUnique({
        where: { id: linkId },
        select: { clicks: true },
      }),
      prisma.analyticsEvent.aggregate({
        where: { linkId, ...dateFilter },
        _avg: { redirectDuration: true },
      }),
    ]);

    const totalFromDaily = dailyAgg._sum.totalClicks || 0;
    const totalFromHourly = hourlyAgg._sum.totalClicks || 0;
    const totalClicks = linkClickCount?.clicks || Math.max(totalFromDaily, totalFromHourly);

    const uniqueFromDaily = dailyAgg._sum.uniqueVisitors || 0;
    const uniqueFromHourly = hourlyAgg._sum.uniqueVisitors || 0;
    const uniqueVisitors = Math.max(uniqueFromDaily, uniqueFromHourly);

    const result: SummaryResult = {
      totalClicks,
      uniqueVisitors,
      topReferrer: referrers.length > 0 ? referrers[0].value : 'Direct',
      topCountry: countries.length > 0 ? countries[0].value : 'Unknown',
      topBrowser: browsers.length > 0 ? browsers[0].value : 'Unknown',
      topDevice: devices.length > 0 ? devices[0].value : 'Unknown',
      totalLinks: 1,
      avgRedirectDuration: Math.round(redirectDurationAgg._avg.redirectDuration || 0),
    };

    await this.cache.set(cacheKey, result, 30);
    return result;
  }

  async getTimeseries(linkId: string, startDate: Date, endDate: Date): Promise<TimeseriesPoint[]> {
    const cacheKey = `${linkId}:timeseries:${startDate.toISOString()}:${endDate.toISOString()}`;
    const cached = await this.cache.get<TimeseriesPoint[]>(cacheKey);
    if (cached) {
      await this.cache.recordHit();
      return cached;
    }
    await this.cache.recordMiss();

    const hours = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
    const days = Math.ceil(hours / 24);

    let result: TimeseriesPoint[];

    if (hours <= 48) {
      result = await this.getTimeseriesFromHourly(linkId, startDate, endDate);
    } else if (days <= 90) {
      result = await this.getTimeseriesFromDaily(linkId, startDate, endDate);
    } else {
      result = await this.getTimeseriesFromMonthly(linkId, startDate, endDate);
    }

    if (result.length === 0) {
      result = await this.getTimeseriesFromRaw(linkId, startDate, endDate, hours <= 48 ? 'hour' : days <= 90 ? 'day' : 'month');
    }

    await this.cache.set(cacheKey, result, 60);
    return result;
  }

  private async getTimeseriesFromHourly(linkId: string, startDate: Date, endDate: Date): Promise<TimeseriesPoint[]> {
    const metrics = await prisma.hourlyMetrics.findMany({
      where: { linkId, hour: { gte: startDate, lte: endDate } },
      orderBy: { hour: 'asc' },
    });

    if (metrics.length > 0) {
      return metrics.map(m => ({
        timestamp: m.hour.toISOString(),
        clicks: m.totalClicks,
        uniqueVisitors: m.uniqueVisitors,
      }));
    }
    return [];
  }

  private async getTimeseriesFromDaily(linkId: string, startDate: Date, endDate: Date): Promise<TimeseriesPoint[]> {
    const metrics = await prisma.dailyMetrics.findMany({
      where: { linkId, date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'asc' },
    });

    if (metrics.length > 0) {
      return metrics.map(m => ({
        timestamp: m.date.toISOString().split('T')[0],
        clicks: m.totalClicks,
        uniqueVisitors: m.uniqueVisitors,
      }));
    }
    return [];
  }

  private async getTimeseriesFromMonthly(linkId: string, startDate: Date, endDate: Date): Promise<TimeseriesPoint[]> {
    const metrics = await prisma.monthlyMetrics.findMany({
      where: { linkId, month: { gte: startDate, lte: endDate } },
      orderBy: { month: 'asc' },
    });

    if (metrics.length > 0) {
      return metrics.map(m => ({
        timestamp: m.month.toISOString().split('T')[0],
        clicks: m.totalClicks,
        uniqueVisitors: m.uniqueVisitors,
      }));
    }
    return [];
  }

  private async getTimeseriesFromRaw(linkId: string, startDate: Date, endDate: Date, granularity: 'hour' | 'day' | 'month'): Promise<TimeseriesPoint[]> {
    const events = await prisma.analyticsEvent.findMany({
      where: {
        linkId,
        timestamp: { gte: startDate, lte: endDate },
      },
      select: { timestamp: true, visitorId: true },
    });

    const map: Record<string, { clicks: number; visitors: Set<string> }> = {};
    for (const e of events) {
      let key: string;
      if (granularity === 'hour') {
        key = e.timestamp.toISOString().slice(0, 13);
      } else if (granularity === 'day') {
        key = e.timestamp.toISOString().split('T')[0];
      } else {
        key = e.timestamp.toISOString().slice(0, 7);
      }
      if (!map[key]) map[key] = { clicks: 0, visitors: new Set() };
      map[key].clicks += 1;
      if (e.visitorId) map[key].visitors.add(e.visitorId);
    }

    return Object.entries(map)
      .map(([ts, data]) => ({
        timestamp: granularity === 'hour' ? new Date(ts + ':00:00Z').toISOString() : ts,
        clicks: data.clicks,
        uniqueVisitors: data.visitors.size,
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  async getBreakdown(
    linkId: string,
    dimension: Dimension,
    startDate?: Date,
    endDate?: Date
  ): Promise<BreakdownItem[]> {
    const cacheKey = `${linkId}:breakdown:${dimension}:${startDate?.toISOString() || ''}:${endDate?.toISOString() || ''}`;
    const cached = await this.cache.get<BreakdownItem[]>(cacheKey);
    if (cached) {
      await this.cache.recordHit();
      return cached;
    }
    await this.cache.recordMiss();

    if (!VALID_DIMENSIONS.includes(dimension)) {
      throw new Error(`Invalid dimension. Must be one of: ${VALID_DIMENSIONS.join(', ')}`);
    }

    const dateFilter = startDate || endDate ? {
      timestamp: {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      }
    } : {};

    if (!startDate && !endDate) {
      const agg = await prisma.aggregatedMetrics.findMany({
        where: { linkId, dimension },
        orderBy: { clicks: 'desc' },
        take: 10,
      });

      if (agg.length > 0) {
        const result = agg.map(r => ({ name: r.value, clicks: r.clicks }));
        await this.cache.set(cacheKey, result, 120);
        return result;
      }
    }

    const result = await prisma.analyticsEvent.groupBy({
      by: [dimension as Prisma.AnalyticsEventScalarFieldEnum],
      where: { linkId, ...dateFilter, [dimension]: { not: null } },
      _count: { [dimension as Prisma.AnalyticsEventScalarFieldEnum]: true },
      orderBy: { _count: { [dimension as Prisma.AnalyticsEventScalarFieldEnum]: 'desc' } },
      take: 10,
    });

    const items = result.map(r => ({
      name: (r as any)[dimension] || 'Unknown',
      clicks: (r._count as any)[dimension],
    }));

    await this.cache.set(cacheKey, items, 120);
    return items;
  }
}
