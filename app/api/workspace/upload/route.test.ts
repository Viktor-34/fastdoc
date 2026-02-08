import { beforeEach, describe, expect, it, vi } from 'vitest';

const getServerAuthSessionMock = vi.fn();
const getActiveWorkspaceIdMock = vi.fn();
const mkdirMock = vi.fn();
const writeFileMock = vi.fn();

vi.mock('@/lib/auth', () => ({
  getServerAuthSession: getServerAuthSessionMock,
}));

vi.mock('@/lib/workspace', () => ({
  getActiveWorkspaceId: getActiveWorkspaceIdMock,
}));

vi.mock('fs/promises', () => ({
  mkdir: mkdirMock,
  writeFile: writeFileMock,
}));

describe('POST /api/workspace/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mkdirMock.mockResolvedValue(undefined);
    writeFileMock.mockResolvedValue(undefined);
  });

  it('returns 401 for unauthenticated users', async () => {
    getServerAuthSessionMock.mockResolvedValue(null);

    const { POST } = await import('./route');
    const request = {
      formData: vi.fn(),
    } as unknown as Parameters<typeof POST>[0];

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('rejects SVG payload spoofed as JPG by extension and mime-type', async () => {
    getServerAuthSessionMock.mockResolvedValue({
      user: { workspaceId: 'workspace-1' },
    });
    getActiveWorkspaceIdMock.mockResolvedValue('workspace-1');

    const formData = new FormData();
    const spoofedImage = new File(
      ['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'],
      'logo.jpg',
      { type: 'image/jpeg' },
    );
    formData.set('file', spoofedImage);
    formData.set('field', 'logoUrl');

    const { POST } = await import('./route');
    const request = {
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as Parameters<typeof POST>[0];

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(writeFileMock).not.toHaveBeenCalled();
  });
});
