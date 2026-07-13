import { Prisma } from '@prisma/client';
import prisma from '../../../lib/prisma';

export class AuthRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string) {
    return prisma.user.findUnique({ where: { username } });
  }

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async createUser(data: {
    email: string;
    username: string;
    displayName: string | null;
    passwordHash: string;
  }) {
    return prisma.user.create({ data });
  }

  async updateUser(id: string, data: Record<string, unknown>) {
    return prisma.user.update({ where: { id }, data });
  }

  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    deviceInfo: string | null;
    ipAddress: string | null;
    expiresAt: Date;
  }) {
    return prisma.refreshToken.create({ data });
  }

  async findRefreshToken(tokenHash: string) {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  async revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserRefreshTokens(userId: string, exceptId?: string) {
    return prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      data: { revokedAt: new Date() },
    });
  }

  async listActiveSessions(userId: string) {
    return prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createEmailVerificationToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return prisma.emailVerificationToken.create({ data });
  }

  async findEmailVerificationToken(tokenHash: string) {
    return prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
  }

  async useEmailVerificationToken(id: string) {
    return prisma.emailVerificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async createPasswordResetToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return prisma.passwordResetToken.create({ data });
  }

  async findPasswordResetToken(tokenHash: string) {
    return prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  }

  async usePasswordResetToken(id: string) {
    return prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async createAuditLog(data: {
    userId?: string;
    action: string;
    resource?: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.auditLog.create({
      data: {
        userId: data.userId ?? null,
        action: data.action,
        resource: data.resource ?? null,
        resourceId: data.resourceId ?? null,
        details: (data.details ?? undefined) as any,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  }

  async incrementLoginAttempts(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { loginAttempts: { increment: 1 } },
    });
  }

  async resetLoginAttempts(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { loginAttempts: 0, lockedUntil: null },
    });
  }

  async lockUser(userId: string, durationMinutes: number = 15) {
    const lockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
    return prisma.user.update({
      where: { id: userId },
      data: { lockedUntil },
    });
  }
}
