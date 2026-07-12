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
}

export class AliasConflictError extends Error {
  constructor(message: string = 'Alias already exists') {
    super(message);
    this.name = 'AliasConflictError';
  }
}
