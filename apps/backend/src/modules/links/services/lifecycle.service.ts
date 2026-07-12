import { LinkRepository } from '../repositories/link.repository';
import { SmartLink } from '../models/link.domain';

export class LifecycleService {
  constructor(private linkRepository: LinkRepository = new LinkRepository()) {}

  async archive(id: string): Promise<SmartLink> {
    const existingLink = await this.linkRepository.findById(id);
    
    if (!existingLink) {
      const error = new Error('Link not found');
      error.name = 'NotFoundError';
      throw error;
    }

    if (existingLink.status === 'DELETED') {
      const error = new Error('Cannot archive a deleted link');
      error.name = 'InvalidTransitionError';
      throw error;
    }

    if (existingLink.status === 'ARCHIVED') {
      return existingLink; // Idempotent
    }

    return this.linkRepository.update(id, { status: 'ARCHIVED' });
  }

  async restore(id: string): Promise<SmartLink> {
    const existingLink = await this.linkRepository.findById(id);
    
    if (!existingLink) {
      const error = new Error('Link not found');
      error.name = 'NotFoundError';
      throw error;
    }

    if (existingLink.status !== 'ARCHIVED') {
      const error = new Error('Only archived links can be restored');
      error.name = 'InvalidTransitionError';
      throw error;
    }

    // Restore to ACTIVE by default. If it was expired, a cron would catch it, 
    // or we could check expiresAt here, but KISS for now as FDD says EXPIRED takes precedence anyway during routing.
    return this.linkRepository.update(id, { status: 'ACTIVE' });
  }
}
