import { beforeEach, describe, expect, it, vi } from 'vitest';

const getServerAuthSessionMock = vi.fn();
const getActiveWorkspaceIdMock = vi.fn();
const prismaMock = {
  proposal: {
    findFirst: vi.fn(),
  },
  workspace: {
    findUnique: vi.fn(),
  },
  client: {
    findUnique: vi.fn(),
  },
};

vi.mock('@/lib/auth', () => ({
  getServerAuthSession: getServerAuthSessionMock,
}));

vi.mock('@/lib/workspace', () => ({
  getActiveWorkspaceId: getActiveWorkspaceIdMock,
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: prismaMock,
}));

describe('POST /api/pdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 413 when payload exceeds the 100KB limit', async () => {
    getServerAuthSessionMock.mockResolvedValue({
      user: { workspaceId: 'workspace-1' },
    });
    getActiveWorkspaceIdMock.mockResolvedValue('workspace-1');
    prismaMock.proposal.findFirst.mockResolvedValue(null);

    const { POST } = await import('./route');
    const request = {
      headers: new Headers({
        'content-length': String(101 * 1024),
      }),
      cookies: { get: vi.fn(() => undefined) },
      json: vi.fn().mockResolvedValue({
        proposalId: 'proposal-1',
      }),
    } as unknown as Parameters<typeof POST>[0];

    const response = await POST(request);

    expect(response.status).toBe(413);
  });
});
