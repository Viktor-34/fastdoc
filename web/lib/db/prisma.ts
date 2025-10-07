import { PrismaClient } from '@prisma/client';

declare global {
  // Allow global prisma caching in dev
  var prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient = global.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;


