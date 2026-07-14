import { Request, Response } from 'express';
import { RedirectService } from '../services/redirect.service';
import { RedirectStatus } from '../models/redirect.domain';
import { AnalyticsProducer } from '../../analytics/services/analytics.producer';
import logger from '../../../lib/logger';

const redirectService = new RedirectService();

export class RedirectController {
  static async handleRedirect(req: Request, res: Response) {
    const startTime = Date.now();
    try {
      const shortCode = req.params.shortCode as string;
      const token = req.query.token as string | undefined;
      const forwardedFor = req.headers['x-forwarded-for'] as string | undefined;
      const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : (req.socket.remoteAddress || '127.0.0.1');
      const userAgent = req.headers['user-agent'] || '';

      const result = await redirectService.resolveAlias(shortCode, ip, userAgent, token);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const redirectDuration = Date.now() - startTime;

      switch (result.status) {
        case RedirectStatus.SUCCESS:
          if (result.linkId) {
            AnalyticsProducer.publishEvent({
              linkId: result.linkId,
              alias: result.alias || shortCode,
              ownerId: result.ownerId,
              ip,
              userAgent,
              timestamp: new Date(),
              referrer: (req.headers['referer'] as string) || undefined,
              originalUrl: req.originalUrl,
              redirectDuration,
              httpStatus: 302,
            });
          }

          logger.info({ alias: shortCode, redirectDuration }, 'Redirect completed');
          return res.redirect(302, result.destinationUrl!);

        case RedirectStatus.NOT_FOUND:
          return res.redirect(302, `${frontendUrl}/error/not-found`);

        case RedirectStatus.INACTIVE:
          if (result.fallbackUrl) {
            return res.redirect(302, result.fallbackUrl);
          }
          return res.redirect(302, `${frontendUrl}/error/inactive`);

        case RedirectStatus.EXPIRED:
          if (result.fallbackUrl) {
            return res.redirect(302, result.fallbackUrl);
          }
          return res.redirect(302, `${frontendUrl}/error/expired`);

        case RedirectStatus.PASSWORD_REQUIRED:
          return res.redirect(302, `${frontendUrl}/protected/${shortCode}`);

        default:
          return res.redirect(302, `${frontendUrl}/error/not-found`);
      }
    } catch (error: any) {
      logger.error({ err: error, shortCode: req.params.shortCode }, 'Redirect error');
      if (error.name === 'ServiceUnavailableError') {
        return res.status(503).send('Service Unavailable');
      }
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(302, `${frontendUrl}/error/500`);
    }
  }
}
