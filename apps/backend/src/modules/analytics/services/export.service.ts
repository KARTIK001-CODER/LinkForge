import prisma from '../../../lib/prisma';
import Redis from 'ioredis';

export class ExportService {
  private static redis: Redis | null = null;

  private static getRedis(): Redis | null {
    if (this.redis) return this.redis;
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) return null;
    try {
      this.redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, commandTimeout: 100 });
      this.redis.on('error', () => {});
      return this.redis;
    } catch {
      return null;
    }
  }

  async createExportJob(linkId: string): Promise<string> {
    const job = await prisma.exportJob.create({
      data: { linkId, status: 'PENDING' },
    });

    const redis = ExportService.getRedis();
    if (redis) {
      await redis.xadd('analytics:exports', '*', 'jobId', job.id, 'linkId', linkId);
    } else {
      this.processExportJob(job.id, linkId);
    }

    return job.id;
  }

  async processExportJob(jobId: string, linkId: string) {
    try {
      const events = await prisma.analyticsEvent.findMany({
        where: { linkId },
        orderBy: { timestamp: 'desc' },
        take: 50000,
      });

      const header = 'id,timestamp,country,region,city,browser,browserVersion,os,osVersion,deviceType,platform,referrer,utmSource,utmMedium,utmCampaign,utmContent,utmTerm,redirectDuration\n';
      const rows = events.map(e =>
        `${e.id},${e.timestamp.toISOString()},${e.country || ''},${e.region || ''},${e.city || ''},${e.browser || ''},${e.browserVersion || ''},${e.os || ''},${e.osVersion || ''},${e.deviceType || ''},${e.platform || ''},${e.referrer || ''},${e.utmSource || ''},${e.utmMedium || ''},${e.utmCampaign || ''},${e.utmContent || ''},${e.utmTerm || ''},${e.redirectDuration || 0}`
      ).join('\n');

      const csvContent = header + rows;
      const base64 = Buffer.from(csvContent).toString('base64');

      await prisma.exportJob.update({
        where: { id: jobId },
        data: { status: 'COMPLETED', fileUrl: `data:text/csv;base64,${base64}` },
      });
    } catch (err) {
      await prisma.exportJob.update({
        where: { id: jobId },
        data: { status: 'FAILED' },
      });
    }
  }

  async getExportJob(jobId: string) {
    return prisma.exportJob.findUnique({ where: { id: jobId } });
  }
}
