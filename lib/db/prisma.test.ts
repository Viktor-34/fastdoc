import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const prismaInstance = { __mock: 'prisma-client' };
const prismaClientCtor = vi.fn(() => prismaInstance);

vi.mock('@prisma/client', () => ({
  PrismaClient: prismaClientCtor,
}));

const globalWithPrisma = globalThis as typeof globalThis & { prisma?: unknown };
const previousNodeEnv = process.env.NODE_ENV;

describe('lib/db/prisma', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    delete globalWithPrisma.prisma;
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
    delete globalWithPrisma.prisma;
  });

  it('reuses the same instance across multiple imports in development', async () => {
    const first = await import('./prisma');
    const second = await import('./prisma');

    expect(first.prisma).toBe(second.prisma);
    expect(prismaClientCtor).toHaveBeenCalledTimes(1);
    expect(globalWithPrisma.prisma).toBe(first.prisma);
  });

  it('uses pre-existing global prisma when available', async () => {
    const existingInstance = { __mock: 'existing-client' };
    globalWithPrisma.prisma = existingInstance;

    const moduleUnderTest = await import('./prisma');

    expect(moduleUnderTest.prisma).toBe(existingInstance);
    expect(prismaClientCtor).not.toHaveBeenCalled();
  });
});
