import { LinkRepository } from '../repositories/link.repository';
import { GetLinksQuery } from '../validators/getLinks.schema';

export class GetLinksService {
  private linkRepository: LinkRepository;

  constructor() {
    this.linkRepository = new LinkRepository();
  }

  async execute(query: GetLinksQuery, userId?: string) {
    const { page, limit, search, status, tags, isFavorite, collectionId, sortBy, sortOrder } = query;
    
    const skip = (page - 1) * limit;
    const take = limit;
    
    const parsedTags = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined;

    const { items, totalItems } = await this.linkRepository.findManyPaginated({
      skip,
      take,
      search,
      status,
      tags: parsedTags,
      isFavorite,
      collectionId,
      sortBy,
      sortOrder,
      userId,
    });

    const totalPages = Math.ceil(totalItems / limit);

    // Compute hasPassword, handle expiration, and format response according to FDD
    const formattedItems = items.map(item => {
      let currentStatus = item.status;
      if (item.expiresAt && new Date(item.expiresAt) < new Date() && currentStatus !== 'DISABLED') {
        currentStatus = 'EXPIRED';
      }

      return {
        id: item.id,
        alias: item.alias,
        shortUrl: `${process.env.BASE_URL || 'http://localhost:4000'}/${item.alias}`,
        destinationUrl: item.destinationUrl,
        hasPassword: !!item.passwordHash,
        expiresAt: item.expiresAt,
        status: currentStatus,
        tags: item.tags,
        isFavorite: item.isFavorite,
        collectionId: item.collectionId,
        createdAt: item.createdAt,
      };
    });

    return {
      items: formattedItems,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      }
    };
  }
}
