import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WORKSPACE_HEADER } from '@/lib/workspace-constants';

const prismaMock = {
  shareLink: {
    findUnique: vi.fn(),
  },
  events: {
    create: vi.fn(),
  },
};

vi.mock('@/lib/db/prisma', () => ({
  prisma: prismaMock,
}));

describe('POST /api/track', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 when explicit workspace mismatches share-link workspace', async () => {
    prismaMock.shareLink.findUnique.mockResolvedValue({
      Proposal: { workspaceId: 'workspace-a' },
    });

    const { POST } = await import('./route');
    const request = {
      json: vi.fn().mockResolvedValue({
        token: 'token-1',
        event: 'view',
        uid: 'uid-1',
      }),
      headers: new Headers({
        [WORKSPACE_HEADER]: 'workspace-b',
      }),
      cookies: { get: vi.fn(() => undefined) },
    } as unknown as Parameters<typeof POST>[0];

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(prismaMock.events.create).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON payloads', async () => {
    const { POST } = await import('./route');
    const request = {
      json: vi.fn().mockRejectedValue(new Error('invalid json')),
      headers: new Headers(),
      cookies: { get: vi.fn(() => undefined) },
    } as unknown as Parameters<typeof POST>[0];

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
