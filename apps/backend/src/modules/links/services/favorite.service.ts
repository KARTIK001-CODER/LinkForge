import { LinkRepository } from '../repositories/link.repository';
import { SmartLink } from '../models/link.domain';

export class FavoriteService {
  constructor(private readonly linkRepository: LinkRepository = new LinkRepository()) {}

  async toggleFavorite(id: string, isFavorite: boolean): Promise<SmartLink> {
    const existingLink = await this.linkRepository.findById(id);
    
    if (!existingLink) {
      const error = new Error('Link not found');
      error.name = 'NotFoundError';
      throw error;
    }

    if (existingLink.status === 'DELETED') {
      const error = new Error('Cannot favorite a deleted link');
      error.name = 'InvalidTransitionError';
      throw error;
    }

    if (existingLink.isFavorite === isFavorite) {
      return existingLink; // Idempotent
    }

    return this.linkRepository.update(id, { isFavorite });
  }
}
