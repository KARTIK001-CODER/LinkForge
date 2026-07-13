import UAParser from 'ua-parser-js';
import geoip from 'geoip-lite';

export interface EnrichmentResult {
  country: string;
  city: string;
  browser: string;
  os: string;
  deviceType: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export class EnrichmentService {
  enrichEvent(ip: string, userAgent: string, originalUrl?: string): EnrichmentResult {
    // GeoIP Enrichment
    const geo = geoip.lookup(ip);
    const country = geo?.country || 'Unknown';
    const city = geo?.city || 'Unknown';

    // User-Agent Enrichment
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser().name || 'Unknown';
    const os = parser.getOS().name || 'Unknown';
    const deviceType = parser.getDevice().type || 'Desktop';

    // UTM Parsing
    let utmSource, utmMedium, utmCampaign;
    if (originalUrl) {
      try {
        const url = new URL(originalUrl, 'http://localhost');
        utmSource = url.searchParams.get('utm_source') || undefined;
        utmMedium = url.searchParams.get('utm_medium') || undefined;
        utmCampaign = url.searchParams.get('utm_campaign') || undefined;
      } catch (e) {}
    }

    return {
      country,
      city,
      browser,
      os,
      deviceType,
      utmSource,
      utmMedium,
      utmCampaign,
    };
  }
}
