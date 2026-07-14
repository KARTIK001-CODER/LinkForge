import { AppError } from '../../../lib/app-error';
import { CollectionRepository } from '../repositories/collection.repository';
import type { CreateCollectionDto, UpdateCollectionDto } from '../validators/collection.schema';
import type { Collection } from '../models/collection.domain';

export class CollectionConflictError extends AppError {
  constructor(message: string = 'Collection name already exists') {
    super(message, 'COLLECTION_CONFLICT', 409);
    this.name = 'CollectionConflictError';
  }
}

export class CollectionNotFoundError extends AppError {
  constructor(message: string = 'Collection not found') {
    super(message, 'COLLECTION_NOT_FOUND', 404);
    this.name = 'CollectionNotFoundError';
  }
}

export class CollectionService {
  constructor(private readonly collectionRepository: CollectionRepository = new CollectionRepository()) {}

  async create(data: CreateCollectionDto, userId?: string): Promise<Collection> {
    const existing = await this.collectionRepository.findByName(data.name, userId);
    if (existing) {
      throw new CollectionConflictError();
    }
    return this.collectionRepository.create({ ...data, userId });
  }

  async findAll(userId?: string): Promise<Collection[]> {
    return this.collectionRepository.findAll(userId);
  }

  async findById(id: string, userId?: string): Promise<Collection> {
    const collection = await this.collectionRepository.findById(id, userId);
    if (!collection) {
      throw new CollectionNotFoundError();
    }
    return collection;
  }

  async update(id: string, data: UpdateCollectionDto, userId?: string): Promise<Collection> {
    const existing = await this.collectionRepository.findById(id, userId);
    if (!existing) {
      throw new CollectionNotFoundError();
    }

    if (data.name && data.name !== existing.name) {
      const nameConflict = await this.collectionRepository.findByName(data.name, userId);
      if (nameConflict) {
        throw new CollectionConflictError();
      }
    }

    return this.collectionRepository.update(id, data, userId);
  }

  async delete(id: string, userId?: string): Promise<void> {
    const existing = await this.collectionRepository.findById(id, userId);
    if (!existing) {
      throw new CollectionNotFoundError();
    }
    return this.collectionRepository.delete(id, userId);
  }
}
