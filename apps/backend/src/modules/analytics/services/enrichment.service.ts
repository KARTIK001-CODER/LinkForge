import { UAParser } from 'ua-parser-js';
import geoip from 'geoip-lite';

export interface EnrichmentResult {
  country: string;
  region: string;
  city: string;
  timezone: string;
  language: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: string;
  platform: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

export class EnrichmentService {
  enrichEvent(ip: string, userAgent: string, originalUrl?: string, acceptLanguage?: string): EnrichmentResult {
    const geo = geoip.lookup(ip);
    const country = geo?.country || 'Unknown';
    const region = geo?.region || 'Unknown';
    const city = geo?.city || 'Unknown';
    const timezone = geo?.timezone || 'Unknown';

    const languages = acceptLanguage
      ? acceptLanguage.split(',').map(l => l.split(';')[0].trim())
      : [];
    const language = languages[0] || 'Unknown';

    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser().name || 'Unknown';
    const browserVersion = parser.getBrowser().version || 'Unknown';
    const os = parser.getOS().name || 'Unknown';
    const osVersion = parser.getOS().version || 'Unknown';
    const device = parser.getDevice();
    const deviceType = device.type || 'Desktop';
    const platform = parser.getDevice().vendor || 'Unknown';

    let utmSource: string | undefined;
    let utmMedium: string | undefined;
    let utmCampaign: string | undefined;
    let utmContent: string | undefined;
    let utmTerm: string | undefined;

    if (originalUrl) {
      try {
        const url = new URL(originalUrl, 'http://localhost');
        utmSource = url.searchParams.get('utm_source') || undefined;
        utmMedium = url.searchParams.get('utm_medium') || undefined;
        utmCampaign = url.searchParams.get('utm_campaign') || undefined;
        utmContent = url.searchParams.get('utm_content') || undefined;
        utmTerm = url.searchParams.get('utm_term') || undefined;
      } catch (e) {}
    }

    return {
      country,
      region,
      city,
      timezone,
      language,
      browser,
      browserVersion,
      os,
      osVersion,
      deviceType,
      platform,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
    };
  }
}
