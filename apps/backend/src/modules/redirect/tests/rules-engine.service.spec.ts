import { describe, it, expect } from 'vitest';
import { RulesEngineService } from '../services/rules-engine.service';

describe('RulesEngineService', () => {
  it('should return null when no rules match', () => {
    const rules: any[] = [{
      id: 'rule-1',
      priority: 1,
      destinationUrl: 'https://mobile.example.com',
      conditions: [{ type: 'device', operator: 'eq', value: 'mobile' }],
    }];
    const context = { device: 'desktop', country: 'US', region: 'CA', dayOfWeek: 1, dateTime: new Date() };
    const result = RulesEngineService.evaluate(rules, context);
    expect(result).toBeNull();
  });

  it('should return matched rule destination', () => {
    const rules: any[] = [{
      id: 'rule-1',
      priority: 1,
      destinationUrl: 'https://mobile.example.com',
      conditions: [{ type: 'device', operator: 'eq', value: 'mobile' }],
    }];
    const context = { device: 'mobile', country: 'US', region: 'CA', dayOfWeek: 1, dateTime: new Date() };
    const result = RulesEngineService.evaluate(rules, context);
    expect(result).toBe('https://mobile.example.com');
  });

  it('should return first matching rule (rules are pre-sorted by priority)', () => {
    const rules: any[] = [
      {
        id: 'rule-1',
        priority: 1,
        destinationUrl: 'https://first-match.com',
        conditions: [{ type: 'device', operator: 'eq', value: 'mobile' }],
      },
      {
        id: 'rule-2',
        priority: 2,
        destinationUrl: 'https://second-match.com',
        conditions: [{ type: 'device', operator: 'eq', value: 'mobile' }],
      },
    ];
    const context = { device: 'mobile', country: 'US', region: 'CA', dayOfWeek: 1, dateTime: new Date() };
    const result = RulesEngineService.evaluate(rules, context);
    expect(result).toBe('https://first-match.com');
  });

  it('should evaluate multiple AND conditions', () => {
    const rules: any[] = [{
      id: 'rule-1',
      priority: 1,
      destinationUrl: 'https://us-mobile.com',
      conditions: [
        { type: 'device', operator: 'eq', value: 'mobile' },
        { type: 'country', operator: 'eq', value: 'US' },
      ],
    }];
    const context = { device: 'mobile', country: 'US', region: 'CA', dayOfWeek: 1, dateTime: new Date() };
    const result = RulesEngineService.evaluate(rules, context);
    expect(result).toBe('https://us-mobile.com');
  });

  it('should return null when AND condition partially matches', () => {
    const rules: any[] = [{
      id: 'rule-1',
      priority: 1,
      destinationUrl: 'https://us-mobile.com',
      conditions: [
        { type: 'device', operator: 'eq', value: 'mobile' },
        { type: 'country', operator: 'eq', value: 'US' },
      ],
    }];
    const context = { device: 'mobile', country: 'CA', region: 'ON', dayOfWeek: 1, dateTime: new Date() };
    const result = RulesEngineService.evaluate(rules, context);
    expect(result).toBeNull();
  });

  it('should handle empty rules array', () => {
    const result = RulesEngineService.evaluate([], { device: 'mobile', country: 'US', region: 'CA', dayOfWeek: 1, dateTime: new Date() });
    expect(result).toBeNull();
  });

  it('should match by country', () => {
    const rules: any[] = [{
      id: 'rule-1',
      priority: 1,
      destinationUrl: 'https://de.example.com',
      conditions: [{ type: 'country', operator: 'eq', value: 'DE' }],
    }];
    const context = { device: 'desktop', country: 'DE', region: 'BY', dayOfWeek: 1, dateTime: new Date() };
    const result = RulesEngineService.evaluate(rules, context);
    expect(result).toBe('https://de.example.com');
  });

  it('should support not-equal operator', () => {
    const rules: any[] = [{
      id: 'rule-1',
      priority: 1,
      destinationUrl: 'https://not-us.com',
      conditions: [{ type: 'country', operator: 'neq', value: 'US' }],
    }];
    const context = { device: 'desktop', country: 'DE', region: 'BY', dayOfWeek: 1, dateTime: new Date() };
    const result = RulesEngineService.evaluate(rules, context);
    expect(result).toBe('https://not-us.com');
  });
});
