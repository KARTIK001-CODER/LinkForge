import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';

export interface RequestContext {
  device: string;
  country: string;
  region: string;
  dateTime: Date;
  dayOfWeek: number; // 0-6
}

export class ContextExtractorService {
  static extractContext(ip: string, userAgent: string): RequestContext {
    const parser = new UAParser(userAgent);
    const deviceResult = parser.getDevice();
    
    let device = 'desktop'; // default
    if (deviceResult.type === 'mobile') device = 'mobile';
    if (deviceResult.type === 'tablet') device = 'tablet';

    let country = 'UNKNOWN';
    let region = 'UNKNOWN';
    
    // Convert IPv6 loopback to IPv4 loopback for geoip-lite if needed,
    // though geoip-lite will just return null for private IPs.
    if (ip) {
      const geo = geoip.lookup(ip);
      if (geo) {
        country = geo.country || 'UNKNOWN';
        region = geo.region || 'UNKNOWN';
      }
    }

    const now = new Date();

    return {
      device,
      country,
      region,
      dateTime: now,
      dayOfWeek: now.getUTCDay()
    };
  }
}
