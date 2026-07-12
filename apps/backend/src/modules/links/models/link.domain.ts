export interface SmartLink {
  id: string;
  destinationUrl: string;
  alias: string;
  passwordHash: string | null;
  startsAt: Date | null;
  expiresAt: Date | null;
  fallbackUrl: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'DISABLED' | 'ARCHIVED' | 'DELETED';
  title?: string | null;
  description?: string | null;
  tags: any;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
  collectionId?: string | null;
  rules?: RedirectRule[];
}

export interface RedirectRule {
  id: string;
  linkId: string;
  priority: number;
  destinationUrl: string;
  conditions: RuleCondition[];
}

export interface RuleCondition {
  type: 'device' | 'country' | 'region' | 'date_time' | 'day_of_week';
  operator: 'eq' | 'neq' | 'in' | 'nin' | 'gt' | 'lt';
  value: string | string[];
}

export class AliasConflictError extends Error {
  constructor(message: string = 'Alias already exists') {
    super(message);
    this.name = 'AliasConflictError';
  }
}
