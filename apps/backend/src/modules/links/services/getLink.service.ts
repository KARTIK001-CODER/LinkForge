import { LinkRepository } from '../repositories/link.repository';

export class GetLinkService {
  private linkRepository: LinkRepository;

  constructor() {
    this.linkRepository = new LinkRepository();
  }

  async execute(alias: string) {
    const item = await this.linkRepository.findByAlias(alias);

    if (!item) {
      return null;
    }

    let currentStatus = item.status;
    if (item.expiresAt && new Date(item.expiresAt) < new Date() && currentStatus !== 'DISABLED') {
      currentStatus = 'EXPIRED';
    }

    return {
      id: item.id,
      userId: item.userId,
      alias: item.alias,
      shortUrl: `${process.env.BASE_URL || 'http://localhost:4000'}/${item.alias}`,
      destinationUrl: item.destinationUrl,
      hasPassword: !!item.passwordHash,
      expiresAt: item.expiresAt,
      status: currentStatus,
      tags: item.tags,
      isFavorite: item.isFavorite,
      collectionId: item.collectionId,
      clicks: item.clicks,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
