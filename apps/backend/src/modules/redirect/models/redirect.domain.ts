export enum RedirectStatus {
  SUCCESS = 'SUCCESS',
  NOT_FOUND = 'NOT_FOUND',
  INACTIVE = 'INACTIVE', // Covers both DISABLED, DELETED and ARCHIVED
  EXPIRED = 'EXPIRED',
  PASSWORD_REQUIRED = 'PASSWORD_REQUIRED', // For Epic 2, Story 2.2
}

export interface RedirectResult {
  status: RedirectStatus;
  destinationUrl?: string; // Present if SUCCESS
}
