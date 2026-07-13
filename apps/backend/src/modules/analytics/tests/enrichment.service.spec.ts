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
  });

  it('should parse UTM parameters from originalUrl', () => {
    const url = 'https://example.com/alias?utm_source=twitter&utm_medium=social&utm_campaign=summer_sale';
    const result = service.enrichEvent('127.0.0.1', 'dummy UA', url);
    
    expect(result.utmSource).toBe('twitter');
    expect(result.utmMedium).toBe('social');
    expect(result.utmCampaign).toBe('summer_sale');
  });

  it('should gracefully handle missing UTM params', () => {
    const result = service.enrichEvent('127.0.0.1', 'dummy UA', 'https://example.com/alias');
    
    expect(result.utmSource).toBeUndefined();
  });
});
