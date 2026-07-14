import prisma from '../../../lib/prisma';
import type { SmartLink } from '../models/link.domain';
import { AliasConflictError } from '../models/link.domain';
import { RedisCacheService } from '../../redirect/services/redis-cache.service';
import CircuitBreaker from 'opossum';

export class LinkRepository {
  async create(data: Partial<Omit<SmartLink, 'id' | 'createdAt' | 'updatedAt' | 'clicks'>> & { destinationUrl: string; alias: string; userId?: string | null }): Promise<SmartLink> {
    try {
      const link = await prisma.smartLink.create({
        data: {
          userId: data.userId,
          destinationUrl: data.destinationUrl,
          alias: data.alias,
          passwordHash: data.passwordHash,
          startsAt: data.startsAt,
          expiresAt: data.expiresAt,
          fallbackUrl: data.fallbackUrl,
          tags: data.tags ?? [],
          collectionId: data.collectionId,
        },
      });
      return link as SmartLink;
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const prismaError = error as { code: string; meta?: { target?: string[] } };
        if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('alias')) {
          throw new AliasConflictError();
        }
      }
      throw error;
    }
  }

  private static findUniqueBreaker = new CircuitBreaker(async (alias: string) => {
    return prisma.smartLink.findUnique({
      where: { alias },
      include: {
        rules: {
          orderBy: { priority: 'asc' },
        },
      },
    });
  }, {
    timeout: 60000,
    errorThresholdPercentage: 50,
    resetTimeout: 5000,
  });

  async findByAlias(alias: string): Promise<SmartLink | null> {
    const cacheKey = RedisCacheService.formatLinkKey(alias);

    const cachedLink = await RedisCacheService.get<SmartLink>(cacheKey);
    if (cachedLink) {
      return {
        ...cachedLink,
        createdAt: new Date(cachedLink.createdAt),
        updatedAt: new Date(cachedLink.updatedAt),
      };
    }

    let dbLink: SmartLink | null = null;
    try {
      dbLink = await LinkRepository.findUniqueBreaker.fire(alias) as SmartLink | null;
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'Unknown error';
      console.error(`[CircuitBreaker] Failed to fetch alias ${alias} from DB: ${errMsg}`);
      const error = new Error('Database temporarily unavailable');
      error.name = 'ServiceUnavailableError';
      throw error;
    }

    if (dbLink) {
      RedisCacheService.set(cacheKey, dbLink).catch(() => {});
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
    userId?: string;
  }): Promise<{ items: SmartLink[]; totalItems: number }> {
    const { skip, take, search, status, tags, isFavorite, collectionId, sortBy, sortOrder, userId } = params;

    const where: Record<string, unknown> = {};

    if (userId) {
      where.userId = userId;
    }

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
        notIn: ['ARCHIVED', 'DELETED'],
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

  async findById(id: string, userId?: string): Promise<SmartLink | null> {
    const where: Record<string, unknown> = { id };
    if (userId) {
      where.userId = userId;
    }
    return prisma.smartLink.findFirst({ where }) as Promise<SmartLink | null>;
  }

  async update(id: string, data: Partial<Omit<SmartLink, 'id' | 'createdAt' | 'updatedAt' | 'clicks' | 'alias'>>, userId?: string): Promise<SmartLink> {
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
        trafficVariants: data.trafficVariants !== undefined ? (data.trafficVariants as never) : undefined,
      },
    });

    if (updated.alias) {
      RedisCacheService.delete(RedisCacheService.formatLinkKey(updated.alias)).catch(() => {});
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

    RedisCacheService.delete(RedisCacheService.formatLinkKey(originalAlias)).catch(() => {});

    return updated as SmartLink;
  }
}
