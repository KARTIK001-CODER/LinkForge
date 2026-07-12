import { CollectionRepository } from '../repositories/collection.repository';
import { CreateCollectionDto, UpdateCollectionDto } from '../validators/collection.schema';
import { Collection } from '../models/collection.domain';

export class CollectionConflictError extends Error {
  constructor(message: string = 'Collection name already exists') {
    super(message);
    this.name = 'CollectionConflictError';
  }
}

export class CollectionNotFoundError extends Error {
  constructor(message: string = 'Collection not found') {
    super(message);
    this.name = 'CollectionNotFoundError';
  }
}

export class CollectionService {
  constructor(private readonly collectionRepository: CollectionRepository = new CollectionRepository()) {}

  async create(data: CreateCollectionDto): Promise<Collection> {
    const existing = await this.collectionRepository.findByName(data.name);
    if (existing) {
      throw new CollectionConflictError();
    }
    return this.collectionRepository.create(data);
  }

  async findAll(): Promise<Collection[]> {
    return this.collectionRepository.findAll();
  }

  async findById(id: string): Promise<Collection> {
    const collection = await this.collectionRepository.findById(id);
    if (!collection) {
      throw new CollectionNotFoundError();
    }
    return collection;
  }

  async update(id: string, data: UpdateCollectionDto): Promise<Collection> {
    const existing = await this.collectionRepository.findById(id);
    if (!existing) {
      throw new CollectionNotFoundError();
    }

    if (data.name && data.name !== existing.name) {
      const nameConflict = await this.collectionRepository.findByName(data.name);
      if (nameConflict) {
        throw new CollectionConflictError();
      }
    }

    return this.collectionRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.collectionRepository.findById(id);
    if (!existing) {
      throw new CollectionNotFoundError();
    }
    return this.collectionRepository.delete(id);
  }
}
