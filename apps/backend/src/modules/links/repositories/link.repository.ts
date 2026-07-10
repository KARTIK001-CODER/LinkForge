import { PrismaClient } from '@prisma/client';
import { SmartLink, AliasConflictError } from '../models/link.domain';

const prisma = new PrismaClient();

export class LinkRepository {
  async create(data: Omit<SmartLink, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: string }): Promise<SmartLink> {
    try {
      const link = await prisma.smartLink.create({
        data: {
          destinationUrl: data.destinationUrl,
          alias: data.alias,
          passwordHash: data.passwordHash,
          expiresAt: data.expiresAt,
          tags: data.tags ? data.tags : [],
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
}
