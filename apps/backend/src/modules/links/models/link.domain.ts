export interface SmartLink {
  id: string;
  destinationUrl: string;
  alias: string;
  passwordHash: string | null;
  expiresAt: Date | null;
  status: 'ACTIVE' | 'EXPIRED' | 'DISABLED';
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
