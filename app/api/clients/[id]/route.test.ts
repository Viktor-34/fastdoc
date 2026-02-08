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

const getServerAuthSessionMock = vi.fn();

vi.mock('@/lib/db/prisma', () => ({
  prisma: prismaMock,
}));

vi.mock('@/lib/auth', () => ({
  getServerAuthSession: getServerAuthSessionMock,
}));

describe('/api/clients/[id] workspace ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 for unauthenticated users in PATCH', async () => {
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

  it('uses id_workspaceId compound key in PATCH', async () => {
    getServerAuthSessionMock.mockResolvedValue({
      user: { id: 'user-1' },
    });
    prismaMock.user.findUnique.mockResolvedValue({ workspaceId: 'workspace-1' });
    prismaMock.client.update.mockResolvedValue({ id: 'client-1' });

    const { PATCH } = await import('./route');
    const request = {
      json: vi.fn().mockResolvedValue({ name: 'Updated' }),
    } as unknown as Parameters<typeof PATCH>[0];

    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'client-1' }),
    });

    expect(response.status).toBe(200);
    expect(prismaMock.client.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id_workspaceId: {
            id: 'client-1',
            workspaceId: 'workspace-1',
          },
        },
      }),
    );
  });

  it('returns 404 when record is missing in PATCH (P2025)', async () => {
    getServerAuthSessionMock.mockResolvedValue({
      user: { id: 'user-1' },
    });
    prismaMock.user.findUnique.mockResolvedValue({ workspaceId: 'workspace-1' });
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

  it('uses id_workspaceId compound key in DELETE', async () => {
    getServerAuthSessionMock.mockResolvedValue({
      user: { id: 'user-1' },
    });
    prismaMock.user.findUnique.mockResolvedValue({ workspaceId: 'workspace-1' });
    prismaMock.client.delete.mockResolvedValue({ id: 'client-1' });

    const { DELETE } = await import('./route');
    const request = {} as unknown as Parameters<typeof DELETE>[0];

    const response = await DELETE(request, {
      params: Promise.resolve({ id: 'client-1' }),
    });

    expect(response.status).toBe(200);
    expect(prismaMock.client.delete).toHaveBeenCalledWith({
      where: {
        id_workspaceId: {
          id: 'client-1',
          workspaceId: 'workspace-1',
        },
      },
    });
  });
});
