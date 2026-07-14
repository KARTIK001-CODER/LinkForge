export interface RawAnalyticsEvent {
  eventId?: string;
  linkId: string;
  alias?: string;
  ownerId?: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  referrer?: string;
  originalUrl?: string;
  redirectDuration?: number;
  httpStatus?: number;
}

export interface EnrichedAnalyticsEvent extends RawAnalyticsEvent {
  visitorId: string;
  sessionId: string;
  ipHash: string;
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
  referrerUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

export interface VisitorData {
  hash: string;
}

export interface EventDedupKey {
  linkId: string;
  visitorHash: string;
  timestampHour: string;
}
