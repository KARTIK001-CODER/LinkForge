import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { LinkRepository } from '../repositories/link.repository';

export class VerifyPasswordService {
  private linkRepository: LinkRepository;
  private readonly jwtSecret: string;

  constructor() {
    this.linkRepository = new LinkRepository();
    // Use fallback for local development if missing
    this.jwtSecret = process.env.JWT_SECRET || 'fallback_secret_for_local_dev';
  }

  async verifyPassword(alias: string, passwordAttempt: string): Promise<{ success: boolean; token?: string }> {
    const link = await this.linkRepository.findByAlias(alias);

    if (!link || !link.passwordHash) {
      return { success: false };
    }

    const isValid = await bcrypt.compare(passwordAttempt, link.passwordHash);

    if (!isValid) {
      return { success: false };
    }

    // Sign a short-lived token specifically for this alias
    const token = jwt.sign({ alias }, this.jwtSecret, { expiresIn: '30s' });

    return { success: true, token };
  }
}
