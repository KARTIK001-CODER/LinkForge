import { PrismaClient } from '@prisma/client';
import { SmartLink, AliasConflictError } from '../models/link.domain';

const prisma = new PrismaClient();

export class LinkRepository {
  async create(data: Omit<SmartLink, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'clicks'> & { status?: string }): Promise<SmartLink> {
    try {
      const link = await prisma.smartLink.create({
        data: {
          destinationUrl: data.destinationUrl,
          alias: data.alias,
          passwordHash: data.passwordHash,
          expiresAt: data.expiresAt,
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

  async findByAlias(alias: string): Promise<SmartLink | null> {
    return prisma.smartLink.findUnique({ where: { alias } }) as Promise<SmartLink | null>;
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
        isFavorite: data.isFavorite,
        collectionId: data.collectionId,
      },
    });
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
    return updated as SmartLink;
  }
}
