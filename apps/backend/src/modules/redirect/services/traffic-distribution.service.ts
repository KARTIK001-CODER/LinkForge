import { TrafficVariant } from '../../links/models/link.domain';
import crypto from 'crypto';

export class TrafficDistributionService {
  /**
   * Resolves a variant deterministically based on the visitor fingerprint.
   * Uses MD5 hash mapped to an integer 0-99 to determine buckets.
   */
  static resolveVariant(variants: TrafficVariant[] | null | undefined, ip: string, userAgent: string): string | null {
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return null;
    }

    // Verify variants sum to exactly 100
    const totalWeight = variants.reduce((sum, v) => sum + (Number(v.weight) || 0), 0);
    if (totalWeight !== 100) {
      console.warn(`[TrafficDistribution] Variants do not sum to 100. Sum: ${totalWeight}`);
      return null; // Fallback gracefully if configuration is corrupt
    }

    // Create deterministic fingerprint
    const fingerprint = `${ip}-${userAgent}`;
    
    // Hash and map to integer 0-99
    // MD5 is fast enough for this purpose and perfectly distributed
    const hash = crypto.createHash('md5').update(fingerprint).digest('hex');
    const hashInt = parseInt(hash.substring(0, 8), 16);
    const bucket = hashInt % 100;

    // Distribute
    let cumulative = 0;
    for (const variant of variants) {
      cumulative += Number(variant.weight);
      if (bucket < cumulative) {
        return variant.url;
      }
    }

    return null;
  }
}
