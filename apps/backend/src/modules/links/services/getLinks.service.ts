import { LinkRepository } from '../repositories/link.repository';
import { GetLinksQuery } from '../validators/getLinks.schema';

export class GetLinksService {
  private linkRepository: LinkRepository;

  constructor() {
    this.linkRepository = new LinkRepository();
  }

  async execute(query: GetLinksQuery) {
    const { page, limit, search, status, tags, sortBy, sortOrder } = query;
    
    const skip = (page - 1) * limit;
    const take = limit;
    
    const parsedTags = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined;

    const { items, totalItems } = await this.linkRepository.findManyPaginated({
      skip,
      take,
      search,
      status,
      tags: parsedTags,
      sortBy,
      sortOrder,
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
        shortUrl: `https://lnk.fg/${item.alias}`, // In real app, read from env
        destinationUrl: item.destinationUrl,
        hasPassword: !!item.passwordHash,
        expiresAt: item.expiresAt,
        status: currentStatus,
        tags: item.tags,
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
