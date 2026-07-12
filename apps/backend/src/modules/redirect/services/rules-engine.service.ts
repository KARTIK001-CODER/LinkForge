import { RedirectRule, RuleCondition } from '../../links/models/link.domain';
import { RequestContext } from './context-extractor.service';

export class RulesEngineService {
  static evaluate(rules: RedirectRule[], context: RequestContext): string | null {
    if (!rules || rules.length === 0) return null;

    // Rules are already sorted by priority ASC from DB
    for (const rule of rules) {
      if (this.evaluateConditions(rule.conditions, context)) {
        return rule.destinationUrl; // First match wins (Short-circuiting)
      }
    }

    return null;
  }

  private static evaluateConditions(conditions: RuleCondition[], context: RequestContext): boolean {
    if (!conditions || conditions.length === 0) return false;

    // All conditions must pass (Implicit AND)
    for (const condition of conditions) {
      if (!this.evaluateCondition(condition, context)) {
        return false;
      }
    }
    return true;
  }

  private static evaluateCondition(condition: RuleCondition, context: RequestContext): boolean {
    let contextValue: any;
    
    switch (condition.type) {
      case 'device':
        contextValue = context.device;
        break;
      case 'country':
        contextValue = context.country;
        break;
      case 'region':
        contextValue = context.region;
        break;
      case 'day_of_week':
        contextValue = context.dayOfWeek;
        break;
      case 'date_time':
        contextValue = context.dateTime.getTime();
        break;
      default:
        return false; // Unknown rule type fails gracefully
    }

    let targetValue = condition.value;
    
    // Normalize date_time for comparison if needed
    if (condition.type === 'date_time') {
      targetValue = new Date(condition.value as string).getTime();
    }

    switch (condition.operator) {
      case 'eq':
        return contextValue === targetValue;
      case 'neq':
        return contextValue !== targetValue;
      case 'in':
        if (Array.isArray(targetValue)) {
          return targetValue.includes(contextValue);
        }
        return false;
      case 'nin':
        if (Array.isArray(targetValue)) {
          return !targetValue.includes(contextValue);
        }
        return false;
      case 'gt':
        return contextValue > targetValue;
      case 'lt':
        return contextValue < targetValue;
      default:
        return false; // Unknown operator fails gracefully
    }
  }
}
