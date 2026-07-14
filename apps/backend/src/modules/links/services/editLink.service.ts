import { LinkRepository } from '../repositories/link.repository';
import { EditLinkDto } from '../validators/editLink.schema';
import { SmartLink } from '../models/link.domain';

export class EditLinkService {
  constructor(private linkRepository: LinkRepository = new LinkRepository()) {}

  async execute(id: string, data: EditLinkDto, userId?: string): Promise<SmartLink> {
    const existingLink = await this.linkRepository.findById(id, userId);
    
    if (!existingLink) {
      const error = new Error('Link not found');
      error.name = 'NotFoundError';
      throw error;
    }

    const updateData: any = { ...data };
    
    if (data.isActive !== undefined) {
      updateData.status = data.isActive ? 'ACTIVE' : 'DISABLED';
      delete updateData.isActive;
    }

    const updatedLink = await this.linkRepository.update(id, updateData, userId);
    
    // In a real application, we would also emit an event here to invalidate cache.
    // e.g., CacheInvalidationHandler.handle({ alias: updatedLink.alias })
    
    return updatedLink;
  }
}
