export interface RawAnalyticsEvent {
  linkId: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  referrer?: string;
  originalUrl?: string;
}

export interface EnrichedAnalyticsEvent extends RawAnalyticsEvent {
  country: string;
  city: string;
  browser: string;
  os: string;
  deviceType: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  visitorId: string;
}

export interface VisitorData {
  hash: string;
}
