export interface SmartLink {
  id: string;
  destinationUrl: string;
  alias: string;
  passwordHash: string | null;
  expiresAt: Date | null;
  status: 'ACTIVE' | 'EXPIRED' | 'DISABLED' | 'ARCHIVED' | 'DELETED';
  title: string | null;
  description: string | null;
  tags: any;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
}

export class AliasConflictError extends Error {
  constructor(message: string = 'Alias already exists') {
    super(message);
    this.name = 'AliasConflictError';
  }
}
