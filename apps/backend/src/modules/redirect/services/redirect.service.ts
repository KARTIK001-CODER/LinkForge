import jwt from 'jsonwebtoken';
import { LinkRepository } from '../../links/repositories/link.repository';
import type { RedirectResult } from '../models/redirect.domain';
import { RedirectStatus } from '../models/redirect.domain';
import { ContextExtractorService } from './context-extractor.service';
import { RulesEngineService } from './rules-engine.service';
import { TrafficDistributionService } from './traffic-distribution.service';
import type { TrafficVariant } from '../../links/models/link.domain';

export class RedirectService {
  private linkRepository: LinkRepository;

  constructor() {
    this.linkRepository = new LinkRepository();
  }

  async resolveAlias(alias: string, ip: string, userAgent: string, token?: string): Promise<RedirectResult> {
    const link = await this.linkRepository.findByAlias(alias);

    if (!link) {
      return { status: RedirectStatus.NOT_FOUND };
    }

    if (link.status === 'DISABLED' || link.status === 'ARCHIVED' || link.status === 'DELETED') {
      return { status: RedirectStatus.INACTIVE, fallbackUrl: link.fallbackUrl || undefined };
    }

    if (link.startsAt && new Date(link.startsAt) > new Date()) {
      return { status: RedirectStatus.INACTIVE, fallbackUrl: link.fallbackUrl || undefined };
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return { status: RedirectStatus.EXPIRED, fallbackUrl: link.fallbackUrl || undefined };
    }

    if (link.passwordHash) {
      let isTokenValid = false;
      if (token && process.env.JWT_ACCESS_SECRET) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET) as { alias: string };
          if (decoded.alias === alias) {
            isTokenValid = true;
          }
        } catch {
          // Token is invalid or expired
        }
      }

      if (!isTokenValid) {
        return { status: RedirectStatus.PASSWORD_REQUIRED };
      }
    }

    let destinationUrl = link.destinationUrl;

    if (link.trafficVariants) {
      const parsedVariants = typeof link.trafficVariants === 'string'
        ? JSON.parse(link.trafficVariants)
        : link.trafficVariants;

      const variantDestination = TrafficDistributionService.resolveVariant(
        parsedVariants as TrafficVariant[],
        ip,
        userAgent,
      );

      if (variantDestination) {
        destinationUrl = variantDestination;
      }
    }

    if (link.rules && link.rules.length > 0) {
      const context = ContextExtractorService.extractContext(ip, userAgent);
      const ruleDestination = RulesEngineService.evaluate(link.rules, context);

      if (ruleDestination) {
        destinationUrl = ruleDestination;
      }
    }

    if (!destinationUrl.startsWith('http://') && !destinationUrl.startsWith('https://')) {
      destinationUrl = `https://${destinationUrl}`;
    }

    return {
      status: RedirectStatus.SUCCESS,
      destinationUrl,
      linkId: link.id,
      alias: link.alias,
      ownerId: link.userId || undefined,
    };
  }
}
