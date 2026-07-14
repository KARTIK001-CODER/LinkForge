import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createTestUser(overrides: Partial<{
  email: string;
  username: string;
  passwordHash: string;
  role: string;
  isVerified: boolean;
}> = {}) {
  const id = crypto.randomUUID();
  return prisma.user.create({
    data: {
      id,
      email: overrides.email || `test-${id}@example.com`,
      username: overrides.username || `testuser-${id}`,
      passwordHash: overrides.passwordHash || '$2b$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Ql5q3p0sY7s8c9d0e1f2a3b4c5d6e7', // "password123"
      role: overrides.role || 'USER',
      isVerified: overrides.isVerified ?? true,
    },
  });
}

export async function createTestLink(overrides: Partial<{
  userId: string;
  destinationUrl: string;
  alias: string;
  status: string;
  passwordHash: string | null;
  expiresAt: Date | null;
}> = {}) {
  const id = crypto.randomUUID();
  return prisma.smartLink.create({
    data: {
      id,
      userId: overrides.userId || null,
      destinationUrl: overrides.destinationUrl || 'https://example.com',
      alias: overrides.alias || `test-${id}`,
      status: overrides.status || 'ACTIVE',
      passwordHash: overrides.passwordHash || null,
      expiresAt: overrides.expiresAt || null,
    },
  });
}

export async function cleanupDatabase() {
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE`);
      } catch {
        // Skip tables that can't be truncated
      }
    }
  }
}

export { prisma };
