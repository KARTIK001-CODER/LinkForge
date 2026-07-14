import { describe, it, expect } from 'vitest';
import { TrafficDistributionService } from '../services/traffic-distribution.service';

describe('TrafficDistributionService', () => {
  const variants = [
    { url: 'https://a.example.com', weight: 50 },
    { url: 'https://b.example.com', weight: 50 },
  ];

  it('should return a destination from the variants', () => {
    const result = TrafficDistributionService.resolveVariant(variants, '127.0.0.1', 'test-agent');
    expect(result).toBeTruthy();
    expect(['https://a.example.com', 'https://b.example.com']).toContain(result);
  });

  it('should be deterministic for the same IP and UA', () => {
    const result1 = TrafficDistributionService.resolveVariant(variants, '192.168.1.1', 'Chrome');
    const result2 = TrafficDistributionService.resolveVariant(variants, '192.168.1.1', 'Chrome');
    expect(result1).toBe(result2);
  });

  it('should distribute differently for different fingerprints', () => {
    const results = new Set(Array.from({ length: 20 }, (_, i) =>
      TrafficDistributionService.resolveVariant(
        variants,
        `10.0.0.${i}`,
        `Agent-${i}`,
      )
    ));
    expect(results.size).toBeGreaterThan(1);
  });

  it('should return null for empty variants', () => {
    const result = TrafficDistributionService.resolveVariant([], '127.0.0.1', 'test');
    expect(result).toBeNull();
  });

  it('should return null for null variants', () => {
    const result = TrafficDistributionService.resolveVariant(null, '127.0.0.1', 'test');
    expect(result).toBeNull();
  });

  it('should handle single variant', () => {
    const result = TrafficDistributionService.resolveVariant(
      [{ url: 'https://only.example.com', weight: 100 }],
      '127.0.0.1',
      'test',
    );
    expect(result).toBe('https://only.example.com');
  });

  it('should not return null for any fingerprint with valid variants', () => {
    for (let i = 0; i < 100; i++) {
      const result = TrafficDistributionService.resolveVariant(
        variants,
        `10.0.0.${i % 255}`,
        `Agent-${i}`,
      );
      expect(result).toBeTruthy();
    }
  });
});
