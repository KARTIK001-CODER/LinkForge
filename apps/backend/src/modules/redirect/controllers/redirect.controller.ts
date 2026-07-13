import { Request, Response } from 'express';
import { RedirectService } from '../services/redirect.service';
import { RedirectStatus } from '../models/redirect.domain';
import { AnalyticsProducer } from '../../analytics/services/analytics.producer';

const redirectService = new RedirectService();

export class RedirectController {
  static async handleRedirect(req: Request, res: Response) {
    try {
      const shortCode = req.params.shortCode as string;
      const token = req.query.token as string | undefined;
      const forwardedFor = req.headers['x-forwarded-for'] as string | undefined;
      const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : (req.socket.remoteAddress || '127.0.0.1');
      const userAgent = req.headers['user-agent'] || '';
      const startTime = Date.now();

      const result = await redirectService.resolveAlias(shortCode, ip, userAgent, token);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      switch (result.status) {
        case RedirectStatus.SUCCESS:
          if (result.linkId) {
            AnalyticsProducer.publishEvent({
              linkId: result.linkId,
              ip,
              userAgent,
              timestamp: new Date(),
              referrer: (req.headers['referer'] as string) || undefined,
              originalUrl: req.originalUrl
            });
          }

          console.log(`[Redirect] Alias: ${shortCode}, Result: SUCCESS, Latency: ${Date.now() - startTime}ms`);
          return res.redirect(302, result.destinationUrl!);

        case RedirectStatus.NOT_FOUND:
          console.log(`[Redirect] Alias: ${shortCode}, Result: NOT_FOUND, Latency: ${Date.now() - startTime}ms`);
          return res.redirect(302, `${frontendUrl}/error/not-found`);

        case RedirectStatus.INACTIVE:
          console.log(`[Redirect] Alias: ${shortCode}, Result: INACTIVE, Latency: ${Date.now() - startTime}ms`);
          if (result.fallbackUrl) {
            return res.redirect(302, result.fallbackUrl);
          }
          return res.redirect(302, `${frontendUrl}/error/inactive`);

        case RedirectStatus.EXPIRED:
          console.log(`[Redirect] Alias: ${shortCode}, Result: EXPIRED, Latency: ${Date.now() - startTime}ms`);
          if (result.fallbackUrl) {
            return res.redirect(302, result.fallbackUrl);
          }
          return res.redirect(302, `${frontendUrl}/error/expired`);

        case RedirectStatus.PASSWORD_REQUIRED:
          console.log(`[Redirect] Alias: ${shortCode}, Result: PASSWORD_REQUIRED, Latency: ${Date.now() - startTime}ms`);
          return res.redirect(302, `${frontendUrl}/protected/${shortCode}`);

        default:
          console.error(`[Redirect] Unknown status for alias: ${shortCode}`);
          return res.redirect(302, `${frontendUrl}/error/not-found`);
      }
    } catch (error: any) {
      console.error('[Redirect Error]', error);

      if (error.name === 'ServiceUnavailableError') {
        return res.status(503).send('Service Unavailable');
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(302, `${frontendUrl}/error/500`);
    }
  }
}
