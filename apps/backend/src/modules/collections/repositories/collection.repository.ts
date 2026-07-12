import { PrismaClient } from '@prisma/client';
import { Collection } from '../models/collection.domain';
import { CreateCollectionDto, UpdateCollectionDto } from '../validators/collection.schema';

const prisma = new PrismaClient();

export class CollectionRepository {
  async create(data: CreateCollectionDto): Promise<Collection> {
    const collection = await prisma.collection.create({
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

  async findAll(): Promise<Collection[]> {
    const collections = await prisma.collection.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { links: true }
        }
      }
    });
    return collections as Collection[];
  }

  async findById(id: string): Promise<Collection | null> {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: { links: true }
        }
      }
    });
    return collection as Collection | null;
  }

  async findByName(name: string): Promise<Collection | null> {
    const collection = await prisma.collection.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });
    return collection as Collection | null;
  }

  async update(id: string, data: UpdateCollectionDto): Promise<Collection> {
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

  async delete(id: string): Promise<void> {
    await prisma.collection.delete({
      where: { id }
    });
  }
}
