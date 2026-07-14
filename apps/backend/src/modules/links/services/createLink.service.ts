import bcrypt from 'bcrypt';
import { LinkRepository } from '../repositories/link.repository';
import { CreateLinkDto } from '../validators/createLink.schema';
import { generateAlias } from '../utils/aliasGenerator';
import { AliasConflictError, SmartLink } from '../models/link.domain';

export class CreateLinkService {
  constructor(private readonly linkRepository: LinkRepository = new LinkRepository()) {}

  async execute(dto: CreateLinkDto, userId?: string): Promise<SmartLink> {
    let passwordHash: string | null = null;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (dto.customAlias) {
      return this.linkRepository.create({
        userId,
        destinationUrl: dto.destinationUrl,
        alias: dto.customAlias,
        passwordHash,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        tags: dto.tags || [],
        isFavorite: false,
        collectionId: dto.collectionId,
      });
    }

    // Generator retry loop
    let retries = 0;
    const MAX_RETRIES = 3;

    while (retries < MAX_RETRIES) {
      try {
        const alias = generateAlias();
        return await this.linkRepository.create({
          userId,
          destinationUrl: dto.destinationUrl,
          alias,
          passwordHash,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          tags: dto.tags || [],
          isFavorite: false,
          collectionId: dto.collectionId,
        });
      } catch (error) {
        if (error instanceof AliasConflictError) {
          retries++;
          continue;
        }
        throw error;
      }
    }

    throw new Error('Failed to generate a unique alias after multiple attempts');
  }
}
