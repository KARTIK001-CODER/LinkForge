import { describe, it, expect, beforeEach } from 'vitest';
import { EnrichmentService } from '../services/enrichment.service';

describe('EnrichmentService', () => {
  let service: EnrichmentService;

  beforeEach(() => {
    service = new EnrichmentService();
  });

  it('should parse User-Agent properly', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    const result = service.enrichEvent('127.0.0.1', ua);
    expect(result.browser).toBe('Chrome');
    expect(result.os).toBe('Windows');
    expect(result.deviceType).toBe('Desktop');
  });

  it('should detect mobile device', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Mobile Safari/537.36';
    const result = service.enrichEvent('127.0.0.1', ua);
    expect(result.deviceType).toBe('mobile');
    expect(result.os).toBe('Android');
  });

  it('should parse UTM parameters from originalUrl', () => {
    const url = 'https://example.com/alias?utm_source=twitter&utm_medium=social&utm_campaign=summer_sale';
    const result = service.enrichEvent('127.0.0.1', 'dummy UA', url);
    expect(result.utmSource).toBe('twitter');
    expect(result.utmMedium).toBe('social');
    expect(result.utmCampaign).toBe('summer_sale');
  });

  it('should extract all UTM params', () => {
    const url = 'https://example.com/alias?utm_source=google&utm_medium=cpc&utm_campaign=spring&utm_content=ad1&utm_term=shoes';
    const result = service.enrichEvent('127.0.0.1', 'dummy UA', url);
    expect(result.utmSource).toBe('google');
    expect(result.utmMedium).toBe('cpc');
    expect(result.utmCampaign).toBe('spring');
    expect(result.utmContent).toBe('ad1');
    expect(result.utmTerm).toBe('shoes');
  });

  it('should gracefully handle missing UTM params', () => {
    const result = service.enrichEvent('127.0.0.1', 'dummy UA', 'https://example.com/alias');
    expect(result.utmSource).toBeUndefined();
    expect(result.utmMedium).toBeUndefined();
    expect(result.utmCampaign).toBeUndefined();
  });

  it('should parse accept-language header', () => {
    const result = service.enrichEvent('127.0.0.1', 'dummy UA', undefined, 'en-US,en;q=0.9,fr;q=0.8');
    expect(result.language).toBe('en-US');
  });

  it('should handle missing accept-language', () => {
    const result = service.enrichEvent('127.0.0.1', 'dummy UA');
    expect(result.language).toBe('Unknown');
  });

  it('should return Unknown for localhost IP (no GeoIP)', () => {
    const result = service.enrichEvent('127.0.0.1', 'dummy UA');
    expect(result.country).toBe('Unknown');
    expect(result.region).toBe('Unknown');
    expect(result.city).toBe('Unknown');
  });

  it('should parse mobile Safari user agent', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';
    const result = service.enrichEvent('127.0.0.1', ua);
    expect(result.browser).toBe('Mobile Safari');
    expect(result.os).toBe('iOS');
    expect(result.deviceType).toBe('mobile');
  });
});
