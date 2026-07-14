import { PrismaClient } from '@prisma/client';
import { Collection } from '../models/collection.domain';
import { CreateCollectionDto, UpdateCollectionDto } from '../validators/collection.schema';
import prisma from '../../../lib/prisma';

export class CollectionRepository {
  async create(data: CreateCollectionDto & { userId?: string }): Promise<Collection> {
    const collection = await prisma.collection.create({
      data: {
        userId: data.userId,
        name: data.name,
        description: data.description,
      },
      include: {
        _count: {
          select: { links: true }
        }
      }
    });
    return collection as Collection;
  }

  async findAll(userId?: string): Promise<Collection[]> {
    const collections = await prisma.collection.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { links: true }
        }
      }
    });
    return collections as Collection[];
  }

  async findById(id: string, userId?: string): Promise<Collection | null> {
    const collection = await prisma.collection.findFirst({
      where: userId ? { id, userId } : { id },
      include: {
        _count: {
          select: { links: true }
        }
      }
    });
    return collection as Collection | null;
  }

  async findByName(name: string, userId?: string): Promise<Collection | null> {
    const collection = await prisma.collection.findFirst({
      where: userId ? { name: { equals: name, mode: 'insensitive' }, userId } : { name: { equals: name, mode: 'insensitive' } }
    });
    return collection as Collection | null;
  }

  async update(id: string, data: UpdateCollectionDto, userId?: string): Promise<Collection> {
    const collection = await prisma.collection.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
      include: {
        _count: {
          select: { links: true }
        }
      }
    });
    return collection as Collection;
  }

  async delete(id: string, userId?: string): Promise<void> {
    await prisma.collection.delete({
      where: { id }
    });
  }
}
