import prisma from '../../../lib/prisma';

export class ExportService {
  async createExportJob(linkId: string): Promise<string> {
    const job = await prisma.exportJob.create({
      data: {
        linkId,
        status: 'PENDING',
      },
    });

    this.processExportJob(job.id, linkId);

    return job.id;
  }

  private async processExportJob(jobId: string, linkId: string) {
    try {
      const events = await prisma.analyticsEvent.findMany({
        where: { linkId },
        orderBy: { timestamp: 'desc' },
        take: 10000,
      });

      const csvHeader = 'timestamp,country,browser,os,deviceType,referrer,utmSource,utmMedium,utmCampaign\n';
      const csvRows = events.map(e =>
        `${e.timestamp.toISOString()},${e.country || ''},${e.browser || ''},${e.os || ''},${e.deviceType || ''},${e.referrer || ''},${e.utmSource || ''},${e.utmMedium || ''},${e.utmCampaign || ''}`
      ).join('\n');

      const csvContent = csvHeader + csvRows;

      await prisma.exportJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          fileUrl: `data:text/csv;base64,${Buffer.from(csvContent).toString('base64')}`,
        },
      });
    } catch (err) {
      await prisma.exportJob.update({
        where: { id: jobId },
        data: { status: 'FAILED' },
      });
    }
  }

  async getExportJob(jobId: string) {
    return prisma.exportJob.findUnique({
      where: { id: jobId }
    });
  }
}
