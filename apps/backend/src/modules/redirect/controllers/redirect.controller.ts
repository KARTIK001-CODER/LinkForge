import { Request, Response } from 'express';
import { RedirectService } from '../services/redirect.service';
import { RedirectStatus } from '../models/redirect.domain';

const redirectService = new RedirectService();

export class RedirectController {
  static async handleRedirect(req: Request, res: Response) {
    try {
      const shortCode = req.params.shortCode as string;
      const startTime = Date.now();

      const result = await redirectService.resolveAlias(shortCode);

      // Construct frontend base URL safely
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      switch (result.status) {
        case RedirectStatus.SUCCESS:
          // Log success asynchronously if needed
          console.log(`[Redirect] Alias: ${shortCode}, Result: SUCCESS, Latency: ${Date.now() - startTime}ms`);
          return res.redirect(302, result.destinationUrl!);

        case RedirectStatus.NOT_FOUND:
          console.log(`[Redirect] Alias: ${shortCode}, Result: NOT_FOUND, Latency: ${Date.now() - startTime}ms`);
          return res.redirect(302, `${frontendUrl}/error/not-found`);

        case RedirectStatus.INACTIVE:
          console.log(`[Redirect] Alias: ${shortCode}, Result: INACTIVE, Latency: ${Date.now() - startTime}ms`);
          return res.redirect(302, `${frontendUrl}/error/inactive`);

        case RedirectStatus.EXPIRED:
          console.log(`[Redirect] Alias: ${shortCode}, Result: EXPIRED, Latency: ${Date.now() - startTime}ms`);
          return res.redirect(302, `${frontendUrl}/error/expired`);
          
        case RedirectStatus.PASSWORD_REQUIRED:
          // For Epic 2, Story 2.2
          console.log(`[Redirect] Alias: ${shortCode}, Result: PASSWORD_REQUIRED, Latency: ${Date.now() - startTime}ms`);
          // Temporarily redirect to not found until password page exists
          return res.redirect(302, `${frontendUrl}/error/not-found`);

        default:
          console.error(`[Redirect] Unknown status for alias: ${shortCode}`);
          return res.redirect(302, `${frontendUrl}/error/not-found`);
      }
    } catch (error) {
      console.error('[Redirect Error]', error);
      // Fallback on severe error to generic not-found rather than leaking stack traces
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(302, `${frontendUrl}/error/not-found`);
    }
  }
}
