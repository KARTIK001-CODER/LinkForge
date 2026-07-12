import { LinkRepository } from '../../links/repositories/link.repository';
import { RedirectResult, RedirectStatus } from '../models/redirect.domain';
import jwt from 'jsonwebtoken';

export class RedirectService {
  private linkRepository: LinkRepository;

  constructor() {
    this.linkRepository = new LinkRepository();
  }

  async resolveAlias(alias: string, token?: string): Promise<RedirectResult> {
    const link = await this.linkRepository.findByAlias(alias);

    if (!link) {
      return { status: RedirectStatus.NOT_FOUND };
    }

    if (link.status === 'DISABLED' || link.status === 'ARCHIVED' || link.status === 'DELETED') {
      return { status: RedirectStatus.INACTIVE };
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return { status: RedirectStatus.EXPIRED };
    }

    // Epic 2 Story 2.2 - Evaluate Password/Rules
    if (link.passwordHash) {
      let isTokenValid = false;
      if (token) {
        try {
          const secret = process.env.JWT_SECRET || 'fallback_secret_for_local_dev';
          const decoded = jwt.verify(token, secret) as { alias: string };
          if (decoded.alias === alias) {
            isTokenValid = true;
          }
        } catch (e) {
          // Token is invalid or expired
        }
      }
      
      if (!isTokenValid) {
        return { status: RedirectStatus.PASSWORD_REQUIRED };
      }
    }

    // Security check: ensure URL is safe to redirect to
    let destinationUrl = link.destinationUrl;
    if (!destinationUrl.startsWith('http://') && !destinationUrl.startsWith('https://')) {
      // Default to https if protocol is missing, or reject.
      // But Zod validated it on creation. If malicious data got in, prefix it safely.
      destinationUrl = `https://${destinationUrl}`;
    }

    // TODO: Epic 3 - Fire Analytics Event (Async, non-blocking)
    this.executeAnalyticsHook(link.id);

    return { 
      status: RedirectStatus.SUCCESS,
      destinationUrl 
    };
  }

  private executeAnalyticsHook(linkId: string) {
    // Fire and forget
    Promise.resolve().then(() => {
      // Analytics tracking logic will go here
      // console.log(`[Analytics] Tracked click for link ${linkId}`);
    });
  }
}
