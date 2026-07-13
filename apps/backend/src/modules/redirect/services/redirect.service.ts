import { LinkRepository } from '../../links/repositories/link.repository';
import { RedirectResult, RedirectStatus } from '../models/redirect.domain';
import { ContextExtractorService } from './context-extractor.service';
import { RulesEngineService } from './rules-engine.service';
import { TrafficDistributionService } from './traffic-distribution.service';
import { TrafficVariant } from '../../links/models/link.domain';
import jwt from 'jsonwebtoken';

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

    // Default destination
    let destinationUrl = link.destinationUrl;

    // Epic 2 Story 2.6 - Evaluate Traffic Variants (A/B Testing)
    if (link.trafficVariants) {
      const parsedVariants = typeof link.trafficVariants === 'string' 
        ? JSON.parse(link.trafficVariants) 
        : link.trafficVariants;
        
      const variantDestination = TrafficDistributionService.resolveVariant(
        parsedVariants as TrafficVariant[], 
        ip, 
        userAgent
      );
      
      if (variantDestination) {
        destinationUrl = variantDestination;
      }
    }

    // Epic 2 Story 2.5 - Evaluate Smart Rules (Overrides generic traffic variants)
    if (link.rules && link.rules.length > 0) {
      const context = ContextExtractorService.extractContext(ip, userAgent);
      const ruleDestination = RulesEngineService.evaluate(link.rules, context);
      
      if (ruleDestination) {
        destinationUrl = ruleDestination;
      }
    }

    // Security check: ensure URL is safe to redirect to
    if (!destinationUrl.startsWith('http://') && !destinationUrl.startsWith('https://')) {
      destinationUrl = `https://${destinationUrl}`;
    }

    return { 
      status: RedirectStatus.SUCCESS,
      destinationUrl,
      linkId: link.id
    };
  }
}


