import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  user: {
    findUnique: vi.fn(),
  },
  client: {
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

const prismaClientCtor = vi.fn(() => prismaMock);
const getServerAuthSessionMock = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: prismaClientCtor,
}));

vi.mock('@/lib/auth', () => ({
  getServerAuthSession: getServerAuthSessionMock,
}));

describe('PATCH /api/clients/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 for unauthenticated users', async () => {
    getServerAuthSessionMock.mockResolvedValue(null);

    const { PATCH } = await import('./route');
    const request = {
      json: vi.fn().mockResolvedValue({ name: 'Updated' }),
    } as unknown as Parameters<typeof PATCH>[0];

    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'client-1' }),
    });

    expect(response.status).toBe(401);
  });

  it('returns 404 when record disappears during update (P2025)', async () => {
    getServerAuthSessionMock.mockResolvedValue({
      user: { id: 'user-1' },
    });
    prismaMock.user.findUnique.mockResolvedValue({ workspaceId: 'workspace-1' });
    prismaMock.client.findFirst.mockResolvedValue({ id: 'client-1' });
    prismaMock.client.update.mockRejectedValue(
      Object.assign(new Error('Record not found'), { code: 'P2025' }),
    );

    const { PATCH } = await import('./route');
    const request = {
      json: vi.fn().mockResolvedValue({ name: 'Updated' }),
    } as unknown as Parameters<typeof PATCH>[0];

    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'client-1' }),
    });

    expect(response.status).toBe(404);
  });
});
