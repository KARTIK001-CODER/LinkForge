import prisma from '../../../lib/prisma';
import { SmartLink, AliasConflictError } from '../models/link.domain';
import { RedisCacheService } from '../../redirect/services/redis-cache.service';
import CircuitBreaker = require('opossum');

export class LinkRepository {
  async create(data: Omit<SmartLink, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'clicks'> & { status?: string }): Promise<SmartLink> {
    try {
      const link = await prisma.smartLink.create({
        data: {
          destinationUrl: data.destinationUrl,
          alias: data.alias,
          passwordHash: data.passwordHash,
          startsAt: data.startsAt,
          expiresAt: data.expiresAt,
          fallbackUrl: data.fallbackUrl,
          tags: data.tags ? data.tags : [],
          collectionId: data.collectionId,
        },
      });
      return link as SmartLink;
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('alias')) {
        throw new AliasConflictError();
      }
      throw error;
    }
  }

  private static findUniqueBreaker = new CircuitBreaker(async (alias: string) => {
    return prisma.smartLink.findUnique({ 
      where: { alias },
      include: {
        rules: {
          orderBy: { priority: 'asc' }
        }
      }
    });
  }, {
    timeout: 60000, // 60000ms max to allow for incredibly slow Neon Serverless DB cold starts
    errorThresholdPercentage: 50, // Trip if 50% fail
    resetTimeout: 5000 // Wait 5s before trying again
  });

  async findByAlias(alias: string): Promise<SmartLink | null> {
    const cacheKey = RedisCacheService.formatLinkKey(alias);
    
    // 1. Check Cache
    const cachedLink = await RedisCacheService.get<SmartLink>(cacheKey);
    if (cachedLink) {
      return { ...cachedLink, createdAt: new Date(cachedLink.createdAt), updatedAt: new Date(cachedLink.updatedAt) };
    }

    // 2. Cache Miss -> Query DB via Circuit Breaker
    let dbLink: SmartLink | null = null;
    try {
      dbLink = await LinkRepository.findUniqueBreaker.fire(alias) as SmartLink | null;
    } catch (e: any) {
      console.error(`[CircuitBreaker] Failed to fetch alias ${alias} from DB: ${e.message}`);
      // Re-throw so the redirect controller can catch it and return 503 instead of 500
      const error = new Error('Database temporarily unavailable');
      error.name = 'ServiceUnavailableError';
      throw error;
    }

    // 3. Populate Cache
    if (dbLink) {
      // Async fire-and-forget
      Promise.resolve().then(() => RedisCacheService.set(cacheKey, dbLink));
    }

    return dbLink;
  }

  async findManyPaginated(params: {
    skip: number;
    take: number;
    search?: string;
    status?: string;
    tags?: string[];
    isFavorite?: boolean;
    collectionId?: string;
    sortBy: 'createdAt' | 'alias';
    sortOrder: 'asc' | 'desc';
  }): Promise<{ items: SmartLink[]; totalItems: number }> {
    const { skip, take, search, status, tags, isFavorite, collectionId, sortBy, sortOrder } = params;

    const where: any = {};

    if (search) {
      where.OR = [
        { alias: { contains: search, mode: 'insensitive' } },
        { destinationUrl: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    } else {
      where.status = {
        notIn: ['ARCHIVED', 'DELETED']
      };
    }

    if (tags && tags.length > 0) {
      where.tags = {
        array_contains: tags,
      };
    }

    if (isFavorite !== undefined) {
      where.isFavorite = isFavorite;
    }

    if (collectionId !== undefined) {
      where.collectionId = collectionId === 'unassigned' ? null : collectionId;
    }

    const [items, totalItems] = await prisma.$transaction([
      prisma.smartLink.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.smartLink.count({ where }),
    ]);

    return { items: items as SmartLink[], totalItems };
  }

  async findById(id: string): Promise<SmartLink | null> {
    return prisma.smartLink.findUnique({ where: { id } }) as Promise<SmartLink | null>;
  }

  async update(id: string, data: Partial<Omit<SmartLink, 'id' | 'createdAt' | 'updatedAt' | 'clicks' | 'alias'>>): Promise<SmartLink> {
    const updated = await prisma.smartLink.update({
      where: { id },
      data: {
        destinationUrl: data.destinationUrl,
        title: data.title,
        description: data.description,
        status: data.status,
        tags: data.tags,
        startsAt: data.startsAt,
        expiresAt: data.expiresAt,
        fallbackUrl: data.fallbackUrl,
        isFavorite: data.isFavorite,
        collectionId: data.collectionId,
        trafficVariants: data.trafficVariants !== undefined ? (data.trafficVariants as any) : undefined,
      },
    });
    
    // Purge cache
    if (updated.alias) {
      Promise.resolve().then(() => RedisCacheService.delete(RedisCacheService.formatLinkKey(updated.alias)));
    }
    
    return updated as SmartLink;
  }

  async softDelete(id: string, originalAlias: string): Promise<SmartLink> {
    const deletedAlias = `${originalAlias}_del_${Date.now()}`;
    const updated = await prisma.smartLink.update({
      where: { id },
      data: {
        status: 'DELETED',
        alias: deletedAlias,
      },
    });
    
    // Purge cache for original alias
    Promise.resolve().then(() => RedisCacheService.delete(RedisCacheService.formatLinkKey(originalAlias)));
    
    return updated as SmartLink;
  }
}
